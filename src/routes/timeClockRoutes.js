import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import employeeMiddleware from "../middleware/employeeMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import targetEmployeeMiddleware from "../middleware/targetEmployeeMiddleware.js";

import {
  clockIn,
  clockOut,
  endBreak,
  getTimeClockStatus,
  startBreak,
} from "../controllers/timeClockController.js";

const router = express.Router();

router.use(authMiddleware);

const selfTimeClockRoles = authorizeRoles(
  "ADMIN",
  "AGENT",
  "EMPLOYEE",
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
);
const employeeTimeClockRoles = authorizeRoles(
  "ADMIN",
  "TIMEKEEPER",
  "SUPERVISOR",
);

router.get(
  "/status",
  selfTimeClockRoles,
  getTimeClockStatus,
);

router.post("/clock-in", selfTimeClockRoles, employeeMiddleware, clockIn);
router.post("/start-break", selfTimeClockRoles, employeeMiddleware, startBreak);
router.post("/end-break", selfTimeClockRoles, employeeMiddleware, endBreak);
router.post("/clock-out", selfTimeClockRoles, employeeMiddleware, clockOut);

router.post(
  "/employees/:employeeId/clock-in",
  employeeTimeClockRoles,
  targetEmployeeMiddleware,
  clockIn,
);
router.post(
  "/employees/:employeeId/clock-out",
  employeeTimeClockRoles,
  targetEmployeeMiddleware,
  clockOut,
);

export default router;
