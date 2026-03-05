import mongoose from "mongoose";
import Product from "./product.model";
import Category from "../category/category.model";
import Subcategory from "../subcategory/subcategory.model";
import { AppError } from "../../utils/AppError";
import { assertValidObjectId } from "../../utils/objectId";
import { slugify } from "../../utils/slugify";
import { parsePagination, paginationMeta } from "../../utils/pagination";
import type { Types } from "mongoose";

export interface ProductOptionInput {
  name: string;
  values: string[];
}

export interface ProductVariantInput {
  optionValues: Record<string, string>;
  sku?: string;
  price?: number;
  stock?: number;
}

export interface ProductAddOnInput {
  name: string;
  price: number;
  description?: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  categoryId: string;
  subcategoryId?: string;
  price: number;
  thumbnail?: string;
  images?: string[];
  documentUrl?: string;
  sku?: string;
  stock?: number;
  options?: ProductOptionInput[];
  variants?: ProductVariantInput[];
  addOns?: ProductAddOnInput[];
  attributes?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  categoryId?: string;
  subcategoryId?: string | null;
  price?: number;
  thumbnail?: string | null;
  images?: string[];
  documentUrl?: string | null;
  sku?: string;
  stock?: number;
  options?: ProductOptionInput[] | null;
  variants?: ProductVariantInput[] | null;
  addOns?: ProductAddOnInput[] | null;
  attributes?: Record<string, unknown>;
  isActive?: boolean;
}

export interface ProductListQuery {
  page?: string | string[];
  limit?: string | string[];
  search?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  category?: string | string[];
  subcategory?: string | string[];
  activeOnly?: string | string[];
}

export async function createProduct(
  data: CreateProductInput,
  createdBy: Types.ObjectId
) {
  assertValidObjectId(data.categoryId, "Invalid category id");
  const category = await Category.findById(data.categoryId);
  if (!category) throw new AppError(404, "Category not found");

  if (data.subcategoryId) {
    assertValidObjectId(data.subcategoryId, "Invalid subcategory id");
    const subcategory = await Subcategory.findById(data.subcategoryId);
    if (!subcategory) throw new AppError(404, "Subcategory not found");
    if (String(subcategory.categoryId) !== data.categoryId) {
      throw new AppError(400, "Subcategory does not belong to this category");
    }
  }

  const slug = slugify(data.name);
  const product = await Product.create({
    name: data.name.trim(),
    slug,
    description: data.description ?? "",
    categoryId: new mongoose.Types.ObjectId(data.categoryId),
    subcategoryId: data.subcategoryId
      ? new mongoose.Types.ObjectId(data.subcategoryId)
      : undefined,
    price: data.price,
    thumbnail: data.thumbnail ?? "",
    images: data.images ?? [],
    documentUrl: data.documentUrl ?? "",
    sku: data.sku ?? "",
    stock: data.stock ?? 0,
    options: data.options ?? [],
    variants: data.variants ?? [],
    addOns: data.addOns ?? [],
    attributes: data.attributes ?? {},
    isActive: data.isActive ?? true,
    createdBy,
  });
  return product.populate("categoryId subcategoryId", "name slug");
}

