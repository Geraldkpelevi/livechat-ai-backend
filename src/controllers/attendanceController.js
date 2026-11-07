
import {
  getAllAttendanceService,
  getAttendanceByIdService,
  correctAttendanceService,
  getEmployeeAttendanceService,
} from "../services/attendanceService.js";

export const getAllAttendance = async (req, res, next) => {
  try {
    const result = await getAllAttendanceService(req.query);

    return res.status(200).json({
      success: true,
      message: "Attendance records retrieved successfully",
      data: result.attendance,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceById = async (req, res, next) => {
  try {
    const attendance = await getAttendanceByIdService(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Attendance record retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const correctAttendance = async (req, res, next) => {
  try {
    const attendance = await correctAttendanceService(
      req.params.id,
      req.body,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: "Attendance record corrected successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeAttendance = async (req, res, next) => {
  try {
    const result = await getEmployeeAttendanceService(
      req.employee._id,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Your attendance history retrieved successfully",
      data: result.attendance,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};
