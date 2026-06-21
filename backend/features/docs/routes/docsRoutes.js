import express from "express";
import authMiddleware from "../../auth/middleware/authMiddleware.js";
// import apiKeyMiddleware from "../../auth/middleware/apiKeyMiddleware.js";
import projectOwner from "../../projects/middleware/projectOwner.js";
import { getProjectDocs } from "../controllers/docsController.js";

const router = express.Router({ mergeParams: true });

router.get("/:projectId/docs", authMiddleware, projectOwner, getProjectDocs);

export default router;
