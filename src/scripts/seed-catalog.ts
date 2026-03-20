import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../db/connect";
import User from "../modules/auth/user.model";
import Category from "../modules/category/category.model";
import Subcategory from "../modules/subcategory/subcategory.model";
import Product from "../modules/product/product.model";
import { slugify } from "../utils/slugify";

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function upsertCategory(params: {
  createdBy: any;
  name: string;
  description?: string;
  image: string;
}) {
  const name = params.name.trim();
  const slug = slugify(name);
  const existing = await Category.findOne({
    name: { $regex: new RegExp(`^${escapeRegExp(name)}$`, "i") },
  }).lean();

  if (existing) return existing._id;

  const doc = await Category.create({
    name,
    slug,
    description: params.description ?? "",
    image: params.image ?? "",
    isActive: true,
    createdBy: params.createdBy,
  });

  return doc._id;
}

async function upsertSubcategory(params: {
  createdBy: any;
  categoryId: any;
  name: string;
  description?: string;
  image: string;
}) {
  const name = params.name.trim();
  const slug = slugify(name);
  const existing = await Subcategory.findOne({
    categoryId: params.categoryId,
    name: { $regex: new RegExp(`^${escapeRegExp(name)}$`, "i") },
  }).lean();

  if (existing) return existing._id;

  const doc = await Subcategory.create({
    name,
    slug,
    categoryId: params.categoryId,
    description: params.description ?? "",
    image: params.image ?? "",
    isActive: true,
    createdBy: params.createdBy,
  });

  return doc._id;
}

async function upsertProduct(params: {
  createdBy: any;
  categoryId: any;
  subcategoryId?: any;
  name: string;
  price: number;
  stock: number;
  thumbnail: string;
  images: string[];
  description?: string;
  weightOz?: number;
  dimensionsIn?: { lengthIn: number; widthIn: number; heightIn: number };
}) {
  const name = params.name.trim();
  const slug = slugify(name);

  const existing = await Product.findOne({
    name: { $regex: new RegExp(`^${escapeRegExp(name)}$`, "i") },
    categoryId: params.categoryId,
  }).lean();

  if (existing) return existing._id;

  const doc = await Product.create({
    name,
    slug,
    description: params.description ?? "",
    categoryId: params.categoryId,
    subcategoryId: params.subcategoryId ?? undefined,
    price: params.price,
    thumbnail: params.thumbnail ?? "",
    images: params.images ?? [],
    documentUrl: "",
    sku: "",
    stock: params.stock,
    options: [],
    variants: [],
    addOns: [],
    attributes: {},
    weightOz: params.weightOz ?? 8,
    lengthIn: params.dimensionsIn?.lengthIn ?? 10,
    widthIn: params.dimensionsIn?.widthIn ?? 8,
    heightIn: params.dimensionsIn?.heightIn ?? 4,
    isActive: true,
    createdBy: params.createdBy,
  });

  return doc._id;
}

