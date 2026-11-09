import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: [
        "CUSTOMER",
        "EMPLOYEE",
        "AGENT",
        "MANAGER",
        "ADMIN",
        "SUPER_ADMIN",
        "TIMEKEEPER",
        "SUPERVISOR",
        "HR",
        "ACCOUNTANT",
        "IT_SUPPORT",
        "SALES",
        "MARKETING",
        "DEVELOPER",
        "DESIGNER",
        "ANALYST",
        "CONSULTANT",
        "PROJECT_MANAGER",
        "TEAM_LEAD",
        "DIRECTOR",
        "VP",
        "C_LEVEL",
      ],
      default: "CUSTOMER",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
