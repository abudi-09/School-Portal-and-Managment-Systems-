import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/auth";
import User from "../models/User";
import ClassHeadAssignment from "../models/ClassHeadAssignment";
import ClassFinalResult from "../models/ClassFinalResult";
import ClassSubjectAssignment from "../models/ClassSubjectAssignment";
import Evaluation from "../models/Evaluation";
import Course from "../models/Course";

const router = express.Router();

// GET /api/teacher/students?grade=11&section=A
// Lists students in a specific class (grade+section)
router.get(
  "/students",
  authMiddleware,
  authorizeRoles("teacher", "head", "admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const grade = String(req.query.grade || "")
        .trim()
        .toUpperCase();
      const section = String(req.query.section || "")
        .trim()
        .toUpperCase();
      if (!grade || !section) {
        return res
          .status(400)
          .json({ success: false, message: "grade and section are required" });
      }
      const students = await User.find({
        role: "student",
        isActive: true,
        status: "approved",
        "academicInfo.grade": grade,
        "academicInfo.section": section,
      })
        .select("firstName lastName academicInfo.studentId _id")
        .sort({ "academicInfo.studentId": 1, lastName: 1 });

      return res.json({
        success: true,
        data: {
          students: students.map((s) => ({
            id: s._id.toString(),
            name: `${s.firstName} ${s.lastName}`.trim(),
            rollNo: s.academicInfo?.studentId || "",
          })),
        },
      });
    } catch (error: any) {
      console.error("Teacher list students error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error retrieving students",
      });
    }
  }
);

// POST /api/teacher/class-results/:classId/submit
// Submits compiled rankings for approval (must be head-of-class for classId)
router.post(
  "/class-results/:classId/submit",
  authMiddleware,
  authorizeRoles("teacher", "admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const raw = String(req.params.classId || "");
      const classId = raw.trim().toLowerCase();
      if (!classId) {
        return res
          .status(400)
          .json({ success: false, message: "classId is required" });
      }

      // Ensure this teacher is the assigned head for the class
      const asg = await ClassHeadAssignment.findOne({ classId });
      if (!asg) {
        return res
          .status(403)
          .json({ success: false, message: "No head assignment for class" });
      }
      const userId = (req.user as any)?._id?.toString();
      if (!userId || asg.headTeacher.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not the head teacher for this class",
        });
      }

      const payload = req.body as {
        grade: string;
        section: string;
        rankings: Array<{
          studentId: string;
          studentName: string;
          rollNo?: string;
          total: number;
          average: number;
          rank: number;
          subjectScores: Array<{
            courseId: string;
            courseName: string;
            score: number;
          }>;
        }>;
      };
      if (!payload?.rankings || !Array.isArray(payload.rankings)) {
        return res.status(400).json({
          success: false,
          message: "rankings array is required",
        });
      }

      const doc = await ClassFinalResult.findOneAndUpdate(
        { classId },
        {
          classId,
          grade: payload.grade,
          section: payload.section,
          status: "submitted",
          submittedBy: userId,
          submittedAt: new Date(),
          rankings: payload.rankings,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return res.json({
        success: true,
        message: "Class results submitted for approval",
        data: {
          final: {
            classId: doc.classId,
            status: doc.status,
            submittedAt: doc.submittedAt,
          },
        },
      });
    } catch (error: any) {
      console.error("Teacher submit class results error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error submitting class results",
      });
    }
  }
);

// GET /api/teacher/my-head-class -> returns the (single) class where requester is assigned head-of-class
router.get(
  "/my-head-class",
  authMiddleware,
  authorizeRoles("teacher", "admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req.user as any)?._id?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const asg = await ClassHeadAssignment.findOne({ headTeacher: userId }).lean();
      if (!asg) {
        return res.status(404).json({ success: false, message: "No head-of-class assignment" });
      }
      return res.json({
        success: true,
        data: { classId: asg.classId, grade: asg.grade, section: asg.section },
      });
    } catch (error: any) {
      console.error("Get my-head-class error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error retrieving head class" });
    }
  }
);