export async function updateProduct(
  id: string,
  data: UpdateProductInput,
  _createdBy: Types.ObjectId
) {
  assertValidObjectId(id, "Invalid product id");
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, "Product not found");

  if (data.categoryId !== undefined) {
    assertValidObjectId(data.categoryId, "Invalid category id");
    const category = await Category.findById(data.categoryId);
    if (!category) throw new AppError(404, "Category not found");
    product.categoryId = new mongoose.Types.ObjectId(data.categoryId);
  }
  if (data.subcategoryId !== undefined) {
    if (data.subcategoryId === null || data.subcategoryId === "") {
      product.subcategoryId = undefined;
    } else {
      assertValidObjectId(data.subcategoryId, "Invalid subcategory id");
      const subcategory = await Subcategory.findById(data.subcategoryId);
      if (!subcategory) throw new AppError(404, "Subcategory not found");
      if (String(subcategory.categoryId) !== String(product.categoryId)) {
        throw new AppError(400, "Subcategory does not belong to this category");
      }
      product.subcategoryId = new mongoose.Types.ObjectId(data.subcategoryId);
    }
  }
  if (data.name !== undefined) {
    product.name = data.name.trim();
    product.slug = slugify(data.name);
  }
  if (data.description !== undefined) product.description = data.description;
  if (data.price !== undefined) product.price = data.price;
  if (data.thumbnail !== undefined) product.thumbnail = data.thumbnail ?? "";
  if (data.images !== undefined) product.images = data.images;
  if (data.documentUrl !== undefined) product.documentUrl = data.documentUrl ?? "";
  if (data.sku !== undefined) product.sku = data.sku;
  if (data.stock !== undefined) product.stock = data.stock;
  if (data.options !== undefined) product.options = data.options ?? [];
  if (data.variants !== undefined) product.variants = data.variants ?? [];
  if (data.addOns !== undefined) product.addOns = data.addOns ?? [];
  if (data.attributes !== undefined) product.attributes = data.attributes;
  if (data.isActive !== undefined) product.isActive = data.isActive;

  await product.save();
  return product.populate("categoryId subcategoryId", "name slug");
}

export async function deleteProduct(id: string) {
  assertValidObjectId(id, "Invalid product id");
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new AppError(404, "Product not found");
}

export async function updateProductStock(id: string, stock: number) {
  assertValidObjectId(id, "Invalid product id");
  const product = await Product.findByIdAndUpdate(
    id,
    { stock },
    { new: true }
  ).populate("categoryId subcategoryId", "name slug");
  if (!product) throw new AppError(404, "Product not found");
  return product;
}

export async function getProductById(id: string) {
  assertValidObjectId(id, "Invalid product id");
  const product = await Product.findById(id).populate(
    "categoryId subcategoryId",
    "name slug"
  );
  if (!product) throw new AppError(404, "Product not found");
  return product;
}

function buildProductFilter(query: ProductListQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  const activeOnly = String(query.activeOnly ?? "true");
  if (activeOnly !== "false") {
    filter.isActive = true;
  }
  const category = Array.isArray(query.category) ? query.category[0] : query.category;
  if (category) {
    assertValidObjectId(category, "Invalid category id");
    filter.categoryId = new mongoose.Types.ObjectId(category);
  }
  const subcategory = Array.isArray(query.subcategory) ? query.subcategory[0] : query.subcategory;
  if (subcategory) {
    assertValidObjectId(subcategory, "Invalid subcategory id");
    filter.subcategoryId = new mongoose.Types.ObjectId(subcategory);
  }
  const minP = query.minPrice ? parseFloat(String(query.minPrice)) : NaN;
  const maxP = query.maxPrice ? parseFloat(String(query.maxPrice)) : NaN;
  if (!Number.isNaN(minP) && !Number.isNaN(maxP)) {
    filter.price = { $gte: minP, $lte: maxP };
  } else if (!Number.isNaN(minP)) {
    filter.price = { $gte: minP };
  } else if (!Number.isNaN(maxP)) {
    filter.price = { $lte: maxP };
  }
  const search = Array.isArray(query.search) ? query.search[0] : query.search;
  if (search && String(search).trim()) {
    const term = String(search).trim();
    filter.$or = [
      { name: { $regex: term, $options: "i" } },
      { description: { $regex: term, $options: "i" } },
      { sku: { $regex: term, $options: "i" } },
    ];
  }
  return filter;
}

export async function getProductList(query: ProductListQuery) {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildProductFilter(query);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("categoryId subcategoryId", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const pagination = paginationMeta(page, limit, total);
  return { products, pagination };
}

export async function getProductsByCategory(
  categoryId: string,
  query: ProductListQuery
) {
  assertValidObjectId(categoryId, "Invalid category id");
  return getProductList({ ...query, category: categoryId });
}

export async function getProductsBySubcategory(
  subcategoryId: string,
  query: ProductListQuery
) {
  assertValidObjectId(subcategoryId, "Invalid subcategory id");
  return getProductList({ ...query, subcategory: subcategoryId });
}
