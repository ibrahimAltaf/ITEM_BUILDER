import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import mongoose from "mongoose";
import * as service from "./order.service";
import { createOrderSchema, previewCheckoutSchema } from "./order.schemas";

function validationError(issues: { message: string }[]): never {
  throw new AppError(400, issues.map((e) => e.message).join("; "));
}

export async function preview(req: AuthRequest, res: Response): Promise<Response> {
  const parsed = previewCheckoutSchema.safeParse(req.body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const out = await service.previewCheckout(
    userId,
    parsed.data!.addressId,
    parsed.data!.shippoRateObjectId
  );
  return success(res, 200, "Checkout preview.", out);
}

export async function createOrder(req: AuthRequest, res: Response): Promise<Response> {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const d = parsed.data!;
  const { order, clientSecret } = await service.createCustomerOrder(userId, {
    addressId: d.addressId,
    shippoRateObjectId: d.shippoRateObjectId,
    paymentMethod: d.paymentMethod,
    preferredPaymentMethod: d.preferredPaymentMethod,
  });
  const msg =
    d.paymentMethod === "cod"
      ? "Order placed (COD). Pay on delivery."
      : "Order created. Confirm payment with Stripe clientSecret.";
  return success(res, 201, msg, {
    orderId: order._id,
    order,
    clientSecret,
    paymentMethod: order.paymentMethod,
  });
}

export async function listMine(req: AuthRequest, res: Response): Promise<Response> {
  const list = await service.listMyOrders(new mongoose.Types.ObjectId(req.user!.id));
  return success(res, 200, "Orders loaded.", { orders: list });
}

export async function getMine(req: AuthRequest, res: Response): Promise<Response> {
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!id) throw new AppError(400, "Order id required");
  const order = await service.getMyOrder(id, new mongoose.Types.ObjectId(req.user!.id));
  return success(res, 200, "Order loaded.", { order });
}
