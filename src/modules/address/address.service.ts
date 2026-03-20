import { Types } from "mongoose";
import Address from "./address.model";
import User from "../auth/user.model";
import { AppError } from "../../utils/AppError";
import { assertValidObjectId } from "../../utils/objectId";
import { createAddressSchema, updateAddressSchema } from "./address.schemas";
import type { z } from "zod";

type CreateIn = z.infer<typeof createAddressSchema>;
type UpdateIn = z.infer<typeof updateAddressSchema>;

export async function listAddresses(userId: Types.ObjectId) {
  return Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
}

export async function createAddress(userId: Types.ObjectId, data: CreateIn) {
  if (data.isDefault) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } });
  }
  return Address.create({
    userId,
    ...data,
    state: data.state.toUpperCase(),
    country: data.country.toUpperCase(),
    city: data.isMilitary ? data.city.toUpperCase() : data.city,
  });
}

export async function getAddressForUser(id: string, userId: Types.ObjectId) {
  assertValidObjectId(id);
  const doc = await Address.findOne({ _id: id, userId });
  if (!doc) throw new AppError(404, "Address not found");
  return doc;
}

export async function updateAddress(
  id: string,
  userId: Types.ObjectId,
  data: UpdateIn
) {
  const doc = await getAddressForUser(id, userId);
  if (data.isDefault === true) {
    await Address.updateMany({ userId, _id: { $ne: doc._id } }, { $set: { isDefault: false } });
  }
  Object.assign(doc, data);
  if (data.state) doc.state = data.state.toUpperCase();
  if (data.country) doc.country = data.country.toUpperCase();
  if (data.city && data.isMilitary) doc.city = data.city.toUpperCase();
  await doc.save();
  return doc;
}

export async function deleteAddress(id: string, userId: Types.ObjectId) {
  const doc = await getAddressForUser(id, userId);
  await doc.deleteOne();
}

export async function assertUserExists(userId: Types.ObjectId) {
  const u = await User.findById(userId);
  if (!u) throw new AppError(404, "User not found");
}

/** Admin: list addresses for any customer */
export async function adminListAddressesForUser(targetUserId: Types.ObjectId) {
  await assertUserExists(targetUserId);
  return listAddresses(targetUserId);
}

export async function adminCreateAddressForUser(
  targetUserId: Types.ObjectId,
  data: CreateIn
) {
  await assertUserExists(targetUserId);
  return createAddress(targetUserId, data);
}

export async function adminUpdateAddressForUser(
  targetUserId: Types.ObjectId,
  addressId: string,
  data: UpdateIn
) {
  await assertUserExists(targetUserId);
  return updateAddress(addressId, targetUserId, data);
}

export async function adminDeleteAddressForUser(
  targetUserId: Types.ObjectId,
  addressId: string
) {
  await assertUserExists(targetUserId);
  return deleteAddress(addressId, targetUserId);
}

export function addressToShippoInput(a: {
  fullName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isMilitary?: boolean;
}) {
  return {
    name: a.fullName,
    street1: a.line1,
    street2: a.line2 || undefined,
    city: a.city,
    state: a.state,
    zip: a.zip.replace(/\s/g, ""),
    country: a.country || "US",
    phone: a.phone || undefined,
    isMilitary: !!a.isMilitary,
  };
}
