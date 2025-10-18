import express from "express";
import { body, param, validationResult } from "express-validator";
import User from "../models/User";
import { authMiddleware, authorizeRoles } from "../middleware/auth";
import { ApprovalService } from "../services/approval.service";

const router = express.Router();

// Validation rules
const userIdValidation = [
  param("id").isMongoId().withMessage("Invalid user ID"),
];

const statusUpdateValidation = [
  body("status")
    .isIn(["pending", "approved", "deactivated"])
    .withMessage("Invalid status specified"),
];

// @route   GET /api/head/pending-teachers
// @desc    Get pending teachers for approval
// @access  Private/Head
router.get(
  "/pending-teachers",
  authMiddleware,
  authorizeRoles("head"),
  async (req: express.Request, res: express.Response) => {
    try {
      const teachers = await ApprovalService.getPendingUsersByRole("teacher");

      res.json({
        success: true,
        data: { teachers },
      });
    } catch (error: any) {
      console.error("Get pending teachers error:", error);
      res.status(500).json({
        success: false,
        message: "Server error retrieving pending teachers",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PATCH /api/head/teachers/:id/approve
// @desc    Approve a pending teacher
// @access  Private/Head
router.patch(
  "/teachers/:id/approve",
  authMiddleware,
  authorizeRoles("head"),
  userIdValidation,
  async (req: express.Request, res: express.Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const teacherId = req.params.id;

      if (!teacherId) {
        return res.status(400).json({
          success: false,
          message: "Teacher ID is required",
        });
      }

      const teacher = await ApprovalService.approveUser(teacherId);

      // Verify it was actually a pending teacher
      if (teacher.role !== "teacher") {
        return res.status(400).json({
          success: false,
          message: "User is not a teacher",
        });
      }

      res.json({
        success: true,
        message: "Teacher approved successfully",
        data: { teacher },
      });
    } catch (error: any) {
      console.error("Approve teacher error:", error);
      res.status(500).json({
        success: false,
        message: "Server error approving teacher",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PATCH /api/head/teachers/:id/reject
// @desc    Reject a pending teacher (deactivate account)
// @access  Private/Head
router.patch(
  "/teachers/:id/reject",
  authMiddleware,
  authorizeRoles("head"),
  userIdValidation,
  async (req: express.Request, res: express.Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const teacherId = req.params.id;

      if (!teacherId) {
        return res.status(400).json({
          success: false,
          message: "Teacher ID is required",
        });
      }

      const teacher = await ApprovalService.deactivateUser(teacherId);

      // Verify it was actually a pending teacher
      if (teacher.role !== "teacher") {
        return res.status(400).json({
          success: false,
          message: "User is not a teacher",
        });
      }

      res.json({
        success: true,
        message: "Teacher rejected and account deactivated",
        data: { teacher },
      });
    } catch (error: any) {
      console.error("Reject teacher error:", error);
      res.status(500).json({
        success: false,
        message: "Server error rejecting teacher",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/head/teachers
// @desc    Get all teachers under this head's management
// @access  Private/Head
router.get(
  "/teachers",
  authMiddleware,
  authorizeRoles("head"),
  async (req: express.Request, res: express.Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const teachers = await User.find({ role: "teacher" })
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments({ role: "teacher" });

      res.json({
        success: true,
        data: {
          teachers,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Get teachers error:", error);
      res.status(500).json({
        success: false,
        message: "Server error retrieving teachers",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

export default router;
