import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import * as orderService from "../order/order.service";
import {
  adminOrderListQuerySchema,
  adminUpdateOrderSchema,
  adminCreateOrderSchema,
} from "../order/order.schemas";
import mongoose from "mongoose";

function validationError(issues: { message: string }[]): never {
  throw new AppError(400, issues.map((e) => e.message).join("; "));
}

export async function orderStats(_req: AuthRequest, res: Response): Promise<Response> {
  const stats = await orderService.adminOrderStatsSummary();
  return success(res, 200, "Order stats.", stats);
}

export async function revenueSummary(_req: AuthRequest, res: Response): Promise<Response> {
  const s = await orderService.adminOrderRevenueSummaryPaid();
  return success(res, 200, "Paid revenue summary.", {
    ...s,
    totalRevenueUsd: s.totalCents / 100,
    shippingUsd: s.shippingCents / 100,
    taxUsd: s.taxCents / 100,
    subtotalUsd: s.subtotalCents / 100,
  });
}

export async function revenueByPaymentMethod(_req: AuthRequest, res: Response): Promise<Response> {
  const s = await orderService.adminOrderRevenueByPaymentMethodPaid();
  const out = {
    ...s,
    breakdown: Object.fromEntries(
      Object.entries(s.breakdown).map(([method, v]) => [
        method,
        {
          ...v,
          totalUsd: v.totalCents / 100,
        },
      ])
    ),
  };
  return success(res, 200, "Paid revenue by payment method.", out);
}

export async function revenueDaily(req: AuthRequest, res: Response): Promise<Response> {
  const raw = Array.isArray(req.query.days) ? req.query.days[0] : req.query.days;
  const days = raw ? Number(raw) : 30;
  if (!Number.isFinite(days) || days <= 0) {
    throw new AppError(400, "days must be a positive number");
  }
  const s = await orderService.adminOrderRevenueDailyPaid(days);
  return success(res, 200, "Paid revenue daily.", {
    ...s,
    items: s.items.map((i: { day: string; totalCents: number }) => ({
      ...i,
      totalUsd: i.totalCents / 100,
    })),
  });
}

export async function listOrders(req: AuthRequest, res: Response): Promise<Response> {
  const parsed = adminOrderListQuerySchema.safeParse(req.query);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);
  const d = parsed.data!;
  const { items, meta } = await orderService.adminListOrders({
    page: d.page,
    limit: d.limit,
    orderStatus: d.orderStatus,
    userId: d.userId,
  });
  return success(res, 200, "Orders loaded.", { orders: items, meta });
}

export async function getOrder(req: AuthRequest, res: Response): Promise<Response> {
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!id) throw new AppError(400, "Order id required");
  const order = await orderService.adminGetOrder(id);
  return success(res, 200, "Order loaded.", { order });
}

export async function createAdminOrder(req: AuthRequest, res: Response): Promise<Response> {
  const parsed = adminCreateOrderSchema.safeParse(req.body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);
  const d = parsed.data!;
  const { order, clientSecret } = await orderService.adminCreateOrder({
    customerUserId: new mongoose.Types.ObjectId(d.userId),
    items: d.items,
    addressId: d.addressId,
    shippoRateObjectId: d.shippoRateObjectId,
    shippingCents: d.shippingCents,
    paymentMethod: d.paymentMethod,
  });
  const msg =
    d.paymentMethod === "cod"
      ? "Admin order created (COD)."
      : "Admin order created. Use clientSecret for Stripe checkout.";
  return success(res, 201, msg, {
    orderId: order._id,
    order,
    clientSecret,
    paymentMethod: order.paymentMethod,
  });
}

export async function updateOrder(req: AuthRequest, res: Response): Promise<Response> {
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!id) throw new AppError(400, "Order id required");
  const parsed = adminUpdateOrderSchema.safeParse(req.body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);
  const order = await orderService.adminUpdateOrder(id, parsed.data!);
  return success(res, 200, "Order updated.", { order });
}
