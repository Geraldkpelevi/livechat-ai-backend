
import {
  registerUser,
  loginUser,
} from "../services/authService.js";

// Register
export const register = async (req, res) => {
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

    const result = await registerUser({
      name,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: result,
    });
  } catch (error) {
    const isDuplicate =
      error.message.includes("already exists");

    return res.status(isDuplicate ? 409 : 500).json({
      success: false,
      message: isDuplicate
        ? error.message
        : "Unable to create account",
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await loginUser({
      email,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    const isInactive = error.message.includes("deactivated");

    return res.status(isInactive ? 403 : 401).json({
      success: false,
      message: isInactive
        ? error.message
        : "Invalid email or password",
    });
  }
};

// Get authenticated user
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
      },
    },
  });
};
