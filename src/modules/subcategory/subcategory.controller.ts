import { Response } from "express";
import * as service from "./subcategory.service";
import { AuthRequest } from "../../middlewares/auth";
import {
  createSubcategorySchema,
  updateSubcategorySchema,
} from "./subcategory.schemas";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import mongoose from "mongoose";
import { uploadImageFromBase64, isImageBase64 } from "../../utils/cloudinary";

function validationError(issues: { message: string }[]): never {
  const message = issues.map((e) => e.message).join("; ");
  throw new AppError(400, message);
}

function buildSubcategoryBody(req: AuthRequest): Record<string, unknown> {
  const body = { ...req.body };
  if (typeof body.isActive === "string") body.isActive = body.isActive === "true";
  return body;
}

export async function createSubcategory(req: AuthRequest, res: Response): Promise<Response> {
  const body = buildSubcategoryBody(req) as Record<string, string | boolean>;
  if (isImageBase64(body.image)) {
    const result = await uploadImageFromBase64(body.image);
    body.image = result.url;
  }
  const parsed = createSubcategorySchema.safeParse(body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);

  const subcategory = await service.createSubcategory(
    parsed.data!,
    new mongoose.Types.ObjectId(req.user!.id)
  );
  return success(res, 201, "Subcategory created successfully.", { subcategory });
}

export async function updateSubcategory(req: AuthRequest, res: Response): Promise<Response> {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Subcategory id required");

  const body = buildSubcategoryBody(req) as Record<string, string | boolean>;
  if (isImageBase64(body.image)) {
    const result = await uploadImageFromBase64(body.image);
    body.image = result.url;
  }
  const parsed = updateSubcategorySchema.safeParse(body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);

  const subcategory = await service.updateSubcategory(
    id,
    parsed.data!,
    new mongoose.Types.ObjectId(req.user!.id)
  );
  return success(res, 200, "Subcategory updated successfully.", { subcategory });
}

export async function deleteSubcategory(req: AuthRequest, res: Response): Promise<Response> {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Subcategory id required");

  await service.deleteSubcategory(id);
  return success(res, 200, "Subcategory deleted successfully.");
}

export async function getSubcategoryById(req: AuthRequest, res: Response): Promise<Response> {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Subcategory id required");

  const subcategory = await service.getSubcategoryById(id);
  return success(res, 200, "Subcategory found.", { subcategory });
}

export async function getSubcategoryList(req: AuthRequest, res: Response): Promise<Response> {
  const activeOnly = req.query.activeOnly !== "false";
  const subcategories = await service.getSubcategoryList(activeOnly);
  return success(res, 200, "Subcategories list.", { subcategories });
}

export async function getSubcategoriesByCategory(req: AuthRequest, res: Response): Promise<Response> {
  const categoryId =
    typeof req.params.categoryId === "string"
      ? req.params.categoryId
      : req.params.categoryId?.[0];
  if (!categoryId) throw new AppError(400, "Category id required");

  const activeOnly = req.query.activeOnly !== "false";
  const subcategories = await service.getSubcategoriesByCategory(categoryId, activeOnly);
  return success(res, 200, "Subcategories by category.", { subcategories });
}
