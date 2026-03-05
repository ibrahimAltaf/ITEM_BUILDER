import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/auth";
import type { UserPayload } from "../modules/auth/auth.types";

export type AuthRequest = Request & {
  user?: UserPayload;
};

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Authorization header missing or invalid",
    });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Invalid or expired token",
    });
  }
}