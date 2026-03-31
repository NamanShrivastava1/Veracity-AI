import { Router } from "express";
import {
  register,
  login,
  getMe,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  validateRegister,
  validateLogin,
} from "../validators/auth.validator.js";

const authRouter = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user and send a welcome email with verification link
 * @access Public
 * @body { username: String, email: String, password: String }
 */
authRouter.post("/register", validateRegister, register);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token
 * @access Public
 * @body { email: String, password: String }
 */
authRouter.post("/login", validateLogin, login);

/**
 * @route GET /api/auth/get-me
 * @desc Get current authenticated user's details
 * @access Private
 */
authRouter.get("/get-me", authMiddleware, getMe);

/**
 * @route GET /api/auth/verify-email
 * @desc Verify user's email address using the token sent in the welcome email
 * @access Public
 * @query { token: String }
 */
authRouter.get("/verify-email", verifyEmail);

export default authRouter;
