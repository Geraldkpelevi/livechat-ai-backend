
import mongoose from "mongoose";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

export const getPagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);

  const requestedLimit = Number.parseInt(query.limit, 10) || 10;
  const limit = Math.min(100, Math.max(1, requestedLimit));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const validateDate = (value, fieldName) => {
  if (!value) return;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const error = new Error(
      `${fieldName} must use YYYY-MM-DD format`
    );
    error.statusCode = 400;
    throw error;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    const error = new Error(`${fieldName} is not a valid date`);
    error.statusCode = 400;
    throw error;
  }
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


export const buildAttendanceFilters = async (query) => {
  const {
    from,
    to,
    status,
    employee,
    department,
    search,
  } = query;

  validateDate(from, "from");
  validateDate(to, "to");

  if (from && to && from > to) {
    const error = new Error(
      "The from date cannot be later than the to date"
    );
    error.statusCode = 400;
    throw error;
  }

  const filters = {};
  const employeeSets = [];

  if (from || to) {
    filters.workDate = {};

    if (from) filters.workDate.$gte = from;
    if (to) filters.workDate.$lte = to;
  }

  if (status) {
    const allowedStatuses = [
      "ON_DUTY",
      "ON_BREAK",
      "COMPLETED",
    ];

    if (!allowedStatuses.includes(status)) {
      const error = new Error("Invalid attendance status");
      error.statusCode = 400;
      throw error;
    }

    filters.status = status;
  }

  if (employee) {
    const employeeFilter = mongoose.Types.ObjectId.isValid(employee)
      ? { _id: employee }
      : { employeeNumber: employee.toUpperCase() };

    const found = await Employee.findOne(employeeFilter).select("_id");

    employeeSets.push(found ? [found._id] : []);
  }

  if (department) {
    const found = await Employee.find({
      department: {
        $regex: `^${escapeRegex(department)}$`,
        $options: "i",
      },
    }).select("_id");

    employeeSets.push(found.map((item) => item._id));
  }

  if (search?.trim()) {
    const regex = new RegExp(
      escapeRegex(search.trim()),
      "i"
    );

    const matchingUsers = await User.find({
      $or: [
        { name: regex },
        { email: regex },
      ],
    }).select("_id");

    const matchingEmployees = await Employee.find({
      $or: [
        { employeeNumber: regex },
        { user: { $in: matchingUsers.map((item) => item._id) } },
      ],
    }).select("_id");

    employeeSets.push(
      matchingEmployees.map((item) => item._id)
    );
  }

  if (employeeSets.length) {
    const firstSet = new Set(employeeSets[0].map(String));

    const matchingIds = [...firstSet].filter((id) =>
      employeeSets.every((set) =>
        set.some((item) => String(item) === id)
      )
    );

    filters.employee = {
      $in: matchingIds,
    };
  }

  return filters;
};
