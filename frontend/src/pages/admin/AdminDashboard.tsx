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
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/useAuth";
import { apiClient } from "@/lib/apiClient";
import { StatCardSkeleton } from "@/components/shared/LoadingSkeletons";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/patterns";
import StatsGrid from "@/components/admin/StatsGrid";
import { getAuthToken } from "@/lib/utils";

import type { ComponentType } from "react";
import type { SVGProps } from "react";
type StatItem = {
  title: string;
  value: string;
  change?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  color?: string;
};

type Notification = {
  id: number;
  title: string;
  message: string;
  user: string;
  seen: boolean;
  timestamp: string;
};

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:5000";

const authHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as HeadersInit;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.seen).length;
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );

  // Stats
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Activity
  const [activity, setActivity] = useState<
    { action: string; user: string; time: string }[]
  >([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  // System status
  const [systemStatus, setSystemStatus] = useState<{
    term?: string;
    daysRemaining?: number;
  }>({});
  const [loadingSystem, setLoadingSystem] = useState(true);
  const [systemError, setSystemError] = useState<string | null>(null);

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

  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [pendingActivationCount, setPendingActivationCount] = useState(0);

  const pendingActions = [
    {
      type: "Registration Approval",
      count: pendingApprovalsCount,
      priority: "high" as const,
    },
    {
      type: "Account Activation",
      count: pendingActivationCount,
      priority: "medium" as const,
    },
    { type: "ID Generation", count: 0, priority: "low" as const },
  ];

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(null);
    try {
      // Use admin users endpoint with minimal page size to read totals
      const qs = (q: Record<string, string | number>) =>
        new URLSearchParams({
          ...Object.fromEntries(
            Object.entries(q).map(([k, v]) => [k, String(v)])
          ),
        }).toString();

      const [studentsRes, teachersRes, activeRes, inactiveRes] =
        await Promise.all([
          fetch(
            `${apiBaseUrl}/api/admin/users?${qs({
              role: "student",
              page: 1,
              limit: 1,
            })}`,
            { headers: authHeaders() }
          ),
          fetch(
            `${apiBaseUrl}/api/admin/users?${qs({
              role: "teacher",
              page: 1,
              limit: 1,
            })}`,
            { headers: authHeaders() }
          ),
          fetch(
            `${apiBaseUrl}/api/admin/users?${qs({
              status: "approved",
              page: 1,
              limit: 1,
            })}`,
            { headers: authHeaders() }
          ),
          fetch(
            `${apiBaseUrl}/api/admin/users?${qs({
              status: "deactivated",
              page: 1,
              limit: 1,
            })}`,
            { headers: authHeaders() }
          ),
        ]);

      const pluckTotal = async (res: Response) => {
        if (!res.ok) return 0;
        const json = await res.json();
        return json?.data?.pagination?.total ?? 0;
      };

      const [studentsTotal, teachersTotal, activeTotal, inactiveTotal] =
        await Promise.all([
          pluckTotal(studentsRes),
          pluckTotal(teachersRes),
          pluckTotal(activeRes),
          pluckTotal(inactiveRes),
        ]);

      setStats([
        {
          title: "Total Students",
          value: String(studentsTotal),
          icon: Users,
          color: "text-primary",
        },
        {
          title: "Total Teachers",
          value: String(teachersTotal),
          icon: Users,
          color: "text-primary",
        },
        {
          title: "Active Accounts",
          value: String(activeTotal),
          icon: UserCheck,
          color: "text-success",
        },
        {
          title: "Inactive Accounts",
          value: String(inactiveTotal),
          icon: UserX,
          color: "text-muted-foreground",
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load stats";
      setStatsError(msg);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    setNotificationsError(null);
    try {
      // Pending approvals (heads + teachers)
      const res = await fetch(`${apiBaseUrl}/api/admin/users/pending`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load pending approvals");
      const json = await res.json();
      const heads = json?.data?.heads || [];
      const teachers = json?.data?.teachers || [];
      const totalPending = Number(json?.data?.totalPending ?? 0);
      setPendingApprovalsCount(totalPending);

      // Pending activations (status=pending)
      const pendingRes = await fetch(
        `${apiBaseUrl}/api/admin/users?status=pending&page=1&limit=1`,
        { headers: authHeaders() }
      );
      let pendingActivation = 0;
      if (pendingRes.ok) {
        const pjson = await pendingRes.json();
        pendingActivation = pjson?.data?.pagination?.total ?? 0;
      }
      setPendingActivationCount(pendingActivation);

      const notifs: Notification[] = [];
      if (heads.length) {
        notifs.push({
          id: 1,
          title: "Pending Head Approvals",
          message: `${heads.length} head${
            heads.length > 1 ? "s" : ""
          } awaiting review`,
          user: "System",
          seen: false,
          timestamp: new Date().toISOString(),
        });
      }
      if (teachers.length) {
        notifs.push({
          id: 2,
          title: "Pending Teacher Approvals",
          message: `${teachers.length} teacher${
            teachers.length > 1 ? "s" : ""
          } awaiting review`,
          user: "System",
          seen: false,
          timestamp: new Date().toISOString(),
        });
      }
      if (!heads.length && !teachers.length) {
        notifs.push({
          id: 3,
          title: "No pending approvals",
          message: "You're all caught up",
          user: "System",
          seen: true,
          timestamp: new Date().toISOString(),
        });
      }
      setNotifications(notifs);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load notifications";
      setNotificationsError(msg);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    setActivityError(null);
    try {
      // Request server-side filtered activity for admins and the current admin user
      const query: Record<string, string | number | undefined> = {
        role: "admin",
        actorId: user?.id,
        limit: 6,
      };
      const json = await apiClient(`/api/admin/activity`, {
        method: "GET",
        query,
      });
      const logs: Array<{
        time?: string;
        classId?: string;
        subject?: string;
        change?: string;
        actorName?: string;
        actorId?: string;
        actorRole?: string;
        toTeacherName?: string;
        fromTeacherName?: string;
      }> = json?.data?.logs ?? json?.logs ?? [];

      // If backend already filters by role & actorId, we can map directly.
      const items = logs.map((l) => ({
        action:
          l.change === "assign"
            ? `Assigned ${l.subject || "Subject"} (${l.classId || "-"})`
            : l.change === "reassign"
            ? `Reassigned ${l.subject || "Subject"} (${l.classId || "-"})`
            : l.change === "unassign"
            ? `Unassigned ${l.subject || "Subject"} (${l.classId || "-"})`
            : `Update for ${l.subject || "Subject"} (${l.classId || "-"})`,
        user: l.actorName || "System",
        time: l.time ? new Date(l.time).toLocaleString() : "",
      }));
      setActivity(items);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load activity";
      setActivityError(msg);
      setActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  }, [user]);

  const fetchSystemStatus = useCallback(async () => {
    setLoadingSystem(true);
    setSystemError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/system-status`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load system status");
      const json = await res.json();
      setSystemStatus({
        term: json?.data?.term,
        daysRemaining: json?.data?.daysRemaining,
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load system status";
      setSystemError(msg);
    } finally {
      setLoadingSystem(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchActivity();
    fetchSystemStatus();
  }, [fetchStats, fetchNotifications, fetchActivity, fetchSystemStatus]);

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
                          !notification.seen ? "bg-accent/10" : ""
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
                            <div className="h-2 w-2 bg-accent rounded-full flex-shrink-0 mt-2" />
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
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {statsError ? (
                <Alert className="border-destructive/30 bg-destructive/5 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {statsError}
                  </AlertDescription>
                </Alert>
              ) : (
                <StatsGrid stats={stats} />
              )}
            </>
          )}
        </section>
        {/* Registration Status Alert */}
        <Alert className="border-border bg-accent/10 rounded-xl shadow-sm">
          <AlertCircle className="h-5 w-5 text-accent" />
          <AlertDescription className="text-foreground">
            <span className="font-semibold">Registration Status:</span>{" "}
            Currently{" "}
            <Badge
              variant="default"
              className="ml-2 bg-accent/10 text-foreground hover:bg-accent/20"
            >
              Open
            </Badge>
          </AlertDescription>
        </Alert>
        {/* Head Signup Notification Alert */}
        {unreadCount > 0 && (
          <Alert className="border-border bg-accent/10 rounded-xl shadow-sm">
            <Bell className="h-5 w-5 text-accent" />
            <AlertDescription className="text-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-lg">New Head Signup</span>
                  <p className="text-sm mt-1 text-muted-foreground">
                    A new Head of School has registered. Review and approve
                    their account.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleViewNotification(notifications[0])}
                  className="ml-6 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
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
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/30 hover:bg-muted/10 transition-all group cursor-pointer"
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
              {loadingNotifications
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
              {loadingActivity && (
                <p className="text-sm text-muted-foreground">
                  Loading activity…
                </p>
              )}
              {activityError && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-destructive">{activityError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchActivity()}
                  >
                    Retry
                  </Button>
                </div>
              )}
              {!loadingActivity && !activityError && activity.length === 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    No recent activity for your admin account
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchActivity()}
                  >
                    Refresh
                  </Button>
                </div>
              )}
              {activity.map((act, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-3 rounded-xl ${
                    index % 2 === 0 ? "bg-muted/50" : "bg-card"
                  }`}
                >
                  <div className="h-3 w-3 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-foreground mb-1">
                      {act.action}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      {act.user}
                    </p>
                    <p className="text-xs text-muted-foreground">{act.time}</p>
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
            {loadingSystem && (
              <p className="text-sm text-muted-foreground">
                Loading system status…
              </p>
            )}
            {systemError && (
              <p className="text-sm text-destructive">{systemError}</p>
            )}
            {!loadingSystem && !systemError && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Term
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {systemStatus.term || "—"}
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Days Remaining
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {systemStatus.daysRemaining !== undefined
                      ? `${systemStatus.daysRemaining} days`
                      : "—"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
