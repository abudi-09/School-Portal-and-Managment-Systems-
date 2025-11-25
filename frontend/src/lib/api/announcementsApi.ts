import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    console.error(
      "Announcements API: failed to read token for request headers",
      e
    );
  }

  // Debug: log request summary to help diagnose invalid payloads
  try {
    console.debug("Announcements API Request:", {
      method: config.method,
      url: config.url,
      dataType:
        config.data === undefined
          ? "undefined"
          : Object.prototype.toString.call(config.data),
      data: config.data,
    });
  } catch (e) {
    console.debug("Announcements API Request: unable to serialize data", e);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network errors (no response) will have undefined response — include the message and request for diagnosis
    if (!error.response) {
      console.error("Announcements API Network Error:", error.message, {
        request: error.request,
      });
    } else {
      console.error(
        "Announcements API Error:",
        error.response.status,
        error.response.data
      );
    }
    return Promise.reject(error);
  }
);

export type AnnouncementType = "school" | "teacher";

export interface AnnouncementAttachment {
  filename: string;
  url: string;
  mimeType?: string;
  size?: number;
}

export interface AnnouncementItem {
  _id: string;
  title: string;
  postedBy: { user: string; name: string; role: string };
  date: string; // ISO
  type: AnnouncementType;
  message: string;
  attachments: AnnouncementAttachment[];
  isRead?: boolean;
}

export async function getAnnouncements(params: {
  type?: AnnouncementType;
  page: number;
  pageSize: number;
}) {
  const { data } = await api.get<{
    success: boolean;
    data: { items: AnnouncementItem[]; total: number; unreadCount: number };
  }>("/api/announcements", { params });
  return data.data;
}

export async function markRead(id: string) {
  await api.put(`/api/announcements/${id}/mark-read`);
}

export async function markReadBulk(ids: string[]) {
  await api.put(`/api/announcements/mark-read-bulk`, { ids });
}

export async function getUnreadCount() {
  const { data } = await api.get<{
    success: boolean;
    data: { unreadCount: number };
  }>("/api/announcements/unread-count");
  return data.data.unreadCount;
}

export type AudienceScope = "all" | "teachers" | "students" | "class";

export interface CreateAnnouncementInput {
  title: string;
  message: string;
  type: AnnouncementType; // teachers can only create 'teacher'
  attachments?: AnnouncementAttachment[]; // URL-based attachments
  audience?: { scope?: AudienceScope; classId?: string };
  date?: string | Date;
}

export async function createAnnouncement(input: CreateAnnouncementInput) {
  if (!input || typeof input !== "object") {
    console.error("createAnnouncement called with invalid input:", input);
    throw new TypeError("createAnnouncement input must be an object");
  }
  const { data } = await api.post<{ success: boolean; data: AnnouncementItem }>(
    "/api/announcements",
    input
  );
  return data.data;
}

export interface UpdateAnnouncementInput {
  title?: string;
  message?: string;
  type?: AnnouncementType; // only admin/head can change
  attachments?: AnnouncementAttachment[];
  audience?: { scope?: AudienceScope; classId?: string };
  date?: string | Date;
  archived?: boolean;
}

export async function updateAnnouncement(
  id: string,
  input: UpdateAnnouncementInput
) {
  if (!input || typeof input !== "object") {
    console.error("updateAnnouncement called with invalid input:", input);
    throw new TypeError("updateAnnouncement input must be an object");
  }
  const { data } = await api.put<{ success: boolean; data: AnnouncementItem }>(
    `/api/announcements/${id}`,
    input
  );
  return data.data;
}

export async function deleteAnnouncement(
  id: string,
  opts?: { hard?: boolean }
) {
  await api.delete(`/api/announcements/${id}`, {
    params: { hard: opts?.hard ? "true" : undefined },
  });
}
