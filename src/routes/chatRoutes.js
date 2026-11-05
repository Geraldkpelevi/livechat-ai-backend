import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  toggleAI,
} from "../controllers/chatController.js";

const router = express.Router();

router.use(authMiddleware);

// Conversations
router.post("/conversations", createConversation);
router.get("/conversations", getConversations);

// Messages
router.get(
  "/conversations/:conversationId/messages",
  getMessages
);

router.post(
  "/conversations/:conversationId/messages",
  sendMessage
);

// AI settings
router.patch(
  "/conversations/:conversationId/ai",
  toggleAI
);

export default router;