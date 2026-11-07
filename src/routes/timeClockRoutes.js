
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import employeeMiddleware from "../middleware/employeeMiddleware.js";

import {
  clockIn,
  startBreak,
  endBreak,
  clockOut,
  getTimeClockStatus,
} from "../controllers/timeClockController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles("AGENT", "EMPLOYEE"));
router.use(employeeMiddleware);

router.get("/status", getTimeClockStatus);

router.post("/clock-in", clockIn);
router.post("/start-break", startBreak);
router.post("/end-break", endBreak);
router.post("/clock-out", clockOut);

export default router;
