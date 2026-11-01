
import mongoose from "mongoose";

const aiSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    isEnabled: {
      type: Boolean,
      default: true,
    },

    responseMode: {
      type: String,
      enum: ["AI", "MANUAL"],
      default: "AI",
    },

    tone: {
      type: String,
      default: "friendly",
    },

    language: {
      type: String,
      default: "en",
    },

    autoReply: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const AISettings = mongoose.model("AISettings", aiSettingsSchema);

export default AISettings;
