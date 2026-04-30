import express from "express";
import projectController from "../controllers/projectController.js";
import authMiddleware from "../../auth/middleware/authMiddleware.js";
// import apiKeyMiddleware from "../../auth/middleware/apiKeyMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, projectController.createProject);
router.patch("/:projectId", authMiddleware, projectController.updateProject);
router.get("/", authMiddleware, projectController.getProjects);
router.get("/:projectId", authMiddleware, projectController.getProjectById);

export default router;
