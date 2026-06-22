import express from "express";
import apiKeyMiddleware from "../../auth/middleware/apiKeyMiddleware.js";
import * as recordController from "../controllers/recordController.js";

const router = express.Router({ mergeParams: true });
/**
 * @swagger
 * /api/v1/projects/{projectId}/records:
 *   post:
 *     tags:
 *       - Records
 *     summary: Create a new record
 *     security:
 *       - apiKeyAuth: []
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
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - API key required
 */
router.post("/", apiKeyMiddleware, recordController.createRecord);
/**
 * @swagger
 * /api/v1/projects/{projectId}/records:
 *   get:
 *     tags:
 *       - Records
 *     summary: List all records for a project
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Records retrieved successfully
 *       401:
 *         description: Unauthorized - API key required
 */
router.get("/", apiKeyMiddleware, recordController.getRecords);
/**
 * @swagger
 * /api/v1/projects/{projectId}/records/{recordId}:
 *   get:
 *     tags:
 *       - Records
 *     summary: Get a specific record by ID
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: recordId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record retrieved successfully
 *       401:
 *         description: Unauthorized - API key required
 *       404:
 *         description: Record not found
 */
router.get("/:recordId", apiKeyMiddleware, recordController.getRecordById);
/**
 * @swagger
 * /api/v1/projects/{projectId}/records/{recordId}:
 *   patch:
 *     tags:
 *       - Records
 *     summary: Update a record
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: recordId
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
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - API key required
 *       404:
 *         description: Record not found
 */
router.patch("/:recordId", apiKeyMiddleware, recordController.updateRecord);
/**
 * @swagger
 * /api/v1/projects/{projectId}/records/{recordId}:
 *   delete:
 *     tags:
 *       - Records
 *     summary: Delete a record
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: recordId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Record deleted successfully
 *       401:
 *         description: Unauthorized - API key required
 *       404:
 *         description: Record not found
 */
router.delete("/:recordId", apiKeyMiddleware, recordController.deleteRecord);

export default router;
