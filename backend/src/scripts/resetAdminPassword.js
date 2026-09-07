import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

async function resetAdminPassword() {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!process.env.MONGODB_URI || !email || !password) {
      throw new Error(
        "MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD are required"
      );
    }

    if (
      password.length < 12 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      throw new Error(
        "Admin password must have at least 12 characters, uppercase, lowercase, a number, and at most 72 bytes"
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const admin = await User.findOne({
      email,
      role: "admin",
    }).select("+password");

    if (!admin) {
      throw new Error("No administrator found with ADMIN_EMAIL");
    }

    admin.password = password;

    // The User model's save hook hashes the new password.
    await admin.save();

    console.log("Admin password updated successfully.");
  } catch (error) {
    console.error(`Admin password reset failed (${error.name}).`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await resetAdminPassword();