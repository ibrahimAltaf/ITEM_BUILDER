import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import mongoose from "mongoose";
import * as service from "./cart.service";
import { setCartSchema, addCartItemSchema, updateCartItemSchema } from "./cart.schemas";

function validationError(issues: { message: string }[]): never {
  throw new AppError(400, issues.map((e) => e.message).join("; "));
}

export async function getMyCart(req: AuthRequest, res: Response): Promise<Response> {
  const cart = await service.getCart(new mongoose.Types.ObjectId(req.user!.id));
  return success(res, 200, "Cart loaded.", { cart });
}

export async function replaceCart(req: AuthRequest, res: Response): Promise<Response> {
  const parsed = setCartSchema.safeParse(req.body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);
  const cart = await service.setCartItems(
    new mongoose.Types.ObjectId(req.user!.id),
    parsed.data!.items
  );
  return success(res, 200, "Cart updated.", { cart });
}

export async function clearMyCart(req: AuthRequest, res: Response): Promise<Response> {
  await service.clearCart(new mongoose.Types.ObjectId(req.user!.id));
  return success(res, 200, "Cart cleared.");
}
