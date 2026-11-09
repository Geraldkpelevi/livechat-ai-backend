
const roundSeconds = (milliseconds) =>
  Math.max(0, Math.round(milliseconds / 1000));

const roundMinutes = (seconds) =>
  Math.round((seconds / 60) * 100) / 100;

/**
 * Converts seconds to HH:MM:SS.
 * Hours can exceed 24 for long shifts or timesheet totals.
 */
export const formatDurationFromSeconds = (totalSeconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
};

/**
 * Creates consistent duration fields from seconds.
 * Reuse this for attendance and timesheet responses.
 */
export const serializeDuration = ({
  workedSeconds = 0,
  breakSeconds = 0,
} = {}) => {
  const safeWorkedSeconds = Math.max(
    0,
    Math.round(Number(workedSeconds) || 0)
  );

  const safeBreakSeconds = Math.max(
    0,
    Math.round(Number(breakSeconds) || 0)
  );

  return {
    totalWorkedSeconds: safeWorkedSeconds,
    totalWorkedMinutes: roundMinutes(safeWorkedSeconds),
    totalWorkedTimeFormatted:
      formatDurationFromSeconds(safeWorkedSeconds),

    totalBreakSeconds: safeBreakSeconds,
    totalBreakMinutes: roundMinutes(safeBreakSeconds),
    totalBreakTimeFormatted:
      formatDurationFromSeconds(safeBreakSeconds),
  };
};

/**
 * Serializes one attendance record.
 *
 * Completed records use clockOutTime.
 * Active records use the current time.
 * An open break is counted up to the current time.
 */
export const serializeAttendance = (
  attendance,
  now = new Date()
) => {
  if (!attendance) return null;

  const record =
    typeof attendance.toObject === "function"
      ? attendance.toObject()
      : { ...attendance };

  const clockIn = record.clockInTime
    ? new Date(record.clockInTime).getTime()
    : null;

  const clockOut = record.clockOutTime
    ? new Date(record.clockOutTime).getTime()
    : null;

  let workedSeconds = 0;
  let breakSeconds = 0;

  if (Number.isFinite(clockIn)) {
    const endTime = Number.isFinite(clockOut)
      ? clockOut
      : now.getTime();

    const elapsedMilliseconds = Math.max(0, endTime - clockIn);

    let totalBreakMilliseconds = 0;

    for (const item of record.breaks || []) {
      if (!item.startedAt) continue;

      const breakStart = new Date(item.startedAt).getTime();

      if (!Number.isFinite(breakStart)) continue;

      const breakEnd = item.endedAt
        ? new Date(item.endedAt).getTime()
        : endTime;

      if (!Number.isFinite(breakEnd)) continue;

      const validBreakStart = Math.max(clockIn, breakStart);
      const validBreakEnd = Math.min(endTime, breakEnd);

      if (validBreakEnd > validBreakStart) {
        totalBreakMilliseconds +=
          validBreakEnd - validBreakStart;
      }
    }

    breakSeconds = roundSeconds(totalBreakMilliseconds);

    workedSeconds = roundSeconds(
      Math.max(0, elapsedMilliseconds - totalBreakMilliseconds)
    );
  } else {
    // Fallback for older or incomplete attendance records.
    workedSeconds = Math.round(
      (Number(record.totalWorkedMinutes) || 0) * 60
    );

    breakSeconds = Math.round(
      (Number(record.totalBreakMinutes) || 0) * 60
    );
  }

  const duration = serializeDuration({
    workedSeconds,
    breakSeconds,
  });

  // Remove legacy fields that could conflict with the new format.
  const {
    totalWorkedTime,
    totalWorkedTimeFormatted,
    ...attendanceData
  } = record;

  return {
    ...attendanceData,
    ...duration,
  };
};

/**
 * Serializes attendance arrays.
 */
export const serializeAttendanceList = (
  attendanceList = [],
  now = new Date()
) => {
  return attendanceList.map((attendance) =>
    serializeAttendance(attendance, now)
  );
};
