
import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const seedAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Admin environment variables are required");
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("Admin password must be at least 12 characters");
    }

    await connectDB();

    const email = ADMIN_EMAIL.trim().toLowerCase();

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      throw new Error(
        "An account with this email already exists. No changes were made."
      );
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email,
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("Admin account created successfully");
    console.log({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } catch (error) {
    console.error("Admin seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    const mongoose = await import("mongoose");
    await mongoose.default.connection.close();
  }
};

seedAdmin();
