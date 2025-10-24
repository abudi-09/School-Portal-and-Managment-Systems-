import { Router, Request, Response } from "express";
import ExamSchedule from "../models/ExamSchedule";
import { authMiddleware, authorizeRoles } from "../middleware/auth";

const router = Router();

function isOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart; // HH:mm compare
}

// Create
router.post(
  "/",
  authMiddleware,
  authorizeRoles("head"),
  async (req: Request, res: Response) => {
    try {
      const {
        grade,
        date,
        startTime,
        endTime,
        subject,
        type,
        invigilator,
        room,
      } = req.body as {
        grade: string;
        date: string | Date;
        startTime: string;
        endTime: string;
        subject: string;
        type: string;
        invigilator?: string;
        room?: string;
      };

      if (!grade || !date || !startTime || !endTime || !subject || !type) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }
      if (endTime <= startTime) {
        return res
          .status(400)
          .json({ success: false, message: "endTime must be after startTime" });
      }

      const d = new Date(date);
      const existing = await ExamSchedule.find({ grade, date: d });
      const conflict = existing.find((e) =>
        isOverlap(startTime, endTime, e.startTime, e.endTime)
      );
      if (conflict) {
        return res
          .status(409)
          .json({
            success: false,
            message: "Overlapping exam for this grade/date",
          });
      }

      const created = await ExamSchedule.create({
        grade,
        date: d,
        startTime,
        endTime,
        subject,
        type,
        invigilator,
        room,
        createdBy: String(req.user!._id),
      });
      return res
        .status(201)
        .json({ success: true, data: { schedule: created } });
    } catch (err: any) {
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// List (any role view)
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { grade, date } = req.query as { grade?: string; date?: string };
    const filter: Record<string, any> = {};
    if (grade) filter.grade = grade;
    if (date) filter.date = new Date(date);
    const items = await ExamSchedule.find(filter).sort({
      date: 1,
      startTime: 1,
    });
    return res.json({ success: true, data: { schedules: items } });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Update
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("head"),
  async (req: Request, res: Response) => {
    try {
      const item = await ExamSchedule.findById(req.params.id);
      if (!item)
        return res.status(404).json({ success: false, message: "Not found" });

      const proposed = {
        grade: (req.body.grade ?? item.grade) as string,
        date: new Date((req.body.date ?? item.date) as string | Date),
        startTime: (req.body.startTime ?? item.startTime) as string,
        endTime: (req.body.endTime ?? item.endTime) as string,
      };
      if (proposed.endTime <= proposed.startTime) {
        return res
          .status(400)
          .json({ success: false, message: "endTime must be after startTime" });
      }
      const existing = await ExamSchedule.find({
        grade: proposed.grade,
        date: proposed.date,
        _id: { $ne: item._id },
      });
      const conflict = existing.find((e) =>
        isOverlap(proposed.startTime, proposed.endTime, e.startTime, e.endTime)
      );
      if (conflict) {
        return res
          .status(409)
          .json({
            success: false,
            message: "Overlapping exam for this grade/date",
          });
      }

      Object.assign(item, req.body);
      await item.save();
      return res.json({ success: true, data: { schedule: item } });
    } catch (err: any) {
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// Delete
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("head"),
  async (req: Request, res: Response) => {
    try {
      const item = await ExamSchedule.findById(req.params.id);
      if (!item)
        return res.status(404).json({ success: false, message: "Not found" });
      await item.deleteOne();
      return res.json({ success: true });
    } catch (err: any) {
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

export default router;
