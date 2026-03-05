import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name required").trim(),
  description: z.string().optional().default(""),
  image: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field required",
});
