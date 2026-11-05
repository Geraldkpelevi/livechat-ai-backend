import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import { generateAIResponse } from "../services/openaiService.js";

// Check conversation access
const canAccessConversation = (conversation, user) => {
  if (user.role === "ADMIN") return true;

  if (
    user.role === "CUSTOMER" &&
    conversation.customer.toString() === user._id.toString()
  ) {
    return true;
  }

  if (
    user.role === "AGENT" &&
    (
      !conversation.assignedAgent ||
      conversation.assignedAgent.toString() === user._id.toString()
    )
  ) {
    return true;
  }

  return false;
};

// Create conversation
// Create conversation
export const createConversation = async (req, res, next) => {
  try {
    // Only customers can create conversations
    if (req.user.role !== "CUSTOMER") {
      return res.status(403).json({
        success: false,
        message: "Only customers can create conversations",
      });
    }

    const conversation = await Conversation.create({
      customer: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: { conversation },
    });
  } catch (error) {
    next(error);
  }
};

// Get conversations
export const getConversations = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === "CUSTOMER") {
      filter.customer = req.user._id;
    }

    if (req.user.role === "AGENT") {
      filter.$or = [
        { assignedAgent: req.user._id },
        { assignedAgent: null },
      ];
    }

    const conversations = await Conversation.find(filter)
      .populate("customer", "name email")
      .populate("assignedAgent", "name email")
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    next(error);
  }
};

// Get conversation messages
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!canAccessConversation(conversation, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You cannot access this conversation",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", "name role")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: { messages },
    });
  } catch (error) {
    next(error);
  }
};

// Send message
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const content = req.body.content?.trim();

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    if (!content || content.length > 10000) {
      return res.status(400).json({
        success: false,
        message: "Message must contain between 1 and 10000 characters",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!canAccessConversation(conversation, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You cannot access this conversation",
      });
    }

    if (conversation.status === "CLOSED") {
      return res.status(400).json({
        success: false,
        message: "This conversation is closed",
      });
    }

    const senderRole = req.user.role;

    // Save incoming message
    const customerMessage = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      senderRole,
      content,
    });

    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();

    await conversation.save();

    let aiMessage = null;
    let aiError = null;

    // Generate AI response only for customer messages
    if (senderRole === "CUSTOMER" && conversation.aiEnabled) {
      try {
        const history = await Message.find({
          conversation: conversation._id,
        })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();

        history.reverse();

        const formattedMessages = history.map((message) => ({
          role: message.senderRole === "CUSTOMER" ? "user" : "assistant",
          content: message.content,
        }));

        const aiResponse = await generateAIResponse(formattedMessages);

        aiMessage = await Message.create({
          conversation: conversation._id,
          senderRole: "AI",
          content: aiResponse,
        });

        conversation.lastMessage = aiResponse;
        conversation.lastMessageAt = new Date();

        await conversation.save();
      } catch (error) {
        console.error("AI response error:", error.message);
        aiError = "Your message was saved, but the AI could not respond right now.";
      }
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        customerMessage,
        aiMessage,
        aiError,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Toggle AI mode
export const toggleAI = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { aiEnabled } = req.body;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    if (typeof aiEnabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "aiEnabled must be a boolean",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!canAccessConversation(conversation, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You cannot manage this conversation",
      });
    }

    conversation.aiEnabled = aiEnabled;

    await conversation.save();

    res.status(200).json({
      success: true,
      message: `AI Auto-Reply ${aiEnabled ? "enabled" : "disabled"}`,
      data: { conversation },
    });
  } catch (error) {
    next(error);
  }
};