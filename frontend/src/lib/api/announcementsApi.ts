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
    console.error("Announcements API Error:", error.response?.status, error.response?.data);
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

export async function getAnnouncements(params: { type: AnnouncementType; page: number; pageSize: number }) {
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
  const { data } = await api.get<{ success: boolean; data: { unreadCount: number } }>(
    "/api/announcements/unread-count"
  );
  return data.data.unreadCount;
}
