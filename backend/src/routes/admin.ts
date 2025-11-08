import express from "express";
import { body, param, validationResult } from "express-validator";
import User from "../models/User";
import Course from "../models/Course";
import Section from "../models/Section";
import { authMiddleware, authorizeRoles } from "../middleware/auth";
import { ApprovalService } from "../services/approval.service";
import AuditLog from "../models/AuditLog";

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
      const stream = (req.query.stream as string | undefined)?.trim();
      if ((gradeNum === 11 || gradeNum === 12) && stream) {
        // When filtering by stream for senior grades, include common courses too
        filter.$or = [{ isCommon: true }, { stream }];
      }

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
    body("isCommon")
      .optional()
      .isBoolean()
      .withMessage("isCommon must be boolean"),
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
      const { grade, name, isMandatory, stream, isCommon } = req.body as {
        grade: number;
        name: string;
        isMandatory?: boolean;
        stream?: string;
        isCommon?: boolean;
      };

      // For grades 11 and 12: either stream OR isCommon must be provided (but not both)
      if ([11, 12].includes(Number(grade))) {
        const hasStream = !!stream;
        const common = !!isCommon;
        if (!hasStream && !common) {
          return res.status(400).json({
            success: false,
            message:
              "For grades 11 and 12, either stream must be set or the course must be marked common",
          });
        }
        if (hasStream && common) {
          return res.status(400).json({
            success: false,
            message:
              "Course cannot be both stream-specific and common at the same time",
          });
        }
      }

      const doc = new Course({
        grade,
        name,
        isMandatory: !!isMandatory,
        stream,
        isCommon: !!isCommon,
      });
      await doc.save();
      return res.status(201).json({ success: true, data: { course: doc } });
    } catch (error: any) {
      if (error?.code === 11000) {
        // Provide a more helpful duplicate response
        try {
          const { grade, name, stream, isCommon } = req.body as any;
          const normalizedName = String(name || "")
            .trim()
            .toLowerCase();
          const gradeNum = Number(grade);
          let conflict: any = null;
          if (isCommon) {
            // Existing common or any stream-specific with same name
            conflict =
              (await Course.findOne({
                grade: gradeNum,
                normalizedName,
                isCommon: true,
              }).lean()) ||
              (await Course.findOne({
                grade: gradeNum,
                normalizedName,
                stream: { $in: ["natural", "social"] },
              }).lean());
          } else if (stream) {
            // Existing same stream-specific or common with same name
            conflict =
              (await Course.findOne({
                grade: gradeNum,
                normalizedName,
                stream,
              }).lean()) ||
              (await Course.findOne({
                grade: gradeNum,
                normalizedName,
                isCommon: true,
              }).lean());
          } else {
            // Grades 9/10: any course with same normalizedName in grade
            conflict = await Course.findOne({
              grade: gradeNum,
              normalizedName,
            }).lean();
          }
          const detail = conflict
            ? {
                id: conflict._id?.toString?.(),
                name: conflict.name,
                isCommon: !!conflict.isCommon,
                stream: conflict.stream ?? null,
              }
            : undefined;
          return res.status(409).json({
            success: false,
            code: "DUPLICATE_COURSE",
            message: conflict?.isCommon
              ? `A common course named '${conflict.name}' already exists for grade ${gradeNum}.`
              : conflict?.stream
              ? `Course '${conflict.name}' already exists for grade ${gradeNum} in the '${conflict.stream}' stream.`
              : "Course already exists for this grade/stream/common scope",
            conflict: detail,
          });
        } catch (lookupErr) {
          return res.status(409).json({
            success: false,
            message: "Course already exists for this grade/stream/common scope",
          });
        }
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
    body("isCommon")
      .optional()
      .isBoolean()
      .withMessage("isCommon must be boolean"),
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
      if (req.body.isCommon !== undefined)
        update.isCommon = !!req.body.isCommon;

      const course = await Course.findById(id);
      if (!course)
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });

      // For grades 11 and 12: enforce XOR between stream and isCommon
      if (course.grade === 11 || course.grade === 12) {
        const nextStream =
          update.stream !== undefined ? update.stream : course.stream;
        const nextCommon =
          update.isCommon !== undefined ? update.isCommon : course.isCommon;
        const hasStream = !!nextStream;
        const common = !!nextCommon;
        if (!hasStream && !common) {
          return res.status(400).json({
            success: false,
            message:
              "For grades 11 and 12, either stream must be set or the course must be marked common",
          });
        }
        if (hasStream && common) {
          return res.status(400).json({
            success: false,
            message:
              "Course cannot be both stream-specific and common at the same time",
          });
        }
      } else {
        // For 9/10 ensure no stream/common
        update.stream = undefined;
        update.isCommon = false;
      }

      Object.assign(course, update);
      await course.save();

      return res.json({ success: true, data: { course } });
    } catch (error: any) {
      if (error?.code === 11000) {
        // Make duplicate message descriptive for updates as well
        try {
          const current = await Course.findById(req.params.id)
            .select("grade name stream isCommon")
            .lean();
          const gradeNum = Number(req.body.grade ?? current?.grade);
          // Determine intended post-update state
          const nextName = (req.body.name ?? current?.name) as string;
          const normalizedName = String(nextName || "")
            .trim()
            .toLowerCase();
          const nextStream = req.body.stream ?? current?.stream;
          const nextCommon = req.body.isCommon ?? current?.isCommon;
          let conflict: any = null;
          if (nextCommon) {
            conflict =
              (await Course.findOne({
                grade: gradeNum,
                normalizedName,
                isCommon: true,
              }).lean()) ||
              (await Course.findOne({
                grade: gradeNum,
                normalizedName,
                stream: { $in: ["natural", "social"] },
              }).lean());
          } else if (nextStream) {
            conflict =
              (await Course.findOne({
                grade: gradeNum,
                normalizedName,
                stream: nextStream,
              }).lean()) ||
              (await Course.findOne({
                grade: gradeNum,
                normalizedName,
                isCommon: true,
              }).lean());
          } else {
            conflict = await Course.findOne({
              grade: gradeNum,
              normalizedName,
            }).lean();
          }
          return res.status(409).json({
            success: false,
            code: "DUPLICATE_COURSE",
            message: conflict?.isCommon
              ? `A common course named '${conflict.name}' already exists for grade ${gradeNum}.`
              : conflict?.stream
              ? `Course '${conflict.name}' already exists for grade ${gradeNum} in the '${conflict.stream}' stream.`
              : "Course already exists for this grade/stream/common scope",
            conflict: conflict
              ? {
                  id: conflict._id?.toString?.(),
                  name: conflict.name,
                  isCommon: !!conflict.isCommon,
                  stream: conflict.stream ?? null,
                }
              : undefined,
          });
        } catch {
          return res.status(409).json({
            success: false,
            message: "Course already exists for this grade/stream/common scope",
          });
        }
      }
      console.error("Update course error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error updating course" });
    }
  }
);

