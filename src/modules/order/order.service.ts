import { Types } from "mongoose";
import Stripe from "stripe";
import {
  resolveCartForCheckout,
  resolveLineItemsForOrder,
  clearCart,
  type CartLineInput,
} from "../cart/cart.service";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { assertValidObjectId } from "../../utils/objectId";
import { getRateDetails } from "../../services/shippo.service";
import { calculateSalesTax } from "../../services/tax.service";
import { getAddressForUser, addressToShippoInput } from "../address/address.service";
import { getShipFromAddress } from "../../services/shippo.service";
import Order from "./order.model";
import { parsePagination, paginationMeta } from "../../utils/pagination";
import User from "../auth/user.model";

function requireStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError(503, "Stripe is not configured. Set STRIPE_SECRET_KEY in .env");
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
}

type AddressPlain = Parameters<typeof addressToShippoInput>[0];

async function totalsFromShippingUsd(
  resolved: Awaited<ReturnType<typeof resolveCartForCheckout>>,
  addressPlain: AddressPlain,
  shippingUsd: number
) {
  const shipFrom = getShipFromAddress();
  const toAddr = addressToShippoInput(addressPlain);

  const tax = await calculateSalesTax({
    from: {
      country: shipFrom.country,
      state: shipFrom.state,
      zip: shipFrom.zip.replace(/\s/g, ""),
      city: shipFrom.city,
      street: shipFrom.street1,
    },
    to: {
      country: toAddr.country,
      state: toAddr.state,
      zip: toAddr.zip,
      city: toAddr.city,
      street: toAddr.street1,
    },
    shippingUsd,
    lineItems: resolved.lines.map((l) => ({
      amount: Number(l.lineTotal.toFixed(2)),
      quantity: 1,
    })),
  });

  const shippingCents = Math.round(shippingUsd * 100);
  const taxCents = Math.round(tax.taxUsd * 100);
  const totalCents = resolved.subtotalCents + shippingCents + taxCents;
  return { shippingCents, taxCents, totalCents, taxSource: tax.source };
}

function snapshotAddress(a: Record<string, unknown>) {
  return {
    fullName: String(a.fullName ?? ""),
    phone: String(a.phone ?? ""),
    line1: String(a.line1 ?? ""),
    line2: String(a.line2 ?? ""),
    city: String(a.city ?? ""),
    state: String(a.state ?? ""),
    zip: String(a.zip ?? ""),
    country: String(a.country ?? "US"),
    isMilitary: Boolean(a.isMilitary),
    militaryType: String(a.militaryType ?? ""),
  };
}

export async function previewCheckout(
  userId: Types.ObjectId,
  addressId: string,
  shippoRateObjectId: string
) {
  const resolved = await resolveCartForCheckout(userId);
  const addrDoc = await getAddressForUser(addressId, userId);
  const rate = await getRateDetails(shippoRateObjectId);
  const { shippingCents, taxCents, totalCents, taxSource } =
    await totalsFromShippingUsd(resolved, addrDoc.toObject() as AddressPlain, rate.amountUsd);

  return {
    subtotalCents: resolved.subtotalCents,
    shippingCents,
    taxCents,
    totalCents,
    taxSource,
    currency: "usd",
  };
}

export async function createCustomerOrder(
  userId: Types.ObjectId,
  input: {
    addressId: string;
    shippoRateObjectId: string;
    paymentMethod: "stripe" | "cod";
    preferredPaymentMethod?: string;
  }
) {
  const resolved = await resolveCartForCheckout(userId);
  const addrDoc = await getAddressForUser(input.addressId, userId);
  const rate = await getRateDetails(input.shippoRateObjectId);
  const { shippingCents, taxCents, totalCents, taxSource } =
    await totalsFromShippingUsd(resolved, addrDoc.toObject() as AddressPlain, rate.amountUsd);

  const a = addrDoc.toObject();
  const linesPayload = resolved.lines.map((l) => ({
    productId: new Types.ObjectId(l.productId),
    name: l.name,
    thumbnail: l.thumbnail ?? "",
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    lineTotal: l.lineTotal,
    variantLabel: l.variantLabel ?? "",
    addOns: l.addOns,
  }));

  if (input.paymentMethod === "cod") {
    const order = await Order.create({
      userId,
      lines: linesPayload,
      shippingAddress: snapshotAddress(a as Record<string, unknown>),
      subtotalCents: resolved.subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      currency: "usd",
      taxSource,
      shippoRateObjectId: input.shippoRateObjectId,
      shippoShipmentObjectId: rate.shipmentObjectId,
      paymentMethod: "cod",
      orderStatus: "processing",
      paymentStatus: "unpaid",
    });
    await clearCart(userId);
    return { order, clientSecret: null as string | null };
  }

  if (totalCents < 50) {
    throw new AppError(400, "Order total too small for card payment (min $0.50)");
  }

  const order = await Order.create({
    userId,
    lines: linesPayload,
    shippingAddress: snapshotAddress(a as Record<string, unknown>),
    subtotalCents: resolved.subtotalCents,
    shippingCents,
    taxCents,
    totalCents,
    currency: "usd",
    taxSource,
    shippoRateObjectId: input.shippoRateObjectId,
    shippoShipmentObjectId: rate.shipmentObjectId,
    paymentMethod: "stripe",
    orderStatus: "pending_payment",
    paymentStatus: "unpaid",
  });

  const stripe = requireStripe();
  const pi = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: String(order._id),
      userId: String(userId),
      preferredPaymentMethod: input.preferredPaymentMethod ?? "",
    },
    description: `Order ${String(order._id)}`,
  });

  order.stripePaymentIntentId = pi.id;
  await order.save();

  if (!pi.client_secret) {
    throw new AppError(502, "Stripe did not return a client secret");
  }

  return { order, clientSecret: pi.client_secret };
}

