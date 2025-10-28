import express from "express";
import { body, param, validationResult } from "express-validator";
import User, { type IUser } from "../models/User";
import ClassHeadAssignment from "../models/ClassHeadAssignment";
import ClassSubjectAssignment from "../models/ClassSubjectAssignment";
import { authMiddleware, authorizeRoles } from "../middleware/auth";
import { ApprovalService } from "../services/approval.service";
import Course from "../models/Course";
import { env } from "../config/env";
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog";

const router = express.Router();

const HEAD_RESPONSIBILITY_PREFIX = "HeadClass:";
const SUBJECT_RESPONSIBILITY_PREFIX = "SubjectTeacher:"; // SubjectTeacher:<classId>:<subject>

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

const addSubjectResponsibility = (
  value: string | undefined | null,
  classId: string,
  subject: string
) => {
  const fragment = `${SUBJECT_RESPONSIBILITY_PREFIX}${classId}:${subject}`;
  const entries = splitResponsibilities(value).filter(
    (item) => item !== fragment
  );
  entries.push(fragment);
  return joinResponsibilities(entries);
};

const removeSubjectResponsibility = (
  value: string | undefined | null,
  classId: string,
  subject: string
) => {
  const fragment = `${SUBJECT_RESPONSIBILITY_PREFIX}${classId}:${subject}`;
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

// Policy toggles (from env/config)
const ALLOW_MULTI_HEAD_ASSIGNMENTS = env.policy.allowMultiClassHead;
const ALLOW_TEACHER_MULTI_SUBJECTS = env.policy.allowTeacherMultiSubjects;
const ALLOW_TEACHER_MULTI_SECTIONS = env.policy.allowTeacherMultiSections;

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

      const filter: Record<string, unknown> = {
        role: "teacher",
        status: "approved",
        isActive: true,
      };

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

// @route   GET /api/head/subject-assignments
// @desc    List subject teacher assignments for a class (or all)
// @access  Private/Head+Admin
router.get(
  "/subject-assignments",
  authMiddleware,
  authorizeRoles("head", "admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const classId = req.query.classId as string | undefined;
      const filter: Record<string, unknown> = {};
      if (classId) filter.classId = classId.toLowerCase();
      // Use `any` cast for the model to avoid TypeScript overload incompatibility
      const assignments = await (ClassSubjectAssignment as any)
        .find(filter)
        .sort({ grade: 1, section: 1 });
      res.json({
        success: true,
        data: {
          assignments: (assignments as any[]).map((a: any) => ({
            classId: a.classId,
            grade: a.grade,
            section: a.section,
            subject: a.subject,
            teacherId: a.teacher?.toString?.(),
            teacherName: a.teacherName,
            teacherEmail: a.teacherEmail,
          })),
        },
      });
    } catch (error: any) {
      console.error("Get subject assignments error:", error);
      res.status(500).json({
        success: false,
        message: "Server error retrieving subject assignments",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/head/subject-assignments/:classId
// @desc    Assign or reassign a subject teacher for a class
// @access  Private/Head+Admin
router.put(
  "/subject-assignments/:classId",
  authMiddleware,
  authorizeRoles("head", "admin"),
  [
    param("classId").notEmpty().withMessage("Class ID is required"),
    body("subject").notEmpty().withMessage("Subject is required"),
    body("teacherId").isMongoId().withMessage("Teacher ID must be valid"),
    body("confirmReassign").optional().isBoolean(),
    body("expectedCurrentTeacherId").optional().isString(),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const rawClassId = req.params.classId;
      const { subject, teacherId, confirmReassign, expectedCurrentTeacherId } =
        req.body as {
          subject: string;
          teacherId: string;
          confirmReassign?: boolean;
          expectedCurrentTeacherId?: string | null;
        };
      const { classId, grade, section } = parseClassIdentifier(rawClassId);

      const teacher = await User.findOne({
        _id: teacherId,
        role: "teacher",
        isActive: true,
      });
      if (!teacher) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found or inactive" });
      }

      // Validate subject is configured for this grade (from admin courses)
      const gradeNum = parseInt(grade, 10);
      if (!Number.isFinite(gradeNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid class grade parsed from classId",
        });
      }
      const gradeCourses = await Course.find({ grade: gradeNum }).select(
        "name"
      );
      const allowed = new Set(
        (gradeCourses as any[]).map((c: any) => c.name as string)
      );
      if (!allowed.has(subject)) {
        return res.status(400).json({
          success: false,
          message: `Subject '${subject}' is not configured for grade ${gradeNum}`,
        });
      }

      // Enforce optional subject/section policies for teacher
      if (!ALLOW_TEACHER_MULTI_SUBJECTS) {
        const otherSubject = await (ClassSubjectAssignment as any).findOne({
          teacher: teacher._id,
          subject: { $ne: subject },
        });
        if (otherSubject) {
          return res.status(400).json({
            success: false,
            message:
              "This teacher is already assigned to another subject and multiple subjects are not permitted by policy.",
          });
        }
      }

      if (!ALLOW_TEACHER_MULTI_SECTIONS) {
        const otherSectionForSubject = await (
          ClassSubjectAssignment as any
        ).findOne({
          teacher: teacher._id,
          subject,
          classId: { $ne: classId },
        });
        if (otherSectionForSubject) {
          return res.status(400).json({
            success: false,
            message:
              "This teacher is already assigned to the same subject in another section and multiple sections are not permitted by policy.",
          });
        }
      }

      // Find previous assignment (if any) for this class+subject
      const previous = await (ClassSubjectAssignment as any).findOne({
        classId,
        subject,
      });
      const previousTeacherId = previous?.teacher?.toString() ?? null;

      // CAS check (compare-and-swap): if client provided expectation and it doesn't match → conflict
      if (
        typeof expectedCurrentTeacherId !== "undefined" &&
        (expectedCurrentTeacherId || null) !== (previousTeacherId || null)
      ) {
        return res.status(409).json({
          success: false,
          code: "STALE_ASSIGNMENT",
          message:
            "Assignment conflict: mapping changed by another user. Please reload.",
          currentTeacherId: previousTeacherId,
        });
      }

      // If assigning same teacher → no-op
      if (previousTeacherId && previousTeacherId === teacherId) {
        return res.status(200).json({
          success: true,
          message:
            "No change: teacher already assigned for this subject and class.",
          data: {
            assignment: {
              classId,
              grade,
              section,
              subject,
              teacherId: previousTeacherId,
            },
          },
        });
      }

      // If replacing an existing teacher, require confirmReassign
      if (
        previousTeacherId &&
        previousTeacherId !== teacherId &&
        !confirmReassign
      ) {
        const prevTeacher = await User.findById(previousTeacherId);
        return res.status(409).json({
          success: false,
          code: "CONFIRM_REASSIGN",
          needsConfirmation: true,
          message: `Class ${grade}${section} currently has ${
            prevTeacher ? buildTeacherDisplayName(prevTeacher) : "a teacher"
          } for ${subject}. Confirmation required to reassign.`,
          currentTeacher: prevTeacher
            ? {
                _id: prevTeacher._id.toString(),
                fullName: buildTeacherDisplayName(prevTeacher),
                email: prevTeacher.email,
              }
            : { _id: previousTeacherId },
        });
      }

      const session = await mongoose.startSession();
      let responsePayload: any;
      await session.withTransaction(async () => {
        // Update new teacher responsibilities
        const freshNew = await User.findById(teacher._id).session(session);
        if (!freshNew)
          throw new Error("Teacher disappeared during transaction");
        freshNew.employmentInfo = freshNew.employmentInfo || {};
        freshNew.employmentInfo.responsibilities = addSubjectResponsibility(
          freshNew.employmentInfo.responsibilities,
          classId,
          subject
        );
        freshNew.assignedClassIds = normalizeAssignedClassIds(
          freshNew.assignedClassIds,
          classId,
          "add"
        );
        freshNew.markModified("employmentInfo");
        await freshNew.save({ session });

        // Update previous teacher if any and different
        if (previousTeacherId && previousTeacherId !== teacher._id.toString()) {
          const prevTeacherDoc = await User.findById(previousTeacherId).session(
            session
          );
          if (prevTeacherDoc) {
            prevTeacherDoc.employmentInfo = prevTeacherDoc.employmentInfo || {};
            prevTeacherDoc.employmentInfo.responsibilities =
              removeSubjectResponsibility(
                prevTeacherDoc.employmentInfo.responsibilities,
                classId,
                subject
              );
            prevTeacherDoc.assignedClassIds = normalizeAssignedClassIds(
              prevTeacherDoc.assignedClassIds,
              classId,
              "remove"
            );
            prevTeacherDoc.markModified("employmentInfo");
            await prevTeacherDoc.save({ session });
          }
        }

        // Upsert mapping
        const assignment = await (
          ClassSubjectAssignment as any
        ).findOneAndUpdate(
          { classId, subject },
          {
            classId,
            grade,
            section,
            subject,
            teacher: teacher._id,
            teacherName: buildTeacherDisplayName(teacher),
            teacherEmail: teacher.email,
            updatedBy: req.user?._id,
          },
          { new: true, upsert: true, setDefaultsOnInsert: true, session }
        );

        // Audit log
        await AuditLog.create(
          [
            {
              timestamp: new Date(),
              actorId: req.user?._id as any,
              actorName:
                (req.user as any)?.fullName || (req.user as any)?.email,
              classId,
              grade,
              section,
              subject,
              change:
                previousTeacherId && previousTeacherId !== teacherId
                  ? "reassign"
                  : "assign",
              fromTeacherId: previousTeacherId as any,
              fromTeacherName: previous?.teacherName,
              toTeacherId: teacher._id,
              toTeacherName: buildTeacherDisplayName(teacher),
            },
          ],
          { session }
        );

        responsePayload = {
          success: true,
          message:
            previousTeacherId && previousTeacherId !== teacherId
              ? `Reassigned ${subject} (${grade}${section}) to ${buildTeacherDisplayName(
                  teacher
                )}.`
              : `Assigned ${buildTeacherDisplayName(
                  teacher
                )} to ${subject} — ${grade}${section}.`,
          data: {
            assignment: {
              classId: assignment.classId,
              grade: assignment.grade,
              section: assignment.section,
              subject: assignment.subject,
              teacherId: assignment.teacher?.toString(),
              teacherName: assignment.teacherName,
            },
          },
        };
      });
      await session.endSession();
      return res.json(responsePayload);
    } catch (error: any) {
      console.error("Assign subject teacher error:", error);
      res.status(500).json({
        success: false,
        message: "Server error assigning subject teacher",
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
    body("confirmReassign").optional().isBoolean(),
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
      const { teacherId, confirmReassign } = req.body as {
        teacherId: string;
        confirmReassign?: boolean;
      };
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

      // Optional policy: prevent a teacher from heading multiple classes
      if (!ALLOW_MULTI_HEAD_ASSIGNMENTS) {
        const existingAsHead = await ClassHeadAssignment.findOne({
          headTeacher: teacher._id,
          classId: { $ne: classId },
        });
        if (existingAsHead) {
          return res.status(400).json({
            success: false,
            message:
              "This teacher is already assigned as head for another class.",
          });
        }
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

      // If a different head exists, require confirmation before reassignment
      if (
        previousTeacherId &&
        previousTeacherId !== teacherId &&
        !confirmReassign
      ) {
        // Return a 409 with the current head details to trigger client confirmation
        const currentHeadUser = await User.findById(previousTeacherId);
        return res.status(409).json({
          success: false,
          code: "CONFIRM_REASSIGN",
          needsConfirmation: true,
          message: `Class ${grade}${section} already has a head teacher. Confirmation required to reassign.`,
          currentHead: currentHeadUser
            ? {
                _id: currentHeadUser._id.toString(),
                fullName: buildTeacherDisplayName(currentHeadUser),
                email: currentHeadUser.email,
              }
            : {
                _id: previousTeacherId,
                fullName: previousAssignment?.headTeacherName,
                email: previousAssignment?.headTeacherEmail,
              },
        });
      }

      const session = await mongoose.startSession();
      let resultPayload: any;
      await session.withTransaction(async () => {
        const teacherDisplayName = buildTeacherDisplayName(teacher);

        // Update new head teacher responsibilities
        const freshNewHead = await User.findById(teacher._id).session(session);
        if (!freshNewHead)
          throw new Error("Teacher disappeared during transaction");
        freshNewHead.employmentInfo = freshNewHead.employmentInfo || {};
        freshNewHead.employmentInfo.responsibilities = addHeadResponsibility(
          freshNewHead.employmentInfo.responsibilities,
          classId
        );
        freshNewHead.assignedClassIds = normalizeAssignedClassIds(
          freshNewHead.assignedClassIds,
          classId,
          "add"
        );
        freshNewHead.markModified("employmentInfo");
        await freshNewHead.save({ session });

        // Update previous head if exists
        if (previousTeacherId && previousTeacherId !== teacherId) {
          const previousTeacher = await User.findById(
            previousTeacherId
          ).session(session);
          if (previousTeacher) {
            previousTeacher.employmentInfo =
              previousTeacher.employmentInfo || {};
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
            await previousTeacher.save({ session });
          }
        }

        // Upsert assignment snapshot
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
          { new: true, upsert: true, setDefaultsOnInsert: true, session }
        );

        // Write audit log
        await AuditLog.create(
          [
            {
              timestamp: new Date(),
              actorId: req.user?._id as any,
              actorName:
                (req.user as any)?.fullName || (req.user as any)?.email,
              classId,
              grade,
              section,
              change:
                previousTeacherId && previousTeacherId !== teacherId
                  ? "reassign"
                  : "assign",
              fromTeacherId: previousTeacherId as any,
              fromTeacherName: previousAssignment?.headTeacherName,
              toTeacherId: teacher._id,
              toTeacherName: teacherDisplayName,
              note: undefined,
            },
          ],
          { session }
        );

        resultPayload = {
          success: true,
          message:
            previousTeacherId && previousTeacherId !== teacherId
              ? `Reassigned: ${teacherDisplayName} is now Head — ${grade}${section}`
              : `Assigned ${teacherDisplayName} to class ${grade}${section}`,
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
        };
      });
      await session.endSession();
      return res.json(resultPayload);
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
