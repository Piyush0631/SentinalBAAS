import AppError from "../utils/apperror.js";

export const validationErrorHandler = (err, req, res, next) => {
  if (err.name === "ZodError") {
    const message = err.errors.map((e) => e.message).join(", ");
    return next(new AppError(message, 400, "VALIDATION_ERROR"));
  }
  next(err);
};
