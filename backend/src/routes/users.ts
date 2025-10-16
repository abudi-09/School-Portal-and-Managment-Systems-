import express from "express";
import User from "../models/User";
import { authMiddleware, authorizeRoles } from "../middleware/auth";
import path from "path";

let multer: any;
try {
  // try to require the real multer
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  multer = require("multer");
} catch (e) {
  // fallback to local shim so server can run even if multer isn't installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  multer = require("../utils/multer-shim");
}

// Configure multer
const uploadDir = path.join(__dirname, "..", "..", "uploads");
const storage =
  typeof multer.diskStorage === "function"
    ? multer.diskStorage({
        destination: function (
          _req: unknown,
          _file: unknown,
          cb: (err: Error | null, destination?: string) => void
        ) {
          cb(null, uploadDir);
        },
        filename: function (
          _req: unknown,
          file: { originalname?: string },
          cb: (err: Error | null, filename?: string) => void
        ) {
          const originalName = file?.originalname ?? "upload";
          const ext = path.extname(originalName);
          cb(
            null,
            `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`
          );
        },
      })
    : undefined;

const upload =
  typeof multer === "function"
    ? multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: (
          _req: unknown,
          file: { originalname?: string },
          cb: (error: Error | null, allow?: boolean) => void
        ) => {
          const allowed = /jpeg|jpg|png/;
          const ext = path.extname(file?.originalname ?? "").toLowerCase();
          if (allowed.test(ext)) {
            cb(null, true);
            return;
          }
          cb(new Error("Only JPEG/PNG files are allowed"));
        },
      })
    : multer();

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

// @route   POST /api/users/:id/avatar
// @desc    Upload avatar for user (owner or admin)
// @access  Private
router.post(
  "/:id/avatar",
  authMiddleware,
  upload.single("avatar"),
  async (
    req: express.Request & { user?: any; file?: { filename?: string } | null },
    res: express.Response
  ) => {
    try {
      // Permission check
      if (
        req.user?._id.toString() !== req.params.id &&
        req.user?.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }

      if (!req.file || !req.file.filename) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Save relative path to avatar
      user.profile = user.profile || {};
      user.profile.avatar = `/uploads/${req.file.filename}`;
      await user.save();

      res.json({
        success: true,
        message: "Avatar uploaded",
        data: { avatar: user.profile.avatar },
      });
    } catch (error: any) {
      console.error("Upload avatar error:", error);
      res.status(500).json({
        success: false,
        message: "Server error uploading avatar",
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

// @route   PUT /api/users/:id/responsibilities
// @desc    Update user responsibilities (head or admin only)
// @access  Private
router.put(
  "/:id/responsibilities",
  authMiddleware,
  authorizeRoles("head", "admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const { responsibilities } = req.body;

      if (typeof responsibilities !== "string") {
        return res.status(400).json({
          success: false,
          message: "Responsibilities must be a string",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Only head or admin can update responsibilities
      if (req.user?.role !== "head" && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      user.employmentInfo = user.employmentInfo || {};
      user.employmentInfo.responsibilities = responsibilities;
      await user.save();

      res.json({
        success: true,
        message: "Responsibilities updated successfully",
        data: { user: { _id: user._id, employmentInfo: user.employmentInfo } },
      });
    } catch (error: any) {
      console.error("Update responsibilities error:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating responsibilities",
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
