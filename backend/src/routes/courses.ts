import express from "express";
import Course from "../models/Course";

const router = express.Router();

// Public endpoint to list courses by grade (and optional stream)
// GET /api/courses?grade=9[&stream=natural|social]
router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    const gradeNum = Number(req.query.grade);
    if (![9, 10, 11, 12].includes(gradeNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing grade. Expected 9,10,11,12.",
      });
    }

    const filter: any = { grade: gradeNum };
    const stream = (req.query.stream as string | undefined)?.trim();
    if ((gradeNum === 11 || gradeNum === 12) && stream) {
      filter.$or = [{ isCommon: true }, { stream }];
    } else if (stream) {
      filter.stream = stream;
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: { courses } });
  } catch (error: any) {
    console.error("Public list courses error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error retrieving courses" });
  }
});

export default router;
