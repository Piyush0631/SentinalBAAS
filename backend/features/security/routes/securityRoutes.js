import express from "express";
import { getSecurityReport } from "../controllers/securityController.js";
import aiRateLimit from "../middleware/aiRateLimit.js";
import authMiddleware from "../../auth/middleware/authMiddleware.js";
import projectOwner from "../../projects/middleware/projectOwner.js";

const router = express.Router();

router.get(
  "/:id/security-report",
  aiRateLimit,
  authMiddleware,
  projectOwner,
  getSecurityReport,
);

export default router;
