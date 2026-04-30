import express from "express";
import cors from "cors";
import morgan from "morgan";
import AppError from "./utils/apperror.js";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import rateLimit from "express-rate-limit";

import healthRouter from "./features/health/routes/healthRouter.js";
import authRouter from "./features/auth/routes/authRouter.js";
import projectRouter from "./features/projects/routes/projectRoutes.js";
import recordRouter from "./features/records/routes/recordRoutes.js";
import securityRouter from "./features/security/routes/securityRoutes.js";
import docsRouter from "./features/docs/routes/docsRoutes.js";
const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
});
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());
app.use(compression());
app.use("/api", limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/projects/:projectId/records", recordRouter);
app.use("/api/v1/projects", securityRouter);
app.use("/api/v1/projects", docsRouter);
app.use("/api/v1/projects", projectRouter);

app.use((request, response, next) => {
  next(
    new AppError(`Route ${request.originalUrl} not found`, 404, "ROUTE_001"),
  );
});

app.use((error, request, response, _next) => {
  console.error(error);

  const statusCode = error.statusCode || 500;
  const errorCode = error.code || "SERVER_001";
  const errorMessage = error.isOperational
    ? error.message
    : "Internal server error";

  response.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
    },
  });
});

export default app;
