import mongoose, { Types } from "mongoose";
import Cart from "./cart.model";
import Product from "../product/product.model";
import { AppError } from "../../utils/AppError";
import { assertValidObjectId } from "../../utils/objectId";
import { env } from "../../config/env";
import type { ParcelInput } from "../../services/shippo.service";

export interface ResolvedCartLine {
  productId: string;
  name: string;
  thumbnail?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variantLabel?: string;
  addOns: { name: string; price: number }[];
}

export interface ResolvedCart {
  lines: ResolvedCartLine[];
  subtotalCents: number;
  parcel: ParcelInput;
}

function pickVariantLabel(
  variant: { optionValues?: Record<string, string> } | undefined
): string | undefined {
  if (!variant?.optionValues) return undefined;
  const entries = Object.entries(variant.optionValues);
  if (!entries.length) return undefined;
  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
}

export async function getOrCreateCart(userId: Types.ObjectId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
}

export async function getCart(userId: Types.ObjectId) {
  return getOrCreateCart(userId);
}

export async function setCartItems(
  userId: Types.ObjectId,
  items: {
    productId: string;
    quantity: number;
    variantIndex?: number | null;
    addOnIndexes?: number[];
  }[]
) {
  const cart = await getOrCreateCart(userId);
  cart.items = items.map((i) => ({
    productId: new Types.ObjectId(i.productId),
    quantity: i.quantity,
    variantIndex: i.variantIndex ?? null,
    addOnIndexes: i.addOnIndexes ?? [],
  }));
  await cart.save();
  return cart;
}

export async function clearCart(userId: Types.ObjectId) {
  await Cart.findOneAndUpdate({ userId }, { items: [] });
}

export type CartLineInput = {
  productId: string;
  quantity: number;
  variantIndex?: number | null;
  addOnIndexes?: number[];
};

/**
 * Resolve products/prices from line items (cart DB or admin payload).
 */
export async function resolveLineItemsForOrder(
  items: CartLineInput[]
): Promise<ResolvedCart> {
  if (!items.length) {
    throw new AppError(400, "No line items");
  }

  const lines: ResolvedCartLine[] = [];
  let totalWeightOz = 0;
  let lengthIn = env.DEFAULT_PARCEL_LENGTH_IN;
  let widthIn = env.DEFAULT_PARCEL_WIDTH_IN;
  let heightIn = env.DEFAULT_PARCEL_HEIGHT_IN;

  for (const row of items) {
    assertValidObjectId(String(row.productId), "Invalid product id");
    const product = await Product.findById(row.productId).lean();
    if (!product || !product.isActive) {
      throw new AppError(400, `Product not available: ${row.productId}`);
    }

    const qty = row.quantity;
    let unitPrice = product.price;
    let variantLabel: string | undefined;
    let stock = product.stock ?? 0;

    if (row.variantIndex != null && product.variants?.[row.variantIndex]) {
      const v = product.variants[row.variantIndex] as {
        price?: number;
        stock?: number;
        optionValues?: Record<string, string>;
      };
      if (typeof v.price === "number" && v.price > 0) unitPrice = v.price;
      variantLabel = pickVariantLabel(v);
      if (typeof v.stock === "number") stock = v.stock;
    }

    if (stock < qty) {
      throw new AppError(400, `Insufficient stock for "${product.name}"`);
    }

    const addOns: { name: string; price: number }[] = [];
    const indexes = row.addOnIndexes ?? [];
    for (const idx of indexes) {
      const add = product.addOns?.[idx] as { name?: string; price?: number } | undefined;
      if (!add?.name) throw new AppError(400, "Invalid add-on selection");
      addOns.push({ name: add.name, price: add.price ?? 0 });
      unitPrice += add.price ?? 0;
    }

    const lineTotal = unitPrice * qty;
    lines.push({
      productId: String(product._id),
      name: product.name,
      thumbnail: product.thumbnail || undefined,
      quantity: qty,
      unitPrice,
      lineTotal,
      variantLabel,
      addOns,
    });

    const w =
      typeof product.weightOz === "number" && product.weightOz > 0
        ? product.weightOz
        : env.DEFAULT_PARCEL_WEIGHT_OZ;
    totalWeightOz += w * qty;

    if (typeof product.lengthIn === "number" && product.lengthIn > lengthIn) {
      lengthIn = product.lengthIn;
    }
    if (typeof product.widthIn === "number" && product.widthIn > widthIn) {
      widthIn = product.widthIn;
    }
    if (typeof product.heightIn === "number" && product.heightIn > heightIn) {
      heightIn = product.heightIn;
    }
  }

  const subtotalCents = Math.round(
    lines.reduce((s, l) => s + l.lineTotal, 0) * 100
  );

  const parcel: ParcelInput = {
    weightOz: Math.max(totalWeightOz, 1),
    lengthIn: Math.max(lengthIn, 1),
    widthIn: Math.max(widthIn, 1),
    heightIn: Math.max(heightIn, 1),
  };

  return { lines, subtotalCents, parcel };
}

export async function resolveCartForCheckout(userId: Types.ObjectId): Promise<ResolvedCart> {
  const cart = await Cart.findOne({ userId });
  if (!cart?.items?.length) {
    throw new AppError(400, "Cart is empty");
  }
  const items: CartLineInput[] = cart.items.map(
    (row: {
      productId: Types.ObjectId;
      quantity: number;
      variantIndex?: number | null;
      addOnIndexes?: number[];
    }) => ({
      productId: String(row.productId),
      quantity: row.quantity,
      variantIndex: row.variantIndex,
      addOnIndexes: row.addOnIndexes ?? [],
    })
  );
  return resolveLineItemsForOrder(items);
}
