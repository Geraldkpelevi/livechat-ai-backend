import {
  assignShiftService,
} from "../services/employeeShiftService.js";

export const assignEmployeeShift = async (req, res, next) => {
  try {
    const { shiftId } = req.body;

    const employee = await assignShiftService(
      req.params.employeeId,
      shiftId,
    );

    return res.status(200).json({
      success: true,
      message: shiftId
        ? "Employee shift assigned successfully"
        : "Employee shift removed successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};