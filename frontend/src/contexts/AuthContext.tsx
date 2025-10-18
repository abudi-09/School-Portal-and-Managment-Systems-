import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type UserRole = "student" | "teacher" | "head" | "admin";

export interface User {
  id: string;
  name: string;
  email?: string;
  studentId?: string;
  role: UserRole;
  subject?: string;
  position?: string;
  // Optional flag: a teacher who is also a head/class lead
  isHeadClassTeacher?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: {
    email?: string;
    password: string;
    studentId?: string;
  }) => Promise<{ success: boolean; user?: User }>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  getRoleBasedRedirect: (role: UserRole) => string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: "teacher" | "head";
  subject?: string;
  position?: string;
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
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Auto-login as Sarah Teacher (Head Class Teacher) for testing
      const sarahTeacher = MOCK_USERS.find(
        (u) => u.email === "sarah@school.edu"
      );
      if (sarahTeacher) {
        setUser(sarahTeacher);
        localStorage.setItem("currentUser", JSON.stringify(sarahTeacher));
      }
    }
  }, []);

  const login = async (credentials: {
    email?: string;
    password: string;
    studentId?: string;
  }): Promise<{ success: boolean; user?: User }> => {
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

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
        console.warn("API login failed, falling back to mock authentication");
        // Fallback to mock authentication if API fails
        return mockLogin(credentials);
      }
    } catch (error) {
      console.warn(
        "API call failed, falling back to mock authentication:",
        error
      );
      // Fallback to mock authentication if API is not available
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
    // Mock signup - in production, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      email: data.email,
      role: data.role,
      subject: data.subject,
      position: data.position,
    };

    // In production, this would require admin approval
    // For now, we'll just add to pending users
    const pendingUsers = JSON.parse(
      localStorage.getItem("pendingUsers") || "[]"
    );
    pendingUsers.push(newUser);
    localStorage.setItem("pendingUsers", JSON.stringify(pendingUsers));

    return true;
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
