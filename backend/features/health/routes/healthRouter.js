import { Router } from "express";
import healthController from "../controllers/healthController.js";

const healthRouter = Router();
/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint to verify server is running
 *     responses:
 *       200:
 *         description: Server is running and healthy
 */
healthRouter.get("/", healthController.getHealthStatus);

export default healthRouter;
