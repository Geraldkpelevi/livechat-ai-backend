
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import AttendanceCorrection from "../models/AttendanceCorrection.js";

import {
  buildAttendanceFilters,
  getPagination,
} from "../utils/attendanceQuery.js";

import {
  serializeAttendance,
  serializeAttendanceList,
} from "../utils/attendanceSerializer.js";

const throwError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const attendancePopulation = {
  path: "employee",
  select: "employeeNumber jobTitle department employmentRole",
  populate: {
    path: "user",
    select: "name email",
  },
};

const getAttendanceSnapshot = (attendance) => ({
  workDate: attendance.workDate,
  timezone: attendance.timezone,
  clockInTime: attendance.clockInTime,
  clockOutTime: attendance.clockOutTime,
  breaks: attendance.breaks.map((item) => ({
    startedAt: item.startedAt,
    endedAt: item.endedAt,
  })),
  status: attendance.status,
  totalBreakMinutes: attendance.totalBreakMinutes,
  totalWorkedMinutes: attendance.totalWorkedMinutes,
  notes: attendance.notes,
});

const calculateDurations = (clockInTime, clockOutTime, breaks) => {
  const clockIn = new Date(clockInTime).getTime();
  const clockOut = new Date(clockOutTime).getTime();

  if (
    !Number.isFinite(clockIn) ||
    !Number.isFinite(clockOut) ||
    clockOut <= clockIn
  ) {
    throwError("Clock-out time must be later than clock-in time");
  }

  let totalBreakMilliseconds = 0;

  for (const item of breaks) {
    const start = new Date(item.startedAt).getTime();
    const end = new Date(item.endedAt).getTime();

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start
    ) {
      throwError("Every break must have a valid start and end time");
    }

    if (start < clockIn || end > clockOut) {
      throwError(
        "Break times must fall between clock-in and clock-out"
      );
    }

    totalBreakMilliseconds += end - start;
  }

  const sortedBreaks = [...breaks].sort(
    (a, b) =>
      new Date(a.startedAt).getTime() -
      new Date(b.startedAt).getTime()
  );

  for (let index = 1; index < sortedBreaks.length; index += 1) {
    const previousEnd = new Date(
      sortedBreaks[index - 1].endedAt
    ).getTime();

    const currentStart = new Date(
      sortedBreaks[index].startedAt
    ).getTime();

    if (currentStart < previousEnd) {
      throwError("Break periods cannot overlap");
    }
  }

  const workedMilliseconds = Math.max(
    0,
    clockOut - clockIn - totalBreakMilliseconds
  );

  return {
    totalBreakMinutes:
      Math.round((totalBreakMilliseconds / 60000) * 100) / 100,

    totalWorkedMinutes:
      Math.round((workedMilliseconds / 60000) * 100) / 100,
  };
};

// ADMIN: Get all attendance records
export const getAllAttendanceService = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filters = await buildAttendanceFilters(query);

  const [attendance, totalRecords] = await Promise.all([
    Attendance.find(filters)
      .populate(attendancePopulation)
      .sort({ clockInTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Attendance.countDocuments(filters),
  ]);

  return {
    attendance: serializeAttendanceList(attendance),

    pagination: {
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      pageLimit: limit,
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
  };
};

// ADMIN: Get one attendance record
export const getAttendanceByIdService = async (attendanceId) => {
  if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
    throwError("Invalid attendance ID", 400);
  }

  const attendance = await Attendance.findById(attendanceId)
    .populate(attendancePopulation)
    .lean();

  if (!attendance) {
    throwError("Attendance record not found", 404);
  }

  const corrections = await AttendanceCorrection.find({
    attendance: attendanceId,
  })
    .populate("changedBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return {
    ...serializeAttendance(attendance),
    corrections,
  };
};

// EMPLOYEE: Get the authenticated employee's history
export const getEmployeeAttendanceService = async (
  employeeId,
  query
) => {
  const { page, limit, skip } = getPagination(query);

  const filters = await buildAttendanceFilters(query);

  // Never allow an employee to query another employee's records.
  filters.employee = employeeId;

  const [attendance, totalRecords] = await Promise.all([
    Attendance.find(filters)
      .sort({ clockInTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Attendance.countDocuments(filters),
  ]);

  return {
    attendance: serializeAttendanceList(attendance),

    pagination: {
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      pageLimit: limit,
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
  };
};

// ADMIN: Correct a completed attendance record and save its audit history
export const correctAttendanceService = async (
  attendanceId,
  correctionData,
  adminId
) => {
  if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
    throwError("Invalid attendance ID", 400);
  }

  const {
    reason,
    clockInTime,
    clockOutTime,
    breaks,
    notes,
  } = correctionData;

  if (typeof reason !== "string" || !reason.trim()) {
    throwError("A correction reason is required");
  }

  if (reason.trim().length > 1000) {
    throwError("Correction reason cannot exceed 1000 characters");
  }

  const session = await mongoose.startSession();

  let correctedAttendance;

  try {
    await session.withTransaction(async () => {
      const attendance = await Attendance.findById(
        attendanceId
      ).session(session);

      if (!attendance) {
        throwError("Attendance record not found", 404);
      }

      if (attendance.status !== "COMPLETED") {
        throwError(
          "Only completed attendance records can be corrected",
          409
        );
      }

      const before = getAttendanceSnapshot(attendance);

      const nextClockIn = clockInTime
        ? new Date(clockInTime)
        : attendance.clockInTime;

      const nextClockOut = clockOutTime
        ? new Date(clockOutTime)
        : attendance.clockOutTime;

      if (
        !Number.isFinite(nextClockIn.getTime()) ||
        !Number.isFinite(nextClockOut.getTime())
      ) {
        throwError("Invalid clock-in or clock-out date");
      }

      if (breaks !== undefined && !Array.isArray(breaks)) {
        throwError("Breaks must be an array");
      }

      const nextBreaks =
        breaks !== undefined
          ? breaks.map((item) => {
              if (
                !item ||
                !item.startedAt ||
                !item.endedAt
              ) {
                throwError(
                  "Each break must have startedAt and endedAt"
                );
              }

              return {
                startedAt: new Date(item.startedAt),
                endedAt: new Date(item.endedAt),
              };
            })
          : attendance.breaks.map((item) => ({
              startedAt: item.startedAt,
              endedAt: item.endedAt,
            }));

      if (
        nextBreaks.some(
          (item) =>
            !Number.isFinite(item.startedAt.getTime()) ||
            !Number.isFinite(item.endedAt.getTime())
        )
      ) {
        throwError("Invalid break date");
      }

      const durations = calculateDurations(
        nextClockIn,
        nextClockOut,
        nextBreaks
      );

      attendance.clockInTime = nextClockIn;
      attendance.clockOutTime = nextClockOut;
      attendance.breaks = nextBreaks;

      if (notes !== undefined) {
        attendance.notes = notes;
      }

      attendance.totalBreakMinutes = durations.totalBreakMinutes;
      attendance.totalWorkedMinutes = durations.totalWorkedMinutes;

      await attendance.save({ session });

      const after = getAttendanceSnapshot(attendance);

      await AttendanceCorrection.create(
        [
          {
            attendance: attendance._id,
            changedBy: adminId,
            reason: reason.trim(),
            before,
            after,
          },
        ],
        { session }
      );

      correctedAttendance = attendance;
    });
  } finally {
    await session.endSession();
  }

  const updatedAttendance = await Attendance.findById(
    correctedAttendance._id
  )
    .populate(attendancePopulation)
    .lean();

  return serializeAttendance(updatedAttendance);
};
