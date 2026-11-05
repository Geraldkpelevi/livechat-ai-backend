import express from "express";

import {
  register,
  login,
  getMe,
  changePassword,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", authMiddleware, getMe);

// Change password (Customer, Admin and Agent)
router.patch(
  "/change-password",
  authMiddleware,
  changePassword
);

export default router;