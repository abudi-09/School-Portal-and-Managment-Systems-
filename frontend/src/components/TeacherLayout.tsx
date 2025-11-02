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
  Award,
  MessageCircle,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/useAuth";
import { Navbar } from "./Navbar";

const TeacherLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  // Check if teacher is also a Head Class Teacher
  const isHeadClassTeacher =
    user?.role === "teacher" && Boolean(user?.isHeadClassTeacher);

  // Build navigation based on role
  const baseNavigation = [
    { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { name: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
    { name: "Grades", href: "/teacher/grades", icon: GraduationCap },
  ];

  // Navigation items that appear before profile
  const preProfileNavigation = [
    { name: "My Classes", href: "/teacher/classes", icon: BookOpen },
    { name: "Messages", href: "/teacher/messages", icon: MessageCircle },
    { name: "Announcements", href: "/teacher/announcements", icon: Bell },
    { name: "Profile", href: "/teacher/profile", icon: User },
  ];

  // Additional navigation for Head Class Teachers (appears after profile)
  const headClassTeacherNavigation = [
    {
      name: "Teacher Attendance",
      href: "/teacher/attendance",
      icon: CalendarCheck,
      headOnly: true,
    },
    {
      name: "All Grades Management",
      href: "/teacher/head-grades",
      icon: Award,
    },
  ];

  // Combine navigation based on role
  const allNavigation = isHeadClassTeacher
    ? [
        ...baseNavigation,
        ...preProfileNavigation,
        ...headClassTeacherNavigation,
      ]
    : [...baseNavigation, ...preProfileNavigation];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar title="Teacher Portal" />

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-14 left-4 z-50">
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
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 pt-14",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {baseNavigation.map((item) => (
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
            {preProfileNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={false}
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
            {isHeadClassTeacher && (
              <>
                <div className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Head Class Teacher
                </div>
                <div className="px-4 pb-2 text-xs text-muted-foreground">
                  Showing role-specific links for{" "}
                  <span className="font-medium">Head</span>
                </div>
                {headClassTeacherNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={false}
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
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.headOnly && (
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground ml-2">
                          Head only
                        </span>
                      )}
                    </div>
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* User info */}
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <span className="text-sm font-semibold text-accent-foreground">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "T"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name || "Teacher"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.subject ? `${user.subject} Dept.` : "Teacher"}
                  {isHeadClassTeacher && <span className="ml-1">(Head)</span>}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors border border-gray-200 bg-white"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 pt-14">
        <main className="min-h-screen p-3">
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
