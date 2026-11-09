const getLocalDateTimeAsUTC = (dateString, timeString, timezone) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = timeString.split(":").map(Number);

  // Start with the equivalent UTC wall-clock time.
  const target = Date.UTC(year, month - 1, day, hours, minutes);

  // Resolve the actual UTC instant for the employee's timezone.
  let result = target;

  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(result));

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    const representedUTC = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
    );

    result += target - representedUTC;
  }

  return new Date(result);
};

const getShiftBoundaries = (attendance, shift) => {
  const timezone = attendance.timezone || "UTC";
  const workDate = attendance.workDate;

  const expectedStart = getLocalDateTimeAsUTC(
    workDate,
    shift.startTime,
    timezone,
  );

  const startMinutes =
    Number(shift.startTime.split(":")[0]) * 60 +
    Number(shift.startTime.split(":")[1]);

  const endMinutes =
    Number(shift.endTime.split(":")[0]) * 60 +
    Number(shift.endTime.split(":")[1]);

  // Support overnight shifts, e.g. 22:00 - 06:00.
  const endDate = new Date(`${workDate}T00:00:00Z`);

  if (endMinutes <= startMinutes) {
    endDate.setUTCDate(endDate.getUTCDate() + 1);
  }

  const endWorkDate = [
    endDate.getUTCFullYear(),
    String(endDate.getUTCMonth() + 1).padStart(2, "0"),
    String(endDate.getUTCDate()).padStart(2, "0"),
  ].join("-");

  const expectedEnd = getLocalDateTimeAsUTC(
    endWorkDate,
    shift.endTime,
    timezone,
  );

  return { expectedStart, expectedEnd };
};

const calculateActualWorkedMinutes = (attendance, now) => {
  const clockIn = new Date(attendance.clockInTime);
  const clockOut = attendance.clockOutTime
    ? new Date(attendance.clockOutTime)
    : now;

  let workedMinutes = Math.max(
    0,
    Math.floor((clockOut - clockIn) / 60000),
  );

  for (const breakRecord of attendance.breaks || []) {
    if (!breakRecord.startedAt) continue;

    const breakStart = new Date(breakRecord.startedAt);
    const breakEnd = breakRecord.endedAt
      ? new Date(breakRecord.endedAt)
      : now;

    workedMinutes -= Math.max(
      0,
      Math.floor((breakEnd - breakStart) / 60000),
    );
  }

  return Math.max(0, workedMinutes);
};

export const calculateShiftAttendance = (
  attendance,
  shift,
  now = new Date(),
) => {
  if (!attendance || !shift) {
    return null;
  }

  const { expectedStart, expectedEnd } = getShiftBoundaries(
    attendance,
    shift,
  );

  const actualClockIn = attendance.clockInTime
    ? new Date(attendance.clockInTime)
    : null;

  const actualClockOut = attendance.clockOutTime
    ? new Date(attendance.clockOutTime)
    : null;

  const actualWorkedMinutes = calculateActualWorkedMinutes(
    attendance,
    now,
  );

  const scheduledMinutes = Math.max(
    0,
    Math.floor((expectedEnd - expectedStart) / 60000) -
      (shift.breakDurationMinutes || 0),
  );

  const lateMinutes = actualClockIn
    ? Math.max(
        0,
        Math.floor((actualClockIn - expectedStart) / 60000),
      )
    : 0;

  const earlyDepartureMinutes = actualClockOut
    ? Math.max(
        0,
        Math.floor((expectedEnd - actualClockOut) / 60000),
      )
    : 0;

  const overtimeMinutes = Math.max(
    0,
    actualWorkedMinutes - scheduledMinutes,
  );

  return {
    shift: {
      id: shift._id,
      name: shift.name,
      description: shift.description,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDurationMinutes: shift.breakDurationMinutes,
    },

    expectedClockIn: expectedStart,
    expectedClockOut: expectedEnd,

    actualClockIn,
    actualClockOut,

    scheduledMinutes,
    actualWorkedMinutes,

    lateMinutes,
    isLate: lateMinutes > 0,

    earlyDepartureMinutes,
    isEarlyDeparture: earlyDepartureMinutes > 0,

    overtimeMinutes,
    hasOvertime: overtimeMinutes > 0,
  };
};