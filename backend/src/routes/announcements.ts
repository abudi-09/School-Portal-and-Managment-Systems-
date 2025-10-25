import { Router } from "express";
import { getAnnouncements, markRead, markReadBulk, getUnreadCount } from "../controllers/announcement.controller";
import { authMiddleware, optionalAuth } from "../middleware/auth";

const router = Router();

// List announcements with pagination; optional auth so we can compute isRead for logged-in users
router.get("/", optionalAuth, getAnnouncements);

// Mark single announcement as read
router.put("/:id/mark-read", authMiddleware, markRead);

// Bulk mark as read
router.put("/mark-read-bulk", authMiddleware, markReadBulk);

// Combined unread count
router.get("/unread-count", optionalAuth, getUnreadCount);

export default router;

