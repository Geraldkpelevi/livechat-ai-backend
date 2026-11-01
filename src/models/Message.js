import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    senderType: {
      type: String,
      enum: ["USER", "AI", "ADMIN", "SYSTEM"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    messageType: {
      type: String,
      enum: ["TEXT", "IMAGE", "FILE"],
      default: "TEXT",
    },

    status: {
      type: String,
      enum: ["PENDING", "SENT", "DELIVERED", "READ", "FAILED"],
      default: "SENT",
    },

    aiMetadata: {
      model: {
        type: String,
        default: "",
      },

      promptTokens: {
        type: Number,
        default: 0,
      },

      completionTokens: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({
  conversation: 1,
  createdAt: 1,
});

const Message = mongoose.model("Message", messageSchema);

export default Message;