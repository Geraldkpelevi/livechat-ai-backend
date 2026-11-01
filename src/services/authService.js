
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import AISettings from "../AISettings.js";
import generateToken from "../utils/generateToken.js";

export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const session = await mongoose.startSession();

  let createdUser;

  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "CUSTOMER",
          },
        ],
        { session }
      );

      await AISettings.create(
        [
          {
            userId: user._id,
          },
        ],
        { session }
      );

      createdUser = user;
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("An account with this email already exists");
    }

    throw error;
  } finally {
    await session.endSession();
  }

  const token = generateToken(createdUser._id);

  return {
    user: {
      id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
    },
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Your account has been deactivated");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};
