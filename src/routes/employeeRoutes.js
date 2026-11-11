import express from "express";

import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  registerEmployee,
  updateEmployee,
  updateEmployeeRole,
  updateEmployeeStatus,
} from "../controllers/employeeController.js";
import { assignEmployeeShift } from "../controllers/employeeShiftController.js";
import { clockIn, clockOut } from "../controllers/timeClockController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import targetEmployeeMiddleware from "../middleware/targetEmployeeMiddleware.js";

const router = express.Router();

export const employeeRegistrationRouter = express.Router();

employeeRegistrationRouter.post("/register", registerEmployee);

router.use(authMiddleware);
router.use(authorizeRoles("ADMIN"));

router.post("/", createEmployee);
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.patch("/:id", updateEmployee);
router.patch("/:id/status", updateEmployeeStatus);
router.delete("/:id", deleteEmployee);
router.patch("/:id/role", updateEmployeeRole);

// Only ADMIN can assign or remove employee shifts.
router.patch(
  "/:employeeId/shift",
  authorizeRoles("ADMIN"),
  assignEmployeeShift,
);
router.post(
  "/:employeeId/clock-in",
  authorizeRoles("ADMIN"),
  targetEmployeeMiddleware,
  clockIn,
);
router.post(
  "/:employeeId/clock-out",
  authorizeRoles("ADMIN"),
  targetEmployeeMiddleware,
  clockOut,
);

export default router;
