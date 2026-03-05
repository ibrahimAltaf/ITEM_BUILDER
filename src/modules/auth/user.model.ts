import mongoose, { Schema } from "mongoose"

const schema = new Schema(
  {
    firstName: String,
    lastName: String,
    fullName: String,
    email: { type: String, unique: true },
    phoneNumber: String,
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ["admin", "staff", "user"], default: "user" },
    emailVerified: { type: Boolean, default: false },
    verifyToken: String,
    refreshToken: String,
    otpCode: String,
    otpExpire: Date,
    resetToken: String,
    resetExpire: Date,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", schema)