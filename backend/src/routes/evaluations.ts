import { Router, Request, Response } from "express";
import Evaluation from "../models/Evaluation";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Create evaluation (teacher only)
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== "teacher") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only teachers can create evaluations",
        });
    }

    const {
      studentId,
      evaluationType,
      score,
      maxScore,
      comment,
      date,
      classId,
      courseId,
    } = req.body as {
      studentId: string;
      evaluationType: string;
      score: number;
      maxScore: number;
      comment?: string;
      date?: string | Date;
      classId?: string;
      courseId?: string;
    };

    if (
      !studentId ||
      !evaluationType ||
      score === undefined ||
      maxScore === undefined
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    if (maxScore <= 0 || score < 0 || score > maxScore) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid score/maxScore" });
    }

    const evaluation = await Evaluation.create({
      studentId,
      teacherId: String(user._id),
      classId,
      courseId,
      evaluationType,
      score,
      maxScore,
      comment,
      date: date ? new Date(date) : new Date(),
    });

    return res.status(201).json({ success: true, data: { evaluation } });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// List evaluations (role-based scoping)
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { classId, courseId, evaluationType, studentId, teacherId } =
      req.query as Record<string, string | undefined>;

    const filter: Record<string, any> = {};
    if (classId) filter.classId = classId;
    if (courseId) filter.courseId = courseId;
    if (evaluationType) filter.evaluationType = evaluationType;

    if (user.role === "teacher") {
      filter.teacherId = String(user._id);
      if (studentId) filter.studentId = studentId;
    } else if (user.role === "student") {
      filter.studentId = String(user._id);
    } else if (user.role === "admin" || user.role === "head") {
      if (teacherId) filter.teacherId = teacherId;
      if (studentId) filter.studentId = studentId;
    }

    const evaluations = await Evaluation.find(filter).sort({
      date: -1,
      createdAt: -1,
    });
    return res.json({ success: true, data: { evaluations } });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Get by id (teacher owner, student subject, or admin/head)
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const ev = await Evaluation.findById(req.params.id);
    if (!ev)
      return res.status(404).json({ success: false, message: "Not found" });

    const isOwnerTeacher =
      user.role === "teacher" && String(ev.teacherId) === String(user._id);
    const isStudentSelf =
      user.role === "student" && String(ev.studentId) === String(user._id);
    const isElevated = user.role === "admin" || user.role === "head";
    if (!isOwnerTeacher && !isStudentSelf && !isElevated) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.json({ success: true, data: { evaluation: ev } });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Update (teacher owner only)
router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== "teacher")
      return res.status(403).json({ success: false, message: "Forbidden" });
    const ev = await Evaluation.findById(req.params.id);
    if (!ev)
      return res.status(404).json({ success: false, message: "Not found" });
    if (String(ev.teacherId) !== String(user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const {
      studentId,
      evaluationType,
      score,
      maxScore,
      comment,
      date,
      classId,
      courseId,
    } = req.body as Partial<{
      studentId: string;
      evaluationType: string;
      score: number;
      maxScore: number;
      comment?: string;
      date?: string | Date;
      classId?: string;
      courseId?: string;
    }>;

    if (score !== undefined || maxScore !== undefined) {
      const s = score ?? ev.score;
      const m = maxScore ?? ev.maxScore;
      if (m <= 0 || s < 0 || s > m) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid score/maxScore" });
      }
    }

    if (studentId !== undefined) ev.studentId = studentId;
    if (evaluationType !== undefined) ev.evaluationType = evaluationType;
    if (score !== undefined) ev.score = score;
    if (maxScore !== undefined) ev.maxScore = maxScore;
    if (comment !== undefined) ev.comment = comment;
    if (date !== undefined) ev.date = new Date(date);
    if (classId !== undefined) ev.classId = classId;
    if (courseId !== undefined) ev.courseId = courseId;

    await ev.save();
    return res.json({ success: true, data: { evaluation: ev } });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Delete (teacher owner only)
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== "teacher")
      return res.status(403).json({ success: false, message: "Forbidden" });
    const ev = await Evaluation.findById(req.params.id);
    if (!ev)
      return res.status(404).json({ success: false, message: "Not found" });
    if (String(ev.teacherId) !== String(user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    await ev.deleteOne();
    return res.json({ success: true });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

export default router;
