import express from "express";
import authMiddleware from "../../auth/middleware/authMiddleware.js";
// import apiKeyMiddleware from "../../auth/middleware/apiKeyMiddleware.js";
import projectOwner from "../../projects/middleware/projectOwner.js";
import { getProjectDocs } from "../controllers/docsController.js";

const router = express.Router({ mergeParams: true });
/**
 * @swagger
 * /api/v1/projects/{projectId}/docs:
 *   get:
 *     tags:
 *       - Docs
 *     summary: Get auto-generated API documentation for a project
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: operationId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter docs by specific operation ID
 *     responses:
 *       200:
 *         description: Project documentation retrieved successfully
 *       401:
 *         description: Unauthorized - JWT required
 *       403:
 *         description: Forbidden - Not project owner
 */
router.get("/:projectId/docs", authMiddleware, projectOwner, getProjectDocs);

export default router;
