import mongoose, { Schema } from "mongoose";

const addressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, default: "Home" },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: "US", trim: true },
    /** APO / FPO / DPO — use city as APO/FPO/DPO and state AA/AE/AP */
    isMilitary: { type: Boolean, default: false },
    militaryType: {
      type: String,
      enum: ["APO", "FPO", "DPO"],
      required: false,
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

addressSchema.index({ userId: 1 });

export default mongoose.models.Address || mongoose.model("Address", addressSchema);
