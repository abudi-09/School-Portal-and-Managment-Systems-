import express from "express";
import { body, param, validationResult } from "express-validator";
import mongoose, { Types } from "mongoose";
// Note: no local file system writes for uploads
import multer from "multer";
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
import SavedMessage from "../models/SavedMessage";
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
import {
  getPresenceForUser,
  isVisibleOnline,
} from "../services/presence.service";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary";
import { idToString } from "../utils/idToString";
import { generateWaveform } from "../utils/generateWaveform";

const mapPresenceDto = (
  user: Pick<IUser, "_id" | "lastSeenAt" | "privacy">
) => {
  const userId = user._id?.toString();
  if (!userId) {
    return undefined;
  }
  const presence = getPresenceForUser(userId);
  const hidden = Boolean(user.privacy?.hideOnlineStatus ?? presence.hidden);
  const lastSeenAt = presence.lastSeenAt ?? user.lastSeenAt?.toISOString();
  return {
    visibleStatus: hidden ? "offline" : presence.visibleStatus,
    hidden,
    ...(lastSeenAt ? { lastSeenAt } : {}),
  } as {
    visibleStatus: "online" | "offline";
    hidden?: boolean;
    lastSeenAt?: string;
  };
};

const router = express.Router();

router.use(authMiddleware, authorizeRoles("admin", "head", "teacher"));

// Use memory storage to avoid writing files to local disk
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  // common audio types
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "text/plain",
  "text/csv",
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
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
  "/send-voice",
  upload.single("voice"),
  async (req: express.Request, res: express.Response) => {
    const currentUser = req.user as IUser;
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const receiverIdRaw = req.body.receiverId as string | undefined;
    if (!receiverIdRaw || !Types.ObjectId.isValid(receiverIdRaw)) {
      return res
        .status(400)
        .json({ success: false, message: "receiverId required" });
    }
    const receiver = await User.findById(receiverIdRaw);
    if (!receiver) {
      return res
        .status(404)
        .json({ success: false, message: "Receiver not found" });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No voice file uploaded" });
    }
    const voiceFile = req.file as Express.Multer.File;
    const allowedVoice = new Set([
      "audio/webm",
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
    ]);
    if (!allowedVoice.has(voiceFile.mimetype)) {
      return res
        .status(400)
        .json({ success: false, message: "Unsupported voice mime type" });
    }
    if (!isCloudinaryConfigured) {
      return res
        .status(500)
        .json({ success: false, message: "Cloudinary not configured" });
    }
    let uploadResult: any;
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        uploadResult = await new Promise((resolve, reject) => {
          const cloudFolder = `${
            env.cloudinary?.avatarFolder || "pathways"
          }/voices`;
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "auto",
              folder: cloudFolder,
              filename_override: voiceFile.originalname,
            },
            (error: any, result: any) => {
              if (error || !result)
                return reject(error || new Error("Cloudinary upload failed"));
              resolve(result);
            }
          );
          stream.end(voiceFile.buffer);
        });
        break; // Success
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) {
          console.error("Voice upload error after retries", err);
          return res
            .status(500)
            .json({ success: false, message: "Failed to upload voice" });
        }
        // Exponential backoff: 500ms, 1000ms, 2000ms...
        const delay = 500 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    // Generate waveform & duration
    const { waveform, duration, error } = await generateWaveform(
      voiceFile.buffer
    );
    const messageDoc = new Message({
      sender: currentUser._id,
      receiver: receiver._id,
      participants: [currentUser._id, receiver._id],
      senderRole: currentUser.role,
      receiverRole: receiver.role,
      content: "",
      status: "unread",
      type: "voice",
      fileUrl: uploadResult.secure_url,
      fileName: voiceFile.originalname,
      mimeType: voiceFile.mimetype,
      fileSize: voiceFile.size || uploadResult.bytes,
      deleted: false,
      voiceDuration: duration ?? undefined,
      voiceWaveform: waveform,
      voicePlayedBy: [],
      voiceUrl: uploadResult.secure_url,
      duration: duration ?? undefined,
      waveform,
      isPlayed: false,
    } as Partial<IMessage>);
    await messageDoc.save();
    const normalized = normalizeMessage(messageDoc);
    const payload = {
      messageId: idToString((messageDoc as any)._id),
      voiceUrl: uploadResult.secure_url,
      duration,
      waveform,
      timestamp: messageDoc.createdAt.toISOString(),
      ...(error ? { metaError: "waveform_generation_failed" } : {}),
      message: normalized,
    };
    // Emit to participants
    emitToUser(idToString(currentUser._id), "message:sendVoice", payload);
    emitToUser(idToString(receiver._id), "message:sendVoice", payload);
    return res.status(201).json({ success: true, ...payload });
  }
);

