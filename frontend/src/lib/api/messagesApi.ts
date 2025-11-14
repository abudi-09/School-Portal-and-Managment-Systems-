import { getAuthToken } from "@/lib/utils";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const ensureRemoteApiBase = () => {
  // Allow an explicit dev override to permit localhost when developing.
  // Set VITE_ALLOW_LOCALHOST=true in .env to enable localhost during development.
  const allowLocal =
    (import.meta.env.VITE_ALLOW_LOCALHOST as string) === "true" ||
    Boolean(import.meta.env.DEV);
  if (!apiBaseUrl) {
    throw new Error(
      "VITE_API_BASE_URL is not set. Forwarding requires a remote API endpoint."
    );
  }
  const lower = apiBaseUrl.toLowerCase();
  if (
    (lower.includes("localhost") || lower.includes("127.0.0.1")) &&
    !allowLocal
  ) {
    throw new Error(
      "API base URL points to localhost. Forwarding requires a remote API endpoint (not localhost). Set VITE_ALLOW_LOCALHOST=true to allow localhost in development."
    );
  }
};

type MessageResponse = {
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
  replyToMessageId?: string;
  replyTo?: {
    messageId: string;
    senderName: string;
    type: "text" | "image" | "file" | "doc";
    snippet: string;
  };
  replyToDeleted?: boolean;
};

export interface RecipientDto {
  id: string;
  name: string;
  role: "admin" | "head" | "teacher";
  email?: string;
  online?: boolean;
}

export interface ContactSummaryDto {
  user: RecipientDto;
  unreadCount: number;
  lastMessage: MessageResponse;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ msg?: string; message?: string }>;
}

const authHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const json = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok || !json.success || !json.data) {
    const msg = json.message || "Request failed";
    throw new Error(msg);
  }
  return json.data;
};

export const fetchRecipients = async (
  page = 1,
  limit = 50
): Promise<{ recipients: RecipientDto[]; hasMore: boolean }> => {
  ensureRemoteApiBase();
  const response = await fetch(
    `${apiBaseUrl}/api/messages/recipients?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  const data = await handleResponse<{
    recipients: RecipientDto[];
    hasMore: boolean;
  }>(response);
  return { recipients: data.recipients ?? [], hasMore: data.hasMore ?? false };
};

export const fetchInbox = async (): Promise<ContactSummaryDto[]> => {
  ensureRemoteApiBase();
  const response = await fetch(`${apiBaseUrl}/api/messages/inbox`, {
    method: "GET",
    headers: authHeaders(),
  });
  const data = await handleResponse<{ contacts: ContactSummaryDto[] }>(
    response
  );
  return data.contacts ?? [];
};

export const fetchThread = async (
  participantId: string
): Promise<{ participant: RecipientDto; messages: MessageResponse[] }> => {
  ensureRemoteApiBase();
  const response = await fetch(
    `${apiBaseUrl}/api/messages/thread/${participantId}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  return handleResponse<{
    participant: RecipientDto;
    messages: MessageResponse[];
  }>(response);
};

export const sendMessage = async (
  receiverId: string,
  content: string
): Promise<{
  message: MessageResponse;
  sender: RecipientDto;
  receiver: RecipientDto;
}> => {
  ensureRemoteApiBase();
  const response = await fetch(`${apiBaseUrl}/api/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ receiverId, content }),
  });
  return handleResponse<{
    message: MessageResponse;
    sender: RecipientDto;
    receiver: RecipientDto;
  }>(response);
};

export const forwardMessage = async (
  messageId: string,
  receiverId: string
): Promise<{
  message: MessageResponse;
  sender: RecipientDto;
  receiver: RecipientDto;
}> => {
  ensureRemoteApiBase();
  const response = await fetch(
    `${apiBaseUrl}/api/messages/${messageId}/forward`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ receiverId }),
    }
  );
  return handleResponse<{
    message: MessageResponse;
    sender: RecipientDto;
    receiver: RecipientDto;
  }>(response);
};

export const markMessageRead = async (messageId: string) => {
  ensureRemoteApiBase();
  const response = await fetch(`${apiBaseUrl}/api/messages/${messageId}/read`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handleResponse<{ message: MessageResponse }>(response);
};

export type MessageDto = MessageResponse;

export const uploadMessageFile = async (
  file: File
): Promise<{
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
}> => {
  ensureRemoteApiBase();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiBaseUrl}/api/messages/upload`, {
    method: "POST",
    headers: (() => {
      const token = getAuthToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    })(),
    body: formData,
  });

  const data = await handleResponse<{
    fileUrl: string;
    fileName: string;
    mimeType: string;
    size: number;
  }>(response);

  return data;
};
