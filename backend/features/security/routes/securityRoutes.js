import express from "express";
import { getSecurityReport } from "../controllers/securityController.js";
import aiRateLimit from "../middleware/aiRateLimit.js";
import authMiddleware from "../../auth/middleware/authMiddleware.js";
import projectOwner from "../../projects/middleware/projectOwner.js";

const router = express.Router();
/**
 * @swagger
 * /api/v1/projects/{projectId}/security-report:
 *   get:
 *     tags:
 *       - Security
 *     summary: Get AI security analysis report for a project
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Security report retrieved successfully (cached if within 30 minutes)
 *       401:
 *         description: Unauthorized - JWT required
 *       403:
 *         description: Forbidden - Not project owner
 *       429:
 *         description: Too many requests - AI rate limit exceeded
 */
router.get(
  "/:projectId/security-report",
  aiRateLimit,
  authMiddleware,
  projectOwner,
  getSecurityReport,
);

export default router;
