
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  updateEmployeeRole,
} from "../controllers/employeeController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles("ADMIN"));

router.post("/", createEmployee);
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.patch("/:id", updateEmployee);
router.patch("/:id/status", updateEmployeeStatus);
router.delete("/:id", deleteEmployee);
router.patch("/:id/role", updateEmployeeRole);

export default router;
