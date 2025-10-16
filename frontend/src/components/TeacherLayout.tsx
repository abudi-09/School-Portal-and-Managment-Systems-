import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  GraduationCap,
  Bell,
  User,
  Menu,
  X,
  BookOpen,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { name: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
  { name: "Grades", href: "/teacher/grades", icon: GraduationCap },
  { name: "My Classes", href: "/teacher/classes", icon: BookOpen },
  { name: "Announcements", href: "/teacher/announcements", icon: Bell },
  { name: "Profile", href: "/teacher/profile", icon: User },
];

// Additional nav items for Head Class Teacher
const headTeacherNav = [
  { name: "Head Grade Mgmt", href: "/teacher/head-grade-management", icon: GraduationCap },
  { name: "Head Attendance", href: "/teacher/head-attendance", icon: Users },
];

const TeacherLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const isHeadTeacher = user?.isHeadClassTeacher || false;

  const allNavigation = isHeadTeacher
    ? [...navigation.slice(0, 3), ...headTeacherNav, ...navigation.slice(3)]
    : navigation;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-card shadow-md border border-border"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-6 border-b border-border">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">
                Teacher Portal
              </h1>
              <p className="text-xs text-muted-foreground">
                Academic Management
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {allNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/teacher"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User info */}
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <span className="text-sm font-semibold text-accent-foreground">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name || 'Teacher'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.subject ? `${user.subject} Dept.` : 'Teacher'}
                  {isHeadTeacher && <span className="ml-1">(Head)</span>}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default TeacherLayout;
