
import mongoose from "mongoose";

const shiftAssignmentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },

    shiftDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["ASSIGNED", "COMPLETED", "CANCELLED"],
      default: "ASSIGNED",
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

shiftAssignmentSchema.index({
  employee: 1,
  shiftDate: 1,
});

const ShiftAssignment = mongoose.model(
  "ShiftAssignment",
  shiftAssignmentSchema
);

export default ShiftAssignment;
