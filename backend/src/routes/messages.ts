import express from "express";
import { body, param, validationResult } from "express-validator";
import mongoose, { Types } from "mongoose";
import fs from "fs";
import path from "path";
import multer from "multer";
import { randomBytes } from "crypto";
import { env } from "../config/env";
import { authMiddleware, authorizeRoles } from "../middleware/auth";
import Message, {
  IMessage,
  MessageRole,
  MessageType,
  ReplyToMeta,
  getThreadKey,
} from "../models/Message";
import User, { IUser } from "../models/User";
import { emitToUser } from "../socket";
import {
  MessageLike,
  normalizeMessage,
  normalizeMessageIds,
} from "../utils/messages";
import {
  ensureUsersExist,
  formatUserName,
  hierarchyAllows,
} from "../services/messaging.utils";
import { flagRepliesForDeletedOriginal } from "../services/replyPreview.service";
import { isOnline } from "../services/presence.service";

const router = express.Router();

router.use(authMiddleware, authorizeRoles("admin", "head", "teacher"));

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (
    _req: express.Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, uploadsDir);
  },
  filename: (
    _req: express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, fileName: string) => void
  ) => {
    const unique = randomBytes(8).toString("hex");
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${unique}${extension}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "text/csv",
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (
    _req: express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile?: boolean) => void
  ) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Unsupported file type"));
  },
});

