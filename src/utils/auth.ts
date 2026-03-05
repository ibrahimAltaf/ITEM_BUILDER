import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { env } from "../config/env";

export function signAccessToken(payload: { sub: string; role: string }) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as jwt.Secret, {
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: { sub: string; role: string }) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as jwt.Secret, {
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: string };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; role: string };
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}