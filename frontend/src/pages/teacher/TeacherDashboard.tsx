import {
  BookOpen,
  Users,
  ClipboardCheck,
  Calendar,
  Bell,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/patterns";
import { StatCard } from "@/components/patterns";
import { EmptyState } from "@/components/patterns";
import { useAuth } from "@/contexts/useAuth";
import { useEffect, useState, useCallback } from "react";
import { StatCardSkeleton } from "@/components/shared/LoadingSkeletons";
import { getAuthToken } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

type StatItem = {
  key: string;
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "success" | "info" | "warning" | "default";
};

type NotificationItem = {
  id: string;
  title: string;
  sender: string;
  date: string;
  priority: "high" | "medium" | "low";
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

const TeacherDashboard = () => {
  const { user } = useAuth();
  const token = getAuthToken();

  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatItem[]>([]);

  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [loadingUrgent, setLoadingUrgent] = useState(true);
  const [urgentTasks, setUrgentTasks] = useState<
    { task: string; deadline: string }[]
  >([]);

  const fetchStats = useCallback(async () => {
    if (!token) {
      setLoadingStats(false);
      setStatsError("Not authenticated");
      return;
    }
    setLoadingStats(true);
    setStatsError(null);
    try {
      const teacherId = (() => {
        if (!user) return undefined;
        const raw = user as unknown as { _id?: unknown; id?: unknown };
        const val = raw._id ?? raw.id;
        return typeof val === "string"
          ? val
          : (val as { toString?: () => string })?.toString?.();
      })();

      // Fetch classes
      let totalClasses = 0;
      try {
        const headRes = await fetch(`${apiBaseUrl}/api/teacher/my-head-class`, {
          headers: authHeaders(),
        });
        if (headRes.ok) {
          const headJson = await headRes.json();
          if (headJson?.success) totalClasses = 1;
        }
      } catch (_) {}

      // Fetch subject assignments
      const subjRes = await fetch(
        `${apiBaseUrl}/api/head/subject-assignments`,
        { headers: authHeaders() }
      );
      let subjectClassIds: string[] = [];
      if (subjRes.ok) {
        const subjJson = await subjRes.json();
        const assignments: Array<{
          classId?: string;
          teacherId?: string;
        }> = subjJson?.data?.assignments || [];
        subjectClassIds = Array.from(
          new Set(
            assignments
              .filter((a) => a.teacherId === teacherId)
              .map((a) => a.classId || "")
              .filter(Boolean)
          )
        );
      }

      totalClasses += subjectClassIds.length;

      // Mock data for other stats (replace with real API calls)
      const studentsTaught = totalClasses * 30; // Approximate
      const pendingGrading = 12;
      const upcomingExams = 3;

      setStats([
        {
          key: "classes",
          title: "Total Classes",
          value: totalClasses,
          icon: BookOpen,
          variant: "info",
        },
        {
          key: "students",
          title: "Students Taught",
          value: studentsTaught,
          icon: Users,
          variant: "success",
        },
        {
          key: "grading",
          title: "Pending Grading",
          value: pendingGrading,
          icon: ClipboardCheck,
          variant: "warning",
        },
        {
          key: "exams",
          title: "Upcoming Exams",
          value: upcomingExams,
          icon: Calendar,
          variant: "default",
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load stats";
      setStatsError(msg);
    } finally {
      setLoadingStats(false);
    }
  }, [token, user]);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      // Mock notifications (replace with real API)
      setNotifications([
        {
          id: "1",
          title: "New assignment submission",
          sender: "John Doe",
          date: "2 hours ago",
          priority: "high",
        },
        {
          id: "2",
          title: "Grade review request",
          sender: "Jane Smith",
          date: "5 hours ago",
          priority: "medium",
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const fetchUrgentTasks = useCallback(async () => {
    setLoadingUrgent(true);
    try {
      // Mock urgent tasks (replace with real API)
      setUrgentTasks([
        { task: "Grade Mathematics midterm exams", deadline: "Tomorrow" },
        { task: "Submit attendance report", deadline: "Friday" },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUrgent(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchUrgentTasks();
  }, [fetchStats, fetchNotifications, fetchUrgentTasks]);

  const handleRefresh = () => {
    fetchStats();
    fetchNotifications();
    fetchUrgentTasks();
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Teacher Dashboard"
        description="Manage your classes, track student progress, and stay organized"
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))
        ) : statsError ? (
          <div className="col-span-full">
            <p className="text-sm text-destructive">{statsError}</p>
          </div>
        ) : (
          stats.map((s) => (
            <StatCard
              key={s.key}
              label={s.title}
              value={s.value}
              icon={s.icon}
              variant={s.variant}
            />
          ))
        )}
      </div>

      {/* Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Access your most-used features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link to="/teacher/classes" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col gap-2"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span className="text-sm">My Classes</span>
                  </Button>
                </Link>
                <Link to="/teacher/grades" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col gap-2"
                  >
                    <ClipboardCheck className="h-5 w-5" />
                    <span className="text-sm">Grade Students</span>
                  </Button>
                </Link>
                <Link to="/teacher/attendance" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col gap-2"
                  >
                    <Users className="h-5 w-5" />
                    <span className="text-sm">Attendance</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Urgent Tasks
              </CardTitle>
              <CardDescription>
                Items requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUrgent ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : urgentTasks.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="All caught up!"
                  description="No urgent tasks at the moment."
                />
              ) : (
                <div className="space-y-3">
                  {urgentTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.task}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {task.deadline}
                        </p>
                      </div>
                      <Badge variant="destructive">Urgent</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
              <CardDescription>Latest updates</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingNotifications ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No notifications"
                  description="You're all caught up!"
                />
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notif.sender} • {notif.date}
                        </p>
                      </div>
                      {notif.priority === "high" && (
                        <Badge variant="destructive" className="text-xs">
                          High
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Classes
              </CardTitle>
              <CardDescription>Your schedule for today</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Calendar}
                title="Schedule preview"
                description="Your class schedule will appear here."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
