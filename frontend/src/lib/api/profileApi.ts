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

export interface Profile {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  phoneNumber?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  avatar?: string;
  employmentInfo?: {
    position?: string;
    responsibilities?: string;
  };
}

export const getMe = async () => {
  const { data } = await api.get<{ success: boolean; data: { user: Profile } }>(
    "/api/profile/me"
  );
  return data.data.user;
};

export const updateProfile = async (payload: {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  // legacy/nested support for existing forms
  profile?: { phone?: string; address?: string };
  academicInfo?: {
    class?: string;
    section?: string;
    grade?: string;
    subjects?: string[];
  };
  employmentInfo?: {
    department?: string;
    position?: string;
    responsibilities?: string;
  };
}) => {
  const { data } = await api.put<{ success: boolean; data: { user: Profile } }>(
    "/api/profile",
    payload
  );
  return data.data.user;
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const { data } = await api.put<{ success: boolean; data: { user: Profile } }>(
    "/api/profile/avatar",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data.user;
};

export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  await api.put("/api/profile/change-password", payload);
};
