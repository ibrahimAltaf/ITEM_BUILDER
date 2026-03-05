import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name required"),
    lastName: z.string().min(1, "Last name required"),
    email: z.string().email(),
    password: z.string().min(6, "Password at least 6 characters"),
    confirmPassword: z.string(),
    phoneNumber: z.string().min(1, "Phone number required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password required"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    code: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(6, "Password at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createStaffSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["staff", "admin"]).optional(),
});
