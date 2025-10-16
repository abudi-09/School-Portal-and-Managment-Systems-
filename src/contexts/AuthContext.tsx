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
  }) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
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
    }
  }, []);

  const login = async (credentials: {
    email?: string;
    password: string;
    studentId?: string;
  }): Promise<boolean> => {
    // Mock login - in production, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

    let foundUser: User | undefined;

    if (credentials.studentId) {
      // Student login
      foundUser = MOCK_USERS.find((u) => u.studentId === credentials.studentId);
    } else if (credentials.email) {
      // Teacher/Head/Admin login
      foundUser = MOCK_USERS.find((u) => u.email === credentials.email);
    }

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
      return true;
    }

    return false;
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
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  // eslint-disable-next-line react-refresh/only-export-components
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
