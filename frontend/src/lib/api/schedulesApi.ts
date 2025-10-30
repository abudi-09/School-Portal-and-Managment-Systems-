import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("API Request:", config.url, "Token present:", !!token);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Backend models
export interface BackendClassSchedule {
  _id: string;
  section: string;
  day: string;
  period?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  subject: string;
  teacherId?: string;
  room?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendExamSchedule {
  _id: string;
  grade: string;
  date: string; // ISO string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  subject: string;
  type: string;
  invigilator?: string;
  room?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export async function getClassSchedules(params?: {
  grade?: string;
  section?: string;
  day?: string;
  teacherId?: string;
}) {
  const { data } = await api.get<{
    success: boolean;
    data: { schedules: BackendClassSchedule[] };
  }>("/api/schedules/class", { params });
  return data.data.schedules;
}

export async function createClassSchedule(payload: {
  section: string;
  day: string;
  period?: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId?: string;
  room?: string;
}) {
  const { data } = await api.post<{
    success: boolean;
    data: { schedule: BackendClassSchedule };
  }>("/api/schedules/class", payload);
  return data.data.schedule;
}

export async function updateClassSchedule(
  id: string,
  payload: Partial<{
    section: string;
    day: string;
    period?: string;
    startTime: string;
    endTime: string;
    subject: string;
    teacherId?: string;
    room?: string;
  }>
) {
  const { data } = await api.put<{
    success: boolean;
    data: { schedule: BackendClassSchedule };
  }>(`/api/schedules/class/${id}`, payload);
  return data.data.schedule;
}

export async function deleteClassSchedule(id: string) {
  await api.delete(`/api/schedules/class/${id}`);
}

export async function getExamSchedules(params?: {
  type?: string;
  room?: string;
}) {
  const { data } = await api.get<{
    success: boolean;
    data: { schedules: BackendExamSchedule[] };
  }>("/api/schedules/exam", { params });
  return data.data.schedules;
}

export async function createExamSchedule(payload: {
  grade: string;
  date: string; // yyyy-mm-dd or ISO
  startTime: string;
  endTime: string;
  subject: string;
  type: string;
  invigilator?: string;
  room?: string;
}) {
  const { data } = await api.post<{
    success: boolean;
    data: { schedule: BackendExamSchedule };
  }>("/api/schedules/exam", payload);
  return data.data.schedule;
}

export async function updateExamSchedule(
  id: string,
  payload: Partial<{
    grade: string;
    date: string; // yyyy-mm-dd or ISO
    startTime: string;
    endTime: string;
    subject: string;
    type: string;
    invigilator?: string;
    room?: string;
  }>
) {
  const { data } = await api.put<{
    success: boolean;
    data: { schedule: BackendExamSchedule };
  }>(`/api/schedules/exam/${id}`, payload);
  return data.data.schedule;
}

export async function deleteExamSchedule(id: string) {
  await api.delete(`/api/schedules/exam/${id}`);
}

export async function getTeachers() {
  const { data } = await api.get<{
    success: boolean;
    data: {
      teachers: Array<{
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      }>;
    };
  }>("/api/head/teachers", { params: { isApproved: true } });
  return data.data.teachers;
}

// Rooms API
export interface Room {
  _id: string;
  name: string;
  capacity?: number;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export async function getRooms() {
  const { data } = await api.get<{ success: boolean; data: { rooms: Room[] } }>(
    "/api/rooms"
  );
  return data.data.rooms;
}

export async function createRoom(payload: {
  name: string;
  capacity?: number;
  active?: boolean;
}) {
  const { data } = await api.post<{ success: boolean; data: { room: Room } }>(
    "/api/rooms",
    payload
  );
  return data.data.room;
}

export async function updateRoom(
  id: string,
  payload: Partial<{ name: string; capacity?: number; active?: boolean }>
) {
  const { data } = await api.put<{ success: boolean; data: { room: Room } }>(
    `/api/rooms/${id}`,
    payload
  );
  return data.data.room;
}

export async function deleteRoom(id: string) {
  await api.delete(`/api/rooms/${id}`);
}
