import {
  Users,
  GraduationCap,
  Calendar,
  TrendingUp,
  Bell,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState, useCallback } from "react";
import { StatCardSkeleton } from "@/components/shared/LoadingSkeletons";
import { getAuthToken } from "@/lib/utils";

// Fallback: use a generic React component signature for icons

type StatItem = {
  key: string;
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  change?: string;
  inactive?: number;
  loading?: boolean;
  error?: string | null;
};

type PendingTeacher = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  academicInfo?: { subjects?: string[] };
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

const HeadDashboard = () => {
  // Loading & error states
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<
    { action: string; user: string; time: string }[]
  >([]);

  const token = getAuthToken();

  const fetchStats = useCallback(async () => {
    if (!token) {
      setLoadingStats(false);
      setStatsError("Not authenticated");
      return;
    }
    setLoadingStats(true);
    setStatsError(null);
    try {
      // 1. Teachers count (use pagination total, request smallest payload)
      const teacherRes = await fetch(
        `${apiBaseUrl}/api/head/teachers?page=1&limit=1`,
        { headers: authHeaders() }
      );
      const teacherJson = await teacherRes.json();
      const teachersTotal = teacherJson?.data?.pagination?.total ?? 0;

      // 2. Students count (head endpoint returns array only; request a large limit for fuller count)
      const studentsRes = await fetch(
        `${apiBaseUrl}/api/users/students/all?limit=2000`,
        { headers: authHeaders() }
      );
      const studentsJson = await studentsRes.json();
      const studentsTotal = Array.isArray(studentsJson?.students)
        ? studentsJson.students.length
        : 0;

      // 3. Upcoming exam schedules
      const schedulesRes = await fetch(`${apiBaseUrl}/api/examSchedules`, {
        headers: authHeaders(),
      });
      const schedulesJson = await schedulesRes.json();
      const rawSchedules: Array<{ date?: string }> =
        schedulesJson?.data?.schedules ?? [];
      const now = Date.now();
      const upcomingCount = rawSchedules.filter((s) => {
        if (!s.date) return false;
        const d = new Date(s.date).getTime();
        return d >= now; // future or today
      }).length;

      // 4. Active accounts (approximation: active teachers + students)
      const activeAccounts = teachersTotal + studentsTotal; // TODO: include heads/admin when aggregation endpoint exists

      const assembled: StatItem[] = [
        {
          key: "teachers",
          title: "Total Teachers",
          value: teachersTotal,
          icon: Users,
          color: "text-primary",
        },
        {
          key: "students",
          title: "Total Students",
          value: studentsTotal,
          icon: GraduationCap,
          color: "text-accent",
        },
        {
          key: "active",
          title: "Active Accounts",
          value: activeAccounts,
          icon: TrendingUp,
          color: "text-success",
        },
        {
          key: "upcoming",
          title: "Upcoming Exams",
          value: upcomingCount,
          icon: Calendar,
          color: "text-warning",
        },
      ];
      setStats(assembled);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load stats";
      console.error("Dashboard stats error", err);
      setStatsError(message);
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  const fetchPendingTeachers = useCallback(async () => {
    if (!token) {
      setLoadingApprovals(false);
      setApprovalsError("Not authenticated");
      return;
    }
    setLoadingApprovals(true);
    setApprovalsError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/head/pending-teachers`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message || "Failed to load pending teachers");
      }
      setPendingTeachers(json.data?.teachers || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load pending approvals";
      console.error("Dashboard pending approvals error", err);
      setApprovalsError(message);
    } finally {
      setLoadingApprovals(false);
    }
  }, [token]);

  const loadActivity = useCallback(async () => {
    setLoadingActivity(true);
    setActivityError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/head/activity?limit=6`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load activity");
      const json = await res.json();
      const logs: Array<{
        time?: string;
        classId?: string;
        subject?: string;
        change?: string;
        actorName?: string;
      }> = json?.data?.logs || [];
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
      setRecentActivity(items);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load activity";
      setActivityError(message);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchPendingTeachers();
    loadActivity();
  }, [fetchStats, fetchPendingTeachers, loadActivity]);

  const handleRefresh = () => {
    fetchStats();
    fetchPendingTeachers();
    loadActivity();
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, Dr. Roberts 👋
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your school's performance and pending actions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Overview</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loadingStats || loadingApprovals}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${
              loadingStats || loadingApprovals ? "animate-spin" : ""
            }`}
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
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg bg-secondary ${
                        stat.color || ""
                      }`}
                    >
                      <stat.icon className="h-6 w-6" />
                    </div>
                    {stat.change && (
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {stat.change}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  {stat.error ? (
                    <p className="text-sm text-destructive">{stat.error}</p>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      {typeof stat.inactive === "number" && (
                        <p className="text-sm text-muted-foreground">
                          ({stat.inactive} inactive)
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>
      {statsError && (
        <p className="text-sm text-destructive mt-2">{statsError}</p>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Teacher-to-Student Ratio</CardTitle>
            <CardDescription>
              Approximate based on current counts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingStats ? (
              <StatCardSkeleton />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ratio</span>
                  <span className="text-2xl font-bold text-foreground">
                    {(() => {
                      const teachers = stats.find((s) => s.key === "teachers")
                        ?.value as number | undefined;
                      const students = stats.find((s) => s.key === "students")
                        ?.value as number | undefined;
                      if (!teachers || !students || teachers === 0) return "—";
                      const ratio = (students / teachers).toFixed(1);
                      return `1:${ratio}`;
                    })()}
                  </span>
                </div>
                <Progress
                  value={(() => {
                    const teachers = stats.find((s) => s.key === "teachers")
                      ?.value as number | undefined;
                    const students = stats.find((s) => s.key === "students")
                      ?.value as number | undefined;
                    if (!teachers || !students || teachers === 0) return 0;
                    // Normalize ratio progress (ideal range 15-20 → map to 100 when within)
                    const r = students / teachers;
                    if (r < 15) return (r / 15) * 60; // below range
                    if (r > 20) return Math.min(100, (20 / r) * 100); // degrade if too high
                    return 85; // within optimal range
                  })()}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Optimal range: 1:15 to 1:20
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global Attendance</CardTitle>
            <CardDescription>School-wide attendance tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Month</span>
              <span className="text-2xl font-bold text-foreground">92.4%</span>
            </div>
            <Progress value={92} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Target: 95% • Trend: ↑ 2.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Semester Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Current Semester Progress</CardTitle>
          <CardDescription>2024 Fall Semester</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Week 12 of 18</span>
            <span className="text-sm font-medium text-foreground">
              67% Complete
            </span>
          </div>
          <Progress value={67} className="h-3" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">6</p>
              <p className="text-xs text-muted-foreground">Weeks Remaining</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">Exams Scheduled</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">Dec 22</p>
              <p className="text-xs text-muted-foreground">Semester End</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Pending Teacher Approvals
                </CardTitle>
                <CardDescription>
                  Actions requiring your attention
                </CardDescription>
              </div>
              <Badge variant="destructive">
                {loadingApprovals ? "…" : pendingTeachers.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {approvalsError && (
              <p className="text-sm text-destructive">{approvalsError}</p>
            )}
            {loadingApprovals && !approvalsError && (
              <p className="text-sm text-muted-foreground">
                Loading pending approvals…
              </p>
            )}
            {!loadingApprovals &&
              !approvalsError &&
              pendingTeachers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No pending teacher approvals 🎉
                </p>
              )}
            {pendingTeachers.slice(0, 5).map((t) => (
              <div
                key={t._id}
                className="flex items-start justify-between p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">Teacher Registration</Badge>
                    <Badge variant="destructive">pending</Badge>
                  </div>
                  <p className="font-medium text-foreground mb-1">
                    {t.firstName || "(No first name)"} {t.lastName || ""}
                  </p>
                  <p className="text-sm text-muted-foreground break-all">
                    {t.email}
                  </p>
                  {t.academicInfo?.subjects?.length ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Subjects: {t.academicInfo.subjects.join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Review
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" disabled>
              View All Approvals
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest assignment / system actions (placeholder)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityError && (
              <p className="text-sm text-destructive">{activityError}</p>
            )}
            {loadingActivity && !activityError && (
              <p className="text-sm text-muted-foreground">Loading activity…</p>
            )}
            {!loadingActivity &&
              !activityError &&
              recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No recent activity
                </p>
              )}
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg bg-secondary"
              >
                <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-1">
                    {activity.action}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    By {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" disabled>
              View Full Activity (coming soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HeadDashboard;
