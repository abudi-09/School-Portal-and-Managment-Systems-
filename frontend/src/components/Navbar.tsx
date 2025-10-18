import { Link, useNavigate } from "react-router-dom";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  title?: string;
}

export const Navbar = ({ title = "Pathways" }: NavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboardRoute = () => {
    switch (user?.role) {
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

  const getProfileRoute = () => {
    switch (user?.role) {
      case "admin":
        return "/admin/profile";
      case "head":
        return "/head/profile";
      case "teacher":
        return "/teacher/profile";
      case "student":
      default:
        return "/profile";
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = () => {
    switch (user?.role) {
      case "admin":
        return "Administrator";
      case "head":
        return "Head Teacher";
      case "teacher":
        return user?.isHeadClassTeacher ? "Head Class Teacher" : "Teacher";
      case "student":
        return "Student";
      default:
        return "User";
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo/Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Settings className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-auto rounded-full pl-2 pr-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.name || "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground truncate max-w-32">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getRoleDisplay()}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 p-2 shadow-lg border-border/50"
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-3 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getRoleDisplay()}
                </p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem
              className="px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors rounded-md"
              onClick={() => navigate(getProfileRoute())}
            >
              <User className="mr-3 h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors rounded-md"
              onClick={() => navigate(getDashboardRoute())}
            >
              <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem
              className="px-3 py-2.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors rounded-md"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
