import userModel from "../models/user.model.js";
import { sendEmail } from "../services/mail.service.js";

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
      verified: false,
    });

    await sendEmail(
      user.email,
      "Welcome to Perplexity!",
      `<h1>Welcome, ${user.username}!</h1><p>Thank you for registering at Perplexity. We're excited to have you on board!</p>`,
      `Welcome, ${user.username}! Thank you for registering at Perplexity. We're excited to have you on board!`,
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
