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
  { id: "1", name: "John Student", studentId: "STU001", role: "student" },
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
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

      // For student ID login, backend may not support it yet; keep mock fallback
      if (!credentials.email && credentials.studentId) {
        return mockLogin(credentials);
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Transform backend user data to frontend format
        const user: User = {
          id: data.data.user.id,
          name: `${data.data.user.firstName} ${data.data.user.lastName}`,
          email: data.data.user.email,
          role: data.data.user.role,
          subject:
            data.data.user.academicInfo?.subjects?.[0] ||
            data.data.user.employmentInfo?.position,
          position: data.data.user.employmentInfo?.position,
          isHeadClassTeacher:
            data.data.user.role === "teacher" &&
            data.data.user.employmentInfo?.position?.includes("Head"),
        };

        setUser(user);
        localStorage.setItem("currentUser", JSON.stringify(user));
        localStorage.setItem("token", data.data.token);

        return { success: true, user };
      } else {
        // Handle known auth states without falling back to mock
        const message: string | undefined = data?.message;
        const isPending =
          typeof message === "string" &&
          message.toLowerCase().includes("pending");
        return { success: false, pending: isPending, message };
      }
    } catch (error) {
      console.warn(
        "API call failed, using mock authentication only for local dev:",
        error
      );
      // Fallback to mock authentication only when API is unreachable (e.g., local dev)
      return mockLogin(credentials);
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
      // Student login
      foundUser = MOCK_USERS.find((u) => u.studentId === credentials.studentId);
    } else if (credentials.email) {
      // Teacher/Head/Admin login - include the Super Admin
      foundUser = MOCK_USERS.find((u) => u.email === credentials.email);
      // Also check for Super Admin
      if (!foundUser && credentials.email === "superadmin.pathways@gmail.com") {
        foundUser = {
          id: "super-admin",
          name: "Super Admin",
          email: "superadmin.pathways@gmail.com",
          role: "admin",
          position: "Super Administrator",
        };
      }
    }

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
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
        getRoleBasedRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export { AuthContext };
