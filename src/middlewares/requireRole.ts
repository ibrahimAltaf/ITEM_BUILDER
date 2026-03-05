import { Response } from "express";
import type { AuthRequest } from "./auth";
import type { UserRole } from "../modules/auth/auth.types";
import { AppError } from "../utils/AppError";

export function requireRole(...allowedRoles: UserRole[]) {
  return (
    req: AuthRequest,
    _res: Response,
    next: (err?: unknown) => void,
  ): void | Response => {
    if (!req.user) {
      throw new AppError(401, "Unauthorized");
    }
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      throw new AppError(
        403,
        "You do not have permission to perform this action",
      );
    }
    next();
  };
}
