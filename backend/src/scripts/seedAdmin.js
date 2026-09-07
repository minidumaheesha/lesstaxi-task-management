import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../config/db.js";
import User from "../models/User.js";

const validateEnvironment = () => {
  const requiredVariables = ["ADMIN_NAME", "ADMIN_EMAIL", "ADMIN_PASSWORD"];

  const missingVariables = requiredVariables.filter(
    (variableName) => !process.env[variableName],
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing environment variables: ${missingVariables.join(", ")}`,
    );
  }

  if (Buffer.byteLength(process.env.ADMIN_PASSWORD, "utf8") > 72) {
    throw new Error("ADMIN_PASSWORD must not exceed 72 bytes");
  }

  const passwordIsStrong =
    process.env.ADMIN_PASSWORD.length >= 12 &&
    /[a-z]/.test(process.env.ADMIN_PASSWORD) &&
    /[A-Z]/.test(process.env.ADMIN_PASSWORD) &&
    /\d/.test(process.env.ADMIN_PASSWORD);

  if (!passwordIsStrong) {
    throw new Error(
      "ADMIN_PASSWORD must contain at least 12 characters, including uppercase, lowercase, and a number",
    );
  }
};

const seedAdmin = async () => {
  try {
    validateEnvironment();
    await connectDatabase();

    const normalizedEmail = process.env.ADMIN_EMAIL.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      if (existingUser.role !== "admin") {
        throw new Error(
          "ADMIN_EMAIL already belongs to a normal user. Choose a different admin email.",
        );
      }

      console.log(`Admin already exists: ${existingUser.email}`);
      return;
    }

    const admin = await User.create({
      name: process.env.ADMIN_NAME,
      email: normalizedEmail,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
    });

    console.log(`Admin created successfully: ${admin.email}`);
  } catch (error) {
    console.error(`Admin seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedAdmin();
