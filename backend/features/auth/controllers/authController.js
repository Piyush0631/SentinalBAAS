import jwt from "jsonwebtoken";
import User from "../../../models/User.js";
import catchAsync from "../../../utils/catchasync.js";
import AppError from "../../../utils/apperror.js";
import {
  isSuspiciousInput,
  isValidEmail,
  isValidUsername,
} from "../../../utils/sanitization.js";

const registerUser = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return next(
      new AppError(
        "Please provide username, email and password",
        400,
        "AUTH_001",
      ),
    );
  }

  for (const [key, value] of Object.entries({ username, email, password })) {
    if (isSuspiciousInput(value)) {
      return next(
        new AppError(`Suspicious input detected in ${key}`, 400, "AUTH_900"),
      );
    }
  }

  if (!isValidEmail(email)) {
    return next(new AppError("Please provide a valid email", 400, "AUTH_009"));
  }

  if (!isValidUsername(username)) {
    return next(
      new AppError(
        "Username must be 3-30 characters, letters, numbers and underscores only",
        400,
        "AUTH_008",
      ),
    );
  }

  if (password.length < 8) {
    return next(
      new AppError("Password must be at least 8 characters", 400, "AUTH_010"),
    );
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email already in use", 400, "AUTH_002"));
  }
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return next(new AppError("Username already in use", 400, "AUTH_003"));
  }
  const newUser = await User.create({ username, email, password });
  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
    data: {
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    },
  });
});

const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new AppError("Please provide email and password", 400, "AUTH_004"),
    );
  }

  for (const [key, value] of Object.entries({ email, password })) {
    if (isSuspiciousInput(value)) {
      return next(
        new AppError(`Suspicious input detected in ${key}`, 400, "AUTH_900"),
      );
    }
  }

  if (!isValidEmail(email)) {
    return next(new AppError("Please provide a valid email", 400, "AUTH_009"));
  }
  const user = await User.findOne({ email }).select("+password");
  if (user) {
    const isMatch = await user.correctPassword(password, user.password);
    if (!isMatch) {
      return next(new AppError("Incorrect email or password", 401, "AUTH_005"));
    }
  } else {
    return next(new AppError("Incorrect email or password", 401, "AUTH_005"));
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    },
  });
});

const getCurrentUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError("User not found", 404, "AUTH_006"));
  }
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    },
  });
});

export default {
  registerUser,
  loginUser,
  getCurrentUser,
};
