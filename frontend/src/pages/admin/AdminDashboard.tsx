import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  AlertCircle,
  Bell,
  X,
  Award,
  Trophy,
  ClipboardList,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { StatCardSkeleton } from "@/components/shared/LoadingSkeletons";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/StatCard";
import StatsGrid from "@/components/admin/StatsGrid";

type Notification = {
  id: number;
  title: string;
  message: string;
  user: string;
  seen: boolean;
  timestamp: string;
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "New Head Signup",
      message:
        "A new Head of School has registered. Review and approve their account.",
      user: "Abdurahman Suali",
      seen: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: 2,
      title: "New Head Signup",
      message:
        "A new Head of School has registered. Review and approve their account.",
      user: "Sarah Johnson",
      seen: false,
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.seen).length;

  const [isDemoLoading, setIsDemoLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsDemoLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const markAsSeen = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, seen: true } : notification
      )
    );
  };

  const markAllAsSeen = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, seen: true }))
    );
  };

  const handleViewNotification = (notification: Notification) => {
    markAsSeen(notification.id);

    {
      /* Enhanced Stats Grid */
    }
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="transform hover:scale-105 transition-all duration-300">
        <StatCard
          title="Current GPA"
          value="3.85"
          icon={Award}
          trend={{ value: "+0.15", isPositive: true }}
          description="Above average"
          variant="success"
        />
      </div>
      <div className="transform hover:scale-105 transition-all duration-300">
        <StatCard
          title="Class Rank"
          value="#8"
          icon={Trophy}
          description="Out of 120 students"
          variant="accent"
        />
      </div>
      <div className="transform hover:scale-105 transition-all duration-300">
        <StatCard
          title="Pending Assignments"
          value="5"
          icon={ClipboardList}
          description="2 due this week"
          variant="warning"
        />
      </div>
      <div className="transform hover:scale-105 transition-all duration-300">
        <StatCard
          title="Attendance Rate"
          value="96%"
          icon={TrendingUp}
          description="Excellent record"
          variant="success"
        />
      </div>
    </div>;
    navigate("/admin/head-management");
  };
  const stats = [
    {
      title: "Total Students",
      value: "1,247",
      change: "+12%",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Total Teachers",
      value: "89",
      change: "+3%",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Active Accounts",
      value: "1,298",
      change: "+5%",
      icon: UserCheck,
      color: "text-success",
    },
    {
      title: "Inactive Accounts",
      value: "38",
      change: "-8%",
      icon: UserX,
      color: "text-muted-foreground",
    },
  ];

  const recentActivity = [
    {
      action: "New student registered",
      user: "John Doe",
      time: "2 minutes ago",
    },
    {
      action: "Teacher account activated",
      user: "Sarah Smith",
      time: "15 minutes ago",
    },
    { action: "Student ID generated", user: "Emma Wilson", time: "1 hour ago" },
    {
      action: "Registration approved",
      user: "Michael Brown",
      time: "2 hours ago",
    },
  ];

  const pendingActions = [
    { type: "Registration Approval", count: 12, priority: "high" },
    { type: "Account Activation", count: 5, priority: "medium" },
    { type: "ID Generation", count: 8, priority: "low" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-2 lg:p-4 space-y-6">
        <section className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card rounded-2xl p-3 shadow-sm border border-border">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                System overview and control center
              </p>
            </div>

            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-10 w-10 rounded-xl border-border hover:bg-muted transition-colors"
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 rounded-xl border-border shadow-lg"
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h4 className="font-semibold text-foreground">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsSeen}
                      className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1"
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-border last:border-b-0 ${
                          !notification.seen ? "bg-blue-50/30" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-sm text-foreground mb-1">
                              {notification.title}
                            </h5>
                            <p className="text-sm text-muted-foreground mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mb-1">
                              {notification.user}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                notification.timestamp
                              ).toLocaleString()}
                            </p>
                          </div>
                          {!notification.seen && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewNotification(notification)}
                            className="text-xs px-3 py-1 rounded-lg border-border hover:bg-muted"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats Grid */}
          {isDemoLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <StatsGrid
              stats={stats.map((s) => ({
                title: s.title,
                value: s.value,
                change: s.change,
                icon: s.icon,
                color: s.color,
              }))}
            />
          )}
        </section>
        {/* Registration Status Alert */}
        <Alert className="border-blue-200 bg-blue-50/50 rounded-xl shadow-sm">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <span className="font-semibold">Registration Status:</span>{" "}
            Currently{" "}
            <Badge
              variant="default"
              className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              Open
            </Badge>
          </AlertDescription>
        </Alert>
        {/* Head Signup Notification Alert */}
        {unreadCount > 0 && (
          <Alert className="border-blue-200 bg-blue-50 rounded-xl shadow-sm">
            <Bell className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-lg">New Head Signup</span>
                  <p className="text-sm mt-1 text-blue-700">
                    A new Head of School has registered. Review and approve
                    their account.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    handleViewNotification(notifications.find((n) => !n.seen)!)
                  }
                  className="ml-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
                >
                  View
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {/* Removed duplicate Stats Grid; use StatsGrid component above */}
        {/* Quick Actions */}
        <Card className="bg-card rounded-2xl shadow-sm border border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Frequently used administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => navigate("/admin/students")}
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border hover:border-blue-300 hover:bg-muted/10 transition-all group cursor-pointer"
              >
                <Users className="h-8 w-8 text-muted-foreground group-hover:text-foreground mb-3" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                  Add Student
                </span>
              </div>
              <div
                onClick={() => navigate("/admin/head-management")}
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border hover:border-green-300 hover:bg-muted/10 transition-all group cursor-pointer"
              >
                <UserCheck className="h-8 w-8 text-muted-foreground group-hover:text-foreground mb-3" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                  Approve User
                </span>
              </div>
              <div
                onClick={() => navigate("/admin/users")}
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border hover:border-purple-300 hover:bg-muted/10 transition-all group cursor-pointer"
              >
                <UserX className="h-8 w-8 text-muted-foreground group-hover:text-foreground mb-3" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                  Manage Access
                </span>
              </div>
              <div
                onClick={() => navigate("/admin/registration")}
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border hover:border-orange-300 hover:bg-muted/10 transition-all group cursor-pointer"
              >
                <AlertCircle className="h-8 w-8 text-muted-foreground group-hover:text-foreground mb-3" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                  System Alerts
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Pending Actions */}
          <Card className="bg-card rounded-2xl shadow-sm border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-foreground">
                Pending Actions
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Items requiring your attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isDemoLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-border bg-muted/40 animate-pulse"
                    >
                      <div className="h-4 bg-muted/30 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted/30 rounded w-1/3" />
                    </div>
                  ))
                : pendingActions.map((item, index) => (
                    <div
                      key={item.type}
                      onClick={() => {
                        if (item.type === "Registration Approval") {
                          navigate("/admin/head-management");
                        } else if (item.type === "Account Activation") {
                          navigate("/admin/users");
                        } else if (item.type === "ID Generation") {
                          navigate("/admin/students");
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border border-border hover:shadow-sm transition-all cursor-pointer ${
                        index % 2 === 0 ? "bg-muted/50" : "bg-card"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-foreground text-base">
                          {item.type}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.count} pending
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.priority === "high"
                            ? "destructive"
                            : item.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                        className="px-3 py-1 text-xs font-medium"
                      >
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card rounded-2xl shadow-sm border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-foreground">
                Recent Activity
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Latest system actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-3 rounded-xl ${
                    index % 2 === 0 ? "bg-muted/50" : "bg-card"
                  }`}
                >
                  <div className="h-3 w-3 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-foreground mb-1">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      {activity.user}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>{" "}
        {/* System Status */}
        <Card className="bg-card rounded-2xl shadow-sm border border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">
              System Status
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Current academic term overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Current Term
                </p>
                <p className="text-2xl font-bold text-foreground">Fall 2024</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Days Remaining
                </p>
                <p className="text-2xl font-bold text-foreground">42 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
