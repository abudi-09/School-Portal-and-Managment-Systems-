import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "Announcements API Error:",
      error.response?.status,
      error.response?.data
    );
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
  type: AnnouncementType;
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
