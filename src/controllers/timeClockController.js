
import {
  clockInService,
  startBreakService,
  endBreakService,
  clockOutService,
  getTimeClockStatusService,
} from "../services/timeClockService.js";
import {
  serializeAttendance,
} from "../utils/attendanceSerializer.js";
export const clockIn = async (req, res, next) => {
  try {
    const attendance = await clockInService(
      req.employee,
      req.body.source
    );

    return res.status(201).json({
      success: true,
      message: "Clocked in successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const startBreak = async (req, res, next) => {
  try {
    const attendance = await startBreakService(req.employee._id);

    return res.status(200).json({
      success: true,
      message: "Break started successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const endBreak = async (req, res, next) => {
  try {
    const attendance = await endBreakService(req.employee._id);

    return res.status(200).json({
      success: true,
      message: "Break ended successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const clockOut = async (req, res, next) => {
  try {
    const attendance = await clockOutService(
      req.employee._id,
      req.body.source
    );

    return res.status(200).json({
      success: true,
      message: "Clocked out successfully",
      data: serializeAttendance(attendance),
    });
  } catch (error) {
    next(error);
  }
};

export const getTimeClockStatus = async (req, res, next) => {
  try {
    const status = await getTimeClockStatusService(req.employee._id);

    return res.status(200).json({
      success: true,
      message: "Time clock status retrieved successfully",
      data: status,
    });
  } catch (error) {
    next(error);
  }
};
