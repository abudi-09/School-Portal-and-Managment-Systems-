import express from "express";
import { body, param, validationResult } from "express-validator";
import User, { type IUser } from "../models/User";
import ClassHeadAssignment from "../models/ClassHeadAssignment";
import { authMiddleware, authorizeRoles } from "../middleware/auth";
import { ApprovalService } from "../services/approval.service";

const router = express.Router();

const HEAD_RESPONSIBILITY_PREFIX = "HeadClass:";

const parseClassIdentifier = (raw: string | undefined | null) => {
  const classId = (raw ?? "").trim();
  const fallback = {
    classId: classId.toLowerCase(),
    grade: classId.toUpperCase(),
    section: "",
  };
  if (!classId) return fallback;
  const match = classId.match(/^(.*?)([A-Za-z])$/);
  if (!match || match.length < 3) return fallback;
  return {
    classId: classId.toLowerCase(),
    grade: (match[1] ?? classId).toUpperCase(),
    section: (match[2] ?? "").toUpperCase(),
  };
};

const splitResponsibilities = (value?: string | null) =>
  (value ?? "")
    .split(",")
    .map((fragment) => fragment.trim())
    .filter(Boolean);

const joinResponsibilities = (entries: string[]) =>
  Array.from(new Set(entries.filter(Boolean))).join(", ");

const addHeadResponsibility = (
  value: string | undefined | null,
  classId: string
) => {
  const fragment = `${HEAD_RESPONSIBILITY_PREFIX}${classId}`;
  const entries = splitResponsibilities(value).filter(
    (item) => item !== fragment
  );
  entries.push(fragment);
  return joinResponsibilities(entries);
};

const removeHeadResponsibility = (
  value: string | undefined | null,
  classId: string
) => {
  const fragment = `${HEAD_RESPONSIBILITY_PREFIX}${classId}`;
  const entries = splitResponsibilities(value).filter(
    (item) => item !== fragment
  );
  return joinResponsibilities(entries);
};

const normalizeAssignedClassIds = (
  existing: string[] | undefined | null,
  classId: string,
  action: "add" | "remove"
) => {
  const set = new Set((existing ?? []).map((item) => item.toLowerCase()));
  if (action === "add") {
    set.add(classId.toLowerCase());
  } else {
    set.delete(classId.toLowerCase());
  }
  return Array.from(set);
};

