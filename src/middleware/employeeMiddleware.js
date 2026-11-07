
import Employee from "../models/Employee.js";

const employeeMiddleware = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({
      user: req.user._id,
      status: "ACTIVE",
    });

    if (!employee) {
      return res.status(403).json({
        success: false,
        message: "No active employee profile found",
      });
    }

    req.employee = employee;

    next();
  } catch (error) {
    next(error);
  }
};

export default employeeMiddleware;
