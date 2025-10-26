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

    const filter: Record<string, unknown> = { archived: { $ne: true } };
    // If caller requests the "teacher" stream and the requester is a teacher,
    // include both teacher and school announcements that are visible to teachers.
    // If caller asked for a specific stream type, apply it.
    // Special-case: when a logged-in teacher requests the "teacher" stream,
    // include both 'teacher' and 'school' announcement types so Head/School-level
    // announcements (type: 'school') are visible to teachers as well.
    // If the request is unauthenticated and includes type=teacher, ignore the
    // type filter so unauthenticated users still only see audience.scope='all'.
    if (type) {
      if (type === "teacher") {
        if (req.user && req.user.role === "teacher") {
          filter.type = { $in: ["teacher", "school"] };
        } else if (!req.user) {
          // Ignore type=teacher for unauthenticated callers to avoid
          // returning an empty set (they should only see audience.scope='all').
        } else {
          // Authenticated non-teachers (head/admin) requested teacher stream;
          // honor the explicit request and filter to teacher-type only.
          filter.type = "teacher";
        }
      } else {
        filter.type = type;
      }
    }

    // Apply simple role-based visibility using audience
    if (req.user) {
      const role = req.user.role;
      if (role === "student") {
        const ai = req.user.academicInfo as any;
        const studentClass =
          ai?.class ||
          (ai?.grade && ai?.section ? `${ai.grade}-${ai.section}` : undefined);
        filter.$or = [
          { "audience.scope": "all" },
          { "audience.scope": "students" },
          ...(studentClass
            ? [{ "audience.scope": "class", "audience.classId": studentClass }]
            : []),
        ];
      } else if (role === "teacher") {
        // Teachers see: ALL, TEACHERS, CLASS where they teach, and their own posts
        const teacherClassIds: string[] =
          (req.user as any).assignedClassIds || [];
        const classClause = teacherClassIds.length
          ? [
              {
                "audience.scope": "class",
                "audience.classId": { $in: teacherClassIds },
              },
            ]
          : [];
        filter.$or = [
          { "audience.scope": "all" },
          { "audience.scope": "teachers" },
          ...classClause,
          { "postedBy.user": req.user._id },
        ];
      } else {
        // admin/head see all
      }
    } else {
      // Unauthenticated users: only 'all' audience
      filter["audience.scope"] = "all";
    }

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
      const readAllSet = new Set(
        readAll.map((r: any) => String(r.announcement))
      );
      unreadCount = allIds.filter(
        (a: any) => !readAllSet.has(String(a._id))
      ).length;
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
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch announcements" });
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
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
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "ids array required" });
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
    res.status(500).json({
      success: false,
      message: "Failed to mark announcements as read",
    });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      // If not authenticated, everything is unread but we cannot compute efficiently
      const total = await Announcement.countDocuments({
        archived: { $ne: true },
      });
      return res.json({ success: true, data: { unreadCount: total } });
    }

    const baseFilter: Record<string, any> = { archived: { $ne: true } };
    const role = req.user.role;
    if (role === "student") {
      const ai = req.user.academicInfo as any;
      const studentClass =
        ai?.class ||
        (ai?.grade && ai?.section ? `${ai.grade}-${ai.section}` : undefined);
      baseFilter.$or = [
        { "audience.scope": "all" },
        { "audience.scope": "students" },
        ...(studentClass
          ? [{ "audience.scope": "class", "audience.classId": studentClass }]
          : []),
      ];
    } else if (role === "teacher") {
      const teacherClassIds: string[] =
        (req.user as any).assignedClassIds || [];
      const classClause = teacherClassIds.length
        ? [
            {
              "audience.scope": "class",
              "audience.classId": { $in: teacherClassIds },
            },
          ]
        : [];
      baseFilter.$or = [
        { "audience.scope": "all" },
        { "audience.scope": "teachers" },
        ...classClause,
        { "postedBy.user": req.user._id },
      ];
    }

    const allIds = await Announcement.find(baseFilter).select("_id").lean();
    const readAll = await UserAnnouncementRead.find({
      user: req.user._id,
      announcement: { $in: allIds.map((a) => a._id) },
    })
      .select("announcement")
      .lean();
    const readAllSet = new Set(readAll.map((r: any) => String(r.announcement)));
    const unread = allIds.filter(
      (a: any) => !readAllSet.has(String(a._id))
    ).length;

    res.json({ success: true, data: { unreadCount: unread } });
  } catch (error) {
    console.error("getUnreadCount error", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get unread count" });
  }
};

// Create announcement
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const { title, message, type, attachments, audience, date } = req.body as {
      title: string;
      message: string;
      type: "school" | "teacher";
      attachments?: {
        filename: string;
        url: string;
        mimeType?: string;
        size?: number;
      }[];
      audience?: { scope?: string; classId?: string };
      date?: string | Date;
    };

    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: "title, message and type are required",
      });
    }

    // Teachers can only create 'teacher' announcements
    if (req.user.role === "teacher" && type !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Teachers can only post teacher announcements",
      });
    }

    const aud = {
      scope: (audience?.scope as any) || "all",
      classId: audience?.classId,
    } as any;
    if (aud.scope === "class" && !aud.classId) {
      return res.status(400).json({
        success: false,
        message: "classId is required when scope=class",
      });
    }

    const doc = await Announcement.create({
      title,
      message,
      type,
      date: date ? new Date(date) : new Date(),
      attachments: attachments || [],
      audience: aud,
      postedBy: {
        user: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`.trim(),
        role: req.user.role,
      },
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error("createAnnouncement error", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create announcement" });
  }
};

// Update announcement (admin/head or owner teacher)
export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const { id } = req.params;
    const doc = await Announcement.findById(id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    }

    // Ownership/role check
    const isOwner = String(doc.postedBy.user) === String(req.user._id);
    const canManage =
      req.user.role === "admin" ||
      req.user.role === "head" ||
      (req.user.role === "teacher" && isOwner);
    if (!canManage) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { title, message, type, attachments, audience, date, archived } =
      req.body as any;
    if (req.user.role === "teacher" && type && type !== doc.type) {
      return res
        .status(400)
        .json({ success: false, message: "Teachers cannot change type" });
    }

    if (audience?.scope === "class" && !audience.classId) {
      return res.status(400).json({
        success: false,
        message: "classId is required when scope=class",
      });
    }

    if (title !== undefined) doc.title = title;
    if (message !== undefined) doc.message = message;
    if (
      type !== undefined &&
      (req.user.role === "admin" || req.user.role === "head")
    )
      doc.type = type;
    if (attachments !== undefined) doc.attachments = attachments;
    if (audience !== undefined)
      doc.audience = {
        scope: audience.scope || "all",
        classId: audience.classId,
      } as any;
    if (date !== undefined) doc.date = new Date(date);
    if (archived !== undefined) doc.archived = !!archived;

    await doc.save();
    res.json({ success: true, data: doc });
  } catch (error) {
    console.error("updateAnnouncement error", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update announcement" });
  }
};

// Delete or archive announcement (admin/head or owner teacher)
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const { id } = req.params;
    const hard = (req.query.hard as string) === "true";
    const doc = await Announcement.findById(id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    }
    const isOwner = String(doc.postedBy.user) === String(req.user._id);
    const canManage =
      req.user.role === "admin" ||
      req.user.role === "head" ||
      (req.user.role === "teacher" && isOwner);
    if (!canManage) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (hard) {
      await doc.deleteOne();
    } else {
      doc.archived = true;
      await doc.save();
    }
    res.json({ success: true });
  } catch (error) {
    console.error("deleteAnnouncement error", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete announcement" });
  }
};
