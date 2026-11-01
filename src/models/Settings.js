import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    ai: {
      enabled: {
        type: Boolean,
        default: true,
      },

      autoReply: {
        type: Boolean,
        default: true,
      },

      model: {
        type: String,
        default: "gpt-4o-mini",
      },

      tone: {
        type: String,
        enum: ["FRIENDLY", "PROFESSIONAL", "CASUAL", "FORMAL"],
        default: "FRIENDLY",
      },

      customInstructions: {
        type: String,
        default: "",
        maxlength: 2000,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;