const buildTeacherDisplayName = (teacher: IUser) => {
  const fullName = (teacher as unknown as { fullName?: string }).fullName;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  const parts = [teacher.firstName, teacher.lastName]
    .map((value) => (value ? value.trim() : ""))
    .filter(Boolean);
  if (parts.length) return parts.join(" ");
  return teacher.email ?? "Unnamed Teacher";
};

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

      const teacher = await ApprovalService.rejectUser(teacherId);

      // Verify it was actually a pending teacher
      if (teacher.role !== "teacher") {
        return res.status(400).json({
          success: false,
          message: "User is not a teacher",
        });
      }

      res.json({
        success: true,
        message: "Teacher rejected successfully",
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

      const filter: Record<string, unknown> = { role: "teacher" };

      if (req.query.status) {
        filter.status = req.query.status;
      }

      if (req.query.isApproved !== undefined) {
        filter.isApproved = req.query.isApproved === "true";
      }

      const teachers = await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);

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

// @route   GET /api/head/class-assignments
// @desc    List head teacher assignments per class
// @access  Private/Head+Admin
router.get(
  "/class-assignments",
  authMiddleware,
  authorizeRoles("head", "admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const assignments = await ClassHeadAssignment.find()
        .populate(
          "headTeacher",
          "firstName lastName email role isActive employmentInfo assignedClassIds"
        )
        .sort({ grade: 1, section: 1 });

      res.json({
        success: true,
        data: {
          assignments: assignments.map((assignment) => {
            const teacherDoc = assignment.headTeacher as unknown as
              | IUser
              | undefined;
            return {
              classId: assignment.classId,
              grade: assignment.grade,
              section: assignment.section,
              headTeacherId:
                teacherDoc?._id?.toString() ??
                assignment.headTeacher?.toString?.() ??
                "",
              headTeacherName: assignment.headTeacherName,
              headTeacherEmail:
                assignment.headTeacherEmail ?? teacherDoc?.email ?? undefined,
              updatedAt: assignment.updatedAt,
            };
          }),
        },
      });
    } catch (error: any) {
      console.error("Get class assignments error:", error);
      res.status(500).json({
        success: false,
        message: "Server error retrieving class assignments",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/head/class-assignments/:classId
// @desc    Assign or reassign a head class teacher
// @access  Private/Head+Admin
router.put(
  "/class-assignments/:classId",
  authMiddleware,
  authorizeRoles("head", "admin"),
  [
    param("classId").notEmpty().withMessage("Class ID is required"),
    body("teacherId")
      .isMongoId()
      .withMessage("Teacher ID must be a valid identifier"),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignment details",
          errors: errors.array(),
        });
      }

      const { classId: rawClassId } = req.params;
      const { teacherId } = req.body as { teacherId: string };
      const { classId, grade, section } = parseClassIdentifier(rawClassId);

      const teacher = await User.findOne({
        _id: teacherId,
        role: "teacher",
        isActive: true,
      });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found or inactive",
        });
      }

      const previousAssignment = await ClassHeadAssignment.findOne({ classId });
      const previousTeacherId = previousAssignment?.headTeacher?.toString();

      if (previousTeacherId && previousTeacherId === teacherId) {
        return res.json({
          success: true,
          message: "Teacher is already assigned to this class",
          data: {
            assignment: {
              classId,
              grade,
              section,
              headTeacherId: teacherId,
              headTeacherName:
                previousAssignment?.headTeacherName ??
                buildTeacherDisplayName(teacher),
              headTeacherEmail: teacher.email,
            },
          },
        });
      }

      const teacherDisplayName = buildTeacherDisplayName(teacher);
      teacher.employmentInfo = teacher.employmentInfo || {};
      teacher.employmentInfo.responsibilities = addHeadResponsibility(
        teacher.employmentInfo.responsibilities,
        classId
      );
      teacher.assignedClassIds = normalizeAssignedClassIds(
        teacher.assignedClassIds,
        classId,
        "add"
      );
      teacher.markModified("employmentInfo");
      await teacher.save();

      if (previousTeacherId && previousTeacherId !== teacherId) {
        const previousTeacher = await User.findById(previousTeacherId);
        if (previousTeacher) {
          previousTeacher.employmentInfo = previousTeacher.employmentInfo || {};
          previousTeacher.employmentInfo.responsibilities =
            removeHeadResponsibility(
              previousTeacher.employmentInfo.responsibilities,
              classId
            );
          previousTeacher.assignedClassIds = normalizeAssignedClassIds(
            previousTeacher.assignedClassIds,
            classId,
            "remove"
          );
          previousTeacher.markModified("employmentInfo");
          await previousTeacher.save();
        }
      }

      const assignment = await ClassHeadAssignment.findOneAndUpdate(
        { classId },
        {
          classId,
          grade,
          section,
          headTeacher: teacher._id,
          headTeacherName: teacherDisplayName,
          headTeacherEmail: teacher.email,
          updatedBy: req.user?._id,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.json({
        success: true,
        message: `Assigned ${teacherDisplayName} to class ${grade}${section}`,
        data: {
          assignment: {
            classId: assignment.classId,
            grade: assignment.grade,
            section: assignment.section,
            headTeacherId: teacher._id.toString(),
            headTeacherName: assignment.headTeacherName,
            headTeacherEmail: assignment.headTeacherEmail,
          },
        },
      });
    } catch (error: any) {
      console.error("Assign head teacher error:", error);
      res.status(500).json({
        success: false,
        message: "Server error assigning head teacher",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

export default router;
