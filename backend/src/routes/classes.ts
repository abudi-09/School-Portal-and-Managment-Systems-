import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/auth";
import ClassModel from "../models/Class";

const router = express.Router();

// GET /api/classes
// Lists all classes with canonical identifiers
// Access: Head/Admin (can broaden later if needed)
router.get(
  "/",
  authMiddleware,
  authorizeRoles("head", "admin"),
  async (req: express.Request, res: express.Response) => {
    try {
      const classes = await ClassModel.find().sort({ grade: 1, section: 1 });
      res.json({
        success: true,
        data: {
          classes: classes.map((c) => ({
            classId: c.classId,
            grade: c.grade,
            section: c.section,
            name: c.name,
            updatedAt: c.updatedAt,
          })),
        },
      });
    } catch (error: any) {
      console.error("Get classes error:", error);
      res.status(500).json({
        success: false,
        message: "Server error retrieving classes",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

export default router;
