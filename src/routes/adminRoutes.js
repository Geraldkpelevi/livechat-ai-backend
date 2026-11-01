
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

import {
  createAgent,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles("ADMIN"));

router.post("/agents", createAgent);

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

export default router;
