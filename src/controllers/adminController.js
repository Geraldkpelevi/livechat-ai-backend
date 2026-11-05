
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Helper: safely escape search input for MongoDB regex
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Helper: check whether another active administrator exists
const hasAnotherActiveAdmin = async (userId) => {
  return User.exists({
    _id: { $ne: userId },
    role: "ADMIN",
    isActive: true,
  });
};

// CREATE AGENT
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
          isActive: agent.isActive,
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

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const {
      search = "",
      role,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const filter = {};

    // Search by name or email
    if (search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    // Filter by role
    if (role) {
      const allowedRoles = ["CUSTOMER", "AGENT", "ADMIN"];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role",
        });
      }

      filter.role = role;
    }

    // Filter by account status
    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid account status",
        });
      }

      filter.isActive = status === "active";
    }

    const skip = (currentPage - 1) * pageLimit;

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          totalUsers,
          currentPage,
          totalPages: Math.ceil(totalUsers / pageLimit),
          pageLimit,
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve users",
    });
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user",
    });
  }
};

// UPDATE USER ROLE
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const allowedRoles = ["CUSTOMER", "AGENT", "ADMIN"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    if (id === req.user._id.toString() && role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own administrator role",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.role === "ADMIN" &&
      role !== "ADMIN" &&
      user.isActive
    ) {
      const anotherAdmin = await hasAnotherActiveAdmin(user._id);

      if (!anotherAdmin) {
        return res.status(400).json({
          success: false,
          message: "Cannot remove the last active administrator",
        });
      }
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user role",
    });
  }
};

// UPDATE USER STATUS
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    if (id === req.user._id.toString() && !isActive) {
      return res.status(403).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.role === "ADMIN" &&
      user.isActive &&
      !isActive
    ) {
      const anotherAdmin = await hasAnotherActiveAdmin(user._id);

      if (!anotherAdmin) {
        return res.status(400).json({
          success: false,
          message: "Cannot deactivate the last active administrator",
        });
      }
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user status",
    });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (id === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "ADMIN" && user.isActive) {
      const anotherAdmin = await hasAnotherActiveAdmin(user._id);

      if (!anotherAdmin) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last active administrator",
        });
      }
    }

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete user",
    });
  }
};
