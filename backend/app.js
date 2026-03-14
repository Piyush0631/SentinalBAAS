import express from "express";
import cors from "cors";
import morgan from "morgan";
import AppError from "./utils/apperror.js";
import healthRouter from "./features/health/routes/healthrouter.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1/health", healthRouter);

app.use((request, response, next) => {
  next(
    new AppError(`Route ${request.originalUrl} not found`, 404, "ROUTE_001"),
  );
});

app.use((error, request, response, next) => {
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
