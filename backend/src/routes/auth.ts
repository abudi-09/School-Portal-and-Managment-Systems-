import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { authMiddleware } from "../middleware/auth";
import { env } from "../config/env";

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret: jwt.Secret = env.jwtSecret;
  return jwt.sign({ userId }, secret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("firstName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name is required"),
    body("lastName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Last name is required"),
    body("role")
      .isIn(["head", "teacher"])
      .withMessage("Only head or teacher registration is allowed"),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        email,
        password,
        firstName,
        lastName,
        role,
        profile,
        academicInfo,
        employmentInfo,
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role,
        status: "pending",
        isActive: true,
        profile: profile || {},
        academicInfo: academicInfo || {},
        employmentInfo: employmentInfo || {},
      });

      const approvalBy = role === "head" ? "admin" : "head";

      res.status(201).json({
        success: true,
        message: "Registration successful. Your account is pending approval.",
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
          },
          pendingApprovalBy: approvalBy,
        },
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during registration",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post(
  "/login",
  [
    body("email")
      .optional({ checkFalsy: true })
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("studentId")
      .optional({ checkFalsy: true })
      .matches(/^STU-\d{4}-\d{4}$/i)
      .withMessage("Student ID must follow STU-YYYY-0001 format"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body()
      .custom((value) => value.email || value.studentId)
      .withMessage("Email or student ID is required"),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body as {
        email?: string;
        password: string;
        studentId?: string;
      };

      const studentId = (req.body.studentId as string | undefined)
        ?.toString()
        .trim()
        .toUpperCase();

      console.log(
        `Login attempt for ${
          email ? `email ${email}` : `studentId ${studentId ?? "unknown"}`
        }`
      );

      // Find user by identifier
      let user: IUser | null = null;
      if (email) {
        user = await User.findOne({ email });
      } else if (studentId) {
        // Look up by current studentId or historical academicInfo.studentId
        user = await User.findOne({
          $or: [{ studentId }, { "academicInfo.studentId": studentId }],
        });

        // If an admin (or upgraded account) attempts to use studentId, enforce email-only login
        if (user && user.role === "admin") {
          console.log(
            `Admin account attempted studentId login: ${studentId}. Enforcing email-only login.`
          );
          return res.status(400).json({
            success: false,
            message: "Admin accounts must log in using email and password.",
            code: "EMAIL_ONLY_LOGIN",
          });
        }
      }

      if (!user) {
        console.log(
          `User not found for identifier: ${email ?? studentId ?? "unknown"}`
        );
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      console.log(
        `User found: ${user.email ?? user.studentId}, role: ${
          user.role
        }, status: ${user.status}, isActive: ${user.isActive}`
      );

      // Check if user is active
      if (!user.isActive) {
        console.log(
          `User ${email ?? user.studentId ?? "unknown"} is not active`
        );
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      if (user.status !== "approved") {
        console.log(
          `User ${email ?? user.studentId ?? "unknown"} status is ${
            user.status
          }, not approved`
        );
        return res.status(403).json({
          success: false,
          message:
            user.status === "pending"
              ? "Account pending approval. Please wait for confirmation."
              : "Account is not approved for access.",
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      console.log(
        `Password match for ${email ?? user.studentId ?? "unknown"}: ${isMatch}`
      );
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user._id.toString());

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            profile: user.profile,
            academicInfo: user.academicInfo,
            employmentInfo: user.employmentInfo,
            studentId: user.studentId,
          },
          token,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during login",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get(
  "/me",
  authMiddleware,
  async (req: express.Request & { user?: IUser }, res: express.Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            profile: user.profile,
            academicInfo: user.academicInfo,
            employmentInfo: user.employmentInfo,
            lastLogin: user.lastLogin,
          },
        },
      });
    } catch (error: any) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Server error retrieving profile",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post(
  "/logout",
  authMiddleware,
  (req: express.Request, res: express.Response) => {
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
);

export default router;