async function main() {
  dotenv.config();

  await connectDB();

  const admin = await User.findOne({ email: "admin@admin.com" }).lean();
  if (!admin?._id) {
    throw new Error(
      "Super admin not found. Run src/scripts/create-super-admin.ts first."
    );
  }

  const categories = [
    {
      name: "Medals",
      image: "https://picsum.photos/seed/medals-cat/600/300",
      description: "Awards and service medals",
      subcategories: [
        { name: "Gold", image: "https://picsum.photos/seed/medals-gold/400/250" },
        { name: "Silver", image: "https://picsum.photos/seed/medals-silver/400/250" },
        { name: "Bronze", image: "https://picsum.photos/seed/medals-bronze/400/250" },
      ],
    },
    {
      name: "Badges",
      image: "https://picsum.photos/seed/badges-cat/600/300",
      description: "Military & service badges",
      subcategories: [
        { name: "Military", image: "https://picsum.photos/seed/badges-military/400/250" },
        { name: "Service", image: "https://picsum.photos/seed/badges-service/400/250" },
      ],
    },
    {
      name: "Patches",
      image: "https://picsum.photos/seed/patches-cat/600/300",
      description: "Embroidered & woven patches",
      subcategories: [
        { name: "Embroidered", image: "https://picsum.photos/seed/patches-embroidered/400/250" },
        { name: "Woven", image: "https://picsum.photos/seed/patches-woven/400/250" },
      ],
    },
    {
      name: "T-Shirts",
      image: "https://picsum.photos/seed/ts-cat/600/300",
      description: "Apparel for everyday wear",
      subcategories: [
        { name: "Black", image: "https://picsum.photos/seed/ts-black/400/250" },
        { name: "Navy", image: "https://picsum.photos/seed/ts-navy/400/250" },
      ],
    },
    {
      name: "Name Tapes",
      image: "https://picsum.photos/seed/names-cat/600/300",
      description: "Uniform name tapes",
      subcategories: [
        { name: "US Army", image: "https://picsum.photos/seed/tape-us-army/400/250" },
        { name: "Air Force", image: "https://picsum.photos/seed/tape-air-force/400/250" },
      ],
    },
    {
      name: "Stickers",
      image: "https://picsum.photos/seed/stickers-cat/600/300",
      description: "Small accessories & decals",
      subcategories: [
        { name: "Laptop", image: "https://picsum.photos/seed/stickers-laptop/400/250" },
        { name: "Car", image: "https://picsum.photos/seed/stickers-car/400/250" },
      ],
    },
  ];

  // Create categories/subcategories first (build ID map)
  const categoryIdByName: Record<string, string> = {};
  const subcategoryIdByKey: Record<string, string> = {};

  for (const cat of categories) {
    const catId = await upsertCategory({
      createdBy: admin._id,
      name: cat.name,
      image: cat.image,
      description: cat.description,
    });
    categoryIdByName[cat.name] = String(catId);

    for (const sub of cat.subcategories) {
      const subId = await upsertSubcategory({
        createdBy: admin._id,
        categoryId: catId,
        name: sub.name,
        image: sub.image,
      });
      subcategoryIdByKey[`${cat.name}::${sub.name}`] = String(subId);
    }
  }

  // Products (10)
  const products = [
    {
      name: "Gold Service Medal",
      category: "Medals",
      subcategory: "Gold",
      price: 79.99,
      stock: 25,
      thumbnail: "https://picsum.photos/seed/gold-medal-thumb/500/400",
      images: [
        "https://picsum.photos/seed/gold-medal-1/800/600",
        "https://picsum.photos/seed/gold-medal-2/800/600",
      ],
      weightOz: 6,
    },
    {
      name: "Silver Service Medal",
      category: "Medals",
      subcategory: "Silver",
      price: 74.99,
      stock: 25,
      thumbnail: "https://picsum.photos/seed/silver-medal-thumb/500/400",
      images: [
        "https://picsum.photos/seed/silver-medal-1/800/600",
        "https://picsum.photos/seed/silver-medal-2/800/600",
      ],
      weightOz: 6,
    },
    {
      name: "Bronze Service Medal",
      category: "Medals",
      subcategory: "Bronze",
      price: 64.99,
      stock: 25,
      thumbnail: "https://picsum.photos/seed/bronze-medal-thumb/500/400",
      images: [
        "https://picsum.photos/seed/bronze-medal-1/800/600",
        "https://picsum.photos/seed/bronze-medal-2/800/600",
      ],
      weightOz: 6,
    },
    {
      name: "US Military Badge",
      category: "Badges",
      subcategory: "Military",
      price: 59.99,
      stock: 40,
      thumbnail: "https://picsum.photos/seed/military-badge-thumb/500/400",
      images: [
        "https://picsum.photos/seed/military-badge-1/800/600",
        "https://picsum.photos/seed/military-badge-2/800/600",
      ],
      weightOz: 5,
    },
    {
      name: "Service Recognition Badge",
      category: "Badges",
      subcategory: "Service",
      price: 54.99,
      stock: 40,
      thumbnail: "https://picsum.photos/seed/service-badge-thumb/500/400",
      images: [
        "https://picsum.photos/seed/service-badge-1/800/600",
        "https://picsum.photos/seed/service-badge-2/800/600",
      ],
      weightOz: 5,
    },
    {
      name: "Embroidered Patch (Classic)",
      category: "Patches",
      subcategory: "Embroidered",
      price: 24.99,
      stock: 120,
      thumbnail: "https://picsum.photos/seed/embroidered-patch-thumb/500/400",
      images: [
        "https://picsum.photos/seed/embroidered-patch-1/800/600",
        "https://picsum.photos/seed/embroidered-patch-2/800/600",
      ],
      weightOz: 2,
    },
    {
      name: "Woven Patch (Pro)",
      category: "Patches",
      subcategory: "Woven",
      price: 19.99,
      stock: 120,
      thumbnail: "https://picsum.photos/seed/woven-patch-thumb/500/400",
      images: [
        "https://picsum.photos/seed/woven-patch-1/800/600",
        "https://picsum.photos/seed/woven-patch-2/800/600",
      ],
      weightOz: 2,
    },
    {
      name: "Black T-Shirt (Emblem)",
      category: "T-Shirts",
      subcategory: "Black",
      price: 29.99,
      stock: 60,
      thumbnail: "https://picsum.photos/seed/ts-black-thumb/500/400",
      images: [
        "https://picsum.photos/seed/ts-black-1/800/600",
        "https://picsum.photos/seed/ts-black-2/800/600",
      ],
      weightOz: 10,
    },
    {
      name: "Navy T-Shirt (Emblem)",
      category: "T-Shirts",
      subcategory: "Navy",
      price: 29.99,
      stock: 60,
      thumbnail: "https://picsum.photos/seed/ts-navy-thumb/500/400",
      images: [
        "https://picsum.photos/seed/ts-navy-1/800/600",
        "https://picsum.photos/seed/ts-navy-2/800/600",
      ],
      weightOz: 10,
    },
    {
      name: "US Army Name Tape",
      category: "Name Tapes",
      subcategory: "US Army",
      price: 39.99,
      stock: 80,
      thumbnail: "https://picsum.photos/seed/us-army-tape-thumb/500/400",
      images: [
        "https://picsum.photos/seed/us-army-tape-1/800/600",
        "https://picsum.photos/seed/us-army-tape-2/800/600",
      ],
      weightOz: 3,
    },
  ];

  let createdCategories = 0;
  let createdSubcategories = 0;
  let createdProducts = 0;

  for (const cat of categories) {
    // best-effort count by checking existence again (avoid extra queries by not tracking exact creates)
    // We'll just log at the end.
  }

  for (const p of products) {
    const catId = categoryIdByName[p.category];
    const subId = subcategoryIdByKey[`${p.category}::${p.subcategory}`];
    if (!catId || !subId) throw new Error(`Missing IDs for product: ${p.name}`);

    const existing = await Product.findOne({
      name: { $regex: new RegExp(`^${escapeRegExp(p.name)}$`, "i") },
      categoryId: catId,
    }).lean();

    if (existing) continue;

    await upsertProduct({
      createdBy: admin._id,
      categoryId: catId,
      subcategoryId: subId,
      name: p.name,
      price: p.price,
      stock: p.stock,
      thumbnail: p.thumbnail,
      images: p.images,
      weightOz: p.weightOz,
    });
    createdProducts += 1;
  }

  console.log("Seed finished.");
  console.log({ createdProducts });

  await disconnectDB();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await disconnectDB();
  } catch {
    // ignore
  }
  process.exit(1);
});

