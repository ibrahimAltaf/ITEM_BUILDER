import { z } from "zod";

export const createStaffSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email(),
  password: z.string().min(6, "Password at least 6 characters"),
});

export const createAdminSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email(),
  password: z.string().min(6, "Password at least 6 characters"),
});

export const updateStaffSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6, "Password at least 6 characters").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field required",
  });
