import express from "express";
import { body, param, validationResult } from "express-validator";
import User from "../models/User";
import { authMiddleware, authorizeRoles } from "../middleware/auth";
import { StudentService } from "../services/student.service";
import {
  getApprovedUsers,
  upgradeUserRole,
} from "../controllers/user.controller";
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

const createStudentValidators = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("profile").optional({ nullable: true }).isObject(),
  body("academicInfo").optional({ nullable: true }).isObject(),
];

const gmailEmailValidator = (field = "email") =>
  body(field)
    .custom((value) => /@gmail\.com$/i.test(value))
    .withMessage("Email must be a Gmail address");

// @route   GET /api/users
// @desc    Get approved users with valid roles (admin only)
// @access  Private/Admin
router.get("/", authMiddleware, authorizeRoles("admin"), getApprovedUsers);

// NOTE: The generic "/:id" routes are declared AFTER specific routes like "/students" and "/role/:role"
// to prevent accidental matches such as GET /api/users/students being treated as an ID.

// @route   POST /api/users/:id/avatar
// @desc    Upload avatar for user (owner or admin)
// @access  Private
router.post(
  "/:id/avatar",
  authMiddleware,
  [param("id").isMongoId().withMessage("Invalid user ID")],
  upload.single("avatar"),
  async (
    req: express.Request & { user?: any; file?: { filename?: string } | null },
    res: express.Response
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid input",
            errors: errors.array(),
          });
      }
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
  [param("id").isMongoId().withMessage("Invalid user ID")],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid input",
            errors: errors.array(),
          });
      }
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
  [param("id").isMongoId().withMessage("Invalid user ID")],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid input",
            errors: errors.array(),
          });
      }
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
  [param("id").isMongoId().withMessage("Invalid user ID")],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid input",
            errors: errors.array(),
          });
      }
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

// @route   POST /api/users/students
// @desc    Create a new student (admin only)
// @access  Private/Admin
router.post(
  "/students",
  authMiddleware,
  authorizeRoles("admin"),
  [...createStudentValidators, gmailEmailValidator("email")],
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
      const { firstName, lastName, email, profile, academicInfo } = req.body;

      const { student, credentials } = await StudentService.createStudent({
        firstName,
        lastName,
        email,
        profile,
        academicInfo,
      });

      res.status(201).json({
        success: true,
        message: "Student created successfully",
        data: {
          student: {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            role: student.role,
            studentId: student.studentId,
            academicInfo: student.academicInfo,
            profile: student.profile,
          },
          credentials,
        },
      });
    } catch (error: any) {
      console.error("Create student error:", error);

      if (error.message === "A user with this email already exists") {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Server error creating student",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/users/students
// @desc    Get students with pagination and filters
// @access  Private/Admin
router.get(
  "/students",
  authMiddleware,
  authorizeRoles("admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || undefined;
      const status = (req.query.status as "active" | "inactive") || undefined;

      const studentQueryOptions: Parameters<
        typeof StudentService.getStudents
      >[0] = {
        page,
        limit,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      };

      const result = await StudentService.getStudents(studentQueryOptions);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Get students error:", error);
      res.status(500).json({
        success: false,
        message: "Server error retrieving students",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/users/students/:id
// @desc    Update a student (admin only)
// @access  Private/Admin
router.put(
  "/students/:id",
  authMiddleware,
  authorizeRoles("admin"),
  [
    param("id").isMongoId().withMessage("Invalid student ID"),
    gmailEmailValidator("email").optional(),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email")
      .normalizeEmail(),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid input",
          errors: errors.array(),
        });
    }

    try {
      const updated = await StudentService.updateStudent(
        req.params.id as string,
        req.body
      );
      res.json({
        success: true,
        message: "Student updated successfully",
        data: { student: updated },
      });
    } catch (error: any) {
      if (error.message === "Student not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message === "A user with this email already exists") {
        return res.status(409).json({ success: false, message: error.message });
      }
      console.error("Update student error:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error updating student" });
    }
  }
);

// @route   PATCH /api/users/students/:id/activate
// @desc    Activate a student account (admin only)
// @access  Private/Admin
router.patch(
  "/students/:id/activate",
  authMiddleware,
  authorizeRoles("admin"),
  [param("id").isMongoId().withMessage("Invalid student ID")],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid input",
          errors: errors.array(),
        });
    }
    try {
      const student = await StudentService.setActive(
        req.params.id as string,
        true
      );
      res.json({
        success: true,
        message: "Student activated",
        data: { student },
      });
    } catch (error: any) {
      if (error.message === "Student not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error("Activate student error:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error activating student" });
    }
  }
);

// @route   PATCH /api/users/students/:id/deactivate
// @desc    Deactivate a student account (admin only)
// @access  Private/Admin
router.patch(
  "/students/:id/deactivate",
  authMiddleware,
  authorizeRoles("admin"),
  [param("id").isMongoId().withMessage("Invalid student ID")],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid input",
          errors: errors.array(),
        });
    }
    try {
      const student = await StudentService.setActive(
        req.params.id as string,
        false
      );
      res.json({
        success: true,
        message: "Student deactivated",
        data: { student },
      });
    } catch (error: any) {
      if (error.message === "Student not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error("Deactivate student error:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error deactivating student" });
    }
  }
);

// @route   DELETE /api/users/students/:id
// @desc    Deactivate a student account and mark as deleted (admin only)
// @access  Private/Admin
router.delete(
  "/students/:id",
  authMiddleware,
  authorizeRoles("admin"),
  [param("id").isMongoId().withMessage("Invalid student ID")],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid input",
          errors: errors.array(),
        });
    }

    try {
      const student = await StudentService.deleteStudent(
        req.params.id as string
      );
      res.json({
        success: true,
        message: "Student removed",
        data: { student },
      });
    } catch (error: any) {
      if (error.message === "Student not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error("Delete student error:", error);
      res.status(500).json({
        success: false,
        message: "Server error removing student",
      });
    }
  }
);

// @route   PATCH /api/users/:id/upgrade
// @desc    Upgrade a user role to admin (admin only)
// @access  Private/Admin
router.patch(
  "/:id/upgrade",
  authMiddleware,
  authorizeRoles("admin"),
  [param("id").isMongoId().withMessage("Invalid user ID")],
  upgradeUserRole
);

// @route   PATCH /api/users/students/:id/reset-password
// @desc    Reset a student's password (admin only)
// @access  Private/Admin
router.patch(
  "/students/:id/reset-password",
  authMiddleware,
  authorizeRoles("admin"),
  [param("id").isMongoId().withMessage("Invalid student ID")],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid input",
          errors: errors.array(),
        });
    }
    try {
      const { credentials } = await StudentService.resetPassword(
        req.params.id as string
      );
      res.json({
        success: true,
        message: "Student password reset",
        data: { credentials },
      });
    } catch (error: any) {
      if (error.message === "Student not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error("Reset password error:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error resetting password" });
    }
  }
);

export default router;
// Place generic ID route handlers at the end to avoid conflicting with more specific routes
// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get(
  "/:id",
  authMiddleware,
  [param("id").isMongoId().withMessage("Invalid user ID")],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid input",
            errors: errors.array(),
          });
      }

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
