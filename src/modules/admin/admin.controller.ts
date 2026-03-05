import { Response } from "express";
import * as service from "./admin.service";
import { AuthRequest } from "../../middlewares/auth";
import {
  createStaffSchema,
  createAdminSchema,
  updateStaffSchema,
} from "./admin.schemas";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";

function validationError(issues: { message: string }[]): never {
  const message = issues.map((e) => e.message).join("; ");
  throw new AppError(400, message);
}

export async function createStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response> {
  const parsed = createStaffSchema.safeParse(req.body);
  if (!parsed.success)
    validationError(parsed.error.issues as { message: string }[]);

  const user = await service.createStaff(parsed.data!);
  return success(res, 201, "Staff created successfully.", { user });
}

export async function createAdmin(
  req: AuthRequest,
  res: Response,
): Promise<Response> {
  const parsed = createAdminSchema.safeParse(req.body);
  if (!parsed.success)
    validationError(parsed.error.issues as { message: string }[]);

  const user = await service.createAdmin(parsed.data!);
  return success(res, 201, "Admin created successfully.", { user });
}

export async function getStaffList(
  _req: AuthRequest,
  res: Response,
): Promise<Response> {
  const staff = await service.listStaff();
  return success(res, 200, "Staff list.", { staff });
}

export async function deleteStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response> {
  const id =
    typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Staff id required");
  await service.deleteStaff(id);
  return success(res, 200, "Staff removed successfully.");
}

export async function updateStaff(
  req: AuthRequest,
  res: Response,
): Promise<Response> {
  const id =
    typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Staff id required");

  const parsed = updateStaffSchema.safeParse(req.body);
  if (!parsed.success)
    validationError(parsed.error.issues as { message: string }[]);

  const user = await service.updateStaff(id, parsed.data!);
  return success(res, 200, "Staff updated successfully.", { user });
}