router.post(
  "/",
  [
    body("receiverId")
      .isMongoId()
      .withMessage("receiverId must be a valid identifier"),
    body("type")
      .optional()
      .isIn(["text", "image", "file", "doc", "audio", "video"])
      .withMessage("Invalid message type"),
    body("content")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 4000 })
      .withMessage("content must be between 1 and 4000 characters"),
    body("fileUrl").optional().isString(),
    body("fileName").optional().isString(),
    body("replyToMessageId").optional().isMongoId(),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const sender = req.user as IUser;
    if (!sender) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const senderRole = sender.role as MessageRole;
    if (!(["admin", "head", "teacher"] as MessageRole[]).includes(senderRole)) {
      return res
        .status(403)
        .json({ success: false, message: "Role not permitted for messaging" });
    }

    const receiverId = new mongoose.Types.ObjectId(req.body.receiverId);
    if (receiverId.equals(sender._id)) {
      return res.status(400).json({
        success: false,
        message: "Cannot send a message to yourself",
      });
    }

    try {
      const { sender: senderDoc, receiver } = await ensureUsersExist(
        sender._id,
        receiverId
      );

      const receiverRole = receiver.role as MessageRole;
      if (!hierarchyAllows(senderRole, receiverRole)) {
        return res
          .status(403)
          .json({ success: false, message: "Messaging hierarchy violation" });
      }

      const type = (req.body.type as MessageType | undefined) ?? "text";
      const contentValue = req.body.content?.trim() ?? "";
      if (type === "text" && contentValue.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Content is required for text messages",
        });
      }

      if (type !== "text" && !req.body.fileUrl) {
        return res.status(400).json({
          success: false,
          message: "File URL is required for file messages",
        });
      }

      // If replying, validate referenced message exists and belongs to same thread
      let replyToId: mongoose.Types.ObjectId | undefined;
      let replyToMeta: IMessage["replyToMeta"] | null = null;
      let replyToDeleted = false;
      if (req.body.replyToMessageId) {
        replyToId = new mongoose.Types.ObjectId(req.body.replyToMessageId);
        const referenced = await Message.findById(replyToId)
          .populate("sender", "firstName lastName role")
          .lean();
        if (!referenced) {
          return res
            .status(404)
            .json({ success: false, message: "Referenced message not found" });
        }
        const expectedThread = getThreadKey(sender._id, receiverId);
        if (referenced.threadKey !== expectedThread) {
          return res.status(400).json({
            success: false,
            message: "Reply must reference a message from the same thread",
          });
        }

        const referencedSender = referenced.sender as any;
        const referencedSenderName =
          formatUserName(referencedSender) || "Unknown";
        const referencedType =
          (referenced.type as MessageType | undefined) ?? "text";
        const referencedDeleted = Boolean(
          referenced.deleted || (referenced as any).isDeletedForEveryone
        );
        let snippet: string;
        if (referencedDeleted) {
          snippet = "This message was deleted";
        } else if (referencedType === "text") {
          const raw =
            typeof referenced.content === "string"
              ? referenced.content.trim()
              : "";
          snippet = raw.length <= 70 ? raw : raw.slice(0, 67) + "...";
        } else {
          const typeLabelMap: Record<MessageType, string> = {
            text: "Message",
            image: "Photo",
            file: "File",
            doc: "Document",
            audio: "Audio",
            video: "Video",
          };
          snippet = typeLabelMap[referencedType];
        }
        replyToMeta = {
          messageId: referenced._id.toString(),
          senderName: referencedSenderName,
          type: referencedType === "image" ? "photo" : (referencedType as any),
          snippet,
        };
        replyToDeleted = referencedDeleted;
      }

      const messagePayload: Partial<IMessage> & {
        sender: Types.ObjectId;
        receiver: Types.ObjectId;
        senderRole: MessageRole;
        receiverRole: MessageRole;
        content: string;
        type: MessageType;
        deliveredTo: string[];
        seenBy: string[];
      } = {
        sender: sender._id,
        receiver: receiverId,
        senderRole,
        receiverRole,
        content: contentValue,
        type,
        fileUrl: req.body.fileUrl,
        fileName: req.body.fileName,
        deliveredTo: [sender._id.toString()],
        seenBy: [sender._id.toString()],
      };

      if (replyToId && replyToMeta) {
        messagePayload.replyToMessageId = replyToId;
        messagePayload.replyToMeta = replyToMeta;
        messagePayload.replyToDeleted = replyToDeleted;
      } else {
        (messagePayload as any).replyToMeta = null; // enforce null for non-replies
      }

      const message = await Message.create(messagePayload);

      const payload = {
        message: normalizeMessage(message),
        sender: {
          id: sender._id.toString(),
          name: formatUserName(senderDoc),
          role: senderRole,
        },
        receiver: {
          id: receiver._id.toString(),
          name: formatUserName(receiver),
          role: receiverRole,
        },
      };

      emitToUser(receiver._id.toString(), "message:new", payload);
      emitToUser(sender._id.toString(), "message:sent", payload);

      await Message.updateOne(
        { _id: message._id },
        { $addToSet: { deliveredTo: receiver._id.toString() } }
      );

      return res.status(201).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      console.error("Failed to send message", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send message",
      });
    }
  }
);

