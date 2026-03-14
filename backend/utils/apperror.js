class AppError extends Error {
  constructor(message, statusCode, code = "SERVER_001") {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
