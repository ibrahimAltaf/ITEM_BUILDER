import mongoose from "mongoose";
import { AppError } from "./AppError";

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export function assertValidObjectId(id: string, message = "Invalid id"): void {
  if (!isValidObjectId(id)) {
    throw new AppError(400, message);
  }
}