// Forward a message to another recipient
router.post(
  "/:id/forward",
  [
    param("id").isMongoId().withMessage("Invalid message identifier"),
    body("receiverId")
      .isMongoId()
      .withMessage("receiverId must be a valid identifier"),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const currentUser = req.user as IUser;
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    try {
      const original = await Message.findById(req.params.id).lean();
      if (!original) {
        return res
          .status(404)
          .json({ success: false, message: "Original message not found" });
      }

      if ((original as any).isDeletedForEveryone) {
        return res.status(409).json({
          success: false,
          message: "Cannot forward a message deleted for everyone",
        });
      }

      const receiverId = new mongoose.Types.ObjectId(req.body.receiverId);
      if (receiverId.equals(currentUser._id)) {
        return res.status(400).json({
          success: false,
          message: "Cannot forward a message to yourself",
        });
      }

      const { sender: senderDoc, receiver } = await ensureUsersExist(
        currentUser._id,
        receiverId
      );
      const senderRole = currentUser.role as MessageRole;
      const receiverRole = receiver.role as MessageRole;
      if (!hierarchyAllows(senderRole, receiverRole)) {
        return res
          .status(403)
          .json({ success: false, message: "Messaging hierarchy violation" });
      }

      // Build forwardedFrom metadata
      let originalSenderName: string | undefined;
      try {
        const originalSenderDoc = await User.findById(
          (original as any).sender
        ).lean();
        if (originalSenderDoc) {
          originalSenderName = formatUserName(originalSenderDoc as any);
        }
      } catch (e) {
        // ignore
      }

      let forwardedReplyMeta: ReplyToMeta | undefined;
      if ((original as any).replyToMeta) {
        const meta = (original as any).replyToMeta;
        if (meta.messageId && meta.senderName && meta.snippet && meta.type) {
          forwardedReplyMeta = {
            messageId: meta.messageId,
            senderName: meta.senderName,
            type: meta.type,
            snippet: meta.snippet,
          };
        }
      }

      const newMessage = await Message.create({
        sender: currentUser._id,
        receiver: receiverId,
        senderRole,
        receiverRole,
        content: original.content,
        type: original.type ?? "text",
        fileUrl: (original as any).fileUrl,
        fileName: (original as any).fileName,
        ...(forwardedReplyMeta
          ? {
              replyToMeta: forwardedReplyMeta,
              replyToDeleted: Boolean((original as any).replyToDeleted),
            }
          : {}),
        forwardedFrom: {
          originalMessageId: original._id,
          originalSenderId: (original as any).sender,
          originalSenderName,
          originalSentAt: (original as any).createdAt,
        },
        forwardedAt: new Date(),
        deliveredTo: [currentUser._id.toString()],
        seenBy: [currentUser._id.toString()],
      });

      const payload = {
        message: normalizeMessage(newMessage as MessageLike),
        sender: {
          id: currentUser._id.toString(),
          name: formatUserName(currentUser as any),
          role: senderRole,
        },
        receiver: {
          id: receiver._id.toString(),
          name: formatUserName(receiver),
          role: receiverRole,
        },
      };

      emitToUser(receiver._id.toString(), "message:new", payload);
      emitToUser(currentUser._id.toString(), "message:sent", payload);

      await Message.updateOne(
        { _id: newMessage._id },
        { $addToSet: { deliveredTo: receiver._id.toString() } }
      );

      return res.status(201).json({ success: true, data: payload });
    } catch (error) {
      console.error("Failed to forward message", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to forward message" });
    }
  }
);

router.post(
  "/upload",
  upload.single("file"),
  async (req: express.Request, res: express.Response) => {
    const currentUser = req.user as IUser;
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const uploadedFile = req.file as Express.Multer.File;
    const fileUrl = `/uploads/${uploadedFile.filename}`;
    return res.status(201).json({
      success: true,
      data: {
        fileUrl,
        fileName: uploadedFile.originalname,
        mimeType: uploadedFile.mimetype,
        size: uploadedFile.size,
      },
    });
  }
);

router.get(
  "/recipients",
  async (req: express.Request, res: express.Response) => {
    const currentUser = req.user as IUser;
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const role = currentUser.role as MessageRole;
    const roleFilters: Record<MessageRole, MessageRole[]> = {
      admin: ["head"],
      head: ["admin", "teacher"],
      teacher: ["head"],
    };

    const allowedRoles = roleFilters[role] ?? [];
    if (allowedRoles.length === 0) {
      return res.json({
        success: true,
        data: { recipients: [], hasMore: false },
      });
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const recipients = await User.find({
        role: { $in: allowedRoles },
        isActive: true,
        status: "approved",
      })
        .select("firstName lastName email role")
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limit + 1) // fetch one extra to check if there are more
        .lean();

      const hasMore = recipients.length > limit;
      const actualRecipients = hasMore ? recipients.slice(0, -1) : recipients;

      const formatted = actualRecipients
        .filter((user) => !user._id?.equals(currentUser._id))
        .map((user) => ({
          id: user._id?.toString() ?? "",
          name: formatUserName(user),
          role: user.role,
          email: user.email,
          online: isOnline(user._id?.toString() ?? ""),
        }));

      return res.json({
        success: true,
        data: { recipients: formatted, hasMore },
      });
    } catch (error) {
      console.error("Failed to fetch recipients", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch recipients",
      });
    }
  }
);

