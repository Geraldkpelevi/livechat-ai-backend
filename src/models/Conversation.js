import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title: {
      type: String,
      trim: true,
      default: "New Conversation",
      maxlength: 150,
    },

    controlMode: {
      type: String,
      enum: ["AI", "MANUAL"],
      default: "AI",
    },

    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    lastMessage: {
      content: {
        type: String,
        default: "",
      },

      senderType: {
        type: String,
        enum: ["USER", "AI", "ADMIN", "SYSTEM"],
        default: "SYSTEM",
      },

      createdAt: {
        type: Date,
        default: null,
      },
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    takeoverAt: {
      type: Date,
      default: null,
    },

    releasedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({
  user: 1,
  status: 1,
  lastMessageAt: -1,
});

conversationSchema.index({
  assignedAdmin: 1,
  controlMode: 1,
  status: 1,
});

const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);

export default Conversation;