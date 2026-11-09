import mongoose from "mongoose";

const employeeSequenceSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
});

const EmployeeSequence = mongoose.model(
  "EmployeeSequence",
  employeeSequenceSchema,
);

export default EmployeeSequence;