// POST /api/teacher/subject-scores/submit
// Subject teacher submits scores for their subject for a given class (grade+section)
router.post(
  "/subject-scores/submit",
  authMiddleware,
  authorizeRoles("teacher", "admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req.user as any)?._id?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const {
        grade,
        section,
        courseId,
        evaluationType = "final",
        scores,
      }: {
        grade: string;
        section: string;
        courseId: string;
        evaluationType?: string;
        scores: Array<{ studentId: string; score: number; maxScore?: number }>;
      } = req.body || {};

      if (!grade || !section || !courseId || !Array.isArray(scores)) {
        return res.status(400).json({
          success: false,
          message: "grade, section, courseId and scores[] are required",
        });
      }

      const classId = `${String(grade).trim().toUpperCase()}${String(section)
        .trim()
        .toUpperCase()}`;

      // Resolve course and subject name
      const course = await Course.findById(courseId).lean();
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      // Verify this teacher is assigned to teach this subject for this class
      const subjectAssignment = await (ClassSubjectAssignment as any).findOne({
        classId,
        subject: course.name,
      }).lean();
      if (!subjectAssignment) {
        return res.status(403).json({
          success: false,
          message: "No subject assignment found for this class and course",
        });
      }
      if (subjectAssignment.teacher.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not the assigned teacher for this subject/class",
        });
      }

      // Normalize scores and validate
      const normalized = scores
        .filter((s) => s && s.studentId)
        .map((s) => ({
          studentId: String(s.studentId),
          score: Number(s.score),
          maxScore: Number(s.maxScore ?? 100) || 100,
        }))
        .filter((s) => !Number.isNaN(s.score) && s.score >= 0);

      if (normalized.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid scores provided",
        });
      }

      const studentIds = normalized.map((s) => s.studentId);

      // Remove existing evaluations by this teacher for this class+course for these students and type
      await Evaluation.deleteMany({
        teacherId: userId,
        classId,
        courseId,
        evaluationType,
        studentId: { $in: studentIds },
      });

      // Bulk insert
      const docs = normalized.map((s) => ({
        studentId: s.studentId,
        teacherId: userId,
        classId,
        courseId,
        evaluationType,
        score: s.score,
        maxScore: s.maxScore,
        date: new Date(),
      }));
      await Evaluation.insertMany(docs);

      // Implicitly "sent" to head-of-class: scores are now queryable by classId for head teacher
      return res.json({
        success: true,
        message: "Subject scores submitted and available to head-of-class",
        data: { classId, course: { id: courseId, name: course.name }, count: docs.length },
      });
    } catch (error: any) {
      console.error("Submit subject scores error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error submitting scores" });
    }
  }
);

// GET /api/teacher/class-scores?grade=11&section=A[&courseId=...] (head-of-class only)
router.get(
  "/class-scores",
  authMiddleware,
  authorizeRoles("teacher", "admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req.user as any)?._id?.toString();
      const grade = String(req.query.grade || "").trim().toUpperCase();
      const section = String(req.query.section || "").trim().toUpperCase();
      const courseId = req.query.courseId
        ? String(req.query.courseId).trim()
        : undefined;
      if (!grade || !section) {
        return res
          .status(400)
          .json({ success: false, message: "grade and section are required" });
      }
      const classId = `${grade}${section}`;

      // Ensure requester is the head-of-class for this class
      const asg = await ClassHeadAssignment.findOne({ classId });
      if (!asg) {
        return res
          .status(403)
          .json({ success: false, message: "No head assignment for class" });
      }
      if (!userId || asg.headTeacher.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not the head teacher for this class",
        });
      }

      const filter: any = { classId };
      if (courseId) filter.courseId = courseId;
      const evaluations = await Evaluation.find(filter).lean();

      // Group by courseId
      const byCourse = new Map<string, { courseId: string; scores: Array<{ studentId: string; score: number; maxScore: number }> }>();
      for (const ev of evaluations) {
        const key = ev.courseId || "unknown";
        if (!byCourse.has(key)) {
          byCourse.set(key, { courseId: key, scores: [] });
        }
        byCourse.get(key)!.scores.push({
          studentId: ev.studentId,
          score: ev.score,
          maxScore: ev.maxScore,
        });
      }

      // Optionally attach course names
      const result = await Promise.all(
        Array.from(byCourse.values()).map(async (grp) => {
          const crs = grp.courseId ? await Course.findById(grp.courseId).lean() : null;
          return { courseId: grp.courseId, courseName: crs?.name || "", scores: grp.scores };
        })
      );

      return res.json({ success: true, data: { classId, evaluations: result } });
    } catch (error: any) {
      console.error("Head-of-class list class scores error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error retrieving scores" });
    }
  }
);

export default router;
