import mongoose, { Schema } from "mongoose";

const orderLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    variantLabel: { type: String, default: "" },
    addOns: [
      {
        name: String,
        price: Number,
        _id: false,
      },
    ],
  },
  { _id: false }
);

const addrSnapshotSchema = new Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    isMilitary: Boolean,
    militaryType: String,
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lines: { type: [orderLineSchema], required: true },
    shippingAddress: { type: addrSnapshotSchema, required: true },

    subtotalCents: { type: Number, required: true },
    shippingCents: { type: Number, required: true },
    taxCents: { type: Number, required: true },
    totalCents: { type: Number, required: true },
    currency: { type: String, default: "usd" },

    taxSource: {
      type: String,
      enum: ["taxjar", "ca_fallback", "none"],
      default: "none",
    },

    shippoRateObjectId: { type: String, default: "" },
    shippoShipmentObjectId: { type: String, default: "" },

    orderStatus: {
      type: String,
      enum: ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending_payment",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
    },

    paymentMethod: {
      type: String,
      enum: ["stripe", "cod"],
      default: "stripe",
    },

    stripePaymentIntentId: { type: String, default: "" },
    stripePaymentMethodType: { type: String, default: "" },

    trackingNumber: { type: String, default: "" },
    carrier: { type: String, default: "" },

    /** quickbooks / future sync */
    quickbooksSyncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