router.patch(
  "/:id/react",
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

    const allowed = new Set(["❤️", "👍", "😂", "😢", "😡", "🔥", "🎉"]);
    const emoji = String((req.body?.emoji ?? "").trim());
    if (!emoji || !allowed.has(emoji)) {
      return res
        .status(400)
        .json({ success: false, message: "Unsupported emoji reaction" });
    }

    try {
      const message = await Message.findById<IMessage>(req.params.id);
      if (!message) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      // Only participants can react
      const participants = (
        message.participants?.length
          ? message.participants
          : [message.sender, message.receiver]
      )
        .map((p: any) => p.toString())
        .filter(Boolean);
      const { idToString } = await import("../utils/idToString");
      if (!participants.includes(idToString(currentUser._id))) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }

      const userId = idToString(currentUser._id);
      const reactions = Array.isArray((message as any).reactions)
        ? ((message as any).reactions as Array<{
            emoji: string;
            userId: string;
          }>)
        : [];

      const existsIndex = reactions.findIndex(
        (r) => r.emoji === emoji && r.userId === userId
      );
      if (existsIndex >= 0) {
        reactions.splice(existsIndex, 1); // remove existing reaction (toggle off)
      } else {
        reactions.push({ emoji, userId });
      }

      (message as any).reactions = reactions;
      await message.save();

      const normalized = normalizeMessage(message as MessageLike);
      const payload = {
        messageId: normalized.id,
        threadKey: normalized.threadKey,
        reactions: normalized.reactions ?? [],
      };

      // Broadcast to both participants
      const participantIds = participants as string[];
      participantIds.forEach((id) =>
        emitToUser(id, "message:reaction:update", payload)
      );

      return res.json({ success: true, data: payload });
    } catch (error) {
      console.error("Failed to react to message", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to react to message" });
    }
  }
);

