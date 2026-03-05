import Category from "./category.model";
import { AppError } from "../../utils/AppError";
import { assertValidObjectId } from "../../utils/objectId";
import { slugify } from "../../utils/slugify";
import type { Types } from "mongoose";

export interface CreateCategoryInput {
  name: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export async function createCategory(
  data: CreateCategoryInput,
  createdBy: Types.ObjectId
) {
  const existing = await Category.findOne({
    name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
  });
  if (existing) throw new AppError(409, "Category name already exists");

  const slug = slugify(data.name);
  const slugExists = await Category.findOne({ slug });
  if (slugExists) throw new AppError(409, "Category with this name already exists");

  const category = await Category.create({
    name: data.name.trim(),
    slug,
    description: data.description ?? "",
    image: data.image ?? "",
    isActive: data.isActive ?? true,
    createdBy,
  });
  return category;
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryInput,
  _createdBy: Types.ObjectId
) {
  assertValidObjectId(id, "Invalid category id");
  const category = await Category.findById(id);
  if (!category) throw new AppError(404, "Category not found");

  if (data.name !== undefined) {
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
      _id: { $ne: id },
    });
    if (existing) throw new AppError(409, "Category name already exists");
    category.name = data.name.trim();
    category.slug = slugify(data.name);
  }
  if (data.description !== undefined) category.description = data.description;
  if (data.image !== undefined) category.image = data.image;
  if (data.isActive !== undefined) category.isActive = data.isActive;

  await category.save();
  return category;
}

export async function deleteCategory(id: string) {
  assertValidObjectId(id, "Invalid category id");
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new AppError(404, "Category not found");
}

export async function getCategoryById(id: string) {
  assertValidObjectId(id, "Invalid category id");
  const category = await Category.findById(id);
  if (!category) throw new AppError(404, "Category not found");
  return category;
}

export async function getCategoryList(activeOnly = true) {
  const filter = activeOnly ? { isActive: true } : {};
  return Category.find(filter).sort({ name: 1 }).lean();
}
