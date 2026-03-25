class AppError extends Error {
  constructor(message, statusCode, code = "SERVER_001", errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    if (errors) this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
