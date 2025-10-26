import { Router } from "express";
import {
  getAnnouncements,
  markRead,
  markReadBulk,
  getUnreadCount,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcement.controller";
import {
  authMiddleware,
  optionalAuth,
  authorizeRoles,
} from "../middleware/auth";

const router = Router();

// List announcements with pagination; optional auth so we can compute isRead for logged-in users
router.get("/", optionalAuth, getAnnouncements);

// Mark single announcement as read
router.put("/:id/mark-read", authMiddleware, markRead);

// Bulk mark as read
router.put("/mark-read-bulk", authMiddleware, markReadBulk);

// Combined unread count
router.get("/unread-count", optionalAuth, getUnreadCount);

// Create announcement: teachers can post teacher type; head/admin can post both
router.post(
  "/",
  authMiddleware,
  authorizeRoles("teacher", "head", "admin"),
  createAnnouncement
);

// Update announcement: admin/head or owner teacher
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("teacher", "head", "admin"),
  updateAnnouncement
);

// Delete/archive announcement: admin/head or owner teacher
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("teacher", "head", "admin"),
  deleteAnnouncement
);

export default router;
