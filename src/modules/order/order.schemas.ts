import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().min(1),
  shippoRateObjectId: z.string().min(1),
  paymentMethod: z.enum(["stripe", "cod"]).optional().default("stripe"),
  /** Hint for your UI; Stripe still shows all enabled methods */
  preferredPaymentMethod: z
    .enum(["card", "us_bank_account", "apple_pay", "paypal", "venmo", "link"])
    .optional(),
});

const adminOrderLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
  variantIndex: z.number().int().min(0).nullable().optional(),
  addOnIndexes: z.array(z.number().int().min(0)).optional().default([]),
});

export const adminCreateOrderSchema = z
  .object({
    userId: z.string().min(1),
    items: z.array(adminOrderLineSchema).min(1).max(100),
    addressId: z.string().min(1),
    shippoRateObjectId: z.string().optional(),
    shippingCents: z.number().int().min(0).optional(),
    paymentMethod: z.enum(["stripe", "cod"]).optional().default("cod"),
  })
  .superRefine((data, ctx) => {
    const hasShippo = Boolean(data.shippoRateObjectId?.trim());
    const hasFixed =
      data.shippingCents !== undefined && data.shippingCents !== null;
    if (!hasShippo && !hasFixed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide shippoRateObjectId or shippingCents (manual shipping)",
      });
    }
    if (hasShippo && hasFixed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use only one: shippoRateObjectId or shippingCents",
      });
    }
  });

export const previewCheckoutSchema = z.object({
  addressId: z.string().min(1),
  shippoRateObjectId: z.string().min(1),
});

export const adminOrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  userId: z.string().optional(),
  orderStatus: z
    .enum([
      "pending_payment",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .optional(),
});

export const adminUpdateOrderSchema = z.object({
  orderStatus: z
    .enum([
      "pending_payment",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .optional(),
  /** COD: mark paid when cash collected */
  paymentStatus: z.enum(["unpaid", "paid", "failed", "refunded"]).optional(),
  trackingNumber: z.string().max(120).optional(),
  carrier: z.string().max(120).optional(),
});
