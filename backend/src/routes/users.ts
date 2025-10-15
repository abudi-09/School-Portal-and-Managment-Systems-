import express from "express";
import User from "../models/User";
import { authMiddleware, authorizeRoles } from "../middleware/auth";

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const users = await User.find({})
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments();

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

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get(
  "/:id",
  authMiddleware,
  async (req: express.Request, res: express.Response) => {
    try {
      const user = await User.findById(req.params.id).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Users can only view their own profile unless they're admin
      if (
        req.user?._id.toString() !== req.params.id &&
        req.user?.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error retrieving user",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put(
  "/:id",
  authMiddleware,
  async (req: express.Request, res: express.Response) => {
    try {
      // Users can only update their own profile unless they're admin
      if (
        req.user?._id.toString() !== req.params.id &&
        req.user?.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const allowedFields = [
        "firstName",
        "lastName",
        "profile",
        "academicInfo",
        "employmentInfo",
      ];

      const updateData: any = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      const user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User updated successfully",
        data: { user },
      });
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating user",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Soft delete by setting isActive to false
      user.isActive = false;
      await user.save();

      res.json({
        success: true,
        message: "User deactivated successfully",
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

// @route   GET /api/users/role/:role
// @desc    Get users by role
// @access  Private/Admin
router.get(
  "/role/:role",
  authMiddleware,
  authorizeRoles("admin", "head"),
  async (req: express.Request, res: express.Response) => {
    try {
      const { role } = req.params;
      const validRoles = ["admin", "head", "teacher", "student"];

      if (!role || !validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          message: "Invalid role specified",
        });
        return;
      }

      const users = await User.find({ role, isActive: true })
        .select("-password")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: { users },
      });
    } catch (error: any) {
      console.error("Get users by role error:", error);
      res.status(500).json({
        success: false,
        message: "Server error retrieving users",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

export default router;
