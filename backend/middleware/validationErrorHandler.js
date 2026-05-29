import AppError from "../utils/apperror.js";

export const validationErrorHandler = (err, req, res, next) => {
  if (err?.name === "ZodError") {
    const validationErrors = err.issues || err.errors || [];
    const message = validationErrors.map((e) => e.message).join(", ");
    return next(new AppError(message, 400, "VALIDATION_ERROR"));
  }

  if (err?.name === "CastError") {
    const message = `Invalid ${err.path}: ${err.value}`;
    return next(new AppError(message, 400, "VALIDATION_ERROR"));
  }

  if (err?.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return next(new AppError(messages.join(", "), 400, "VALIDATION_ERROR"));
  }

  if (err?.code === 11000 || err?.code === "11000") {
    const fields = Object.keys(err.keyValue || {}).join(", ") || "field";
    const message = `Duplicate value for ${fields}`;
    return next(new AppError(message, 409, "DUPLICATE_KEY"));
  }

  if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    return next(new AppError("Invalid or expired token", 401, "AUTH_001"));
  }

  next(err);
};
