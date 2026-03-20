import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../db/connect";
import User from "../modules/auth/user.model";
import { hashPassword } from "../utils/auth";

async function main() {
  dotenv.config();

  const email = "admin@admin.com";
  const password = "12345678";

  await connectDB();

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    await disconnectDB();
    return;
  }

  const passwordHash = await hashPassword(password);

  await User.create({
    firstName: "Admin",
    lastName: "Admin",
    fullName: "Super Admin",
    email,
    phoneNumber: "",
    passwordHash,
    role: "admin",
    emailVerified: true,
  });

  console.log(`Super admin created: ${email}`);
  await disconnectDB();
}

main().catch(async (err) => {
  console.error("Failed to create super admin:", err);
  try {
    await disconnectDB();
  } catch {
    // ignore
  }
  process.exit(1);
});

