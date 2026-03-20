import mongoose, { Schema } from "mongoose";

const productOptionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    values: [{ type: String, trim: true }],
  },
  { _id: false }
);

const productVariantSchema = new Schema(
  {
    optionValues: { type: Schema.Types.Mixed, default: {} },
    sku: { type: String, trim: true, default: "" },
    price: { type: Number, min: 0, default: 0 },
    stock: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const productAddOnSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    description: { type: String, default: "" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subcategoryId: { type: Schema.Types.ObjectId, ref: "Subcategory" },
    price: { type: Number, required: true, min: 0 },
    thumbnail: { type: String, default: "" },
    images: [{ type: String }],
    documentUrl: { type: String, default: "" },
    sku: { type: String, trim: true },
    stock: { type: Number, default: 0, min: 0 },
    options: [productOptionSchema],
    variants: [productVariantSchema],
    addOns: [productAddOnSchema],
    attributes: { type: Schema.Types.Mixed, default: {} },
    /** Optional — used for Shippo rate quotes */
    weightOz: { type: Number, min: 0, default: null },
    lengthIn: { type: Number, min: 0, default: null },
    widthIn: { type: Number, min: 0, default: null },
    heightIn: { type: Number, min: 0, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ subcategoryId: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: "text", description: "text" });
productSchema.index({ sku: 1 }, { sparse: true });

export default mongoose.models.Product || mongoose.model("Product", productSchema);
