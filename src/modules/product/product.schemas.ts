import { z } from "zod";

const productOptionSchema = z.object({
  name: z.string().min(1).trim(),
  values: z.array(z.string().trim()).min(1),
});

const productVariantSchema = z.object({
  optionValues: z.record(z.string(), z.string()),
  sku: z.string().optional().default(""),
  price: z.number().min(0).optional().default(0),
  stock: z.number().min(0).optional().default(0),
});

const productAddOnSchema = z.object({
  name: z.string().min(1, "Add-on name required").trim(),
  price: z.number().min(0, "Add-on price must be >= 0"),
  description: z.string().optional().default(""),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Name required").trim(),
  description: z.string().optional().default(""),
  categoryId: z.string().min(1, "Category required"),
  subcategoryId: z.string().optional(),
  price: z.number().min(0, "Price must be >= 0"),
  thumbnail: z.string().optional().default(""),
  images: z.array(z.string()).optional().default([]),
  documentUrl: z.string().optional().default(""),
  sku: z.string().optional().default(""),
  stock: z.number().min(0).optional().default(0),
  options: z.array(productOptionSchema).optional().default([]),
  variants: z.array(productVariantSchema).optional().default([]),
  addOns: z.array(productAddOnSchema).optional().default([]),
  attributes: z.record(z.string(), z.unknown()).optional().default({}),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    subcategoryId: z.string().optional().nullable(),
    price: z.number().min(0).optional(),
    thumbnail: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
    documentUrl: z.string().optional().nullable(),
    sku: z.string().optional(),
    stock: z.number().min(0).optional(),
    options: z.array(productOptionSchema).optional().nullable(),
    variants: z.array(productVariantSchema).optional().nullable(),
    addOns: z.array(productAddOnSchema).optional().nullable(),
    attributes: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field required",
  });

export const updateStockSchema = z.object({
  stock: z.number().min(0, "Stock must be >= 0"),
});

export const productQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  activeOnly: z.string().optional(),
});
