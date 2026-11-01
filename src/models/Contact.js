import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Contact name is required"],
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    company: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    source: {
      type: String,
      enum: ["MANUAL", "WHATSAPP", "WEBSITE", "OTHER"],
      default: "MANUAL",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED", "BLOCKED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

// Optimize contact searches per user
contactSchema.index({ user: 1, name: 1 });

contactSchema.index({ user: 1, email: 1 });

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;