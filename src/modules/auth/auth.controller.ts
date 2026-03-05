import { Request, Response } from "express";
import * as service from "./auth.service";
import { AuthRequest } from "../../middlewares/auth";
import {
  registerSchema,
  verifyEmailSchema,
  loginSchema,
  resetPasswordSchema,
} from "./auth.schemas";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";

function validationError(issues: { message: string }[]): never {
  const message = issues.map((e) => e.message).join("; ");
  throw new AppError(400, message);
}

export async function register(req: Request, res: Response): Promise<Response> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success)
    validationError(parsed.error.issues as { message: string }[]);

  const data = parsed.data!;
  const { confirmPassword: _, ...registerData } = data;
  await service.register(registerData);

  return success(
    res,
    201,
    "Account created. Check your email for OTP to verify.",
  );
}

export async function verifyEmail(
  req: Request,
  res: Response,
): Promise<Response> {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success)
    validationError(parsed.error.issues as { message: string }[]);

  const { email, code } = parsed.data!;
  await service.verifyEmailByOtp(email, code);

  return success(res, 200, "Email verified successfully.");
}

export async function login(req: Request, res: Response): Promise<Response> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    validationError(parsed.error.issues as { message: string }[]);

  const data = await service.login(parsed.data!);
  return success(res, 200, "Login successful.", data);
}

export async function refresh(req: Request, res: Response): Promise<Response> {
  const refreshToken = req.body?.refreshToken as string;
  if (!refreshToken) throw new AppError(400, "refreshToken required");

  const data = await service.refresh(refreshToken);
  return success(res, 200, "Token refreshed.", data);
}

export async function forgot(req: Request, res: Response): Promise<Response> {
  const email = req.body?.email as string;
  if (!email) throw new AppError(400, "email required");

  await service.forgot(email);
  return success(
    res,
    200,
    "If the email exists, an OTP has been sent to reset your password.",
  );
}

export async function reset(req: Request, res: Response): Promise<Response> {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success)
    validationError(parsed.error.issues as { message: string }[]);

  const { email, code, newPassword } = parsed.data!;
  await service.resetByOtp(email, code, newPassword);

  return success(res, 200, "Password reset successfully.");
}

export async function changePassword(
  req: AuthRequest,
  res: Response,
): Promise<Response> {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    throw new AppError(400, "oldPassword and newPassword required");

  await service.changePassword(req.user!.id, oldPassword, newPassword);
  return success(res, 200, "Password changed successfully.");
}
