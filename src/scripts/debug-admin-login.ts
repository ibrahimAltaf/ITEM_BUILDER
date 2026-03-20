import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../db/connect";
import User from "../modules/auth/user.model";
import { comparePassword } from "../utils/auth";

async function main() {
  dotenv.config();

  const email = "admin@admin.com";
  const password = "12345678";

  await connectDB();

  const user = await User.findOne({ email }).select("+passwordHash").lean();
  if (!user) {
    console.log("User not found in current MONGO_URI:", email);
    await disconnectDB();
    return;
  }

  const match = await comparePassword(password, String((user as any).passwordHash ?? ""));

  console.log("User found:", email);
  console.log("Password match:", match);
  console.log("Role:", (user as any).role);

  await disconnectDB();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await disconnectDB();
  } catch {
    // ignore
  }
  process.exit(1);
});

