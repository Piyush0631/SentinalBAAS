import express from "express";
import projectController from "../controllers/projectController.js";
import authMiddleware from "../../auth/middleware/authMiddleware.js";
import projectOwner from "../middleware/projectOwner.js";

const router = express.Router();

router.post("/", authMiddleware, projectController.createProject);
router.patch(
  "/:projectId",
  authMiddleware,
  projectOwner,
  projectController.updateProject,
);
router.get("/", authMiddleware, projectController.getProjects);
router.get(
  "/:projectId",
  authMiddleware,
  projectOwner,
  projectController.getProjectById,
);

export default router;
