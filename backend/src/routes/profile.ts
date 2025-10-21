import express from "express";
import { body, validationResult } from "express-validator";
import { authMiddleware } from "../middleware/auth";
import User from "../models/User";

const router = express.Router();

// @route   GET /api/profile/me
// @desc    Get current authenticated user's profile (safe fields only)
// @access  Private
router.get(
  "/me",
  authMiddleware,
  async (req: express.Request, res: express.Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not authenticated" });
      }

      // Fetch fresh user from DB to ensure latest data
      const fresh = await User.findById(user._id).select("-password");
      if (!fresh) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      return res.json({ success: true, data: { user: fresh } });
    } catch (error: any) {
      console.error("Get self profile error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error retrieving profile" });
    }
  }
);

// Validators for update
const updateProfileValidators = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("First name is required"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Last name is required"),
  body("profile")
    .optional()
    .isObject()
    .withMessage("Profile must be an object"),
  body("profile.phone")
    .optional({ nullable: true })
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage("Please enter a valid phone number"),
  body("profile.address").optional({ nullable: true }).isString(),
  body("profile.gender")
    .optional({ nullable: true })
    .isIn(["male", "female", "other"]),
  body("profile.dateOfBirth").optional({ nullable: true }).isISO8601().toDate(),
  // Role-specific validators
  body("academicInfo").optional().isObject(),
  body("academicInfo.class").optional({ nullable: true }).isString(),
  body("academicInfo.section").optional({ nullable: true }).isString(),
  body("academicInfo.grade").optional({ nullable: true }).isString(),
  body("academicInfo.subjects").optional({ nullable: true }).isArray(),
  body("employmentInfo").optional().isObject(),
  body("employmentInfo.department").optional({ nullable: true }).isString(),
  body("employmentInfo.position").optional({ nullable: true }).isString(),
  body("employmentInfo.responsibilities")
    .optional({ nullable: true })
    .isString(),
];

// @route   PUT /api/profile
// @desc    Update current authenticated user's profile (selected fields)
// @access  Private
router.put(
  "/",
  authMiddleware,
  updateProfileValidators,
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: errors.array(),
      });
    }

    try {
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not authenticated" });
      }

      const { firstName, lastName, profile, academicInfo, employmentInfo } =
        req.body as {
          firstName?: string;
          lastName?: string;
          profile?: {
            phone?: string;
            address?: string;
            gender?: string;
            dateOfBirth?: Date;
            avatar?: string;
          };
          academicInfo?: {
            class?: string;
            section?: string;
            grade?: string;
            subjects?: string[];
          };
          employmentInfo?: {
            department?: string;
            position?: string;
            responsibilities?: string;
          };
        };

      if (typeof firstName === "string") user.firstName = firstName;
      if (typeof lastName === "string") user.lastName = lastName;
      if (profile && typeof profile === "object") {
        user.profile = { ...(user.profile || {}), ...profile } as any;
      }
      if (academicInfo && typeof academicInfo === "object") {
        user.academicInfo = {
          ...(user.academicInfo || {}),
          ...academicInfo,
        } as any;
      }
      if (employmentInfo && typeof employmentInfo === "object") {
        user.employmentInfo = {
          ...(user.employmentInfo || {}),
          ...employmentInfo,
        } as any;
      }

      await user.save();
      const sanitized = user.toObject();
      delete (sanitized as any).password;

      return res.json({
        success: true,
        message: "Profile updated successfully",
        data: { user: sanitized },
      });
    } catch (error: any) {
      console.error("Update self profile error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error updating profile" });
    }
  }
);

// @route   PUT /api/profile/password
// @desc    Update current authenticated user's password
// @access  Private
router.put(
  "/password",
  authMiddleware,
  [
    body("currentPassword")
      .isString()
      .isLength({ min: 1 })
      .withMessage("Current password is required"),
    body("newPassword")
      .isString()
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: errors.array(),
      });
    }

    try {
      const user = req.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not authenticated" });
      }

      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Current password is incorrect" });
      }

      user.password = newPassword; // will be hashed by pre-save hook
      await user.save();

      return res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error: any) {
      console.error("Update password error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error updating password" });
    }
  }
);

export default router;
