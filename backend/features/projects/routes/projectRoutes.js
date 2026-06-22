import express from "express";
import projectController from "../controllers/projectController.js";
import authMiddleware from "../../auth/middleware/authMiddleware.js";
import projectOwner from "../middleware/projectOwner.js";

const router = express.Router();
/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Create a new project and generate API key
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               recordSchema:
 *                 type: object
 *             required:
 *               - name
 *               - recordSchema
 *     responses:
 *       201:
 *         description: Project created, API key generated
 *       400:
 *         description: Validation error or suspicious input detected
 *       401:
 *         description: Unauthorized - JWT required
 */
router.post("/", authMiddleware, projectController.createProject);

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   patch:
 *     tags:
 *       - Projects
 *     summary: Update an existing project
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               recordSchema:
 *                 type: object
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Validation error or suspicious input detected
 *       401:
 *         description: Unauthorized - JWT required
 */
router.patch(
  "/:projectId",
  authMiddleware,
  projectOwner,
  projectController.updateProject,
);
/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     tags:
 *       - Projects
 *     summary: List all projects for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *       401:
 *         description: Unauthorized - JWT required
 */
router.get("/", authMiddleware, projectController.getProjects);
/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get a specific project by ID
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
 *         description: Project retrieved successfully
 *       401:
 *         description: Unauthorized - JWT required
 *       403:
 *         description: Forbidden - Not project owner
 */
router.get(
  "/:projectId",
  authMiddleware,
  projectOwner,
  projectController.getProjectById,
);

export default router;
