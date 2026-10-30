
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware.js";
import sendEmail from "../utils/sendEmail.js";

import {
  createHmac,
  randomInt,
  randomBytes,
  timingSafeEqual,
} from "crypto";

const router = express.Router();

const OTP_EXPIRY = 5 * 60 * 1000;
const RESET_TOKEN_EXPIRY = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_WAIT = 60 * 1000;

// Hash OTPs and reset tokens using a server-side secret
const hashValue = (value) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in .env");
  }

  return createHmac("sha256", process.env.JWT_SECRET)
    .update(value)
    .digest("hex");
};

// Constant-time hash comparison
const safeCompare = (a, b) => {
  if (!a || !b) return false;

  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");

  return (
    bufferA.length === bufferB.length &&
    timingSafeEqual(bufferA, bufferB)
  );
};

const resetFields =
  "+resetOtpHash +resetOtpExpiresAt +resetOtpAttempts " +
  "+resetOtpLastSentAt +resetTokenHash +resetTokenExpiresAt";


// ========================================
// REGISTER
// ========================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});


// ========================================
// LOGIN
// ========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});


// ========================================
// FORGOT PASSWORD - SEND OTP
// ========================================

router.post("/forgot-password", async (req, res) => {
   console.log("FORGOT PASSWORD ROUTE HIT");
  try {
    const { email } = req.body || {};

    if (!email?.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(resetFields);

    const genericMessage =
      "If an account exists with this email, an OTP will be sent.";

    // Avoid revealing whether an account exists
    if (!user) {
      return res.status(200).json({
        message: genericMessage,
      });
    }

    // Prevent repeated OTP requests
    if (
      user.resetOtpLastSentAt &&
      Date.now() - user.resetOtpLastSentAt.getTime() <
        OTP_RESEND_WAIT
    ) {
      return res.status(200).json({
        message: genericMessage,
      });
    }

    const otp = randomInt(100000, 1000000).toString();

    user.resetOtpHash = hashValue(otp);
    user.resetOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY);
    user.resetOtpAttempts = 0;
    user.resetOtpLastSentAt = new Date();

    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;

    await user.save();

    try {
      await sendEmail(
        normalizedEmail,
        "TaskFlow - Password Reset OTP",
        `
          <div style="font-family: Arial, sans-serif;">
            <h2>TaskFlow Password Reset</h2>
            <p>You requested to reset your TaskFlow password.</p>
            <h1 style="letter-spacing: 8px;">${otp}</h1>
            <p>This OTP expires in 5 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `
      );
    } catch (emailError) {
      user.resetOtpHash = undefined;
      user.resetOtpExpiresAt = undefined;
      user.resetOtpAttempts = 0;
      user.resetOtpLastSentAt = undefined;

      await user.save();

      throw emailError;
    }

    return res.status(200).json({
      message: genericMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      message: "Unable to process password reset request",
    });
  }
});


// ========================================
// VERIFY OTP
// ========================================

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (
      !email?.trim() ||
      !otp ||
      !/^\d{6}$/.test(String(otp))
    ) {
      return res.status(400).json({
        message: "Valid email and six-digit OTP are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select(resetFields);

    if (
      !user ||
      !user.resetOtpHash ||
      !user.resetOtpExpiresAt
    ) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    if (user.resetOtpExpiresAt.getTime() < Date.now()) {
      user.resetOtpHash = undefined;
      user.resetOtpExpiresAt = undefined;
      user.resetOtpAttempts = 0;

      await user.save();

      return res.status(400).json({
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
      user.resetOtpHash = undefined;
      user.resetOtpExpiresAt = undefined;

      await user.save();

      return res.status(429).json({
        message: "Too many incorrect attempts. Request a new OTP.",
      });
    }

    const isOtpValid = safeCompare(
      hashValue(String(otp)),
      user.resetOtpHash
    );

    if (!isOtpValid) {
      user.resetOtpAttempts += 1;

      if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
        user.resetOtpHash = undefined;
        user.resetOtpExpiresAt = undefined;
      }

      await user.save();

      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // Generate a temporary reset token
    const resetToken = randomBytes(32).toString("hex");

    user.resetTokenHash = hashValue(resetToken);
    user.resetTokenExpiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY
    );

    // OTP can no longer be reused
    user.resetOtpHash = undefined;
    user.resetOtpExpiresAt = undefined;
    user.resetOtpAttempts = 0;

    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("OTP verification error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});


// ========================================
// RESET PASSWORD
// ========================================

router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body || {};

    if (!email?.trim() || !resetToken || !newPassword) {
      return res.status(400).json({
        message: "Email, reset token, and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select(resetFields);

    if (
      !user ||
      !user.resetTokenHash ||
      !user.resetTokenExpiresAt
    ) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    if (user.resetTokenExpiresAt.getTime() < Date.now()) {
      user.resetTokenHash = undefined;
      user.resetTokenExpiresAt = undefined;

      await user.save();

      return res.status(400).json({
        message: "Reset token has expired. Please start again.",
      });
    }

    const isTokenValid = safeCompare(
      hashValue(resetToken),
      user.resetTokenHash
    );

    if (!isTokenValid) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // Hash the new password
    user.password = await bcrypt.hash(newPassword, 12);

    // Clear reset information
    user.resetOtpHash = undefined;
    user.resetOtpExpiresAt = undefined;
    user.resetOtpAttempts = 0;
    user.resetOtpLastSentAt = undefined;
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    console.error("Password reset error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});


// ========================================
// GET CURRENT USER
// ========================================

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Authenticated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error("Profile route error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
