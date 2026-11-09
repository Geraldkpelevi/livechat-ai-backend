import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    employeeNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },

    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    employmentType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"],
      default: "FULL_TIME",
    },

    employmentRole: {
      type: String,
      required: true,
      trim: true,
      default: "EMPLOYEE",
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "PENDING",
    },

    dateHired: {
      type: Date,
      default: Date.now,
    },

    timezone: {
      type: String,
      default: "UTC",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    registrationSource: {
      type: String,
      enum: ["ADMIN", "SELF"],
      default: "ADMIN",
    },
  },
  {
    timestamps: true,
  },
);

employeeSchema.index({ department: 1, status: 1 });

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;