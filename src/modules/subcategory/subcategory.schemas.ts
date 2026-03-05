import { z } from "zod";

export const createSubcategorySchema = z.object({
  name: z.string().min(1, "Name required").trim(),
  categoryId: z.string().min(1, "Category required"),
  description: z.string().optional().default(""),
  image: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
});

export const updateSubcategorySchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field required",
  });
