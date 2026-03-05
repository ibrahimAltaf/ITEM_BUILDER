import mongoose, { Schema } from "mongoose";

const subcategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

subcategorySchema.index({ categoryId: 1 });
subcategorySchema.index({ slug: 1 });
subcategorySchema.index({ isActive: 1 });
subcategorySchema.index({ categoryId: 1, name: 1 }, { unique: true });

export default mongoose.models.Subcategory ||
  mongoose.model("Subcategory", subcategorySchema);
