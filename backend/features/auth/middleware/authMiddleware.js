import jwt from "jsonwebtoken";
import AppError from "../../../utils/apperror.js";
import catchAsync from "../../../utils/catchasync.js";

const authMiddleware = catchAsync(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return next(new AppError("No token provided", 401, "AUTH_007"));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = { id: decoded.id };
  next();
});

export default authMiddleware;
