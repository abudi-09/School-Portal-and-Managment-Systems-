import http from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { env } from "./config/env";
import User, { IUser } from "./models/User";
import Message, { IMessage, MessageRole, MessageType } from "./models/Message";
import {
  ensureUsersExist,
  formatUserName,
  hierarchyAllows,
} from "./services/messaging.utils";
import {
  markOnline,
  markOffline,
  getOnlineUsers,
} from "./services/presence.service";
import { normalizeMessage, normalizeMessageIds } from "./utils/messages";

interface SocketUser {
  id: string;
  role: IUser["role"];
}

type AuthenticatedSocket = Socket & { user?: SocketUser };

let ioInstance: Server | null = null;

const roomForUser = (userId: string) => `user:${userId}`;
const MESSAGE_EDIT_WINDOW_MS = 10 * 60 * 1000;

const participantsToStrings = (
  participants: Array<string | mongoose.Types.ObjectId>
): string[] =>
  participants.map((participant) =>
    typeof participant === "string" ? participant : participant.toString()
  );

const emitToParticipants = (
  participants: Array<string | mongoose.Types.ObjectId>,
  event: string,
  payload: unknown
) => {
  const ids = participantsToStrings(participants);
  ids.forEach((participantId) => emitToUser(participantId, event, payload));
};

