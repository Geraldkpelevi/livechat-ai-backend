
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

import {
  createAgent,
  getAllCustomer,
  getCustomerById,
  updateCustomerStatus,
  deleteCustomer,
} from "../controllers/adminCustomerController.js";

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


router.post("/agents", createAgent);

// Customer management
router.get("/customers", getAllCustomer);
router.get("/customers/:id", getCustomerById);
router.patch("/customers/:id/status", updateCustomerStatus);
router.delete("/customers/:id", deleteCustomer);

export default router;
