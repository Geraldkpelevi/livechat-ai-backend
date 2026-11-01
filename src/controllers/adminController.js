
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const createAgent = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const agent = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "AGENT",
    });

    return res.status(201).json({
      success: true,
      message: "Agent account created successfully",
      data: {
        user: {
          id: agent._id,
          name: agent.name,
          email: agent.email,
          role: agent.role,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Create agent error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create agent account",
    });
  }
};
