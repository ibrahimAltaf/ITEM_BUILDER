import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import mongoose from "mongoose";
import * as addressService from "../address/address.service";
import { createAddressSchema, updateAddressSchema } from "../address/address.schemas";

function validationError(issues: { message: string }[]): never {
  throw new AppError(400, issues.map((e) => e.message).join("; "));
}

function parseUserId(req: AuthRequest): mongoose.Types.ObjectId {
  const raw = Array.isArray(req.params.userId)
    ? req.params.userId[0]
    : req.params.userId;
  const id = String(raw ?? "");
  if (!id) throw new AppError(400, "userId required");
  return new mongoose.Types.ObjectId(id);
}

function parseAddressId(req: AuthRequest): string {
  const raw = Array.isArray(req.params.addressId)
    ? req.params.addressId[0]
    : req.params.addressId;
  const id = String(raw ?? "");
  if (!id) throw new AppError(400, "addressId required");
  return id;
}

export async function listUserAddresses(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  const targetUserId = parseUserId(req);
  const list = await addressService.adminListAddressesForUser(targetUserId);
  return success(res, 200, "Addresses loaded.", { addresses: list });
}

export async function createUserAddress(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  const targetUserId = parseUserId(req);
  const parsed = createAddressSchema.safeParse(req.body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);
  const doc = await addressService.adminCreateAddressForUser(
    targetUserId,
    parsed.data!
  );
  return success(res, 201, "Address saved.", { address: doc });
}

export async function updateUserAddress(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  const targetUserId = parseUserId(req);
  const addressId = parseAddressId(req);
  const parsed = updateAddressSchema.safeParse(req.body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);
  const doc = await addressService.adminUpdateAddressForUser(
    targetUserId,
    addressId,
    parsed.data!
  );
  return success(res, 200, "Address updated.", { address: doc });
}

export async function deleteUserAddress(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  const targetUserId = parseUserId(req);
  const addressId = parseAddressId(req);
  await addressService.adminDeleteAddressForUser(targetUserId, addressId);
  return success(res, 200, "Address removed.");
}
