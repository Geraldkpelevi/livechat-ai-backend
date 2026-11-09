
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import employeeMiddleware from "../middleware/employeeMiddleware.js";
import targetEmployeeMiddleware from "../middleware/targetEmployeeMiddleware.js";

import {
  clockIn,
  startBreak,
  endBreak,
  clockOut,
  getTimeClockStatus,
} from "../controllers/timeClockController.js";

const router = express.Router();

router.use(authMiddleware);

const selfTimeClockRoles = authorizeRoles(
  "ADMIN",
  "AGENT",
  "EMPLOYEE",
  "TIMEKEEPER",
  "SUPERVISOR",
);
const employeeTimeClockRoles = authorizeRoles(
  "ADMIN",
  "TIMEKEEPER",
  "SUPERVISOR",
);

router.get(
  "/status",
  selfTimeClockRoles,
  employeeMiddleware,
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
