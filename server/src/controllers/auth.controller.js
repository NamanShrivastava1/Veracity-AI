import userModel from "../models/user.model.js";
import { sendEmail } from "../services/mail.service.js";
import jwt from "jsonwebtoken";

/**
 * @desc Register a new user and send a welcome email with verification link
 * @route POST /api/auth/register
 * @access Public
 * @body { username: String, email: String, password: String }
 */
export async function register(req, res) {
  const { username, email, password } = req.body;

  try {
    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (isUserAlreadyExists) {
      return res.status(409).json({
        success: false,
        message: "User with this username or email already exists",
        error: "User Already Exists",
      });
    }

    const user = await userModel.create({
      username,
      email,
      password,
    });

    const emailVerificationToken = jwt.sign(
      {
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    await sendEmail(
      user.email,
      "Welcome to Perplexity!",
      `<h1>Welcome, ${user.username}!</h1><p>Thank you for registering at Perplexity. We're excited to have you on board!</p>
      <p>Please verify your email address by clicking the link below:</p><p><a href="http://localhost:3000/api/auth/verify-email?token=${emailVerificationToken}">Verify Email</a></p>
      <p>Thank you,<br/>The Perplexity Team</p>`,
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
}

/**
 * @desc Authenticate user and return JWT token
 * @route POST /api/auth/login
 * @access Public
 * @body { email: String, password: String }
 */
export async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: "User Not Found",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
        error: "Unauthorized",
      });
    }

    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message:
          "Email not verified. Please check your inbox for the verification email.",
        error: "Email Not Verified",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("token", token);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
}

/**
 * @desc Get current authenticated user's details
 * @route GET /api/auth/get-me
 * @access Private
 */
export async function getMe(req, res) {
  const userId = req.user.id;

  const user = await userModel.findById(userId).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      error: "User Not Found",
    });
  }

  res.status(200).json({
    success: true,
    user,
  }); 
}

/**
 * @desc Verify user's email address using the token sent in the welcome email
 * @route GET /api/auth/verify-email
 * @access Public
 * @query { token: String }
 */
export async function verifyEmail(req, res) {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid token or user not found",
        error: "User Not Found",
      });
    }

    user.verified = true;
    await user.save();

    const html = `<h1>Email Verified</h1><p>Your email has been verified successfully. You can now log in to your account.</p>
  <p><a href="http://localhost:3000/login">Go to Login</a></p>`;

    return res.send(html);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
}
