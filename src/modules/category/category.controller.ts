import { Response } from "express";
import * as service from "./category.service";
import { AuthRequest } from "../../middlewares/auth";
import { createCategorySchema, updateCategorySchema } from "./category.schemas";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import mongoose from "mongoose";
import { uploadImageFromBase64, isImageBase64 } from "../../utils/cloudinary";

function validationError(issues: { message: string }[]): never {
  const message = issues.map((e) => e.message).join("; ");
  throw new AppError(400, message);
}

function buildCategoryBody(req: AuthRequest): Record<string, unknown> {
  const body = { ...req.body };
  if (typeof body.isActive === "string") {
    body.isActive = body.isActive === "true";
  }
  return body;
}

export async function createCategory(req: AuthRequest, res: Response): Promise<Response> {
  const body = buildCategoryBody(req) as Record<string, string | boolean>;
  if (isImageBase64(body.image)) {
    const result = await uploadImageFromBase64(body.image);
    body.image = result.url;
  }
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);

  const category = await service.createCategory(
    parsed.data!,
    new mongoose.Types.ObjectId(req.user!.id)
  );
  return success(res, 201, "Category created successfully.", { category });
}

export async function updateCategory(req: AuthRequest, res: Response): Promise<Response> {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Category id required");

  const body = buildCategoryBody(req) as Record<string, string | boolean>;
  if (isImageBase64(body.image)) {
    const result = await uploadImageFromBase64(body.image);
    body.image = result.url;
  }
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);

  const category = await service.updateCategory(
    id,
    parsed.data!,
    new mongoose.Types.ObjectId(req.user!.id)
  );
  return success(res, 200, "Category updated successfully.", { category });
}

export async function deleteCategory(req: AuthRequest, res: Response): Promise<Response> {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Category id required");

  await service.deleteCategory(id);
  return success(res, 200, "Category deleted successfully.");
}

export async function getCategoryById(req: AuthRequest, res: Response): Promise<Response> {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Category id required");

  const category = await service.getCategoryById(id);
  return success(res, 200, "Category found.", { category });
}

export async function getCategoryList(req: AuthRequest, res: Response): Promise<Response> {
  const activeOnly = req.query.activeOnly !== "false";
  const categories = await service.getCategoryList(activeOnly);
  return success(res, 200, "Categories list.", { categories });
}
