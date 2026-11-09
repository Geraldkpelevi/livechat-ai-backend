import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import User from "../models/User.js";

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

  if (!["AGENT", "EMPLOYEE"].includes(user.role)) {
    throw new Error(
      "Only agent or employee accounts can have employee profiles",
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

  if (filters.status) query.status = filters.status;
  if (filters.department) query.department = filters.department;

  const employees = await Employee.find(query)
    .populate("user", "name email role isActive")
    .sort({ createdAt: -1 });

  return employees;
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
      new: true,
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

export const updateEmployeeRoleService = async (
  employeeId,
  role,
  adminId,
) => {
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
    const error = new Error(
      "Only active employees can receive employee roles",
    );
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
