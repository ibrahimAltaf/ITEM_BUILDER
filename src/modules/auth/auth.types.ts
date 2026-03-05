import type { Document, Types } from "mongoose";

export type UserRole = "admin" | "staff" | "user";

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  email: string;
  code: string;
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

export interface CreateStaffInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CreateAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface UpdateStaffInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export interface JwtPayload {
  sub: string;
  role: string;
}

export interface UserPayload {
  id: string;
  role: string;
}

export interface SafeUser {
  id: Types.ObjectId | unknown;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  emailVerified?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface IUser {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  passwordHash?: string;
  role: UserRole;
  emailVerified?: boolean;
  verifyToken?: string;
  refreshToken?: string;
  otpCode?: string;
  otpExpire?: Date;
  resetToken?: string;
  resetExpire?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDoc = Document<unknown, object, IUser> & IUser;
