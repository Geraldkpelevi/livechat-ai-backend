
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

import {
  createAgent,
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from "../controllers/adminController.js";

const router = express.Router();

// Protect all admin routes
router.use(authMiddleware);
router.use(authorizeRoles("ADMIN"));

// Admin dashboard
router.get("/dashboard", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the ReplyMate admin dashboard",
    data: {
      user: req.user.name,
      role: req.user.role,
    },
  });
});

// Agent management
router.post("/agents", createAgent);

// User management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

export default router;
