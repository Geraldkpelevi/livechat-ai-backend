
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
      "Only agent or employee accounts can have employee profiles"
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
  const employee = await Employee.findById(id)
    .populate("user", "name email role isActive");

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
    }
  ).populate("user", "name email role isActive");

  if (!employee) {
    throw new Error("Employee not found");
  }

  return employee;
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