router.post(
  "/:id/save",
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
      const existing = await SavedMessage.findOne({
        userId: currentUser._id,
        messageId: req.params.id,
      });

      // Load the original message to copy into self-chat
      const original = await Message.findById<IMessage>(req.params.id).lean();
      if (!original) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      // If already saved, just acknowledge and ensure client stays in sync
      if (existing) {
        // Emit a lightweight event so clients can ensure the Saved chat exists
        const payload = {
          message: normalizeMessage(original as any),
          sender: {
            id: idToString(original.sender),
            name: "",
            role: original.senderRole as MessageRole,
          },
          receiver: {
            id: idToString(original.receiver),
            name: "",
            role: original.receiverRole as MessageRole,
          },
        };
        emitToUser(idToString(currentUser._id), "message:saved:ack", payload);
        return res.json({ success: true, data: { saved: true } });
      }

      // Create SavedMessage link to prevent duplicates
      await SavedMessage.create({
        userId: currentUser._id,
        messageId: original._id,
      });

      // Create a new message in user's self-thread (Saved Messages)
      const newMessage = await Message.create({
        sender: currentUser._id,
        receiver: currentUser._id,
        senderRole: currentUser.role as MessageRole,
        receiverRole: currentUser.role as MessageRole,
        content: original.content,
        type: (original.type as MessageType) ?? "text",
        fileUrl: (original as any).fileUrl,
        fileName: (original as any).fileName,
        mimeType: (original as any).mimeType,
        fileSize: (original as any).fileSize,
        // Preserve reply preview context when available
        ...(original.replyToMeta
          ? {
              replyToMeta: original.replyToMeta,
              replyToDeleted: Boolean((original as any).replyToDeleted),
            }
          : {}),
        // Mark as immediately delivered and seen by current user
        deliveredTo: [idToString(currentUser._id)],
        seenBy: [idToString(currentUser._id)],
        status: "read",
        ...(original.type === "voice"
          ? {
              voiceDuration: (original as any).voiceDuration,
              voiceWaveform: (original as any).voiceWaveform,
              voicePlayedBy: [idToString(currentUser._id)],
            }
          : {}),
      });

      const payload = {
        message: normalizeMessage(newMessage as any),
        sender: {
          id: idToString(currentUser._id),
          name: formatUserName(currentUser as any),
          role: currentUser.role as MessageRole,
        },
        receiver: {
          id: idToString(currentUser._id),
          name: "Saved Messages",
          role: currentUser.role as MessageRole,
        },
      };

      // Emit both as new and sent so existing flows update instantly
      emitToUser(idToString(currentUser._id), "message:new", payload);
      emitToUser(idToString(currentUser._id), "message:sent", payload);

      return res.status(201).json({ success: true, data: { saved: true } });
    } catch (error) {
      console.error("Failed to save message", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to save message" });
    }
  }
);
router.post(
  "/",
  [
    body("receiverId")
      .isMongoId()
      .withMessage("receiverId must be a valid identifier"),
    body("type")
      .optional()
      .isIn(["text", "image", "file", "doc", "audio", "video", "voice"])
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
    body("voiceDuration").optional().isNumeric(),
    body("voiceWaveform").optional().isArray(),
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

    try {
      const { sender: senderDoc, receiver } = await ensureUsersExist(
        sender._id,
        receiverId
      );

      const receiverRole = receiver.role as MessageRole;
      // Allow self-messaging for Saved Messages
      if (
        !receiverId.equals(sender._id) &&
        !hierarchyAllows(senderRole, receiverRole)
      ) {
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

      if (type === "voice") {
        const durationRaw = req.body.voiceDuration;
        const duration =
          typeof durationRaw === "number" ? durationRaw : Number(durationRaw);
        if (!duration || Number.isNaN(duration) || duration <= 0) {
          return res.status(400).json({
            success: false,
            message: "voiceDuration must be a positive number",
          });
        }
        const waveformRaw = req.body.voiceWaveform;
        if (!Array.isArray(waveformRaw) || waveformRaw.length === 0) {
          return res.status(400).json({
            success: false,
            message: "voiceWaveform must be a non-empty array",
          });
        }
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
            voice: "Voice",
          };
          snippet = typeLabelMap[referencedType];
        }
        replyToMeta = {
          messageId: idToString((referenced as any)._id),
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
        mimeType: req.body.mimeType,
        fileSize:
          typeof req.body.fileSize === "number" ? req.body.fileSize : undefined,
        deliveredTo: [idToString(sender._id)],
        seenBy: [idToString(sender._id)],
      };

      if (replyToId && replyToMeta) {
        messagePayload.replyToMessageId = replyToId;
        messagePayload.replyToMeta = replyToMeta;
        messagePayload.replyToDeleted = replyToDeleted;
      } else {
        (messagePayload as any).replyToMeta = null; // enforce null for non-replies
      }

      if (type === "voice") {
        (messagePayload as any).voiceDuration = Number(req.body.voiceDuration);
        (messagePayload as any).voiceWaveform = Array.isArray(
          req.body.voiceWaveform
        )
          ? req.body.voiceWaveform.map((v: any) => Number(v) || 0)
          : [];
        (messagePayload as any).voicePlayedBy = [idToString(sender._id)];
      }

      const message = await Message.create(messagePayload);

      const payload = {
        message: normalizeMessage(message),
        sender: {
          id: idToString(sender._id),
          name: formatUserName(senderDoc),
          role: senderRole,
        },
        receiver: {
          id: idToString(receiver._id),
          name: formatUserName(receiver),
          role: receiverRole,
        },
      };

      emitToUser(idToString(receiver._id), "message:new", payload);
      emitToUser(idToString(sender._id), "message:sent", payload);

      await Message.updateOne(
        { _id: message._id },
        { $addToSet: { deliveredTo: idToString(receiver._id) } }
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

      const { sender: senderDoc, receiver } = await ensureUsersExist(
        currentUser._id,
        receiverId
      );
      const senderRole = currentUser.role as MessageRole;
      const receiverRole = receiver.role as MessageRole;
      if (
        !receiverId.equals(currentUser._id) &&
        !hierarchyAllows(senderRole, receiverRole)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Cannot forward a message to this recipient due to role restrictions",
        });
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
        mimeType: (original as any).mimeType,
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
        deliveredTo: [idToString(currentUser._id)],
        seenBy: [idToString(currentUser._id)],
        ...(original.type === "voice"
          ? {
              voiceDuration: (original as any).voiceDuration,
              voiceWaveform: (original as any).voiceWaveform,
              voicePlayedBy: [idToString(currentUser._id)],
            }
          : {}),
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

    if (!isCloudinaryConfigured) {
      return res.status(503).json({
        success: false,
        message:
          "File uploads are temporarily unavailable. Cloudinary is not configured.",
      });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const uploadedFile = req.file as Express.Multer.File;
    try {
      const folder = "pathways/messages";
      const useFilename = true;
      const uniqueFilename = true;

      const result = await new Promise<{
        secure_url: string;
        resource_type: string;
        bytes: number;
        original_filename?: string;
        format?: string;
      }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder,
            use_filename: useFilename,
            unique_filename: uniqueFilename,
            filename_override: uploadedFile.originalname,
            // Keep original extension when possible
            overwrite: false,
          },
          (error: any, uploadResult: any) => {
            if (error || !uploadResult) {
              reject(error || new Error("Cloudinary upload failed"));
              return;
            }
            resolve(uploadResult as any);
          }
        );
        stream.end(uploadedFile.buffer);
      });

      return res.status(201).json({
        success: true,
        data: {
          fileUrl: result.secure_url,
          fileName: uploadedFile.originalname,
          mimeType: uploadedFile.mimetype,
          size: uploadedFile.size ?? result.bytes,
        },
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to upload file" });
    }
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
        .select(
          "firstName lastName email role lastSeenAt privacy.hideOnlineStatus"
        )
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
          online: isVisibleOnline(user._id?.toString() ?? ""),
          presence: mapPresenceDto(user as any),
        }));

      // Add Saved Messages as a recipient
      formatted.unshift({
        id: currentUser._id.toString(),
        name: "Saved Messages",
        role: currentUser.role as MessageRole,
        email: currentUser.email,
        online: false,
        presence: undefined,
      });

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
      .select(
        "firstName lastName email role lastSeenAt privacy.hideOnlineStatus"
      )
      .lean();

    const contacts = grouped
      .map((group) => {
        const otherId = group.participants.find((id) => !id.equals(currentId));
        // For self-thread (Saved Messages), otherId will be undefined.
        if (!otherId) {
          return {
            user: {
              id: currentId.toString(),
              name: "Saved Messages",
              role: currentUser.role,
              email: currentUser.email,
              online: false,
              presence: undefined,
            },
            unreadCount: 0,
            lastMessage: normalizeMessage(group.lastMessage),
          } as const;
        }
        const userDoc = counterpartDocs.find((doc) => doc._id?.equals(otherId));
        if (!userDoc) {
          return null;
        }
        const presence = mapPresenceDto(userDoc as any);
        const online =
          presence?.visibleStatus === "online" && !presence?.hidden
            ? true
            : isVisibleOnline(otherId.toString());
        return {
          user: {
            id: otherId.toString(),
            name: formatUserName(userDoc),
            role: userDoc.role,
            email: userDoc.email,
            online,
            presence,
          },
          unreadCount: group.unreadCount,
          lastMessage: normalizeMessage(group.lastMessage),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    // Ensure Saved Messages contact exists even if there is no self-thread yet
    const hasSavedContact = contacts.some(
      (c) => c.user.id === currentId.toString()
    );
    if (!hasSavedContact) {
      // Find latest self-message, if any, to attach as lastMessage
      const selfThreadKey = getThreadKey(currentId, currentId);
      const lastSelf = await Message.findOne({ threadKey: selfThreadKey })
        .sort({ createdAt: -1 })
        .lean<MessageLike | null>();
      contacts.push({
        user: {
          id: currentId.toString(),
          name: "Saved Messages",
          role: currentUser.role as MessageRole,
          email: currentUser.email,
          online: false,
          presence: undefined,
        },
        unreadCount: 0,
        ...(lastSelf ? { lastMessage: normalizeMessage(lastSelf) } : {}),
      } as any);
    }

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
        message:
          "Use /messages/saved to fetch Saved Messages (self-thread) instead.",
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
            online: isVisibleOnline(participantIdString),
            presence: mapPresenceDto(participantDoc as any),
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

// Saved Messages (self-thread) listing with optional search
router.get("/saved", async (req: express.Request, res: express.Response) => {
  const currentUser = req.user as IUser;
  if (!currentUser) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  try {
    const currentId = new mongoose.Types.ObjectId(currentUser._id);
    const threadKey = getThreadKey(currentId, currentId);

    const q = (req.query.q as string | undefined)?.trim();
    const filter: any = { threadKey };
    if (q && q.length > 0) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { content: { $regex: regex } },
        { fileName: { $regex: regex } },
      ];
    }

    const messages = await Message.find<MessageLike>(filter)
      .sort({ createdAt: 1 })
      .lean<MessageLike[]>();

    const mapped = normalizeMessageIds(messages);

    return res.json({
      success: true,
      data: {
        participant: {
          id: currentId.toString(),
          name: "Saved Messages",
          role: currentUser.role,
          email: currentUser.email,
          online: false,
          presence: undefined,
        },
        messages: mapped,
      },
    });
  } catch (error) {
    console.error("Failed to fetch saved messages", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch saved messages" });
  }
});

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

// Mark voice message as played (removes unplayed indicator for this user)
router.patch(
  "/:id/voice-played",
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

      if (message.type !== "voice") {
        return res.status(400).json({
          success: false,
          message: "Not a voice message",
        });
      }

      const userId = currentUser._id.toString();
      const participants = (
        message.participants ?? [message.sender, message.receiver]
      ).map((p: any) => p.toString());
      if (!participants.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this message",
        });
      }

      // Track single receiver playback state
      const isReceiver = message.receiver.toString() === userId;
      if (isReceiver && !(message as any).isPlayed) {
        (message as any).isPlayed = true;
        // Maintain legacy array for compatibility
        const playedSet = new Set<string>((message as any).voicePlayedBy ?? []);
        if (!playedSet.has(userId)) {
          playedSet.add(userId);
          (message as any).voicePlayedBy = Array.from(playedSet);
        }
        await message.save();
        const payload = {
          messageId: (message._id as any).toString(),
          threadKey: message.threadKey,
          userId,
          isPlayed: true,
        };
        participants.forEach((pid) =>
          emitToUser(pid, "message:voicePlayed", payload)
        );
      }

      return res.json({
        success: true,
        data: { message: normalizeMessage(message as any) },
      });
    } catch (error) {
      console.error("Failed to mark voice message played", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update voice message state",
      });
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
