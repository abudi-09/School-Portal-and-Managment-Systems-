import { getAuthToken } from "@/lib/utils";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) ?? "";

// Build API URLs robustly whether apiBaseUrl ends with /api or not.
const apiUrl = (p: string) => {
  const path = p.startsWith("/") ? p : `/${p}`;
  const base = (apiBaseUrl || "").trim().replace(/\/$/, "");
  if (!base) {
    return `/api${path}`;
  }
  if (/\/api$/i.test(base)) {
    return `${base}${path}`;
  }
  return `${base}/api${path}`;
};

const ensureRemoteApiBase = () => {
  // In development, allow missing API base and rely on Vite proxy (/api, /uploads).
  const isDev = Boolean(import.meta.env.DEV);
  if (isDev && !apiBaseUrl) return;

  // In non-dev (or when explicitly set), validate the base.
  const allowLocal =
    (import.meta.env.VITE_ALLOW_LOCALHOST as string) === "true";
  if (!apiBaseUrl) {
    throw new Error(
      "VITE_API_BASE_URL is not set. Please configure it to your backend origin."
    );
  }

  const lower = apiBaseUrl.toLowerCase();
  const isLocal = lower.includes("localhost") || lower.includes("127.0.0.1");
  if (isLocal && !allowLocal && !isDev) {
    throw new Error(
      "API base URL points to localhost, which is not allowed in production. Set VITE_ALLOW_LOCALHOST=true to override."
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
  type: "text" | "image" | "file" | "doc" | "voice";
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
    type: "text" | "image" | "file" | "doc";
    snippet: string;
  };
  replyToDeleted?: boolean;
  reactions?: Array<{ emoji: string; users: string[] }>;
  voiceDuration?: number;
  voiceWaveform?: number[];
  voicePlayedBy?: string[];
};

export interface PresenceDto {
  visibleStatus: "online" | "offline";
  lastSeenAt?: string;
  hidden?: boolean;
}

export interface RecipientDto {
  id: string;
  name: string;
  role: "admin" | "head" | "teacher";
  email?: string;
  online?: boolean;
  presence?: PresenceDto;
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
    `${apiUrl("/messages/recipients")}?page=${page}&limit=${limit}`,
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
  const response = await fetch(apiUrl("/messages/inbox"), {
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
  const response = await fetch(apiUrl(`/messages/thread/${participantId}`), {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse<{
    participant: RecipientDto;
    messages: MessageResponse[];
  }>(response);
};

export const fetchSavedThread = async (
  q?: string
): Promise<{ participant: RecipientDto; messages: MessageResponse[] }> => {
  ensureRemoteApiBase();
  const url =
    q && q.trim().length > 0
      ? `${apiUrl("/messages/saved")}?q=${encodeURIComponent(q.trim())}`
      : apiUrl("/messages/saved");
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse<{
    participant: RecipientDto;
    messages: MessageResponse[];
  }>(response);
};

export const toAbsoluteFileUrl = (fileUrl?: string) => {
  if (!fileUrl || !fileUrl.startsWith("/")) return fileUrl;
  const base = apiBaseUrl.replace(/\/$/, "");
  return `${base}${fileUrl}`;
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
  const response = await fetch(apiUrl("/messages"), {
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

export const sendVoiceMessage = async (
  receiverId: string,
  fileUrl: string,
  fileName: string,
  mimeType: string,
  voiceDuration: number,
  voiceWaveform: number[]
): Promise<{
  message: MessageResponse;
  sender: RecipientDto;
  receiver: RecipientDto;
}> => {
  ensureRemoteApiBase();
  const payload = {
    receiverId,
    type: "voice",
    fileUrl,
    fileName,
    mimeType,
    voiceDuration,
    voiceWaveform,
  };
  const response = await fetch(apiUrl("/messages"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
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
  const response = await fetch(apiUrl(`/messages/${messageId}/forward`), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ receiverId }),
  });
  return handleResponse<{
    message: MessageResponse;
    sender: RecipientDto;
    receiver: RecipientDto;
  }>(response);
};

export const markMessageRead = async (messageId: string) => {
  ensureRemoteApiBase();
  const response = await fetch(apiUrl(`/messages/${messageId}/read`), {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handleResponse<{ message: MessageResponse }>(response);
};

export const markVoicePlayed = async (
  messageId: string
): Promise<{ message: MessageResponse }> => {
  ensureRemoteApiBase();
  const response = await fetch(apiUrl(`/messages/${messageId}/voice-played`), {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handleResponse<{ message: MessageResponse }>(response);
};

export type MessageDto = MessageResponse;

export const reactToMessage = async (
  messageId: string,
  emoji: string
): Promise<{
  messageId: string;
  threadKey: string;
  reactions: Array<{ emoji: string; users: string[] }>;
}> => {
  ensureRemoteApiBase();
  const response = await fetch(apiUrl(`/messages/${messageId}/react`), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ emoji }),
  });
  return handleResponse<{
    messageId: string;
    threadKey: string;
    reactions: Array<{ emoji: string; users: string[] }>;
  }>(response);
};

export const saveMessage = async (messageId: string) => {
  ensureRemoteApiBase();
  const response = await fetch(apiUrl(`/messages/${messageId}/save`), {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse<{ saved: boolean }>(response);
};

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

  const response = await fetch(apiUrl("/messages/upload"), {
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

  // Convert backend-relative file paths to absolute URL using API base
  const normalized = { ...data };
  if (
    typeof normalized.fileUrl === "string" &&
    normalized.fileUrl.startsWith("/")
  ) {
    const base = apiBaseUrl.replace(/\/$/, "");
    normalized.fileUrl = `${base}${normalized.fileUrl}`;
  }

  return normalized;
};

export type UploadProgressHandler = (loaded: number, total: number) => void;

export const uploadMessageFileWithProgress = (
  file: File,
  onProgress?: UploadProgressHandler,
  signal?: AbortSignal
): {
  promise: Promise<{
    fileUrl: string;
    fileName: string;
    mimeType: string;
    size: number;
  }>;
  cancel: () => void;
} => {
  const url = apiUrl("/messages/upload");
  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();
  const promise = new Promise<{
    fileUrl: string;
    fileName: string;
    mimeType: string;
    size: number;
  }>((resolve, reject) => {
    xhr.open("POST", url, true);
    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          onProgress(evt.loaded, evt.total);
        }
      };
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const parsed = JSON.parse(xhr.responseText) as ApiResponse<{
              fileUrl: string;
              fileName: string;
              mimeType: string;
              size: number;
            }>;
            if (!parsed.success || !parsed.data) {
              reject(new Error(parsed.message || "Upload failed"));
              return;
            }
            const data = parsed.data;
            const base = apiBaseUrl.replace(/\/$/, "");
            const absoluteUrl = data.fileUrl.startsWith("/")
              ? `${base}${data.fileUrl}`
              : data.fileUrl;
            resolve({
              fileUrl: absoluteUrl,
              fileName: data.fileName,
              mimeType: data.mimeType,
              size: data.size,
            });
          } catch (e) {
            reject(new Error("Invalid upload response"));
          }
        } else {
          reject(new Error("Upload failed"));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload canceled"));
    xhr.send(formData);
    if (signal) {
      if (signal.aborted) {
        xhr.abort();
      } else {
        signal.addEventListener("abort", () => xhr.abort());
      }
    }
  });

  return {
    promise,
    cancel: () => xhr.abort(),
  };
};
