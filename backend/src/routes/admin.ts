import express from "express";
import { body, param, validationResult } from "express-validator";
import User from "../models/User";
import Course from "../models/Course";
import Section from "../models/Section";
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

// -------- Courses --------
// GET /api/admin/courses?grade=9
router.get(
  "/courses",
  authMiddleware,
  authorizeRoles("admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const gradeNum = Number(req.query.grade);
      if (![9, 10, 11, 12].includes(gradeNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid or missing grade. Expected 9,10,11,12.",
        });
      }
      // Optional stream filter for senior grades
      const filter: any = { grade: gradeNum };
      const stream = req.query.stream as string | undefined;
      if (stream) filter.stream = stream;

      const courses = await Course.find(filter).sort({ createdAt: -1 });
      return res.json({ success: true, data: { courses } });
    } catch (error: any) {
      console.error("List courses error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error retrieving courses" });
    }
  }
);

// POST /api/admin/courses
router.post(
  "/courses",
  authMiddleware,
  authorizeRoles("admin"),
  [
    body("grade").isInt({ min: 9, max: 12 }).withMessage("Grade must be 9-12"),
    body("name")
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Course name is required"),
    body("stream")
      .optional()
      .isIn(["natural", "social"])
      .withMessage("Stream must be 'natural' or 'social'"),
    body("isMandatory")
      .optional()
      .isBoolean()
      .withMessage("isMandatory must be boolean"),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const { grade, name, isMandatory, stream } = req.body as {
        grade: number;
        name: string;
        isMandatory?: boolean;
        stream?: string;
      };

      // For grades 11 and 12, stream is required
      if ([11, 12].includes(Number(grade)) && !stream) {
        return res.status(400).json({
          success: false,
          message: "Stream is required for grades 11 and 12",
        });
      }

      const doc = new Course({
        grade,
        name,
        isMandatory: !!isMandatory,
        stream,
      });
      await doc.save();
      return res.status(201).json({ success: true, data: { course: doc } });
    } catch (error: any) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Course already exists for this grade",
        });
      }
      console.error("Create course error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error creating course" });
    }
  }
);

// PATCH /api/admin/courses/:id
router.patch(
  "/courses/:id",
  authMiddleware,
  authorizeRoles("admin"),
  userIdValidation,
  [
    body("name")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Course name is required"),
    body("stream")
      .optional()
      .isIn(["natural", "social"])
      .withMessage("Stream must be 'natural' or 'social'"),
    body("isMandatory")
      .optional()
      .isBoolean()
      .withMessage("isMandatory must be boolean"),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const id = req.params.id;
      const update: any = {};
      if (req.body.name !== undefined) update.name = req.body.name;
      if (req.body.isMandatory !== undefined)
        update.isMandatory = !!req.body.isMandatory;
      if (req.body.stream !== undefined) update.stream = req.body.stream;

      const course = await Course.findById(id);
      if (!course)
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });

      Object.assign(course, update);
      await course.save();

      return res.json({ success: true, data: { course } });
    } catch (error: any) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Course already exists for this grade",
        });
      }
      console.error("Update course error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error updating course" });
    }
  }
);

// -------- Sections --------
// GET /api/admin/sections?grade=9
router.get(
  "/sections",
  authMiddleware,
  authorizeRoles("admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const gradeNum = Number(req.query.grade);
      if (![9, 10, 11, 12].includes(gradeNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid or missing grade. Expected 9,10,11,12.",
        });
      }

      const sections = await Section.find({ grade: gradeNum }).sort({
        createdAt: -1,
      });
      return res.json({ success: true, data: { sections } });
    } catch (error: any) {
      console.error("List sections error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error retrieving sections" });
    }
  }
);

// POST /api/admin/sections
router.post(
  "/sections",
  authMiddleware,
  authorizeRoles("admin"),
  [
    body("grade").isInt({ min: 9, max: 12 }).withMessage("Grade must be 9-12"),
    body("label")
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Section label is required"),
    body("capacity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Capacity must be a positive integer"),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const { grade, label, capacity } = req.body as {
        grade: number;
        label: string;
        capacity?: number;
      };
      const doc = new Section({ grade, label, capacity });
      await doc.save();
      return res.status(201).json({ success: true, data: { section: doc } });
    } catch (error: any) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Section already exists for this grade",
        });
      }
      console.error("Create section error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error creating section" });
    }
  }
);

// PATCH /api/admin/sections/:id
router.patch(
  "/sections/:id",
  authMiddleware,
  authorizeRoles("admin"),
  userIdValidation,
  [
    body("label")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Section label is required"),
    body("capacity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Capacity must be a positive integer"),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const id = req.params.id;
      const update: any = {};
      if (req.body.label !== undefined) update.label = req.body.label;
      if (req.body.capacity !== undefined) update.capacity = req.body.capacity;

      const section = await Section.findById(id);
      if (!section)
        return res
          .status(404)
          .json({ success: false, message: "Section not found" });

      Object.assign(section, update);
      await section.save();

      return res.json({ success: true, data: { section } });
    } catch (error: any) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Section already exists for this grade",
        });
      }
      console.error("Update section error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error updating section" });
    }
  }
);

// DELETE /api/admin/courses/:id
router.delete(
  "/courses/:id",
  authMiddleware,
  authorizeRoles("admin"),
  userIdValidation,
  async (req: express.Request, res: express.Response) => {
    try {
      const id = req.params.id;
      const course = await Course.findByIdAndDelete(id);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }
      return res.json({ success: true, data: { course } });
    } catch (error: any) {
      console.error("Delete course error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error deleting course" });
    }
  }
);

// DELETE /api/admin/sections/:id
router.delete(
  "/sections/:id",
  authMiddleware,
  authorizeRoles("admin"),
  userIdValidation,
  async (req: express.Request, res: express.Response) => {
    try {
      const id = req.params.id;
      const section = await Section.findByIdAndDelete(id);
      if (!section) {
        return res
          .status(404)
          .json({ success: false, message: "Section not found" });
      }
      return res.json({ success: true, data: { section } });
    } catch (error: any) {
      console.error("Delete section error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error deleting section" });
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
