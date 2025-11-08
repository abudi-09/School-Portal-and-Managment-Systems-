import {
  BookOpen,
  Users,
  ClipboardCheck,
  Calendar,
  Bell,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// (Button & Badge already imported below in original file; avoid duplicate imports)
import { useAuth } from "@/contexts/useAuth";
import { useEffect, useState, useCallback } from "react";
import { StatCardSkeleton } from "@/components/shared/LoadingSkeletons";
import { getAuthToken } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type StatItem = {
  key: string;
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  error?: string | null;
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

  // Dashboard state
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatItem[]>([]);

  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );
  const [recentNotificationsState, setRecentNotificationsState] = useState<
    NotificationItem[]
  >([]);

  const [loadingUrgent, setLoadingUrgent] = useState(true);
  const [urgentError, setUrgentError] = useState<string | null>(null);
  const [urgentActionsState, setUrgentActionsState] = useState<
    { task: string; deadline: string }[]
  >([]);

  // Fetch total classes the teacher is involved in (head or subject assignments)
  const fetchStats = useCallback(async () => {
    if (!token) {
      setLoadingStats(false);
      setStatsError("Not authenticated");
      return;
    }
    setLoadingStats(true);
    setStatsError(null);
    try {
      // Prefer known id field; broaden via index signature instead of any assertion
      const teacherId = (() => {
        if (!user) return undefined;
        // Use dynamic access via unknown cast to satisfy TS without any
        const raw = user as unknown as { _id?: unknown; id?: unknown };
        const val = raw._id ?? raw.id;
        return typeof val === "string"
          ? val
          : (val as { toString?: () => string })?.toString?.();
      })();

      // 1. Head-of-class assignment (0 or 1)
      let headClassCount = 0;
      try {
        const headRes = await fetch(`${apiBaseUrl}/api/teacher/my-head-class`, {
          headers: authHeaders(),
        });
        if (headRes.ok) {
          const headJson = await headRes.json();
          if (headJson?.success) headClassCount = 1; // existence implies one
        }
      } catch (_) {
        // ignore
      }

      // 2. Subject assignments for this teacher (need to query all assignments and count unique classIds)
      // Reuse head endpoint for subject assignments
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

      const totalClasses = headClassCount + subjectClassIds.length;

      // 3. Students taught: aggregate unique students across those classes (approximate via class sections)
      let studentsTaught = 0;
      if (subjectClassIds.length || headClassCount) {
        // Parse classIds into grade+section, fetch students per class
        const classIdsToCheck = [
          ...(headClassCount ? subjectClassIds.slice(0, 0) : []),
          ...subjectClassIds,
        ];
        const studentIdsSet = new Set<string>();
        for (const cid of classIdsToCheck) {
          const match = cid.match(/^(\d+)([A-Za-z])$/);
          if (!match) continue;
          const grade = match[1];
          const section = match[2];
          const stuRes = await fetch(
            `${apiBaseUrl}/api/teacher/students?grade=${grade}&section=${section}`,
            { headers: authHeaders() }
          );
          if (stuRes.ok) {
            const stuJson = await stuRes.json();
            const arr: Array<{ id?: string }> = stuJson?.data?.students || [];
            for (const s of arr) if (s.id) studentIdsSet.add(s.id);
          }
        }
        studentsTaught = studentIdsSet.size;
      }

      // 4. Pending grading: number of subject assignments that lack evaluations (simplified placeholder)
      // Without a direct endpoint, approximate as subject assignments count *some factor minus evaluations we could query later.
      const pendingGrading = subjectClassIds.length * 3; // heuristic placeholder

      // 5. Upcoming exams (reuse /api/examSchedules and filter by courses taught?) For now: count all future exams for grades of classes taught.
      let upcomingExams = 0;
      try {
        const examsRes = await fetch(`${apiBaseUrl}/api/examSchedules`, {
          headers: authHeaders(),
        });
        if (examsRes.ok) {
          const examsJson = await examsRes.json();
          const schedules: Array<{ date?: string; grade?: number | string }> =
            examsJson?.data?.schedules || [];
          const gradesTaught = new Set(
            subjectClassIds
              .map((cid) => cid.replace(/[^0-9].*$/, ""))
              .filter(Boolean)
          );
          const now = Date.now();
          upcomingExams = schedules.filter((s) => {
            if (!s.date) return false;
            const d = new Date(s.date).getTime();
            if (d < now) return false;
            if (gradesTaught.size === 0) return true; // fallback include
            return gradesTaught.has(String(s.grade ?? ""));
          }).length;
        }
      } catch (_) {
        // ignore
      }

      setStats([
        {
          key: "classes",
          title: "Total Classes",
          value: totalClasses,
          icon: BookOpen,
          color: "text-primary",
        },
        {
          key: "students",
          title: "Total Students",
          value: studentsTaught,
          icon: Users,
          color: "text-accent",
        },
        {
          key: "grading",
          title: "Pending Grading (est.)",
          value: pendingGrading,
          icon: ClipboardCheck,
          color: "text-warning",
        },
        {
          key: "exams",
          title: "Upcoming Exams",
          value: upcomingExams,
          icon: Calendar,
          color: "text-success",
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load stats";
      setStatsError(msg);
    } finally {
      setLoadingStats(false);
    }
  }, [token, user]);

  // Notifications placeholder (could be announcements filtered by teacher role later)
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    setNotificationsError(null);
    try {
      // TODO: Replace with a real endpoint (announcements with role filter)
      setRecentNotificationsState([
        {
          id: "1",
          title: "System maintenance scheduled",
          sender: "Admin",
          date: "Today",
          priority: "medium",
        },
      ]);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load notifications";
      setNotificationsError(msg);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const fetchUrgentActions = useCallback(async () => {
    setLoadingUrgent(true);
    setUrgentError(null);
    try {
      // Placeholder: derive from pendingGrading heuristic soon
      setUrgentActionsState([
        {
          task: "Review latest assignment submissions",
          deadline: "Due in 2 days",
        },
        { task: "Enter midterm scores", deadline: "Due today" },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load tasks";
      setUrgentError(msg);
    } finally {
      setLoadingUrgent(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchUrgentActions();
  }, [fetchStats, fetchNotifications, fetchUrgentActions]);

  const handleRefresh = () => {
    fetchStats();
    fetchNotifications();
    fetchUrgentActions();
  };

  const quickActions = [
    {
      title: "Upload Assignment",
      href: "/teacher/assignments",
      icon: ClipboardCheck,
    },
    { title: "Enter Grades", href: "/teacher/grades", icon: TrendingUp },
    { title: "View Schedule", href: "/teacher/classes", icon: Calendar },
    { title: "Post Announcement", href: "/teacher/announcements", icon: Bell },
  ];

  const recentNotifications = [
    {
      id: 1,
      title: "Staff Meeting Scheduled",
      sender: "Head of School",
      date: "Today, 10:30 AM",
      priority: "high",
    },
    {
      id: 2,
      title: "Grade Submission Reminder",
      sender: "Admin",
      date: "Yesterday",
      priority: "medium",
    },
    {
      id: 3,
      title: "Parent-Teacher Conference",
      sender: "Head Class Teacher",
      date: "2 days ago",
      priority: "low",
    },
  ];

  const urgentActions = [
    { task: "Grade Physics Test - Class 11A", deadline: "Due in 2 days" },
    { task: "Submit Attendance Report", deadline: "Due today" },
    { task: "Review Assignment Submissions", deadline: "Due in 3 days" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user?.name || "Teacher"} 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your classes today
          {user?.isHeadClassTeacher && (
            <span className="ml-1">(Head Class Teacher)</span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Overview</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loadingStats}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${loadingStats ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : stats.map((stat) => (
              <Card key={stat.key}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      {stat.error ? (
                        <p className="text-sm text-destructive">{stat.error}</p>
                      ) : (
                        <p className="text-3xl font-bold text-foreground">
                          {stat.value}
                        </p>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg bg-secondary ${
                        stat.color || ""
                      }`}
                    >
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
      {statsError && (
        <p className="text-sm text-destructive mt-2">{statsError}</p>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used tools and features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                <action.icon className="h-6 w-6" />
                <span className="text-sm text-center">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              Urgent Actions
            </CardTitle>
            <CardDescription>
              Tasks requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {urgentError && (
              <p className="text-sm text-destructive">{urgentError}</p>
            )}
            {loadingUrgent && !urgentError && (
              <p className="text-sm text-muted-foreground">Loading tasks…</p>
            )}
            {!loadingUrgent &&
              !urgentError &&
              urgentActionsState.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No urgent tasks 🎉
                </p>
              )}
            {urgentActionsState.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-1">
                    {item.task}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.deadline}
                  </p>
                </div>
                <Badge
                  variant={
                    item.deadline.includes("today")
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {item.deadline.includes("today") ? "Urgent" : "Pending"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Messages from administration and staff (placeholder)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationsError && (
              <p className="text-sm text-destructive">{notificationsError}</p>
            )}
            {loadingNotifications && !notificationsError && (
              <p className="text-sm text-muted-foreground">
                Loading notifications…
              </p>
            )}
            {!loadingNotifications &&
              !notificationsError &&
              recentNotificationsState.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No notifications
                </p>
              )}
            {recentNotificationsState.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground">
                      {notification.title}
                    </p>
                    <Badge
                      variant={
                        notification.priority === "high"
                          ? "destructive"
                          : notification.priority === "medium"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {notification.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    From: {notification.sender}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.date}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
