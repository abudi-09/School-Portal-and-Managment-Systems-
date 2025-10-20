import { createContext, useState, useEffect, ReactNode } from "react";

import { AuthContextType, SignupData, User, UserRole } from "./auth-types";

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "teacher" | "head";
  academicInfo?: { subjects?: string[] };
  employmentInfo?: { position?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "John Student",
    studentId: "STU-2024-0001",
    role: "student",
  },
  {
    id: "2",
    name: "Sarah Teacher",
    email: "sarah@school.edu",
    role: "teacher",
    subject: "Mathematics",
    isHeadClassTeacher: true,
  },
  {
    id: "3",
    name: "Michael Head",
    email: "michael@school.edu",
    role: "head",
    position: "Head of School",
  },
  { id: "4", name: "Admin User", email: "admin@school.edu", role: "admin" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    } else {
      // Clear any stale user data if token is missing
      setUser(null);
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: {
    email?: string;
    password: string;
    studentId?: string;
  }): Promise<{
    success: boolean;
    user?: User;
    pending?: boolean;
    message?: string;
  }> => {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
    const useMock = (import.meta.env.VITE_USE_MOCK as string) === "true";

    try {
      const payload: Record<string, string> = {
        password: credentials.password,
      };

      if (credentials.email) {
        payload.email = credentials.email;
      }

      const normalizedStudentId = credentials.studentId
        ?.toString()
        .trim()
        .toUpperCase();
      if (normalizedStudentId) {
        payload.studentId = normalizedStudentId;
      }

      console.log(
        "Attempting API login:",
        payload.email ?? payload.studentId ?? "unknown"
      );

      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("API response:", response.status, data);

      if (response.ok && data.success) {
        const userData = data.data.user;
        const fullName = `${userData.firstName ?? ""} ${
          userData.lastName ?? ""
        }`
          .trim()
          .replace(/\s+/g, " ");

        const user: User = {
          id: userData.id,
          name: fullName || userData.email || userData.studentId || "User",
          email: userData.email,
          studentId: userData.studentId,
          role: userData.role,
          subject: userData.academicInfo?.subjects?.[0],
          position: userData.employmentInfo?.position,
          isHeadClassTeacher:
            userData.role === "teacher" &&
            Boolean(userData.employmentInfo?.position?.includes("Head")),
        };

        setUser(user);
        localStorage.setItem("currentUser", JSON.stringify(user));
        localStorage.setItem("token", data.data.token);

        return { success: true, user };
      }

      const message: string | undefined = data?.message;
      const isPending =
        typeof message === "string" &&
        message.toLowerCase().includes("pending");
      return { success: false, pending: isPending, message };
    } catch (error) {
      console.warn("API call failed:", error);

      if (useMock) {
        console.log(
          "API login failed with network error, using mock because VITE_USE_MOCK=true"
        );
        return mockLogin(credentials);
      }

      return {
        success: false,
        message: "Network error: failed to reach authentication API.",
      };
    }
  };

  // Mock login function for fallback
  const mockLogin = async (credentials: {
    email?: string;
    password: string;
    studentId?: string;
  }): Promise<{ success: boolean; user?: User }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    let foundUser: User | undefined;

    if (credentials.studentId) {
      const normalizedStudentId = credentials.studentId
        ?.toString()
        .trim()
        .toUpperCase();
      // Student login
      foundUser = MOCK_USERS.find((u) => u.studentId === normalizedStudentId);
    } else if (credentials.email) {
      // Teacher/Head/Admin login - include the Super Admin
      foundUser = MOCK_USERS.find((u) => u.email === credentials.email);
      // Also check for Super Admin
      if (!foundUser && credentials.email === "superadmin@pathways.local") {
        foundUser = {
          id: "super-admin",
          name: "Super Admin",
          email: "superadmin@pathways.local",
          role: "admin",
          position: "Super Administrator",
        };
      }
    }

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
      localStorage.setItem("token", "mock-token");
      return { success: true, user: foundUser };
    }

    return { success: false };
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
    try {
      const [firstName, ...rest] = data.name.trim().split(" ");
      const lastName = rest.join(" ") || "";

      const payload: RegisterPayload = {
        email: data.email,
        password: data.password,
        firstName,
        lastName,
        role: data.role,
      };

      // Optional structured info
      if (data.role === "teacher" && data.subject) {
        payload.academicInfo = { subjects: [data.subject] };
      }
      if (data.role === "head" && data.position) {
        payload.employmentInfo = { position: data.position };
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        return true; // account created in pending state
      }

      console.warn("Signup failed:", result?.message || response.statusText);
      return false;
    } catch (err) {
      console.warn(
        "Signup API unavailable, storing locally as pending (dev-only)",
        err
      );
      // Dev fallback - mimic pending registration
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        email: data.email,
        role: data.role,
        subject: data.subject,
        position: data.position,
      };
      const pendingUsers = JSON.parse(
        localStorage.getItem("pendingUsers") || "[]"
      );
      pendingUsers.push(newUser);
      localStorage.setItem("pendingUsers", JSON.stringify(pendingUsers));
      return true;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    // Use React Router navigation instead of window.location
    window.location.href = "/login";
  };

  const getRoleBasedRedirect = (role: UserRole): string => {
    switch (role) {
      case "admin":
        return "/admin";
      case "head":
        return "/head";
      case "teacher":
        return "/teacher";
      case "student":
      default:
        return "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isLoading,
        getRoleBasedRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export { AuthContext };