// -------- Sections --------
// GET /api/admin/sections?grade=9[&stream=natural|social]
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

      const filter: any = { grade: gradeNum };
      const stream = req.query.stream as string | undefined;
      if (stream) filter.stream = stream;

      const sections = await Section.find(filter).sort({
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
    body("stream")
      .optional()
      .isIn(["natural", "social"])
      .withMessage("Stream must be 'natural' or 'social'"),
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
      const { grade, label, capacity, stream } = req.body as {
        grade: number;
        label: string;
        capacity?: number;
        stream?: string;
      };
      // For grades 11 and 12, stream is required
      if ([11, 12].includes(Number(grade)) && !stream) {
        return res.status(400).json({
          success: false,
          message: "Stream is required for grades 11 and 12",
        });
      }

      const doc = new Section({ grade, label, capacity, stream });
      await doc.save();
      return res.status(201).json({ success: true, data: { section: doc } });
    } catch (error: any) {
      if (error?.code === 11000) {
        // Duplicate key may include stream; provide clearer message
        const key = error?.keyValue
          ? Object.keys(error.keyValue).join(",")
          : null;
        const msg =
          key && key.includes("stream")
            ? "Section with this label already exists for the specified grade and stream"
            : "Section already exists for this grade";
        return res.status(409).json({
          success: false,
          message: msg,
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
    body("stream")
      .optional()
      .isIn(["natural", "social"])
      .withMessage("Stream must be 'natural' or 'social'"),
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
      if (req.body.stream !== undefined) update.stream = req.body.stream;

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

// @route   GET /api/admin/activity
// @desc    Recent assignment-related audit logs (limited to last 25)
// @access  Private/Admin
router.get(
  "/activity",
  authMiddleware,
  authorizeRoles("admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      const logs = await AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      res.json({
        success: true,
        data: {
          logs: logs.map((l) => ({
            id: l._id?.toString?.(),
            time: l.timestamp,
            classId: l.classId,
            subject: l.subject,
            change: l.change,
            fromTeacherName: l.fromTeacherName,
            toTeacherName: l.toTeacherName,
            actorName: l.actorName,
          })),
        },
      });
    } catch (error: any) {
      console.error("Admin activity error", error);
      res
        .status(500)
        .json({ success: false, message: "Server error retrieving activity" });
    }
  }
);

// @route   GET /api/admin/system-status
// @desc    Basic heuristic academic term status until dedicated config exists
// @access  Private/Admin
router.get(
  "/system-status",
  authMiddleware,
  authorizeRoles("admin"),
  async (_req: express.Request, res: express.Response) => {
    try {
      const today = new Date();
      const month = today.getMonth();
      const term = month < 4 ? "Spring" : month < 8 ? "Summer" : "Fall";
      const termEnd = new Date(
        today.getFullYear(),
        month < 4 ? 4 : month < 8 ? 8 : 11,
        month < 4 ? 30 : month < 8 ? 31 : 31
      );
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.max(
        0,
        Math.ceil((termEnd.getTime() - today.getTime()) / msPerDay)
      );
      res.json({
        success: true,
        data: {
          term: `${term} ${today.getFullYear()}`,
          endsOn: termEnd,
          daysRemaining,
        },
      });
    } catch (error: any) {
      console.error("System status error", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error retrieving system status",
        });
    }
  }
);

export default router;
