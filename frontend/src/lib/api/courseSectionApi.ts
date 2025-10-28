import { getAuthToken } from "@/lib/utils";

export type GradeLevel = 9 | 10 | 11 | 12;

export type CoursePayload = {
  grade: GradeLevel;
  name: string;
  isMandatory?: boolean;
};

export type SectionPayload = {
  grade: GradeLevel;
  label: string;
  capacity?: number;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

async function authorizedFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication token missing");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (payload as { message?: string }).message ?? "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export async function listCoursesByGrade(grade: GradeLevel) {
  return authorizedFetch<{
    success: boolean;
    data: { courses: CourseResponse[] };
  }>(`/api/admin/courses?grade=${grade}`);
}

export async function createCourse(payload: CoursePayload) {
  return authorizedFetch<{
    success: boolean;
    data: { course: CourseResponse };
  }>("/api/admin/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listSectionsByGrade(grade: GradeLevel) {
  return authorizedFetch<{
    success: boolean;
    data: { sections: SectionResponse[] };
  }>(`/api/admin/sections?grade=${grade}`);
}

export async function createSection(payload: SectionPayload) {
  return authorizedFetch<{
    success: boolean;
    data: { section: SectionResponse };
  }>("/api/admin/sections", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteCourse(id: string) {
  return authorizedFetch<{
    success: boolean;
    data: { course: CourseResponse };
  }>(`/api/admin/courses/${id}`, {
    method: "DELETE",
  });
}

export async function deleteSection(id: string) {
  return authorizedFetch<{
    success: boolean;
    data: { section: SectionResponse };
  }>(`/api/admin/sections/${id}`, {
    method: "DELETE",
  });
}

export type CourseResponse = {
  id: string;
  name: string;
  grade: GradeLevel;
  isMandatory?: boolean;
  createdAt?: string;
};

export type SectionResponse = {
  id: string;
  label: string;
  grade: GradeLevel;
  capacity?: number;
  createdAt?: string;
};
