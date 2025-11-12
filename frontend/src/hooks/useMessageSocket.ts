import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/utils";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export interface SocketMessagePayload {
  _id: string;
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  status: "read" | "unread";
  timestamp: string;
  readAt?: string;
  threadKey: string;
  senderRole: "admin" | "head" | "teacher";
  receiverRole: "admin" | "head" | "teacher";
  type: "text" | "image" | "file" | "doc";
  fileUrl?: string;
  fileName?: string;
  deleted: boolean;
  editedAt?: string;
  deliveredTo: string[];
  seenBy: string[];
}

export interface MessageSocketEvent {
  message: SocketMessagePayload;
  sender: {
    id: string;
    name: string;
    role: "admin" | "head" | "teacher";
  };
  receiver: {
    id: string;
    name: string;
    role: "admin" | "head" | "teacher";
  };
}

export interface MessageReadEvent {
  messageIds: string[];
  readerId: string;
  threadKey: string;
  seenBy?: string;
}

export type MessageUpdateEvent = SocketMessagePayload;

export interface MessageDeletedEvent {
  messageId: string;
  deletedBy: string;
  forEveryone?: boolean;
}

export interface MessageSeenUpdateEvent {
  messageIds: string[];
  seenBy: string;
  threadKey?: string;
}

export interface UserStatusEvent {
  userId: string;
  online: boolean;
}

export interface UserStatusInitEvent {
  online: string[];
}

interface UseMessageSocketOptions {
  onIncomingMessage?: (payload: MessageSocketEvent) => void;
  onMessageSent?: (payload: MessageSocketEvent) => void;
  onMessagesRead?: (payload: MessageReadEvent) => void;
  onMessageUpdated?: (payload: MessageUpdateEvent) => void;
  onMessageDeleted?: (payload: MessageDeletedEvent) => void;
  onMessageSeenUpdate?: (payload: MessageSeenUpdateEvent) => void;
  onUserStatus?: (payload: UserStatusEvent) => void;
  onUserStatusInit?: (payload: UserStatusInitEvent) => void;
}

type AckResponse<T> = { success: boolean; data?: T; message?: string };

export const useMessageSocket = ({
  onIncomingMessage,
  onMessageSent,
  onMessagesRead,
  onMessageUpdated,
  onMessageDeleted,
  onMessageSeenUpdate,
  onUserStatus,
  onUserStatusInit,
}: UseMessageSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      return () => undefined;
    }

    const socket = io(apiBaseUrl, {
      auth: { token },
      transports: ["websocket"],
      autoConnect: true,
    });

    socketRef.current = socket;

    if (onIncomingMessage) {
      socket.on("message:new", onIncomingMessage);
    }

    if (onMessageSent) {
      socket.on("message:sent", onMessageSent);
    }

    if (onMessagesRead) {
      socket.on("message:read", onMessagesRead);
    }

    if (onMessageUpdated) {
      socket.on("message:update", onMessageUpdated);
    }

    if (onMessageDeleted) {
      socket.on("message:deleted", onMessageDeleted);
    }

    if (onMessageSeenUpdate) {
      socket.on("message:seen:update", onMessageSeenUpdate);
    }

    if (onUserStatus) {
      socket.on("user:status", onUserStatus);
    }

    if (onUserStatusInit) {
      socket.on("user:status:init", onUserStatusInit);
    }

    return () => {
      if (onIncomingMessage) {
        socket.off("message:new", onIncomingMessage);
      }
      if (onMessageSent) {
        socket.off("message:sent", onMessageSent);
      }
      if (onMessagesRead) {
        socket.off("message:read", onMessagesRead);
      }
      if (onMessageUpdated) {
        socket.off("message:update", onMessageUpdated);
      }
      if (onMessageDeleted) {
        socket.off("message:deleted", onMessageDeleted);
      }
      if (onMessageSeenUpdate) {
        socket.off("message:seen:update", onMessageSeenUpdate);
      }
      if (onUserStatus) {
        socket.off("user:status", onUserStatus);
      }
      if (onUserStatusInit) {
        socket.off("user:status:init", onUserStatusInit);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    onIncomingMessage,
    onMessageSent,
    onMessagesRead,
    onMessageUpdated,
    onMessageDeleted,
    onMessageSeenUpdate,
    onUserStatus,
    onUserStatusInit,
  ]);

  const emitWithAck = <T>(event: string, payload: unknown) =>
    new Promise<T>((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      socket.emit(event, payload, (response: AckResponse<T>) => {
        if (response?.success) {
          resolve((response.data as T) ?? ({} as T));
        } else {
          reject(new Error(response?.message ?? "Socket request failed"));
        }
      });
    });

  const sendMessage = async (payload: {
    recipientId: string;
    content?: string;
    type?: SocketMessagePayload["type"];
    fileUrl?: string;
    fileName?: string;
  }) => emitWithAck<{ message: SocketMessagePayload }>("message:send", payload);

  const editMessage = async (messageId: string, newText: string) =>
    emitWithAck<MessageUpdateEvent>("message:edit", { messageId, newText });

  const deleteMessage = async (messageId: string, forEveryone = false) =>
    emitWithAck<unknown>("message:delete", { messageId, forEveryone });

  const emitSeen = async (messageIds: string[], threadKey?: string) =>
    emitWithAck<unknown>("message:seen", { messageIds, threadKey });

  return {
    socketRef,
    sendMessage,
    editMessage,
    deleteMessage,
    emitSeen,
  } as const;
};
