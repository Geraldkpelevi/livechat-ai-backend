import Employee from "../models/Employee.js";
import Shift from "../models/Shift.js";

export const assignShiftService = async (
  employeeId,
  shiftId,
) => {
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new Error("Employee not found");
  }

  if (shiftId) {
    const shift = await Shift.findOne({
      _id: shiftId,
      isActive: true,
    });

    if (!shift) {
      throw new Error("Active shift not found");
    }
  }

  employee.shift = shiftId || null;

  await employee.save();

  return Employee.findById(employeeId)
    .populate("shift")
    .populate("user", "name email role");
};