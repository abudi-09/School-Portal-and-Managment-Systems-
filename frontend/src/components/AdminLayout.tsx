import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Settings,
  User,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  Menu,
  X,
e  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";

const AdminLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Student Management", href: "/admin/students", icon: Users },
    {
      name: "Head Management",
      href: "/admin/head-management",
      icon: GraduationCap,
    },
    { name: "User Management", href: "/admin/users", icon: UserCog },
    { name: "Messages", href: "/admin/messages", icon: MessageCircle },
    {
      name: "Registration Control",
      href: "/admin/registration",
      icon: ClipboardCheck,
    },
    { name: "Profile", href: "/admin/profile", icon: User },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar title="Admin Portal" />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-14 left-4 z-50 p-2 rounded-lg bg-card border border-border"
      >
        {mobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 pt-14",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
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

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 min-h-screen">
        <div className="p-3">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
