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
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: "teacher" | "head";
  subject?: string;
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
