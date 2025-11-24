import { MutableRefObject, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/utils";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

// Module-level shared socket to avoid multiple connections when the hook is used more than once
let sharedSocket: Socket | null = null;
let sharedSubscribers = 0;

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
  type: "text" | "image" | "file" | "doc" | "voice" | "video";
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  deleted: boolean;
  editedAt?: string;
  deliveredTo: string[];
  seenBy: string[];
  replyToMessageId?: string;
  replyTo?: {
    messageId: string;
    senderName: string;
    type: "text" | "image" | "file" | "doc" | "voice" | "video";
    snippet: string;
  };
  replyToDeleted?: boolean;
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
  deletedBy?: string;
  forEveryone?: boolean;
  mode?: "me" | "everyone";
  threadKey?: string;
  placeholder?: string;
  deletedAt?: string;
}

export interface MessageSeenUpdateEvent {
  messageIds: string[];
  seenBy: string;
  threadKey?: string;
}

export interface MessageReactionUpdateEvent {
  messageId: string;
  threadKey: string;
  reactions: Array<{ emoji: string; users: string[] }>;
}

export interface UserStatusEvent {
  userId: string;
  online: boolean;
}

export interface UserStatusInitEvent {
  online: string[];
}

export interface PresenceSnapshotEvent {
  users: Record<
    string,
    {
      visibleStatus: "online" | "offline";
      lastSeenAt?: string;
      hidden?: boolean;
    }
  >;
}

export interface UserVisibilityEvent {
  userId: string;
  visibleStatus: "online" | "offline";
}

export interface UserHiddenEvent {
  userId: string;
  hidden: true;
}

export interface PresenceOnlineEvent {
  userId: string;
  hidden?: boolean;
  visibleStatus?: "online" | "offline";
}

export interface PresenceOfflineEvent {
  userId: string;
  lastSeenAt: string;
  hidden?: boolean;
  visibleStatus?: "online" | "offline";
}

export interface PresenceLastSeenEvent {
  userId: string;
  lastSeenAt: string;
  hidden?: boolean;
  visibleStatus?: "online" | "offline";
}

export interface PresenceVisibilityChangeEvent {
  userId: string;
  visibleStatus: "online" | "offline";
  hidden?: boolean;
  lastSeenAt?: string;
}

export interface MessageSocketHandle {
  socketRef: MutableRefObject<Socket | null>;
  sendMessage: (payload: {
    recipientId: string;
    content?: string;
    type?: SocketMessagePayload["type"];
    fileUrl?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    replyToMessageId?: string;
  }) => Promise<{ message: SocketMessagePayload }>;
  editMessage: (
    messageId: string,
    newText: string
  ) => Promise<MessageUpdateEvent>;
  deleteMessage: (messageId: string, forEveryone?: boolean) => Promise<unknown>;
  emitSeen: (messageIds: string[], threadKey?: string) => Promise<unknown>;
}

interface UseMessageSocketOptions {
  onIncomingMessage?: (payload: MessageSocketEvent) => void;
  onMessageSent?: (payload: MessageSocketEvent) => void;
  onMessagesRead?: (payload: MessageReadEvent) => void;
  onMessageUpdated?: (payload: MessageUpdateEvent) => void;
  onMessageDeleted?: (payload: MessageDeletedEvent) => void;
  onMessageSeenUpdate?: (payload: MessageSeenUpdateEvent) => void;
  onMessageReactionUpdate?: (payload: MessageReactionUpdateEvent) => void;
  onUserStatus?: (payload: UserStatusEvent) => void;
  onUserStatusInit?: (payload: UserStatusInitEvent) => void;
  onPresenceSnapshot?: (payload: PresenceSnapshotEvent) => void;
  onUserOnline?: (payload: UserVisibilityEvent) => void;
  onUserOffline?: (
    payload: UserVisibilityEvent & { lastSeenAt?: string }
  ) => void;
  onUserHidden?: (payload: UserHiddenEvent) => void;
  onUserVisibilityChange?: (payload: UserVisibilityEvent) => void;
  onPresenceOnline?: (payload: PresenceOnlineEvent) => void;
  onPresenceOffline?: (payload: PresenceOfflineEvent) => void;
  onPresenceLastSeenUpdate?: (payload: PresenceLastSeenEvent) => void;
  onPresenceVisibilityChange?: (payload: PresenceVisibilityChangeEvent) => void;
}

type AckResponse<T> = { success: boolean; data?: T; message?: string };

