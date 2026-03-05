import mongoose from "mongoose";
import User from "../auth/user.model";
import { hashPassword } from "../../utils/auth";
import { AppError } from "../../utils/AppError";
import type {
  CreateStaffInput,
  CreateAdminInput,
  UpdateStaffInput,
  SafeUser,
} from "../auth/auth.types";
import type { Types } from "mongoose";

export async function createStaff(data: CreateStaffInput): Promise<SafeUser> {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw new AppError(409, "Email already registered");

  const passwordHash = await hashPassword(data.password);
  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    fullName,
    email: data.email,
    passwordHash,
    role: "staff",
    emailVerified: true,
  });

  return toSafeUser(user);
}

export async function createAdmin(data: CreateAdminInput): Promise<SafeUser> {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw new AppError(409, "Email already registered");

  const passwordHash = await hashPassword(data.password);
  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    fullName,
    email: data.email,
    passwordHash,
    role: "admin",
    emailVerified: true,
  });

  return toSafeUser(user);
}

export async function listStaff(): Promise<SafeUser[]> {
  const users = await User.find({ role: "staff" }).sort({ createdAt: -1 });
  return users.map((u) => toSafeUser(u));
}

export async function deleteStaff(id: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid staff id");
  }
  const user = await User.findById(id);
  if (!user) throw new AppError(404, "Staff not found");
  if (user.role !== "staff") {
    throw new AppError(403, "Only staff can be removed via this endpoint");
  }
  await User.findByIdAndDelete(id);
}

export async function updateStaff(
  id: string,
  data: UpdateStaffInput,
): Promise<SafeUser> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid staff id");
  }
  const user = await User.findById(id).select("+passwordHash");
  if (!user) throw new AppError(404, "Staff not found");
  if (user.role !== "staff") {
    throw new AppError(403, "Only staff can be edited via this endpoint");
  }

  if (data.firstName !== undefined) user.firstName = data.firstName;
  if (data.lastName !== undefined) user.lastName = data.lastName;
  if (data.email !== undefined) {
    const exists = await User.findOne({ email: data.email, _id: { $ne: id } });
    if (exists) throw new AppError(409, "Email already in use");
    user.email = data.email;
  }
  if (data.password !== undefined) {
    user.passwordHash = await hashPassword(data.password);
  }
  user.fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  await user.save();

  return toSafeUser(user);
}

function toSafeUser(user: {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  emailVerified?: boolean;
}): SafeUser {
  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}
