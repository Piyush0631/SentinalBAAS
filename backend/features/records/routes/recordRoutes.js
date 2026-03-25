import express from "express";
import apiKeyMiddleware from "../../auth/middleware/apiKeyMiddleware.js";
import * as recordController from "../controllers/recordController.js";

const router = express.Router({ mergeParams: true });

router.post("/", apiKeyMiddleware, recordController.createRecord);
router.get("/", apiKeyMiddleware, recordController.getRecords);
router.get("/:recordId", apiKeyMiddleware, recordController.getRecordById);
router.patch("/:recordId", apiKeyMiddleware, recordController.updateRecord);
router.delete("/:recordId", apiKeyMiddleware, recordController.deleteRecord);

export default router;
