import http from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { env } from "./config/env";
import User, { IUser } from "./models/User";
import Message, {
  IMessage,
  MessageRole,
  MessageStatus,
  MessageType,
  getThreadKey,
} from "./models/Message";
import {
  ensureUsersExist,
  formatUserName,
  hierarchyAllows,
} from "./services/messaging.utils";
import { flagRepliesForDeletedOriginal } from "./services/replyPreview.service";
import {
  markOnline,
  markOffline,
  setHidden,
  isHidden,
  getPresenceSnapshot,
  getPresenceForUser,
} from "./services/presence.service";
import { normalizeMessage, normalizeMessageIds } from "./utils/messages";
// reply snippet construction now handled inline per new business rules.

interface SocketUser {
  id: string;
  role: IUser["role"];
}

type AuthenticatedSocket = Socket & { user?: SocketUser };

let ioInstance: Server | null = null;

const roomForUser = (userId: string) => `user:${userId}`;
// If env.messaging.editWindowMs is 0 or not set, treat as unlimited (no time limit).
const MESSAGE_EDIT_WINDOW_MS = env.messaging?.editWindowMs ?? 0;

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
        .select("role isActive status privacy.hideOnlineStatus")
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
    try {
      console.log("SERVER > Socket connected:", socket.id);
    } catch {}
    const socketUser = socket.user;
    if (!socketUser) {
      socket.disconnect(true);
      return;
    }

    socket.join(roomForUser(socketUser.id));

    const becameOnline = markOnline(socketUser.id);

    // Initialize hidden state from DB for this user
    (async () => {
      try {
        const me = await User.findById(socketUser.id)
          .select("privacy.hideOnlineStatus")
          .lean();
        const hidden = Boolean(me?.privacy?.hideOnlineStatus);
        setHidden(socketUser.id, hidden);
        // Send snapshot of currently visible-online users
        const snapshot = getPresenceSnapshot();
        socket.emit("presence:snapshot", { users: snapshot });
        // For backward compatibility
        socket.emit("user:status:init", {
          online: Object.entries(snapshot)
            .filter(([, entry]) => entry.visibleStatus === "online")
            .map(([userId]) => userId),
        });

        if (becameOnline && ioInstance) {
          if (!hidden) {
            const onlinePayload = {
              userId: socketUser.id,
              hidden: false,
              visibleStatus: "online" as const,
            };
            ioInstance.emit("presence:online", onlinePayload);
            ioInstance.emit("user:online", onlinePayload);
            ioInstance.emit("user:status", {
              userId: socketUser.id,
              online: true,
            });
          } else {
            // Hidden mode: do NOT broadcast online; just inform client of hidden state.
            ioInstance.emit("user:hidden", {
              userId: socketUser.id,
              hidden: true,
            });
          }
        }
      } catch {}
    })();

    socket.on(
      "message:send",
      async (
        payload: {
          recipientId: string;
          content?: string;
          type?: string;
          fileUrl?: string;
          fileName?: string;
          mimeType?: string;
          fileSize?: number;
          replyToMessageId?: string;
        },
        callback?: (response: {
          success: boolean;
          data?: unknown;
          message?: string;
        }) => void
      ) => {
        try {
          try {
            console.log(
              `[socket] message:send -> from ${socketUser.id} to ${payload.recipientId}`
            );
            console.log("SERVER > message:send event triggered:", {
              hasCallback: typeof callback === "function",
              keys: Object.keys(payload || {}),
            });
            console.log("SERVER > Handler received data:", payload);
          } catch {}
          const senderId = new mongoose.Types.ObjectId(socketUser.id);
          const receiverId = new mongoose.Types.ObjectId(payload.recipientId);

          const { sender, receiver } = await ensureUsersExist(
            senderId,
            receiverId
          );

          const senderRole = sender.role as MessageRole;
          const receiverRole = receiver.role as MessageRole;

          // Allow self-messaging for Saved Messages
          if (
            !receiverId.equals(senderId) &&
            !hierarchyAllows(senderRole, receiverRole)
          ) {
            callback?.({
              success: false,
              message: "Messaging hierarchy violation",
            });
            return;
          }

          const type = (payload.type as MessageType | undefined) ?? "text";
          const allowedTypes: MessageType[] = [
            "text",
            "image",
            "file",
            "doc",
            "audio",
            "video",
          ];
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

          let replyToId: mongoose.Types.ObjectId | undefined;
          let replyToMeta: IMessage["replyToMeta"] | null = null;
          let replyToDeleted = false;

          if (payload.replyToMessageId) {
            replyToId = new mongoose.Types.ObjectId(payload.replyToMessageId);
            const referenced = await Message.findById(replyToId)
              .populate("sender", "firstName lastName role")
              .lean();

            if (!referenced) {
              callback?.({
                success: false,
                message: "Referenced message not found",
              });
              return;
            }

            const expectedThread = getThreadKey(senderId, receiverId);
            if (referenced.threadKey !== expectedThread) {
              callback?.({
                success: false,
                message:
                  "Reply must reference a message from the same conversation",
              });
              return;
            }

            const referencedSender = referenced.sender as any;
            const referencedType =
              (referenced.type as MessageType | undefined) ?? "text";
            const referencedDeleted = Boolean(
              referenced.deleted || (referenced as any).isDeletedForEveryone
            );
            // Build snippet only for replies.
            let snippet: string;
            if (referencedDeleted) {
              snippet = "This message was deleted"; // deleted original rule
            } else if (referencedType === "text") {
              const raw =
                typeof referenced.content === "string"
                  ? referenced.content.trim()
                  : "";
              snippet = raw.length <= 70 ? raw : raw.slice(0, 67) + "..."; // 70 char max
            } else {
              const typeLabelMap: Record<MessageType, string> = {
                text: "Message", // won't normally occur because handled above
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
              messageId: referenced._id.toString(),
              senderName: formatUserName(referencedSender) || "Unknown",
              type:
                referencedType === "image" ? "photo" : (referencedType as any), // keep existing ReplyToMessageType mapping for image->photo
              snippet,
            };
            replyToDeleted = referencedDeleted;
          }

          const socketMessagePayload: Partial<IMessage> & {
            sender: mongoose.Types.ObjectId;
            receiver: mongoose.Types.ObjectId;
            senderRole: MessageRole;
            receiverRole: MessageRole;
            content: string;
            type: MessageType;
            deliveredTo: string[];
            seenBy: string[];
            status: MessageStatus;
          } = {
            sender: senderId,
            receiver: receiverId,
            senderRole,
            receiverRole,
            content: trimmedContent,
            type,
            deliveredTo: [senderId.toString()],
            seenBy: [senderId.toString()],
            status: "unread",
          };

          if (payload.fileUrl) {
            socketMessagePayload.fileUrl = payload.fileUrl;
          }
          if (payload.fileName) {
            socketMessagePayload.fileName = payload.fileName;
          }
          if (payload.mimeType) {
            (socketMessagePayload as any).mimeType = payload.mimeType;
          }
          if (typeof payload.fileSize === "number") {
            (socketMessagePayload as any).fileSize = payload.fileSize;
          }

          if (replyToId && replyToMeta) {
            socketMessagePayload.replyToMessageId = replyToId;
            socketMessagePayload.replyToMeta = replyToMeta;
            socketMessagePayload.replyToDeleted = replyToDeleted;
          } else {
            // Explicitly store null to satisfy strict rule (non-reply messages)
            (socketMessagePayload as any).replyToMeta = null;
          }

          try {
            console.log("SERVER > About to save message…");
          } catch {}
          const message = await Message.create(socketMessagePayload);

          try {
            console.log(
              "SERVER > Message saved:",
              (message._id as any)?.toString?.() || message._id
            );
          } catch {}
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

          try {
            console.log("SERVER > SENDING ACK SUCCESS");
          } catch {}
          callback?.({ success: true, data: responsePayload });

          emitToParticipants(
            message.participants,
            "message:new",
            responsePayload
          );
          try {
            console.log(
              "SERVER > Broadcasting message to participants:",
              participantsToStrings(message.participants)
            );
          } catch {}

          await Message.updateOne(
            { _id: message._id },
            {
              $addToSet: {
                deliveredTo: receiverId.toString(),
              },
            }
          );
        } catch (error) {
          try {
            console.error("SERVER > ERROR:", error);
          } catch {}
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

          if (
            typeof MESSAGE_EDIT_WINDOW_MS === "number" &&
            MESSAGE_EDIT_WINDOW_MS > 0
          ) {
            const withinWindow =
              Date.now() - message.createdAt.getTime() < MESSAGE_EDIT_WINDOW_MS;
            if (!withinWindow) {
              callback?.({ success: false, message: "Edit window expired" });
              return;
            }
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
            await Message.updateOne(
              { _id: message._id },
              { $addToSet: { hiddenFor: requesterId } }
            );
            callback?.({ success: true });
            return;
          }

          const receiverId = message.receiver.toString();
          const seenBy = (message.seenBy ?? []).map((id) => String(id));
          const receiverHasSeen =
            seenBy.includes(receiverId) || message.status === "read";

          if (receiverHasSeen) {
            callback?.({
              success: false,
              message:
                "You can't delete this message because it has already been seen.",
            });
            return;
          }

          const participants = participantsToStrings(
            message.participants?.length
              ? message.participants
              : [message.sender, message.receiver]
          );

          if (!message.deleted) {
            message.deleted = true;
          }
          message.isDeletedForEveryone = true;
          message.deletedAt = new Date();
          message.content = "";
          message.set({ fileUrl: undefined, fileName: undefined });
          const hidden = new Set([
            ...(message.hiddenFor ?? []),
            ...participants,
          ]);
          message.hiddenFor = Array.from(hidden);
          await message.save();

          const affectedReplies = await flagRepliesForDeletedOriginal(
            message._id as mongoose.Types.ObjectId
          );

          if (affectedReplies.length > 0) {
            affectedReplies.forEach((reply) => {
              reply.replyToDeleted = true;
              const normalizedReply = normalizeMessage(reply);
              emitToParticipants(
                (
                  (reply.participants?.length
                    ? reply.participants
                    : [reply.sender, reply.receiver]) as Array<
                    mongoose.Types.ObjectId | string | undefined
                  >
                ).filter((p): p is mongoose.Types.ObjectId | string =>
                  Boolean(p)
                ),
                "message:update",
                normalizedReply
              );
            });
          }

          emitToParticipants(message.participants, "message:deleted", {
            messageId: payload.messageId,
            threadKey: message.threadKey,
            mode: "everyone",
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

    // ------------------------------------------------------------------
    // 1:1 Audio Call Signaling (Phase 1 - Audio only, STUN only)
    // Events:
    //  - call:offer    (initiator -> server -> callee)
    //  - call:incoming (server -> callee notification incl. SDP offer)
    //  - call:answer   (callee -> server -> initiator)
    //  - call:ice      (either side -> server -> peer)
    //  - call:hangup   (either side -> server -> peer, ends active call)
    //  - call:cancel   (initiator -> server -> callee, before answer)
    // Basic in-memory session tracking to prevent multiple concurrent calls per user.
    // NOTE: This is ephemeral; scaling horizontally would require shared store.

    interface CallOfferPayload {
      to: string;
      sdp: string;
    }
    interface CallAnswerPayload {
      to: string;
      sdp: string;
    }
    interface CallIcePayload {
      to: string;
      candidate: unknown;
    }
    interface CallHangupPayload {
      to: string;
      reason?: string;
    }
    interface CallCancelPayload {
      to: string;
    }

    // userId -> peerId mapping for active calls
    const activeCalls: Map<string, string> =
      (ioInstance as any).activeCalls || new Map();
    (ioInstance as any).activeCalls = activeCalls;

    const isBusy = (userId: string) => activeCalls.has(userId);
    const establishCall = (a: string, b: string) => {
      activeCalls.set(a, b);
      activeCalls.set(b, a);
    };
    const clearCall = (userId: string) => {
      const peer = activeCalls.get(userId);
      if (peer) {
        activeCalls.delete(peer);
      }
      activeCalls.delete(userId);
    };

    socket.on(
      "call:offer",
      async (
        payload: CallOfferPayload,
        callback?: (r: { success: boolean; message?: string }) => void
      ) => {
        try {
          const callerId = socketUser.id;
          const calleeId = payload.to;
          if (callerId === calleeId) {
            callback?.({ success: false, message: "Cannot call yourself" });
            return;
          }
          if (isBusy(callerId)) {
            callback?.({
              success: false,
              message: "You are already in a call",
            });
            return;
          }
          if (isBusy(calleeId)) {
            callback?.({ success: false, message: "User is busy" });
            return;
          }

          const callerObjId = new mongoose.Types.ObjectId(callerId);
          const calleeObjId = new mongoose.Types.ObjectId(calleeId);
          const { sender: caller, receiver: callee } = await ensureUsersExist(
            callerObjId,
            calleeObjId
          );
          const callerRole = caller.role as MessageRole;
          const calleeRole = callee.role as MessageRole;
          // Reuse hierarchy rule (same as messaging) unless same user (already excluded)
          if (!hierarchyAllows(callerRole, calleeRole)) {
            callback?.({ success: false, message: "Call hierarchy violation" });
            return;
          }

          // Send incoming notification to callee
          try {
            emitToUser(calleeId, "call:incoming", {
              from: callerId,
              fromRole: callerRole,
              sdp: payload.sdp,
              ts: Date.now(),
            });
            console.log(
              `SERVER > call:offer forwarded ${callerId} -> ${calleeId}`
            );
          } catch (err) {
            console.error("SERVER > call:offer forward failed", err);
            callback?.({ success: false, message: "Failed to forward offer" });
            return;
          }
          callback?.({ success: true });
        } catch (e) {
          callback?.({ success: false, message: "Failed to process offer" });
        }
      }
    );

    socket.on(
      "call:answer",
      async (
        payload: CallAnswerPayload,
        callback?: (r: { success: boolean; message?: string }) => void
      ) => {
        try {
          const calleeId = socketUser.id;
          const callerId = payload.to;
          if (isBusy(calleeId)) {
            callback?.({
              success: false,
              message: "You are already in a call",
            });
            return;
          }
          if (isBusy(callerId)) {
            callback?.({ success: false, message: "Peer is busy" });
            return;
          }
          establishCall(calleeId, callerId);
          try {
            emitToUser(callerId, "call:answer", {
              from: calleeId,
              sdp: payload.sdp,
              ts: Date.now(),
            });
            console.log(
              `SERVER > call:answer forwarded ${calleeId} -> ${callerId}`
            );
          } catch (err) {
            console.error("SERVER > call:answer forward failed", err);
            callback?.({ success: false, message: "Failed to forward answer" });
            return;
          }
          callback?.({ success: true });
        } catch (e) {
          callback?.({ success: false, message: "Failed to process answer" });
        }
      }
    );

    socket.on("call:ice", (payload: CallIcePayload) => {
      const fromId = socketUser.id;
      try {
        emitToUser(payload.to, "call:ice", {
          from: fromId,
          candidate: payload.candidate,
        });
        console.log(`SERVER > call:ice forwarded ${fromId} -> ${payload.to}`);
      } catch (err) {
        console.error("SERVER > call:ice forward failed", err);
      }
    });

    socket.on("call:hangup", (payload: CallHangupPayload) => {
      const fromId = socketUser.id;
      clearCall(fromId);
      try {
        emitToUser(payload.to, "call:hangup", {
          from: fromId,
          reason: payload.reason,
          ts: Date.now(),
        });
        console.log(
          `SERVER > call:hangup forwarded ${fromId} -> ${payload.to}`
        );
      } catch (err) {
        console.error("SERVER > call:hangup forward failed", err);
      }
    });

    socket.on("call:cancel", (payload: CallCancelPayload) => {
      const fromId = socketUser.id;
      try {
        emitToUser(payload.to, "call:cancel", { from: fromId, ts: Date.now() });
        console.log(
          `SERVER > call:cancel forwarded ${fromId} -> ${payload.to}`
        );
      } catch (err) {
        console.error("SERVER > call:cancel forward failed", err);
      }
    });

    socket.on("disconnect", () => {
      socket.leave(roomForUser(socketUser.id));
      // Schedule graceful offline via presence service; callback runs after grace period if still offline.
      markOffline(socketUser.id, async (uid, iso) => {
        if (!ioInstance) return;
        try {
          await User.updateOne(
            { _id: uid },
            { $set: { lastSeenAt: new Date(iso) } }
          );
        } catch {}
        const hidden = isHidden(uid);
        const payload = {
          userId: uid,
          lastSeenAt: iso,
          hidden,
          visibleStatus: "offline" as const,
        };
        // Broadcast offline only now (after grace, no remaining sessions)
        ioInstance.emit("presence:lastSeenUpdate", payload);
        ioInstance.emit("presence:offline", payload);
        ioInstance.emit("user:offline", payload);
        ioInstance.emit("user:status", { userId: uid, online: false });
      });
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
