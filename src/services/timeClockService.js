
import Attendance from "../models/Attendance.js";
import { formatDuration } from "../utils/timeFormatter.js";
const getWorkDate = (date, timezone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const getBreakDurationMilliseconds = (breaks) => {
  return breaks.reduce((total, item) => {
    if (!item.endedAt) return total;

    return (
      total +
      Math.max(
        0,
        new Date(item.endedAt).getTime() -
          new Date(item.startedAt).getTime()
      )
    );
  }, 0);
};

const getBreakMinutes = (breaks) =>
  Math.round((getBreakDurationMilliseconds(breaks) / 60000) * 100) / 100;

const validateSource = (source) => {
  if (!["WEB", "MOBILE"].includes(source)) {
    throw new Error("Source must be WEB or MOBILE");
  }
};

export const clockInService = async (employee, source) => {
  validateSource(source);

  const now = new Date();

  try {
    const attendance = await Attendance.create({
      employee: employee._id,
      workDate: getWorkDate(now, employee.timezone),
      timezone: employee.timezone,
      clockInTime: now,
      clockInSource: source,
      status: "ON_DUTY",
    });

    return attendance;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("You already have an active attendance session");
    }

    throw error;
  }
};

export const startBreakService = async (employeeId) => {
  const now = new Date();

  const attendance = await Attendance.findOneAndUpdate(
    {
      employee: employeeId,
      status: "ON_DUTY",
    },
    {
      $push: {
        breaks: {
          startedAt: now,
        },
      },
      $set: {
        status: "ON_BREAK",
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  if (!attendance) {
    throw new Error("No active working session found");
  }

  return attendance;
};

export const endBreakService = async (employeeId) => {
  const now = new Date();

  const attendance = await Attendance.findOne({
    employee: employeeId,
    status: "ON_BREAK",
    "breaks.endedAt": null,
  });

  if (!attendance) {
    throw new Error("No active break found");
  }

  const activeBreak = attendance.breaks.find(
    (item) => !item.endedAt
  );

  if (!activeBreak) {
    throw new Error("No active break found");
  }

  activeBreak.endedAt = now;

  attendance.totalBreakMinutes = getBreakMinutes(attendance.breaks);

  attendance.status = "ON_DUTY";

  await attendance.save();

  return attendance;
};

export const clockOutService = async (employeeId, source) => {
  validateSource(source);

  const now = new Date();

  const attendance = await Attendance.findOne({
    employee: employeeId,
    status: "ON_DUTY",
  });

  if (!attendance) {
    const onBreak = await Attendance.exists({
      employee: employeeId,
      status: "ON_BREAK",
    });

    if (onBreak) {
      throw new Error("Please end your break before clocking out");
    }

    throw new Error("No active working session found");
  }

  
const totalBreakMilliseconds =
  getBreakDurationMilliseconds(attendance.breaks);

const elapsedMilliseconds =
  now.getTime() - attendance.clockInTime.getTime();

const workedMilliseconds = Math.max(
  0,
  elapsedMilliseconds - totalBreakMilliseconds
);

attendance.totalBreakMinutes =
  Math.round((totalBreakMilliseconds / 60000) * 100) / 100;

attendance.totalWorkedMinutes =
  Math.round((workedMilliseconds / 60000) * 100) / 100;

attendance.totalWorkedTime = Math.floor(
  workedMilliseconds / 1000
);

attendance.totalWorkedTimeFormatted =
  formatDuration(workedMilliseconds);

  attendance.clockOutTime = now;
  attendance.clockOutSource = source;

  attendance.status = "COMPLETED";

  await attendance.save();

  return attendance;
};

export const getTimeClockStatusService = async (employeeId) => {
  const attendance = await Attendance.findOne({
    employee: employeeId,
    status: { $in: ["ON_DUTY", "ON_BREAK"] },
  }).sort({ clockInTime: -1 });

  return {
    isClockedIn: Boolean(attendance),
    status: attendance?.status || "OFF_DUTY",
    attendance,
  };
};
