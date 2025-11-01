export type UserRole = "student" | "teacher" | "head" | "admin";

export interface User {
  id: string;
  name: string;
  email?: string;
  studentId?: string;
  role: UserRole;
  subject?: string;
  position?: string;
  isHeadClassTeacher?: boolean;
  // New: granular capability context
  responsibilities?: string[]; // e.g., ["HeadClass:9a", "SubjectTeacher:10b:Math"]
  assignedClassIds?: string[]; // canonical class ids like "9a", "10b"
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: "teacher" | "head";
  subject?: string;
  grade?: 9 | 10 | 11 | 12;
  stream?: "natural" | "social";
  position?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: {
    email?: string;
    password: string;
    studentId?: string;
  }) => Promise<{
    success: boolean;
    user?: User;
    pending?: boolean;
    message?: string;
    code?: string;
  }>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  getRoleBasedRedirect: (role: UserRole) => string;
}
