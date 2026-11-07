
import mongoose from "mongoose";

const castNumber = mongoose.Schema.Types.Number.cast();

const castWorkedTime = (value) => {
  if (typeof value === "string") {
    const legacyDuration = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(value);

    if (legacyDuration) {
      const [, hours, minutes, seconds] = legacyDuration;
      return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    }
  }

  return castNumber(value);
};

const breakSchema = new mongoose.Schema(
  {
    startedAt: {
      type: Date,
      required: true,
    },

    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    workDate: {
      type: String,
      required: true,
    },

    timezone: {
      type: String,
      default: "UTC",
    },

    clockInTime: {
      type: Date,
      required: true,
    },

    clockOutTime: {
      type: Date,
      default: null,
    },

    breaks: [breakSchema],

    status: {
      type: String,
      enum: ["ON_DUTY", "ON_BREAK", "COMPLETED"],
      default: "ON_DUTY",
    },

    clockInSource: {
      type: String,
      enum: ["WEB", "MOBILE"],
      required: true,
    },

    clockOutSource: {
      type: String,
      enum: ["WEB", "MOBILE"],
    },

    totalBreakMinutes: {
      type: Number,
      default: 0,
    },

    totalWorkedMinutes: {
      type: Number,
      default: 0,
    },

    totalWorkedTime: {
      type: Number,
      default: 0,
      cast: castWorkedTime,
    },

    notes: {
      type: String,
      trim: true,
    },

    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

attendanceSchema.virtual("totalWorkedTimeFormatted").get(function () {
  const totalSeconds = Math.floor(this.totalWorkedTime || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}.${String(minutes).padStart(2, "0")}.${String(seconds).padStart(2, "0")}`;
});

// Only one active attendance session per employee.
// Completed sessions can exist multiple times per day.
attendanceSchema.index(
  { employee: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["ON_DUTY", "ON_BREAK"] },
    },
  }
);


attendanceSchema.index({ workDate: 1, status: 1 });
attendanceSchema.index({ employee: 1, clockInTime: -1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
