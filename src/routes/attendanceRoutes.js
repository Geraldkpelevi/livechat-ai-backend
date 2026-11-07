
import express from "express";

import {
  getAllAttendance,
  getAttendanceById,
  correctAttendance,
  getEmployeeAttendance,
} from "../controllers/attendanceController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import employeeMiddleware from "../middleware/employeeMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Admin attendance management
router.use(
  "/admin/attendance",
  authorizeRoles("ADMIN")
);

router.get("/admin/attendance", getAllAttendance);
router.get("/admin/attendance/:id", getAttendanceById);
router.patch("/admin/attendance/:id", correctAttendance);

// Employee attendance history
router.use(
  "/employee/attendance",
  authorizeRoles("AGENT", "EMPLOYEE"),
  employeeMiddleware
);

router.get("/employee/attendance", getEmployeeAttendance);

export default router;
