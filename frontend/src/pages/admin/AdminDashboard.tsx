import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  AlertCircle,
  Bell,
  X,
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
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              System overview and control center
            </p>
          </div>

          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative h-10 w-10 rounded-xl border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600" />
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
              className="w-80 rounded-xl border-gray-200 shadow-lg"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900">Notifications</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsSeen}
                    className="text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-1"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors ${
                        !notification.seen ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-sm text-gray-900 mb-1">
                            {notification.title}
                          </h5>
                          <p className="text-sm text-gray-600 mb-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mb-1">
                            {notification.user}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(notification.timestamp).toLocaleString()}
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
                          className="text-xs px-3 py-1 rounded-lg border-gray-200 hover:bg-gray-50"
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-3">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-xl bg-gray-100 ${stat.color} ml-4`}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Pending Actions */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Pending Actions
              </CardTitle>
              <CardDescription className="text-gray-600">
                Items requiring your attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingActions.map((item, index) => (
                <div
                  key={item.type}
                  className={`flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-all cursor-pointer ${
                    index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-base">
                      {item.type}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
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
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Recent Activity
              </CardTitle>
              <CardDescription className="text-gray-600">
                Latest system actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-4 rounded-xl ${
                    index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                  }`}
                >
                  <div className="h-3 w-3 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 mb-1">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {activity.user}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>{" "}
        {/* System Status */}
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              System Status
            </CardTitle>
            <CardDescription className="text-gray-600">
              Current academic term overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">
                  Current Term
                </p>
                <p className="text-2xl font-bold text-gray-900">Fall 2024</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">
                  Days Remaining
                </p>
                <p className="text-2xl font-bold text-gray-900">42 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Quick Actions */}
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-600">
              Frequently used administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                <Users className="h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-3" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  Add Student
                </span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group">
                <UserCheck className="h-8 w-8 text-gray-400 group-hover:text-green-500 mb-3" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                  Approve User
                </span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group">
                <UserX className="h-8 w-8 text-gray-400 group-hover:text-purple-500 mb-3" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                  Manage Access
                </span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all group">
                <AlertCircle className="h-8 w-8 text-gray-400 group-hover:text-orange-500 mb-3" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">
                  System Alerts
                </span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
