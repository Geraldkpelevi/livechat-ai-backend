
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles("AGENT", "ADMIN"));

router.get("/dashboard", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the ReplyMate agent dashboard",
    data: {
      user: req.user.name,
      role: req.user.role,
    },
  });
});

export default router;
