import { Router } from "express";
import healthController from "../controllers/healthcontroller.js";

const healthRouter = Router();

healthRouter.get("/", healthController.getHealthStatus);

export default healthRouter;
