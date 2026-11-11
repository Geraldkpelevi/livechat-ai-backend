import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import EmployeeSequence from "../models/EmployeeSequence.js";
import User from "../models/User.js";
import { getPagination } from "../utils/attendanceQuery.js";

const getNextEmployeeNumber = async (session) => {
  let employeeNumber;

  do {
    const sequence = await EmployeeSequence.findOneAndUpdate(
      { _id: "employeeNumber" },
      [
        {
          $set: {
            value: {
              $add: [{ $ifNull: ["$value", -1] }, 1],
            },
          },
        },
      ],
      {
        session,
        upsert: true,
        returnDocument: "after",
        updatePipeline: true,
      },
    );

    employeeNumber = String(sequence.value);
  } while (await Employee.exists({ employeeNumber }).session(session));

  return employeeNumber;
};

export const registerEmployeeService = async (data) => {
  const {
    name,
    email,
    password,
    jobTitle,
    department,
    employmentType,
    employmentRole,
    timezone,
  } = data;

  // Validate required fields
  if (
    !name ||
    !email ||
    !password ||
    !jobTitle ||
    !department ||
    !employmentRole
  ) {
    throw new Error("Please provide all required employee details");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  // Check existing user
  const existingUser = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const session = await mongoose.startSession();

  try {
    let employee;

    await session.withTransaction(async () => {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      const employeeNumber = await getNextEmployeeNumber(session);

      // Create user account
      const [user] = await User.create(
        [
          {
            name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,

            // Never accept role from the request body
            role: "EMPLOYEE",

            isActive: true,
          },
        ],
        { session },
      );

      // Create employee profile
      const [newEmployee] = await Employee.create(
        [
          {
            user: user._id,
            jobTitle,
            department,
            employeeNumber,
            employmentType: employmentType || "FULL_TIME",
            employmentRole: employmentRole || "EMPLOYEE",
            timezone: timezone || "UTC",

            // Employee requires admin approval
            status: "PENDING",

            // No admin created this account
            createdBy: null,
            registrationSource: "SELF",
          },
        ],
        { session },
      );

      employee = newEmployee;
    });

    return employee;
  } finally {
    await session.endSession();
  }
};
export const createEmployeeService = async (data, adminId) => {
  const {
    userId,
    employeeNumber,
    jobTitle,
    department,
    employmentType,
    employmentRole,
    timezone,
  } = data;

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User account not found");
  }

  if (
    ![
      "EMPLOYEE",
      "AGENT",
      "MANAGER",
      "SUPERVISOR",
      "HR",
      "ACCOUNTANT",
      "IT_SUPPORT",
      "SALES",
      "MARKETING",
      "DEVELOPER",
      "TIMEKEEPER",
      "DESIGNER",
      "ANALYST",
      "CONSULTANT",
      "PROJECT_MANAGER",
      "TEAM_LEAD",
      "DIRECTOR",
      "VP",
      "C_LEVEL",
      "ADMIN",
    ].includes(user.role)
  ) {
    throw new Error(
      "This account role cannot have an employee profile",
    );
  }

  if (!user.isActive) {
    throw new Error("Cannot create a profile for an inactive user");
  }

  const existingEmployee = await Employee.findOne({
    user: userId,
  });

  if (existingEmployee) {
    throw new Error("This user already has an employee profile");
  }

  return Employee.create({
    user: userId,
    employeeNumber,
    jobTitle,
    department,
    employmentType,
    employmentRole,
    timezone,
    createdBy: adminId,
  });
};

export const getEmployeesService = async (filters = {}) => {
  const query = {};
  const { page, limit, skip } = getPagination(filters);

  if (filters.status) query.status = filters.status;
  if (filters.department) query.department = filters.department;

  const [employees, totalRecords] = await Promise.all([
    Employee.find(query)
      .populate("user", "name email role isActive")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Employee.countDocuments(query),
  ]);

  return {
    employees,
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

export const getEmployeeByIdService = async (id) => {
  const employee = await Employee.findById(id).populate(
    "user",
    "name email role isActive",
  );

  if (!employee) {
    throw new Error("Employee not found");
  }

  return employee;
};

export const updateEmployeeService = async (id, data) => {
  const allowedFields = [
    "employeeNumber",
    "jobTitle",
    "department",
    "employmentType",
    "employmentRole",
    "status",
    "timezone",
  ];

  const updates = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  }

  const employee = await Employee.findByIdAndUpdate(
    id,
    { $set: updates },
    {
      returnDocument: "after",
      runValidators: true,
    },
  ).populate("user", "name email role isActive");

  if (!employee) {
    throw new Error("Employee not found");
  }

  return employee;
};

export const updateEmployeeStatusService = async (id, status) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid employee ID");
    error.statusCode = 400;
    throw error;
  }

  const allowedStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];

  if (!allowedStatuses.includes(status)) {
    const error = new Error(
      `Invalid employee status. Allowed statuses: ${allowedStatuses.join(", ")}`,
    );
    error.statusCode = 400;
    throw error;
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  employee.status = status;
  await employee.save();

  return employee;
};

export const updateEmployeeRoleService = async (employeeId, role, adminId) => {
  if (!mongoose.isValidObjectId(employeeId)) {
    const error = new Error("Invalid employee ID");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.isValidObjectId(adminId)) {
    const error = new Error(
      "Only administrators are permitted to assign employee roles",
    );
    error.statusCode = 403;
    throw error;
  }

  const admin = await User.findById(adminId);

  if (!admin || !admin.isActive || admin.role !== "ADMIN") {
    const error = new Error(
      "Only administrators are permitted to assign employee roles",
    );
    error.statusCode = 403;
    throw error;
  }

  const allowedRoles = [
    "EMPLOYEE",
    "AGENT",
    "MANAGER",
    "SUPERVISOR",
    "HR",
    "ACCOUNTANT",
    "IT_SUPPORT",
    "SALES",
    "MARKETING",
    "DEVELOPER",
    "DESIGNER",
    "ANALYST",
    "CONSULTANT",
    "PROJECT_MANAGER",
    "TEAM_LEAD",
    "DIRECTOR",
    "VP",
    "C_LEVEL",
    "ADMIN",
    "TIMEKEEPER",
  ];

  if (!allowedRoles.includes(role)) {
    const error = new Error(
      `Invalid employee role. Allowed roles: ${allowedRoles.join(", ")}`,
    );
    error.statusCode = 400;
    throw error;
  }

  const employee = await Employee.findById(employeeId).populate(
    "user",
    "name email role isActive",
  );

  if (!employee) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  if (!employee.user) {
    const error = new Error("Employee has no associated user account");
    error.statusCode = 404;
    throw error;
  }

  if (employee.status !== "ACTIVE") {
    const error = new Error("Only active employees can receive employee roles");
    error.statusCode = 403;
    throw error;
  }

  const user = employee.user;

  if (user.role === "CUSTOMER") {
    const error = new Error("Customers cannot be assigned employee roles");
    error.statusCode = 403;
    throw error;
  }

  if (user.role === "ADMIN") {
    const error = new Error("Administrator roles cannot be changed here");
    error.statusCode = 403;
    throw error;
  }

  const previousRole = user.role;

  if (previousRole === role) {
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      changed: false,
    };
  }

  user.role = role;

  await user.save();

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      previousRole,
      isActive: user.isActive,
    },
    changed: true,
  };
};

export const deleteEmployeeService = async (id) => {
  const employee = await Employee.findById(id);

  if (!employee) {
    throw new Error("Employee not found");
  }

  // Do not delete historical attendance records.
  employee.status = "INACTIVE";

  await employee.save();

  return employee;
};
