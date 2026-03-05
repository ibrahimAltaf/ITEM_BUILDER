import mongoose from "mongoose";
import Subcategory from "./subcategory.model";
import Category from "../category/category.model";
import { AppError } from "../../utils/AppError";
import { assertValidObjectId } from "../../utils/objectId";
import { slugify } from "../../utils/slugify";
import type { Types } from "mongoose";

export interface CreateSubcategoryInput {
  name: string;
  categoryId: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export interface UpdateSubcategoryInput {
  name?: string;
  categoryId?: string;
  description?: string;
  image?: string | null;
  isActive?: boolean;
}

export async function createSubcategory(
  data: CreateSubcategoryInput,
  createdBy: Types.ObjectId
) {
  assertValidObjectId(data.categoryId, "Invalid category id");
  const category = await Category.findById(data.categoryId);
  if (!category) throw new AppError(404, "Category not found");

  const existing = await Subcategory.findOne({
    categoryId: data.categoryId,
    name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
  });
  if (existing) throw new AppError(409, "Subcategory name already exists in this category");

  const slug = slugify(data.name);
  const subcategory = await Subcategory.create({
    name: data.name.trim(),
    slug,
    categoryId: new mongoose.Types.ObjectId(data.categoryId),
    description: data.description ?? "",
    image: data.image ?? "",
    isActive: data.isActive ?? true,
    createdBy,
  });
  return subcategory.populate("categoryId", "name slug");
}

export async function updateSubcategory(
  id: string,
  data: UpdateSubcategoryInput,
  _createdBy: Types.ObjectId
) {
  assertValidObjectId(id, "Invalid subcategory id");
  const subcategory = await Subcategory.findById(id);
  if (!subcategory) throw new AppError(404, "Subcategory not found");

  if (data.categoryId !== undefined) {
    assertValidObjectId(data.categoryId, "Invalid category id");
    const category = await Category.findById(data.categoryId);
    if (!category) throw new AppError(404, "Category not found");
    subcategory.categoryId = new mongoose.Types.ObjectId(data.categoryId);
  }
  if (data.name !== undefined) {
    const existing = await Subcategory.findOne({
      categoryId: subcategory.categoryId,
      name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
      _id: { $ne: id },
    });
    if (existing) throw new AppError(409, "Subcategory name already exists in this category");
    subcategory.name = data.name.trim();
    subcategory.slug = slugify(data.name);
  }
  if (data.description !== undefined) subcategory.description = data.description;
  if (data.image !== undefined) subcategory.image = data.image ?? "";
  if (data.isActive !== undefined) subcategory.isActive = data.isActive;

  await subcategory.save();
  return subcategory.populate("categoryId", "name slug");
}

export async function deleteSubcategory(id: string) {
  assertValidObjectId(id, "Invalid subcategory id");
  const subcategory = await Subcategory.findByIdAndDelete(id);
  if (!subcategory) throw new AppError(404, "Subcategory not found");
}

export async function getSubcategoryById(id: string) {
  assertValidObjectId(id, "Invalid subcategory id");
  const subcategory = await Subcategory.findById(id).populate("categoryId", "name slug");
  if (!subcategory) throw new AppError(404, "Subcategory not found");
  return subcategory;
}

export async function getSubcategoryList(activeOnly = true) {
  const filter = activeOnly ? { isActive: true } : {};
  return Subcategory.find(filter).populate("categoryId", "name slug").sort({ name: 1 }).lean();
}

export async function getSubcategoriesByCategory(categoryId: string, activeOnly = true) {
  assertValidObjectId(categoryId, "Invalid category id");
  const filter: Record<string, unknown> = { categoryId };
  if (activeOnly) filter.isActive = true;
  return Subcategory.find(filter).populate("categoryId", "name slug").sort({ name: 1 }).lean();
}