router.get("/inbox", async (req: express.Request, res: express.Response) => {
  const currentUser = req.user as IUser;
  if (!currentUser) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  const currentId = new mongoose.Types.ObjectId(currentUser._id);

  try {
    const grouped = await Message.aggregate<{
      _id: string;
      lastMessage: MessageLike;
      participants: Types.ObjectId[];
      unreadCount: number;
    }>([
      { $match: { participants: currentId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$threadKey",
          lastMessage: { $first: "$$ROOT" },
          participants: { $first: "$participants" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", currentId] },
                    { $eq: ["$status", "unread"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const counterpartIds = grouped
      .map((group) => group.participants.find((id) => !id.equals(currentId)))
      .filter((id): id is Types.ObjectId => Boolean(id));

    const counterpartDocs = await User.find({ _id: { $in: counterpartIds } })
      .select("firstName lastName email role")
      .lean();

    const contacts = grouped
      .map((group) => {
        const otherId = group.participants.find((id) => !id.equals(currentId));
        if (!otherId) {
          return null;
        }
        const userDoc = counterpartDocs.find((doc) => doc._id?.equals(otherId));
        if (!userDoc) {
          return null;
        }
        return {
          user: {
            id: otherId.toString(),
            name: formatUserName(userDoc),
            role: userDoc.role,
            email: userDoc.email,
            online: isOnline(otherId.toString()),
          },
          unreadCount: group.unreadCount,
          lastMessage: normalizeMessage(group.lastMessage),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return res.json({ success: true, data: { contacts } });
  } catch (error) {
    console.error("Failed to fetch inbox", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch inbox" });
  }
});

router.get(
  "/thread/:participantId",
  [
    param("participantId")
      .isMongoId()
      .withMessage("Invalid participant identifier"),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const currentUser = req.user as IUser;
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const currentId = new mongoose.Types.ObjectId(currentUser._id);
    const participantId = new mongoose.Types.ObjectId(req.params.participantId);

    if (participantId.equals(currentId)) {
      return res.status(400).json({
        success: false,
        message: "Cannot open a thread with yourself",
      });
    }

    try {
      const { sender: currentDoc, receiver: participantDoc } =
        await ensureUsersExist(currentId, participantId);

      const senderRole = currentDoc.role as MessageRole;
      const receiverRole = participantDoc.role as MessageRole;
      if (
        !hierarchyAllows(senderRole, receiverRole) &&
        !hierarchyAllows(receiverRole, senderRole)
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Messaging hierarchy violation" });
      }

      const threadKey = getThreadKey(currentId, participantId);

      const currentIdString = currentId.toString();
      const participantIdString = participantId.toString();

      const messages = await Message.find<MessageLike>({ threadKey })
        .sort({ createdAt: 1 })
        .lean<MessageLike[]>();

      await Message.updateMany(
        {
          threadKey,
          deliveredTo: { $ne: currentIdString },
          sender: { $ne: currentId },
        },
        { $addToSet: { deliveredTo: currentIdString } }
      );

      const unreadIds = messages
        .filter(
          (message) =>
            message.receiver?.toString() === currentIdString &&
            message.status === "unread"
        )
        .map((message) => message._id);

      if (unreadIds.length > 0) {
        await Message.updateMany(
          { _id: { $in: unreadIds }, receiver: currentId },
          {
            $set: { status: "read", readAt: new Date() },
            $addToSet: { seenBy: currentIdString },
          }
        );

        const seenPayload = {
          messageIds: unreadIds.map((id) => id.toString()),
          seenBy: currentIdString,
          readerId: currentIdString,
          threadKey,
        };

        emitToUser(participantIdString, "message:seen:update", seenPayload);
        emitToUser(participantIdString, "message:read", seenPayload);
      }

      const updatedMessages = messages.map((message) => {
        const clone = { ...message } as MessageLike;
        const delivered = new Set(
          (clone.deliveredTo as string[] | undefined)?.map((id) =>
            id.toString()
          ) ?? []
        );
        delivered.add(currentIdString);
        clone.deliveredTo = Array.from(delivered);

        if (unreadIds.some((id) => id?.toString() === clone._id?.toString())) {
          clone.status = "read";
          clone.readAt = new Date();
          const seenBy = new Set(
            (clone.seenBy as string[] | undefined)?.map((id) =>
              id.toString()
            ) ?? []
          );
          seenBy.add(currentIdString);
          clone.seenBy = Array.from(seenBy);
        }

        return clone;
      });

      const filteredMessages = updatedMessages.filter((message) => {
        const hiddenFor = (message.hiddenFor ?? []).map((id) => id?.toString());
        return !hiddenFor.includes(currentIdString);
      });

      const mappedMessages = normalizeMessageIds(filteredMessages);

      return res.json({
        success: true,
        data: {
          participant: {
            id: participantIdString,
            name: formatUserName(participantDoc),
            role: participantDoc.role,
            email: participantDoc.email,
            online: isOnline(participantIdString),
          },
          messages: mappedMessages,
        },
      });
    } catch (error) {
      console.error("Failed to fetch thread", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch thread" });
    }
  }
);

router.patch(
  "/:id/read",
  [param("id").isMongoId().withMessage("Invalid message identifier")],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const currentUser = req.user as IUser;
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    try {
      const message = await Message.findById<IMessage>(req.params.id);
      if (!message) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      if (message.receiver.toString() !== currentUser._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Only the receiver can mark as read",
        });
      }

      await Message.updateOne(
        { _id: message._id },
        {
          $addToSet: {
            deliveredTo: currentUser._id.toString(),
            seenBy: currentUser._id.toString(),
          },
        }
      );

      const currentIdString = currentUser._id.toString();
      const deliveredSet = new Set<string>(
        (message.deliveredTo ?? []).map((value) => value.toString())
      );
      deliveredSet.add(currentIdString);
      message.deliveredTo = Array.from(deliveredSet);

      const seenSet = new Set<string>(
        (message.seenBy ?? []).map((value) => value.toString())
      );
      seenSet.add(currentIdString);
      message.seenBy = Array.from(seenSet);

      if (message.status === "read") {
        return res.json({
          success: true,
          data: { message: normalizeMessage(message) },
        });
      }

      message.status = "read";
      message.readAt = new Date();
      await message.save();

      emitToUser(message.sender.toString(), "message:read", {
        messageIds: [String(message._id)],
        readerId: currentUser._id.toString(),
        threadKey: message.threadKey,
      });
      emitToUser(message.sender.toString(), "message:seen:update", {
        messageIds: [String(message._id)],
        seenBy: currentUser._id.toString(),
        threadKey: message.threadKey,
      });

      return res.json({
        success: true,
        data: { message: normalizeMessage(message) },
      });
    } catch (error) {
      console.error("Failed to update message status", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update message" });
    }
  }
);

// Edit message (only sender)
router.patch(
  "/:id/edit",
  [
    param("id").isMongoId().withMessage("Invalid message identifier"),
    body("content").isString().trim().isLength({ min: 1, max: 4000 }),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const currentUser = req.user as IUser;
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    try {
      const message = await Message.findById<IMessage>(req.params.id);
      if (!message) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      if (message.sender.toString() !== currentUser._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Only the sender can edit this message",
        });
      }

      if (message.isDeletedForEveryone) {
        return res.status(409).json({
          success: false,
          message: "Cannot edit a message deleted for everyone",
        });
      }

      const trimmedContent = req.body.content.trim();
      const previousContent = message.content;

      if (trimmedContent === previousContent) {
        return res.status(400).json({
          success: false,
          message: "New content must be different from the current content",
        });
      }

      const hiddenFor = (message.hiddenFor ?? []).map((id) => id.toString());
      if (hiddenFor.includes(currentUser._id.toString())) {
        return res.status(409).json({
          success: false,
          message: "Cannot edit a message that was deleted",
        });
      }

      const maxEditCount = env.messaging?.maxEditCount ?? 0;
      const currentEditCount =
        typeof message.editCount === "number" ? message.editCount : 0;

      if (maxEditCount > 0 && currentEditCount >= maxEditCount) {
        return res.status(409).json({
          success: false,
          message: "Message edit limit reached",
        });
      }

      // Persist the new content and track edit metadata for transparency.
      message.content = trimmedContent;
      message.isEdited = true;
      message.editedAt = new Date();
      message.editCount = currentEditCount + 1;

      await message.save();

      const normalized = normalizeMessage(message as MessageLike);

      const participants =
        message.participants?.map((p: any) => p.toString()) ?? [];
      participants.forEach((id) =>
        emitToUser(id, "message:edited", {
          message: normalized,
        })
      );

      return res.json({ success: true, data: { message: normalized } });
    } catch (error) {
      console.error("Failed to edit message", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to edit message" });
    }
  }
);

// Delete message: mode=me|everyone (default me)
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid message identifier")],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const currentUser = req.user as IUser;
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const mode = (req.query.mode as string) ?? "me";

    try {
      const message = await Message.findById<IMessage>(req.params.id);
      if (!message) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      const currentId = currentUser._id.toString();

      if (mode === "me") {
        await Message.updateOne(
          { _id: message._id },
          { $addToSet: { hiddenFor: currentId } }
        );
        return res.json({ success: true, message: "Deleted for me" });
      }

      if (message.sender.toString() !== currentId) {
        return res.status(403).json({
          success: false,
          message: "Only the sender can delete for everyone",
        });
      }

      const receiverId = message.receiver.toString();
      const seenBy = (message.seenBy ?? []).map((id) => String(id));
      const receiverHasSeen =
        seenBy.includes(receiverId) || message.status === "read";

      if (receiverHasSeen) {
        return res.status(409).json({
          success: false,
          message:
            "You can't delete this message because it has already been seen.",
        });
      }

      const messageId = (
        message._id as Types.ObjectId | string | number
      ).toString();
      const participants = message.participants?.map((p: any) =>
        p.toString()
      ) ?? [message.sender.toString(), message.receiver.toString()];

      message.deleted = true;
      message.isDeletedForEveryone = true;
      message.deletedAt = new Date();
      message.content = "";
      message.fileUrl = undefined as any;
      message.fileName = undefined as any;
      const hidden = new Set([...(message.hiddenFor ?? []), ...participants]);
      message.hiddenFor = Array.from(hidden);

      await message.save();

      const affectedReplies = await flagRepliesForDeletedOriginal(
        message._id as Types.ObjectId
      );

      if (affectedReplies.length > 0) {
        affectedReplies.forEach((reply) => {
          reply.replyToDeleted = true;
          const normalizedReply = normalizeMessage(reply);
          const replyParticipants = reply.participants?.map(
            (participant: any) => participant.toString()
          ) ?? [reply.sender.toString(), reply.receiver.toString()];

          replyParticipants.forEach((participantId) =>
            emitToUser(participantId, "message:update", normalizedReply)
          );
        });
      }

      const payload = {
        messageId,
        threadKey: message.threadKey,
        mode: "everyone",
      };

      participants.forEach((id) => emitToUser(id, "message:deleted", payload));

      return res.json({
        success: true,
        data: { messageId },
      });
    } catch (error) {
      console.error("Failed to delete message", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete message" });
    }
  }
);

export const messageRouter = router;
export default router;
