import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import mongoose from "mongoose";
import * as service from "./address.service";
import { createAddressSchema, updateAddressSchema } from "./address.schemas";

function validationError(issues: { message: string }[]): never {
  throw new AppError(400, issues.map((e) => e.message).join("; "));
}

export async function listMyAddresses(req: AuthRequest, res: Response): Promise<Response> {
  const list = await service.listAddresses(new mongoose.Types.ObjectId(req.user!.id));
  return success(res, 200, "Addresses loaded.", { addresses: list });
}

export async function createMyAddress(req: AuthRequest, res: Response): Promise<Response> {
  const parsed = createAddressSchema.safeParse(req.body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);
  const doc = await service.createAddress(
    new mongoose.Types.ObjectId(req.user!.id),
    parsed.data!
  );
  return success(res, 201, "Address saved.", { address: doc });
}

export async function updateMyAddress(req: AuthRequest, res: Response): Promise<Response> {
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!id) throw new AppError(400, "Address id required");
  const parsed = updateAddressSchema.safeParse(req.body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);
  const doc = await service.updateAddress(
    id,
    new mongoose.Types.ObjectId(req.user!.id),
    parsed.data!
  );
  return success(res, 200, "Address updated.", { address: doc });
}

export async function deleteMyAddress(req: AuthRequest, res: Response): Promise<Response> {
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!id) throw new AppError(400, "Address id required");
  await service.deleteAddress(id, new mongoose.Types.ObjectId(req.user!.id));
  return success(res, 200, "Address removed.");
}
