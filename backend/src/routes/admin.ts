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

const roleUpdateValidation = [
  body("role")
    .isIn(["admin", "head", "teacher", "student"])
    .withMessage("Invalid role specified"),
];

const statusUpdateValidation = [
  body("status")
    .isIn(["pending", "approved", "deactivated"])
    .withMessage("Invalid status specified"),
];

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination (admin only)
// @access  Private/Admin
router.get(
  "/users",
  authMiddleware,
  authorizeRoles("admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Build filter
      const filter: any = {};
      if (req.query.role) filter.role = req.query.role;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.search) {
        filter.$or = [
          { firstName: new RegExp(req.query.search as string, "i") },
          { lastName: new RegExp(req.query.search as string, "i") },
          { email: new RegExp(req.query.search as string, "i") },
        ];
      }

      const users = await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: "Server error retrieving users",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/admin/users/pending
// @desc    Get pending users (heads/teachers) for approval
// @access  Private/Admin
router.get(
  "/users/pending",
  authMiddleware,
  authorizeRoles("admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const heads = await ApprovalService.getPendingUsersByRole("head");
      const teachers = await ApprovalService.getPendingUsersByRole("teacher");

      res.json({
        success: true,
        data: {
          heads,
          teachers,
          totalPending: heads.length + teachers.length,
        },
      });
    } catch (error: any) {
      console.error("Get pending users error:", error);
      res.status(500).json({
        success: false,
        message: "Server error retrieving pending users",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PATCH /api/admin/users/:id/status
// @desc    Update user status (approve/deactivate)
// @access  Private/Admin
router.patch(
  "/users/:id/status",
  authMiddleware,
  authorizeRoles("admin"),
  userIdValidation,
  statusUpdateValidation,
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

      const { status } = req.body;
      const userId = req.params.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      // Prevent admin from deactivating themselves
      if (userId === req.user?._id.toString() && status === "deactivated") {
        return res.status(400).json({
          success: false,
          message: "Cannot deactivate your own account",
        });
      }

      let user;
      if (status === "approved") {
        user = await ApprovalService.approveUser(userId);
      } else if (status === "deactivated") {
        user = await ApprovalService.deactivateUser(userId);
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid status update",
        });
      }

      res.json({
        success: true,
        message: `User ${status === "approved" ? "approved" : status}`,
        data: { user },
      });
    } catch (error: any) {
      console.error("Update user status error:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating user status",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PATCH /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.patch(
  "/users/:id/role",
  authMiddleware,
  authorizeRoles("admin"),
  userIdValidation,
  roleUpdateValidation,
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

      const { role } = req.body;
      const userId = req.params.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      // Prevent admin from changing their own role
      if (userId === req.user?._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Cannot change your own role",
        });
      }

      const user = await ApprovalService.updateUserRole(userId, role);

      res.json({
        success: true,
        message: "User role updated successfully",
        data: { user },
      });
    } catch (error: any) {
      console.error("Update user role error:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating user role",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (soft delete by deactivating)
// @access  Private/Admin
router.delete(
  "/users/:id",
  authMiddleware,
  authorizeRoles("admin"),
  userIdValidation,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      // Prevent admin from deleting themselves
      if (userId === req.user?._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own account",
        });
      }

      await ApprovalService.deleteUser(userId);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error deleting user",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

export default router;