export const useMessageSocket = ({
  onIncomingMessage,
  onMessageSent,
  onMessagesRead,
  onMessageUpdated,
  onMessageDeleted,
  onMessageSeenUpdate,
  onMessageReactionUpdate,
  onUserStatus,
  onUserStatusInit,
  onPresenceSnapshot,
  onUserOnline,
  onUserOffline,
  onUserHidden,
  onUserVisibilityChange,
  onPresenceOnline,
  onPresenceOffline,
  onPresenceLastSeenUpdate,
  onPresenceVisibilityChange,
}: UseMessageSocketOptions): MessageSocketHandle => {
  const socketRef = useRef<Socket | null>(null);

  // Effect 1: initialize or reuse a shared socket. Only reconnect when token or base URL changes.
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      return () => undefined;
    }

    if (!sharedSocket) {
      sharedSocket = io(apiBaseUrl, {
        auth: { token },
        transports: ["websocket"],
        autoConnect: true,
      });
    }

    sharedSubscribers += 1;
    socketRef.current = sharedSocket;

    return () => {
      sharedSubscribers = Math.max(0, sharedSubscribers - 1);
      if (sharedSubscribers === 0 && sharedSocket) {
        // Disconnect only when the last subscriber unmounts
        sharedSocket.disconnect();
        sharedSocket = null;
      }
      socketRef.current = null;
    };
  }, []);

  // Effect 2: attach/detach listeners when handlers change, do NOT create/disconnect sockets here
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return () => undefined;
    }

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

    if (onMessageReactionUpdate) {
      socket.on("message:reaction:update", onMessageReactionUpdate);
    }

    if (onUserStatus) {
      socket.on("user:status", onUserStatus);
    }

    if (onUserStatusInit) {
      socket.on("user:status:init", onUserStatusInit);
    }

    if (onPresenceSnapshot) {
      socket.on("presence:snapshot", onPresenceSnapshot);
    }
    if (onUserOnline) {
      socket.on("user:online", onUserOnline);
    }
    if (onUserOffline) {
      socket.on("user:offline", onUserOffline);
    }
    if (onUserHidden) {
      socket.on("user:hidden", onUserHidden);
    }
    if (onUserVisibilityChange) {
      socket.on("user:visibilityChange", onUserVisibilityChange);
    }
    if (onPresenceOnline) {
      socket.on("presence:online", onPresenceOnline);
    }
    if (onPresenceOffline) {
      socket.on("presence:offline", onPresenceOffline);
    }
    if (onPresenceLastSeenUpdate) {
      socket.on("presence:lastSeenUpdate", onPresenceLastSeenUpdate);
    }
    if (onPresenceVisibilityChange) {
      socket.on("presence:visibilityChange", onPresenceVisibilityChange);
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
      if (onMessageReactionUpdate) {
        socket.off("message:reaction:update", onMessageReactionUpdate);
      }
      if (onUserStatus) {
        socket.off("user:status", onUserStatus);
      }
      if (onUserStatusInit) {
        socket.off("user:status:init", onUserStatusInit);
      }
      if (onPresenceSnapshot) {
        socket.off("presence:snapshot", onPresenceSnapshot);
      }
      if (onUserOnline) {
        socket.off("user:online", onUserOnline);
      }
      if (onUserOffline) {
        socket.off("user:offline", onUserOffline);
      }
      if (onUserHidden) {
        socket.off("user:hidden", onUserHidden);
      }
      if (onUserVisibilityChange) {
        socket.off("user:visibilityChange", onUserVisibilityChange);
      }
      if (onPresenceOnline) {
        socket.off("presence:online", onPresenceOnline);
      }
      if (onPresenceOffline) {
        socket.off("presence:offline", onPresenceOffline);
      }
      if (onPresenceLastSeenUpdate) {
        socket.off("presence:lastSeenUpdate", onPresenceLastSeenUpdate);
      }
      if (onPresenceVisibilityChange) {
        socket.off("presence:visibilityChange", onPresenceVisibilityChange);
      }
    };
  }, [
    onIncomingMessage,
    onMessageSent,
    onPresenceSnapshot,
    onUserOnline,
    onUserOffline,
    onUserHidden,
    onUserVisibilityChange,
    onPresenceOnline,
    onPresenceOffline,
    onPresenceLastSeenUpdate,
    onPresenceVisibilityChange,
    onMessagesRead,
    onMessageUpdated,
    onMessageDeleted,
    onMessageSeenUpdate,
    onMessageReactionUpdate,
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

      const timeout = setTimeout(() => {
        reject(
          new Error(
            "Message sending timed out. Please check your connection and try again."
          )
        );
      }, 30000);

      try {
        if (event === "message:send") {
          console.log("CLIENT > sending payload:", payload);
        }
        socket.emit(event, payload, (response: AckResponse<T>) => {
          clearTimeout(timeout);
          if (event === "message:send") {
            console.log("CLIENT > received ACK:", response);
            if (!response) {
              console.error("CLIENT > ACK is undefined!");
            }
          }
          if (response?.success) {
            resolve((response.data as T) ?? ({} as T));
          } else {
            reject(new Error(response?.message ?? "Socket request failed"));
          }
        });
      } catch (err) {
        clearTimeout(timeout);
        reject(err as Error);
      }
    });

  const sendMessage = async (payload: {
    recipientId: string;
    content?: string;
    type?: SocketMessagePayload["type"];
    fileUrl?: string;
    fileName?: string;
    replyToMessageId?: string;
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
  };
};

// --- Call Feature Support Helpers (Phase 1) ---
// Provide a way for other hooks (e.g., useCall) to reuse the same socket instance
// without establishing a second connection.
export const getExistingMessageSocket = (): Socket | null => sharedSocket;
export const ensureMessageSocket = (): Socket | null => {
  if (sharedSocket) return sharedSocket;
  const token = getAuthToken();
  if (!token) return null;
  sharedSocket = io(apiBaseUrl, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
  });
  return sharedSocket;
};