export async function adminCreateOrder(input: {
  customerUserId: Types.ObjectId;
  items: CartLineInput[];
  addressId: string;
  shippoRateObjectId?: string;
  shippingCents?: number;
  paymentMethod: "stripe" | "cod";
}) {
  const u = await User.findById(input.customerUserId);
  if (!u) throw new AppError(404, "Customer user not found");

  const resolved = await resolveLineItemsForOrder(input.items);
  const addrDoc = await getAddressForUser(
    input.addressId,
    input.customerUserId
  );

  let shippingUsd: number;
  let rateId = "";
  let shipmentId = "";

  if (input.shippingCents !== undefined) {
    shippingUsd = input.shippingCents / 100;
  } else if (input.shippoRateObjectId) {
    const rate = await getRateDetails(input.shippoRateObjectId);
    shippingUsd = rate.amountUsd;
    rateId = input.shippoRateObjectId;
    shipmentId = rate.shipmentObjectId;
  } else {
    throw new AppError(400, "Either shippoRateObjectId or shippingCents is required");
  }

  const { shippingCents, taxCents, totalCents, taxSource } =
    await totalsFromShippingUsd(resolved, addrDoc.toObject() as AddressPlain, shippingUsd);

  const a = addrDoc.toObject();
  const linesPayload = resolved.lines.map((l) => ({
    productId: new Types.ObjectId(l.productId),
    name: l.name,
    thumbnail: l.thumbnail ?? "",
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    lineTotal: l.lineTotal,
    variantLabel: l.variantLabel ?? "",
    addOns: l.addOns,
  }));

  if (input.paymentMethod === "cod") {
    const order = await Order.create({
      userId: input.customerUserId,
      lines: linesPayload,
      shippingAddress: snapshotAddress(a as Record<string, unknown>),
      subtotalCents: resolved.subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      currency: "usd",
      taxSource,
      shippoRateObjectId: rateId,
      shippoShipmentObjectId: shipmentId,
      paymentMethod: "cod",
      orderStatus: "processing",
      paymentStatus: "unpaid",
    });
    return { order, clientSecret: null as string | null };
  }

  if (totalCents < 50) {
    throw new AppError(400, "Order total too small for card payment (min $0.50)");
  }

  const order = await Order.create({
    userId: input.customerUserId,
    lines: linesPayload,
    shippingAddress: snapshotAddress(a as Record<string, unknown>),
    subtotalCents: resolved.subtotalCents,
    shippingCents,
    taxCents,
    totalCents,
    currency: "usd",
    taxSource,
    shippoRateObjectId: rateId,
    shippoShipmentObjectId: shipmentId,
    paymentMethod: "stripe",
    orderStatus: "pending_payment",
    paymentStatus: "unpaid",
  });

  const stripe = requireStripe();
  const pi = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: String(order._id),
      userId: String(input.customerUserId),
      source: "admin",
    },
    description: `Order ${String(order._id)} (admin)`,
  });

  order.stripePaymentIntentId = pi.id;
  await order.save();

  if (!pi.client_secret) {
    throw new AppError(502, "Stripe did not return a client secret");
  }

  return { order, clientSecret: pi.client_secret };
}

export async function getMyOrder(id: string, userId: Types.ObjectId) {
  assertValidObjectId(id);
  const order = await Order.findOne({ _id: id, userId }).lean();
  if (!order) throw new AppError(404, "Order not found");
  return order;
}

export async function listMyOrders(userId: Types.ObjectId) {
  return Order.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
}

