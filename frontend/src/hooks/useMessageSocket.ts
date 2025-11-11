import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/utils";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export interface MessageSocketEvent {
  message: {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    status: "read" | "unread";
    timestamp: string;
    readAt?: string;
    threadKey: string;
  };
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
}

interface UseMessageSocketOptions {
  onIncomingMessage?: (payload: MessageSocketEvent) => void;
  onMessageSent?: (payload: MessageSocketEvent) => void;
  onMessagesRead?: (payload: MessageReadEvent) => void;
}

export const useMessageSocket = ({
  onIncomingMessage,
  onMessageSent,
  onMessagesRead,
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
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onIncomingMessage, onMessageSent, onMessagesRead]);

  return socketRef;
};
