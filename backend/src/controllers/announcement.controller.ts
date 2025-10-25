import { Request, Response } from "express";
import Announcement, { IAnnouncement } from "../models/Announcement";
import UserAnnouncementRead from "../models/UserAnnouncementRead";

type ListQuery = {
	type?: "school" | "teacher";
	page?: string;
	pageSize?: string;
};

export const getAnnouncements = async (req: Request, res: Response) => {
	try {
		const { type, page = "1", pageSize = "6" } = req.query as ListQuery;
		const pageNum = Math.max(parseInt(page || "1", 10) || 1, 1);
		const limit = Math.max(parseInt(pageSize || "6", 10) || 6, 1);
		const skip = (pageNum - 1) * limit;

		const filter: Record<string, unknown> = {};
		if (type) filter.type = type;

		const [items, total] = await Promise.all([
			Announcement.find(filter)
				.sort({ date: -1, createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean<IAnnouncement[]>(),
			Announcement.countDocuments(filter),
		]);

		let readMap = new Set<string>();
		let unreadCount = 0;

		if (req.user) {
			const ids = items.map((i) => i._id);
			const reads = await UserAnnouncementRead.find({
				user: req.user._id,
				announcement: { $in: ids },
			})
				.select("announcement")
				.lean();
			readMap = new Set(reads.map((r: any) => String(r.announcement)));

			// Compute unreadCount for the current filter for this user
			const allIds = await Announcement.find(filter).select("_id").lean();
			const readAll = await UserAnnouncementRead.find({
				user: req.user._id,
				announcement: { $in: allIds.map((a) => a._id) },
			})
				.select("announcement")
				.lean();
			const readAllSet = new Set(readAll.map((r: any) => String(r.announcement)));
			unreadCount = allIds.filter((a: any) => !readAllSet.has(String(a._id))).length;
		} else {
			// For unauthenticated requests, treat as all unread
			unreadCount = total;
		}

		const itemsWithRead = items.map((i: any) => ({
			...i,
			isRead: req.user ? readMap.has(String(i._id)) : false,
		}));

		res.json({
			success: true,
			data: { items: itemsWithRead, total, unreadCount },
		});
	} catch (error: any) {
		console.error("getAnnouncements error", error);
		res.status(500).json({ success: false, message: "Failed to fetch announcements" });
	}
};

export const markRead = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		if (!req.user) {
			return res.status(401).json({ success: false, message: "Authentication required" });
		}

		await UserAnnouncementRead.updateOne(
			{ user: req.user._id, announcement: id },
			{ $set: { readAt: new Date() } },
			{ upsert: true }
		);

		res.json({ success: true });
	} catch (error) {
		console.error("markRead error", error);
		res.status(500).json({ success: false, message: "Failed to mark as read" });
	}
};

export const markReadBulk = async (req: Request, res: Response) => {
	try {
		const { ids } = req.body as { ids: string[] };
		if (!req.user) {
			return res.status(401).json({ success: false, message: "Authentication required" });
		}
		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(400).json({ success: false, message: "ids array required" });
		}

		const ops = ids.map((id) => ({
			updateOne: {
				filter: { user: req.user!._id, announcement: id },
				update: { $set: { readAt: new Date() } },
				upsert: true,
			},
		}));
		await UserAnnouncementRead.bulkWrite(ops);

		res.json({ success: true });
	} catch (error) {
		console.error("markReadBulk error", error);
		res.status(500).json({ success: false, message: "Failed to mark announcements as read" });
	}
};

export const getUnreadCount = async (req: Request, res: Response) => {
	try {
		if (!req.user) {
			// If not authenticated, everything is unread but we cannot compute efficiently
			const total = await Announcement.countDocuments({});
			return res.json({ success: true, data: { unreadCount: total } });
		}

		const allIds = await Announcement.find({}).select("_id").lean();
		const readAll = await UserAnnouncementRead.find({
			user: req.user._id,
			announcement: { $in: allIds.map((a) => a._id) },
		})
			.select("announcement")
			.lean();
		const readAllSet = new Set(readAll.map((r: any) => String(r.announcement)));
		const unread = allIds.filter((a: any) => !readAllSet.has(String(a._id))).length;

		res.json({ success: true, data: { unreadCount: unread } });
	} catch (error) {
		console.error("getUnreadCount error", error);
		res.status(500).json({ success: false, message: "Failed to get unread count" });
	}
};

