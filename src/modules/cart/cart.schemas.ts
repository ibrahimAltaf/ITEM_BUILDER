import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
  variantIndex: z.number().int().min(0).nullable().optional(),
  addOnIndexes: z.array(z.number().int().min(0)).optional().default([]),
});

export const setCartSchema = z.object({
  items: z.array(cartItemSchema).max(100),
});

export const addCartItemSchema = cartItemSchema;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(999),
  variantIndex: z.number().int().min(0).nullable().optional(),
  addOnIndexes: z.array(z.number().int().min(0)).optional(),
});
