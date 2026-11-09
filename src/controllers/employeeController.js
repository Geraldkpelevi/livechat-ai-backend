
import {
  createEmployeeService,
  getEmployeesService,
  getEmployeeByIdService,
  updateEmployeeService,
  updateEmployeeStatusService,
  deleteEmployeeService,
  updateEmployeeRoleService,
  registerEmployeeService
} from "../services/employeeService.js";

// ADMIN: Create employee profile
export const createEmployee = async (req, res, next) => {
  try {
    const employee = await createEmployeeService(
      req.body,
      req.user._id,
    );

    return res.status(201).json({
      success: true,
      message: "Employee profile created successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// PUBLIC: Employee self-registration
export const registerEmployee = async (req, res, next) => {
  try {
    const employee = await registerEmployeeService(req.body);

    return res.status(201).json({
      success: true,
      message: "Employee registration submitted successfully. Awaiting admin approval.",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};


export const getEmployees = async (req, res, next) => {
  try {
    const result = await getEmployeesService(req.query);

    return res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: result.employees,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await getEmployeeByIdService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await updateEmployeeService(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeStatus = async (req, res, next) => {
  try {
    const employee = await updateEmployeeStatusService(
      req.params.id,
      req.body.status,
    );

    return res.status(200).json({
      success: true,
      message: "Employee status updated successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await deleteEmployeeService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Employee deactivated successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// Update employee role
export const updateEmployeeRole = async (req, res, next) => {
  try {
    const result = await updateEmployeeRoleService(
      req.params.id,
      req.body.role,
      req.user._id,
    );

    return res.status(200).json({
      success: true,
      message: result.changed
        ? "Employee role updated successfully"
        : "Employee already has this role",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};