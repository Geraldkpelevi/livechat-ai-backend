
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Helper: safely escape search input for MongoDB regex
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

// GET ALL CUSTOMERS

export const getAllCustomer = async (req, res) => {
  try {
    const {
      search = "",
      status,
      page = "1",
      limit = "10",
    } = req.query;

    if (
      typeof search !== "string" ||
      typeof page !== "string" ||
      typeof limit !== "string" ||
      (status !== undefined && typeof status !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer query parameters",
      });
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);

    const pageLimit = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const filter = {
      role: "CUSTOMER",
    };

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

    const [customers, totalCustomers] = await Promise.all([
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
      message: "Customers retrieved successfully",
      data: {
        customers,
        pagination: {
          totalCustomers,
          currentPage,
          totalPages: Math.ceil(totalCustomers / pageLimit),
          pageLimit,
        },
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve customers",
    });
  }
};

export const getAllCustomers = getAllCustomer;

// GET CUSTOMER BY ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findOne({ _id: id, role: "CUSTOMER" })
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve customer",
    });
  }
};

// UPDATE CUSTOMER STATUS
export const updateCustomerStatus = async (req, res) => {
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

    const user = await User.findOne({ _id: id, role: "CUSTOMER" });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Customer ${isActive ? "activated" : "deactivated"} successfully`,
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
    console.error("Update customer status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user status",
    });
  }
};

// DELETE CUSTOMER
export const deleteCustomer = async (req, res) => {
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

    const user = await User.findOne({ _id: id, role: "CUSTOMER" });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete user",
    });
  }
};