export const initSocket = (server: http.Server): Server => {
  ioInstance = new Server(server, {
    cors: {
      origin: env.nodeEnv === "development" ? true : env.frontendUrl,
      credentials: true,
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const authToken =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization as string | undefined);

      if (!authToken) {
        return next(new Error("Authentication token missing"));
      }

      const token = authToken.startsWith("Bearer ")
        ? authToken.substring(7)
        : authToken;

      const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };
      const user = await User.findById(decoded.userId)
        .select("role isActive status")
        .lean();

      if (!user || !user.isActive || user.status !== "approved") {
        return next(new Error("Unauthorized"));
      }

      (socket as AuthenticatedSocket).user = {
        id: decoded.userId,
        role: user.role,
      };
      return next();
    } catch (error) {
      return next(new Error("Invalid authentication token"));
    }
  });

  ioInstance.on("connection", (socket: AuthenticatedSocket) => {
    const socketUser = socket.user;
    if (!socketUser) {
      socket.disconnect(true);
      return;
    }

    socket.join(roomForUser(socketUser.id));

    const becameOnline = markOnline(socketUser.id);
    socket.emit("user:status:init", {
      online: getOnlineUsers(),
    });

    if (becameOnline && ioInstance) {
      ioInstance.emit("user:status", {
        userId: socketUser.id,
        online: true,
      });
    }

    socket.on(
      "message:send",
      async (
        payload: {
          recipientId: string;
          content?: string;
          type?: string;
          fileUrl?: string;
          fileName?: string;
          metadata?: Record<string, unknown>;
        },
        callback?: (response: {
          success: boolean;
          data?: unknown;
          message?: string;
        }) => void
      ) => {
        try {
          const senderId = new mongoose.Types.ObjectId(socketUser.id);
          const receiverId = new mongoose.Types.ObjectId(payload.recipientId);

          const { sender, receiver } = await ensureUsersExist(
            senderId,
            receiverId
          );

          const senderRole = sender.role as MessageRole;
          const receiverRole = receiver.role as MessageRole;

          if (!hierarchyAllows(senderRole, receiverRole)) {
            callback?.({
              success: false,
              message: "Messaging hierarchy violation",
            });
            return;
          }

          const type = (payload.type as MessageType | undefined) ?? "text";
          const allowedTypes: MessageType[] = ["text", "image", "file", "doc"];
          if (!allowedTypes.includes(type)) {
            callback?.({ success: false, message: "Invalid message type" });
            return;
          }

          const trimmedContent = payload.content?.trim() ?? "";
          if (type === "text" && trimmedContent.length === 0) {
            callback?.({
              success: false,
              message: "Message content is required",
            });
            return;
          }

          const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            senderRole,
            receiverRole,
            content: trimmedContent,
            type,
            fileUrl: payload.fileUrl,
            fileName: payload.fileName,
            deliveredTo: [senderId.toString()],
            seenBy: [senderId.toString()],
            status: "unread",
          });

          const normalized = normalizeMessage(message);
          const responsePayload = {
            message: normalized,
            sender: {
              id: senderId.toString(),
              name: formatUserName(sender),
              role: senderRole,
            },
            receiver: {
              id: receiverId.toString(),
              name: formatUserName(receiver),
              role: receiverRole,
            },
          };

          emitToParticipants(
            message.participants,
            "message:new",
            responsePayload
          );
          callback?.({ success: true, data: responsePayload });

          await Message.updateOne(
            { _id: message._id },
            {
              $addToSet: {
                deliveredTo: receiverId.toString(),
              },
            }
          );
        } catch (error) {
          callback?.({ success: false, message: "Failed to send message" });
        }
      }
    );

    socket.on(
      "message:edit",
      async (
        payload: { messageId: string; newText: string },
        callback?: (response: {
          success: boolean;
          data?: unknown;
          message?: string;
        }) => void
      ) => {
        try {
          const message = await Message.findById(payload.messageId);
          if (!message) {
            callback?.({ success: false, message: "Message not found" });
            return;
          }

          if (message.sender.toString() !== socketUser.id) {
            callback?.({ success: false, message: "Not authorized" });
            return;
          }

          const withinWindow =
            Date.now() - message.createdAt.getTime() < MESSAGE_EDIT_WINDOW_MS;
          if (!withinWindow) {
            callback?.({ success: false, message: "Edit window expired" });
            return;
          }

          const trimmed = payload.newText.trim();
          if (!trimmed) {
            callback?.({ success: false, message: "Content required" });
            return;
          }

          message.content = trimmed;
          message.editedAt = new Date();
          await message.save();

          const normalized = normalizeMessage(message);
          emitToParticipants(
            message.participants,
            "message:update",
            normalized
          );
          callback?.({ success: true, data: normalized });
        } catch (error) {
          callback?.({ success: false, message: "Failed to edit message" });
        }
      }
    );

    socket.on(
      "message:delete",
      async (
        payload: { messageId: string; forEveryone?: boolean },
        callback?: (response: {
          success: boolean;
          data?: unknown;
          message?: string;
        }) => void
      ) => {
        try {
          const message = await Message.findById(payload.messageId);
          if (!message) {
            callback?.({ success: false, message: "Message not found" });
            return;
          }

          const senderId = message.sender.toString();
          const requesterId = socketUser.id;
          const forEveryone = Boolean(payload.forEveryone);

          if (forEveryone && requesterId !== senderId) {
            callback?.({ success: false, message: "Not authorized" });
            return;
          }

          if (!forEveryone) {
            callback?.({ success: true });
            return;
          }

          if (message.deleted) {
            callback?.({ success: true });
            return;
          }

          message.deleted = true;
          message.content = "";
          message.set({ fileUrl: undefined, fileName: undefined });
          await message.save();

          emitToParticipants(message.participants, "message:deleted", {
            messageId: payload.messageId,
            deletedBy: requesterId,
            forEveryone: true,
          });

          callback?.({ success: true });
        } catch (error) {
          callback?.({ success: false, message: "Failed to delete message" });
        }
      }
    );

    socket.on(
      "message:seen",
      async (
        payload: { messageIds: string[]; threadKey?: string },
        callback?: (response: {
          success: boolean;
          data?: unknown;
          message?: string;
        }) => void
      ) => {
        try {
          const userId = socketUser.id;
          const userObjectId = new mongoose.Types.ObjectId(userId);
          const objectIds = payload.messageIds.map(
            (id) => new mongoose.Types.ObjectId(id)
          );

          await Message.updateMany(
            { _id: { $in: objectIds }, receiver: userObjectId },
            {
              $set: { status: "read", readAt: new Date() },
              $addToSet: { seenBy: userId, deliveredTo: userId },
            }
          );

          const updatedMessages = await Message.find({
            _id: { $in: objectIds },
          });
          const participants = new Set<string>();
          updatedMessages.forEach((message) => {
            participantsToStrings(message.participants).forEach((participant) =>
              participants.add(participant)
            );
          });

          const payloadMessage = {
            messageIds: payload.messageIds,
            seenBy: userId,
          };

          participants.forEach((participantId) =>
            emitToUser(participantId, "message:seen:update", payloadMessage)
          );

          callback?.({ success: true });
        } catch (error) {
          callback?.({ success: false, message: "Failed to update seen" });
        }
      }
    );

    socket.on("disconnect", () => {
      socket.leave(roomForUser(socketUser.id));
      const becameOffline = markOffline(socketUser.id);
      if (becameOffline && ioInstance) {
        ioInstance.emit("user:status", {
          userId: socketUser.id,
          online: false,
        });
      }
    });
  });

  return ioInstance;
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error("Socket.IO server not initialized");
  }
  return ioInstance;
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  if (!ioInstance) {
    return;
  }
  ioInstance.to(roomForUser(userId)).emit(event, payload);
};

export const getUserRoom = (userId: string) => roomForUser(userId);
