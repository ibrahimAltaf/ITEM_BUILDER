import User from "./user.model";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/auth";
import { sendEmail } from "../../utils/mailer";
import {
  verifyEmailOtpTemplate,
  welcomeTemplate,
  resetPasswordOtpTemplate,
  passwordChangedTemplate,
} from "../../utils/emailTemplates";
import { generateOtp, isOtpValid } from "./otp.service";
import { AppError } from "../../utils/AppError";
import type {
  RegisterInput,
  LoginInput,
  UserDoc,
  SafeUser,
  LoginResponse,
  RefreshResponse,
  JwtPayload,
} from "./auth.types";

export async function seedAdmin(): Promise<void> {
  const exists = await User.findOne({ email: "admin@itembuilder.com" });
  if (exists) return;

  const passwordHash = await hashPassword("12345678");
  await User.create({
    fullName: "Admin",
    email: "admin@itembuilder.com",
    passwordHash,
    role: "admin",
    emailVerified: true,
  });
}

export async function register(data: RegisterInput): Promise<UserDoc> {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw new AppError(409, "Email already registered");

  const passwordHash = await hashPassword(data.password);
  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
  const { code, expiresAt } = generateOtp();

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    fullName,
    email: data.email,
    phoneNumber: data.phoneNumber,
    passwordHash,
    otpCode: code,
    otpExpire: expiresAt,
  });

  await sendEmail(user.email, "Verify Your Email", verifyEmailOtpTemplate(code));
  return user as UserDoc;
}

export async function verifyEmailByOtp(email: string, code: string): Promise<void> {
  const user = (await User.findOne({ email })) as UserDoc | null;
  if (!user) throw new AppError(404, "User not found");

  if (!isOtpValid(code, user.otpCode, user.otpExpire)) {
    throw new AppError(400, "Invalid or expired OTP");
  }

  user.emailVerified = true;
  user.otpCode = undefined;
  user.otpExpire = undefined;
  await user.save();

  await sendEmail(user.email, "Welcome", welcomeTemplate(user.fullName));
}

export async function login(data: LoginInput): Promise<LoginResponse> {
  const user = (await User.findOne({ email: data.email }).select(
    "+passwordHash"
  )) as UserDoc | null;

  if (!user) throw new AppError(401, "Invalid email or password");

  const valid = await comparePassword(data.password, user.passwordHash ?? "");
  if (!valid) throw new AppError(401, "Invalid email or password");

  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role,
  });
  const refreshToken = signRefreshToken({
    sub: String(user._id),
    role: user.role,
  });

  user.refreshToken = refreshToken;
  await user.save();

  const obj = user.toObject();
  const safeUser: SafeUser = {
    id: obj._id,
    email: obj.email,
    fullName: obj.fullName,
    firstName: obj.firstName,
    lastName: obj.lastName,
    role: obj.role,
    emailVerified: obj.emailVerified,
  };

  return { accessToken, refreshToken, user: safeUser };
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const decoded = verifyRefreshToken(refreshToken) as JwtPayload;
  const user = (await User.findById(decoded.sub)) as UserDoc | null;

  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role,
  });

  return { accessToken };
}

export async function forgot(email: string): Promise<void> {
  const user = (await User.findOne({ email })) as UserDoc | null;
  if (!user) return;

  const { code, expiresAt } = generateOtp();
  user.otpCode = code;
  user.otpExpire = expiresAt;
  await user.save();

  await sendEmail(
    user.email,
    "Reset Password - OTP",
    resetPasswordOtpTemplate(code)
  );
}

export async function resetByOtp(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const user = (await User.findOne({ email })) as UserDoc | null;
  if (!user) throw new AppError(404, "User not found");

  if (!isOtpValid(code, user.otpCode, user.otpExpire)) {
    throw new AppError(400, "Invalid or expired OTP");
  }

  user.passwordHash = await hashPassword(newPassword);
  user.otpCode = undefined;
  user.otpExpire = undefined;
  await user.save();
}

export async function changePassword(
  userId: string,
  oldPass: string,
  newPass: string
): Promise<void> {
  const user = (await User.findById(userId).select("+passwordHash")) as UserDoc | null;

  if (!user) throw new AppError(404, "User not found");

  const valid = await comparePassword(oldPass, user.passwordHash ?? "");
  if (!valid) throw new AppError(401, "Current password is incorrect");

  user.passwordHash = await hashPassword(newPass);
  await user.save();

  await sendEmail(
    user.email,
    "Password Changed",
    passwordChangedTemplate()
  );
}
