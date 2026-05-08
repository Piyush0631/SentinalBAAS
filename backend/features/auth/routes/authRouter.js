import { Router } from "express";
import authController from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const authRouter = Router();

authRouter.post("/register", authController.registerUser);
authRouter.post("/login", authController.loginUser);
authRouter.get("/me", authMiddleware, authController.getCurrentUser);
authRouter.post("/logout", authController.logoutUser);

export default authRouter;
