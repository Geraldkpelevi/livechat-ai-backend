import mongoose from "mongoose";
import Employee from "../models/Employee.js";

const targetEmployeeMiddleware = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      status: "ACTIVE",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Active employee profile not found",
      });
    }

    req.employee = employee;
    next();
  } catch (error) {
    next(error);
  }
};

export default targetEmployeeMiddleware;
