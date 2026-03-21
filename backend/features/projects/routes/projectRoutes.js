import express from "express";
import projectController from "../controllers/projectController.js";
import authMiddleware from "../../auth/middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, projectController.createProject);
router.get("/", authMiddleware, projectController.getProjects);
router.get("/:id", authMiddleware, projectController.getProjectById);

export default router;
