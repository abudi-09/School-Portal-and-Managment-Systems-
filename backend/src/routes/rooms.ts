import express, { Request, Response } from "express";
import Room from "../models/Room";
import { authMiddleware, authorizeRoles } from "../middleware/auth";

const router = express.Router();

// List rooms
router.get(
  "/",
  authMiddleware,
  authorizeRoles("head"),
  async (_req: Request, res: Response) => {
    try {
      const rooms = await Room.find().sort({ name: 1 }).lean();
      res.json({ success: true, data: { rooms } });
    } catch (err: any) {
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// Create room
router.post(
  "/",
  authMiddleware,
  authorizeRoles("head"),
  async (req: Request, res: Response) => {
    try {
      const { name, capacity, active } = req.body as {
        name: string;
        capacity?: number;
        active?: boolean;
      };
      if (!name) {
        return res
          .status(400)
          .json({ success: false, message: "Room name is required" });
      }
      const exists = await Room.findOne({ name });
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: "Room with this name already exists" });
      }
      const room = await Room.create({
        name,
        capacity,
        active: active ?? true,
        createdBy: String(req.user!._id),
      });
      res.status(201).json({ success: true, data: { room } });
    } catch (err: any) {
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// Update room
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("head"),
  async (req: Request, res: Response) => {
    try {
      const { name, capacity, active } = req.body as {
        name?: string;
        capacity?: number;
        active?: boolean;
      };
      const room = await Room.findById(req.params.id);
      if (!room) return res.status(404).json({ success: false, message: "Not found" });

      if (name && name !== room.name) {
        const exists = await Room.findOne({ name });
        if (exists) {
          return res
            .status(409)
            .json({ success: false, message: "Room with this name already exists" });
        }
      }
      if (name !== undefined) room.name = name;
      if (capacity !== undefined) room.capacity = capacity;
      if (active !== undefined) room.active = active;
      await room.save();
      res.json({ success: true, data: { room } });
    } catch (err: any) {
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

// Delete room
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("head"),
  async (req: Request, res: Response) => {
    try {
      const room = await Room.findById(req.params.id);
      if (!room) return res.status(404).json({ success: false, message: "Not found" });
      await room.deleteOne();
      res.json({ success: true });
    } catch (err: any) {
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  }
);

export default router;
