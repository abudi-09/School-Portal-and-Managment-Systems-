import { Router, Request, Response } from "express";
import ClassSchedule from "../models/ClassSchedule";
import { authMiddleware, authorizeRoles } from "../middleware/auth";

const router = Router();

// Helper: check time overlap
function isOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart; // string compare works for HH:mm
}

// Create
router.post(
  "/",
  authMiddleware,
  authorizeRoles("head"),
  async (req: Request, res: Response) => {
    try {
      const { section, day, startTime, endTime, subject, teacherId, room } =
        req.body as {
          section: string;
          day: string;
          startTime: string;
          endTime: string;
          subject: string;
          teacherId?: string;
          room?: string;
        };

      if (!section || !day || !startTime || !endTime || !subject) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }
      if (endTime <= startTime) {
        return res
          .status(400)
          .json({ success: false, message: "endTime must be after startTime" });
      }

      // Prevent overlap within same section + day
      const existing = await ClassSchedule.find({ section, day });
      const conflict = existing.find((e) =>
        isOverlap(startTime, endTime, e.startTime, e.endTime)
      );
      if (conflict) {
        return res
          .status(409)
          .json({
            success: false,
            message: "Overlapping schedule for this section and day",
          });
      }

      const created = await ClassSchedule.create({
        section,
        day,
        startTime,
        endTime,
        subject,
        teacherId,
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

// List (any role can view)
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { section, day } = req.query as { section?: string; day?: string };
    const filter: Record<string, any> = {};
    if (section) filter.section = section;
    if (day) filter.day = day;
    const items = await ClassSchedule.find(filter).sort({
      day: 1,
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
      const item = await ClassSchedule.findById(req.params.id);
      if (!item)
        return res.status(404).json({ success: false, message: "Not found" });

      const {
        section = item.section,
        day = item.day,
        startTime = item.startTime,
        endTime = item.endTime,
      } = req.body || {};
      if (endTime <= startTime) {
        return res
          .status(400)
          .json({ success: false, message: "endTime must be after startTime" });
      }
      // Check overlap excluding current item
      const existing = await ClassSchedule.find({
        section,
        day,
        _id: { $ne: item._id },
      });
      const conflict = existing.find((e) =>
        isOverlap(startTime, endTime, e.startTime, e.endTime)
      );
      if (conflict) {
        return res
          .status(409)
          .json({
            success: false,
            message: "Overlapping schedule for this section and day",
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
      const item = await ClassSchedule.findById(req.params.id);
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