export async function adminOrderStatsSummary() {
  const byStatus = await Order.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
  ]);
  const paidAgg = await Order.aggregate<{ totalCents: number }>([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: "all", totalCents: { $sum: "$totalCents" } } },
  ]);
  const statusMap: Record<string, number> = {};
  for (const row of byStatus) {
    if (row._id) statusMap[row._id] = row.count;
  }
  return {
    countByOrderStatus: statusMap,
    paidOrdersRevenueCents: paidAgg[0]?.totalCents ?? 0,
  };
}

/**
 * Paid orders (paymentStatus="paid") ke totals: subtotal/shipping/tax/total + count
 */
export async function adminOrderRevenueSummaryPaid() {
  const rows = await Order.aggregate<{
    count: number;
    subtotalCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
  }>([
    { $match: { paymentStatus: "paid" } },
    {
      $group: {
        _id: "all",
        count: { $sum: 1 },
        subtotalCents: { $sum: "$subtotalCents" },
        shippingCents: { $sum: "$shippingCents" },
        taxCents: { $sum: "$taxCents" },
        totalCents: { $sum: "$totalCents" },
      },
    },
  ]);

  const r = rows[0];
  return {
    count: r?.count ?? 0,
    subtotalCents: r?.subtotalCents ?? 0,
    shippingCents: r?.shippingCents ?? 0,
    taxCents: r?.taxCents ?? 0,
    totalCents: r?.totalCents ?? 0,
    currency: "usd",
  };
}

/**
 * Paid orders: COD vs Stripe revenue + count.
 */
export async function adminOrderRevenueByPaymentMethodPaid() {
  const rows = await Order.aggregate<{
    _id: string;
    count: number;
    totalCents: number;
  }>([
    { $match: { paymentStatus: "paid" } },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        totalCents: { $sum: "$totalCents" },
      },
    },
  ]);

  const out: Record<string, { count: number; totalCents: number }> = {};
  for (const row of rows) {
    if (!row._id) continue;
    out[String(row._id)] = {
      count: row.count ?? 0,
      totalCents: row.totalCents ?? 0,
    };
  }

  return { breakdown: out, currency: "usd" };
}

/**
 * Paid orders daily revenue (last N days) grouped by YYYY-MM-DD (UTC).
 */
export async function adminOrderRevenueDailyPaid(days: number) {
  const safeDays = Math.max(1, Math.min(365, Math.floor(days)));
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

  const rows = await Order.aggregate<{ _id: string; totalCents: number }>([
    { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" },
        },
        totalCents: { $sum: "$totalCents" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    days: safeDays,
    since: since.toISOString(),
    items: rows.map((r) => ({ day: r._id, totalCents: r.totalCents ?? 0 })),
    currency: "usd",
  };
}

export async function adminListOrders(query: {
  page: number;
  limit: number;
  orderStatus?: string;
  userId?: string;
}) {
  const filter: Record<string, unknown> = {};
  if (query.orderStatus) filter.orderStatus = query.orderStatus;
  if (query.userId) {
    assertValidObjectId(query.userId, "Invalid userId");
    filter.userId = new Types.ObjectId(query.userId);
  }
  const { skip, limit } = parsePagination({
    page: String(query.page),
    limit: String(query.limit),
  });
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(query.page, limit, total) };
}

export async function adminGetOrder(id: string) {
  assertValidObjectId(id);
  const order = await Order.findById(id).lean();
  if (!order) throw new AppError(404, "Order not found");
  return order;
}

const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"] as const;

export async function adminUpdateOrder(
  id: string,
  data: {
    orderStatus?: (typeof ORDER_STATUSES)[number];
    paymentStatus?: (typeof PAYMENT_STATUSES)[number];
    trackingNumber?: string;
    carrier?: string;
  }
) {
  assertValidObjectId(id);
  const order = await Order.findById(id);
  if (!order) throw new AppError(404, "Order not found");
  if (data.orderStatus) order.orderStatus = data.orderStatus;
  if (data.paymentStatus) order.paymentStatus = data.paymentStatus;
  if (data.trackingNumber !== undefined) order.trackingNumber = data.trackingNumber;
  if (data.carrier !== undefined) order.carrier = data.carrier;
  await order.save();
  return order;
}

export async function markOrderPaidFromStripe(
  paymentIntentId: string,
  paymentMethodType?: string | null
) {
  const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!order) return null;
  order.paymentStatus = "paid";
  order.orderStatus = order.orderStatus === "pending_payment" ? "paid" : order.orderStatus;
  if (paymentMethodType) order.stripePaymentMethodType = paymentMethodType;
  await order.save();
  await clearCart(order.userId as Types.ObjectId);
  return order;
}

export async function markOrderPaymentFailed(paymentIntentId: string) {
  const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!order) return;
  order.paymentStatus = "failed";
  await order.save();
}
