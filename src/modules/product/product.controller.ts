import { Response } from "express";
import * as service from "./product.service";
import { AuthRequest } from "../../middlewares/auth";
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from "./product.schemas";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import mongoose from "mongoose";
import {
  uploadImageFromBase64,
  uploadDocumentFromBase64,
  isImageBase64,
  isPdfBase64,
} from "../../utils/cloudinary";

function validationError(issues: { message: string }[]): never {
  const message = issues.map((e) => e.message).join("; ");
  throw new AppError(400, message);
}

async function resolveProductImages(body: Record<string, unknown>): Promise<void> {
  if (isImageBase64(body.thumbnail)) {
    const r = await uploadImageFromBase64(body.thumbnail);
    body.thumbnail = r.url;
  }
  if (Array.isArray(body.images)) {
    const urls: string[] = [];
    for (const item of body.images) {
      if (isImageBase64(item)) {
        const r = await uploadImageFromBase64(item);
        urls.push(r.url);
      } else if (typeof item === "string") {
        urls.push(item);
      }
    }
    if (urls.length) body.images = urls;
  }
  if (isPdfBase64(body.documentUrl)) {
    const r = await uploadDocumentFromBase64(body.documentUrl);
    body.documentUrl = r.url;
  }
}

export async function createProduct(req: AuthRequest, res: Response): Promise<Response> {
  const body = { ...req.body } as Record<string, unknown>;
  await resolveProductImages(body);

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);

  const product = await service.createProduct(
    parsed.data!,
    new mongoose.Types.ObjectId(req.user!.id)
  );
  return success(res, 201, "Product created successfully.", { product });
}

export async function updateProduct(req: AuthRequest, res: Response): Promise<Response> {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Product id required");

  const body = { ...req.body } as Record<string, unknown>;
  await resolveProductImages(body);

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);

  const product = await service.updateProduct(
    id,
    parsed.data!,
    new mongoose.Types.ObjectId(req.user!.id)
  );
  return success(res, 200, "Product updated successfully.", { product });
}

export async function deleteProduct(req: AuthRequest, res: Response): Promise<Response> {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Product id required");

  await service.deleteProduct(id);
  return success(res, 200, "Product deleted successfully.");
}

export async function updateStock(req: AuthRequest, res: Response): Promise<Response> {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Product id required");

  const parsed = updateStockSchema.safeParse(req.body);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);

  const product = await service.updateProductStock(id, parsed.data!.stock);
  return success(res, 200, "Stock updated successfully.", { product });
}

export async function getProductById(req: AuthRequest, res: Response): Promise<Response> {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
  if (!id) throw new AppError(400, "Product id required");

  const product = await service.getProductById(id);
  return success(res, 200, "Product found.", { product });
}

export async function getProductList(req: AuthRequest, res: Response): Promise<Response> {
  const { products, pagination } = await service.getProductList(req.query);
  return success(res, 200, "Products list.", { products, pagination });
}

export async function getProductsByCategory(req: AuthRequest, res: Response): Promise<Response> {
  const categoryId =
    typeof req.params.categoryId === "string"
      ? req.params.categoryId
      : req.params.categoryId?.[0];
  if (!categoryId) throw new AppError(400, "Category id required");

  const { products, pagination } = await service.getProductsByCategory(
    categoryId,
    req.query
  );
  return success(res, 200, "Products by category.", { products, pagination });
}

export async function getProductsBySubcategory(req: AuthRequest, res: Response): Promise<Response> {
  const subcategoryId =
    typeof req.params.subcategoryId === "string"
      ? req.params.subcategoryId
      : req.params.subcategoryId?.[0];
  if (!subcategoryId) throw new AppError(400, "Subcategory id required");

  const { products, pagination } = await service.getProductsBySubcategory(
    subcategoryId,
    req.query
  );
  return success(res, 200, "Products by subcategory.", { products, pagination });
}
