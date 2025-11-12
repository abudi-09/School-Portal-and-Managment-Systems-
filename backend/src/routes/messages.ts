import express from "express";
import { body, param, validationResult } from "express-validator";
import mongoose, { Types } from "mongoose";
import { authMiddleware, authorizeRoles } from "../middleware/auth";
import Message, { MessageRole, getThreadKey } from "../models/Message";
import User, { IUser } from "../models/User";
import { emitToUser } from "../socket";
import {
  MessageLike,
  normalizeMessage,
  normalizeMessageIds,
} from "../utils/messages";

const router = express.Router();

router.use(authMiddleware, authorizeRoles("admin", "head", "teacher"));

const formatUserName = (
  user: Pick<IUser, "firstName" | "lastName" | "email">
): string => {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`
    .trim()
    .replace(/\s+/g, " ");
  return fullName || user.email || "User";
};

const hierarchyAllows = (
  senderRole: MessageRole,
  receiverRole: MessageRole
) => {
  if (senderRole === "admin") {
    return receiverRole === "head";
  }
  if (senderRole === "head") {
    return receiverRole === "admin" || receiverRole === "teacher";
  }
  if (senderRole === "teacher") {
    return receiverRole === "head";
  }
  return false;
};

const ensureUsersExist = async (
  senderId: Types.ObjectId,
  receiverId: Types.ObjectId
): Promise<{ sender: IUser; receiver: IUser }> => {
  const users = await User.find({ _id: { $in: [senderId, receiverId] } })
    .select("firstName lastName email role status isActive")
    .lean();

  const sender = users.find((item) => item._id?.equals(senderId));
  const receiver = users.find((item) => item._id?.equals(receiverId));

  if (!sender || !receiver) {
    throw new Error("Sender or receiver not found");
  }

  if (!sender.isActive || sender.status !== "approved") {
    throw new Error("Sender is not active");
  }

  if (!receiver.isActive || receiver.status !== "approved") {
    throw new Error("Receiver is not active");
  }

  return {
    sender: sender as unknown as IUser,
    receiver: receiver as unknown as IUser,
  };
};

router.post(
  "/",
  [
    body("receiverId")
      .isMongoId()
      .withMessage("receiverId must be a valid identifier"),
    body("content")
      .isString()
      .trim()
      .isLength({ min: 1, max: 4000 })
      .withMessage("content must be between 1 and 4000 characters"),
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

      const message = await Message.create({
        sender: sender._id,
        receiver: receiverId,
        senderRole,
        receiverRole,
        content: req.body.content.trim(),
      });

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
      return res.json({ success: true, data: { recipients: [] } });
    }

    try {
      const recipients = await User.find({
        role: { $in: allowedRoles },
        isActive: true,
        status: "approved",
      })
        .select("firstName lastName email role")
        .sort({ firstName: 1, lastName: 1 })
        .lean();

      const formatted = recipients
        .filter((user) => !user._id?.equals(currentUser._id))
        .map((user) => ({
          id: user._id?.toString() ?? "",
          name: formatUserName(user),
          role: user.role,
          email: user.email,
        }));

      return res.json({ success: true, data: { recipients: formatted } });
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

      const messages = await Message.find<MessageLike>({ threadKey })
        .sort({ createdAt: 1 })
        .lean<MessageLike[]>();

      const mappedMessages = normalizeMessageIds(messages);

      const unreadIds = messages
        .filter(
          (message) =>
            message.receiver?.toString() === currentId.toString() &&
            message.status === "unread"
        )
        .map((message) => message._id);

      if (unreadIds.length > 0) {
        await Message.updateMany(
          { _id: { $in: unreadIds } },
          { status: "read", readAt: new Date() }
        );

        emitToUser(participantId.toString(), "message:read", {
          messageIds: unreadIds.map((id) => id.toString()),
          readerId: currentId.toString(),
          threadKey,
        });
      }

      return res.json({
        success: true,
        data: {
          participant: {
            id: participantId.toString(),
            name: formatUserName(participantDoc),
            role: participantDoc.role,
            email: participantDoc.email,
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
      const message = await Message.findById(req.params.id);
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

export default router;
