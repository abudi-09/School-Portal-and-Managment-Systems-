import {
  Award,
  TrendingUp,
  ClipboardList,
  Calendar,
  Bell,
  Trophy,
  BookOpen,
  Users,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { getAuthToken } from "@/lib/utils";

type StatItem = {
  key: string;
  title: string;
  value: string | number;
  description?: string;
  icon: any;
  variant?: "success" | "accent" | "warning" | "default";
  trend?: { value: string; isPositive: boolean };
};

type AssignmentItem = {
  id: string | number;
  title: string;
  subject: string;
  due: string;
  status: string;
};

type AnnouncementItem = {
  id: string | number;
  title: string;
  date: string;
  type: string;
  isRead?: boolean;
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

const Dashboard = () => {
  // Stats
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Assignments (placeholder until endpoint exists)
  const [upcomingAssignments, setUpcomingAssignments] = useState<
    AssignmentItem[]
  >([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);

  // Announcements
  const [recentAnnouncements, setRecentAnnouncements] = useState<
    AnnouncementItem[]
  >([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(
    null
  );

  const token = getAuthToken();

  const fetchAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    setAssignmentsError(null);
    try {
      // TODO: Replace with real assignments endpoint when available
      setUpcomingAssignments([]);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load assignments";
      setAssignmentsError(msg);
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    if (!token) {
      setAnnouncementsError("Not authenticated");
      setLoadingAnnouncements(false);
      return;
    }
    setLoadingAnnouncements(true);
    setAnnouncementsError(null);
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/announcements?page=1&pageSize=5`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Failed to load announcements");
      const json = await res.json();
      const items = json?.data?.items || [];
      setRecentAnnouncements(
        items.map((i: any) => ({
          id: i._id,
          title: i.title,
          date: new Date(i.date).toLocaleDateString(),
          type: i.type || "info",
          isRead: i.isRead,
        }))
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load announcements";
      setAnnouncementsError(msg);
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) {
      setStatsError("Not authenticated");
      setLoadingStats(false);
      return;
    }
    setLoadingStats(true);
    setStatsError(null);
    try {
      // GPA from evaluations (simple mapping)
      const evalRes = await fetch(`${apiBaseUrl}/api/evaluations`, {
        headers: authHeaders(),
      });
      let gpaValue: string | number = "—";
      if (evalRes.ok) {
        const evalJson = await evalRes.json();
        const evaluations: Array<{ score: number; maxScore: number }> =
          evalJson?.data?.evaluations || [];
        if (evaluations.length) {
          const avgPercent =
            evaluations.reduce(
              (sum, e) => sum + e.score / (e.maxScore || 100),
              0
            ) / evaluations.length;
          const pct = avgPercent * 100;
          const gpa =
            pct >= 90 ? 4 : pct >= 80 ? 3 : pct >= 70 ? 2 : pct >= 60 ? 1 : 0;
          gpaValue = gpa.toFixed(2);
        }
      }

      // Unread announcements count
      const unreadRes = await fetch(
        `${apiBaseUrl}/api/announcements/unread-count`,
        { headers: authHeaders() }
      );
      const unreadJson = unreadRes.ok ? await unreadRes.json() : null;
      const unread = unreadJson?.data?.unreadCount ?? 0;

      const pendingAssignmentsCount = upcomingAssignments.filter(
        (a) => a.status !== "submitted"
      ).length;

      setStats([
        {
          key: "gpa",
          title: "Current GPA",
          value: gpaValue,
          icon: Award,
          description:
            gpaValue === "—" ? "No scores yet" : "From recent evaluations",
          variant: "success",
        },
        {
          key: "rank",
          title: "Class Rank",
          value: "—",
          icon: Trophy,
          description: "Coming soon",
          variant: "accent",
        },
        {
          key: "assignments",
          title: "Pending Assignments",
          value: pendingAssignmentsCount,
          icon: ClipboardList,
          description: `${pendingAssignmentsCount} due`,
          variant: "warning",
        },
        {
          key: "unread",
          title: "Unread Announcements",
          value: unread,
          icon: Bell,
          description: "Latest school updates",
          variant: "accent",
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load stats";
      setStatsError(msg);
    } finally {
      setLoadingStats(false);
    }
  }, [token, upcomingAssignments]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    fetchStats();
    fetchAnnouncements();
  }, [fetchStats, fetchAnnouncements]);

  const handleRefresh = () => {
    fetchStats();
    fetchAnnouncements();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 rounded-2xl p-8 border border-primary/10 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-7 w-7 text-primary" />
                </div>
                Welcome back, John 👋
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Here's your academic overview for today. Stay focused and keep
                up the great work!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Today's Date</p>
                <p className="text-lg font-semibold text-foreground">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Overview</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loadingStats}
          >
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingStats &&
            stats.length === 0 &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl border border-border animate-pulse bg-secondary/30"
              />
            ))}
          {!loadingStats && statsError && (
            <p className="text-sm text-destructive">{statsError}</p>
          )}
          {!loadingStats &&
            !statsError &&
            stats.slice(0, 4).map((s) => (
              <div
                key={s.key}
                className="transform hover:scale-105 transition-all duration-300"
              >
                <StatCard
                  title={s.title}
                  value={String(s.value)}
                  icon={s.icon}
                  description={s.description}
                  variant={s.variant || "default"}
                  trend={s.trend}
                />
              </div>
            ))}
        </div>

        {/* Enhanced Quick Access */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Quick Access
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                name: "My Scores",
                icon: Award,
                href: "/scores",
                color: "text-blue-600",
              },
              {
                name: "Assignments",
                icon: ClipboardList,
                href: "/assignments",
                color: "text-orange-600",
              },
              {
                name: "Timetable",
                icon: Calendar,
                href: "/timetable",
                color: "text-green-600",
              },
              {
                name: "Announcements",
                icon: Bell,
                href: "/announcements",
                color: "text-purple-600",
              },
              {
                name: "Attendance",
                icon: Users,
                href: "/attendance",
                color: "text-red-600",
              },
              {
                name: "Profile",
                icon: Trophy,
                href: "/profile",
                color: "text-indigo-600",
              },
            ].map((item) => (
              <Link key={item.name} to={item.href}>
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col items-center justify-center gap-3 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300 group"
                >
                  <item.icon
                    className={`h-7 w-7 ${item.color} group-hover:scale-110 transition-transform duration-300`}
                  />
                  <span className="text-sm font-medium text-center">
                    {item.name}
                  </span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Enhanced Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Assignments */}
          <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                Upcoming Assignments
              </CardTitle>
              <CardDescription className="text-base">
                Your pending tasks and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingAssignments && (
                  <p className="text-sm text-muted-foreground">
                    Loading assignments…
                  </p>
                )}
                {assignmentsError && (
                  <p className="text-sm text-destructive">{assignmentsError}</p>
                )}
                {!loadingAssignments &&
                  !assignmentsError &&
                  upcomingAssignments.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No pending assignments
                    </p>
                  )}
                {upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-secondary/30 to-secondary/10 hover:from-secondary/50 hover:to-secondary/20 transition-all duration-300 border border-border/50 hover:border-primary/20"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground mb-1">
                        {assignment.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        {assignment.due}
                      </span>
                      <Badge
                        variant={
                          assignment.status === "submitted"
                            ? "default"
                            : "secondary"
                        }
                        className="px-3 py-1"
                      >
                        {assignment.status === "submitted"
                          ? "Submitted"
                          : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/assignments">
                <Button
                  variant="ghost"
                  className="w-full mt-6 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  View all assignments →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Recent Announcements
              </CardTitle>
              <CardDescription className="text-base">
                Latest updates from school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingAnnouncements && (
                  <p className="text-sm text-muted-foreground">
                    Loading announcements…
                  </p>
                )}
                {announcementsError && (
                  <p className="text-sm text-destructive">
                    {announcementsError}
                  </p>
                )}
                {!loadingAnnouncements &&
                  !announcementsError &&
                  recentAnnouncements.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No announcements
                    </p>
                  )}
                {recentAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-secondary/30 to-secondary/10 hover:from-secondary/50 hover:to-secondary/20 transition-all duration-300 border border-border/50 hover:border-primary/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground mb-1">
                        {announcement.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {announcement.date}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize px-3 py-1">
                      {announcement.type}
                    </Badge>
                  </div>
                ))}
              </div>
              <Link to="/announcements">
                <Button
                  variant="ghost"
                  className="w-full mt-6 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  View all announcements →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
