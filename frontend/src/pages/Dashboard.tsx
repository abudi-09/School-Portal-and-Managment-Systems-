import {
  Award,
  BookOpen,
  ClipboardList,
  Calendar,
  Bell,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/patterns";
import { StatCard } from "@/components/patterns";
import { EmptyState } from "@/components/patterns";
import { useEffect, useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { StatCardSkeleton } from "@/components/shared/LoadingSkeletons";
import { Button } from "@/components/ui/button";
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
  icon: LucideIcon;
  description?: string;
  variant?: "success" | "info" | "warning" | "default";
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
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatItem[]>([]);

  // Assignments
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

  const fetchAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    setAssignmentsError(null);
    try {
      // TODO: Replace with real endpoint for student assignments
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
    setLoadingAnnouncements(true);
    setAnnouncementsError(null);
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/announcements?page=1&pageSize=5`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Failed to load announcements");
      const json = await res.json();
      const items: Array<{
        _id: string;
        title: string;
        date: string;
        type?: string;
      }> = json?.data?.items || [];
      setRecentAnnouncements(
        items.map((i) => ({
          id: i._id,
          title: i.title,
          date: new Date(i.date).toLocaleDateString(),
          type: i.type || "info",
        }))
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load announcements";
      setAnnouncementsError(msg);
    } finally {
      setLoadingAnnouncements(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(null);
    try {
      // GPA from evaluations
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
          gpaValue = (avgPercent * 4).toFixed(2);
        }
      }

      // Announcements count
      const announcementsRes = await fetch(
        `${apiBaseUrl}/api/announcements?page=1&pageSize=100`,
        { headers: authHeaders() }
      );
      let unread = 0;
      if (announcementsRes.ok) {
        const announcementsJson = await announcementsRes.json();
        const items = announcementsJson?.data?.items || [];
        unread = items.filter((a: { status?: string }) => a.status === "unread")
          .length;
      }

      const pendingAssignmentsCount = upcomingAssignments.filter(
        (a) => a.status !== "submitted"
      ).length;

      setStats([
        {
          key: "gpa",
          title: "Current GPA",
          value: gpaValue,
          icon: Award,
          description: "Academic average",
          variant: "success",
        },
        {
          key: "rank",
          title: "Class Rank",
          value: "—",
          icon: TrendingUp,
          description: "Out of students",
          variant: "info",
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
          variant: "info",
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load stats";
      setStatsError(msg);
    } finally {
      setLoadingStats(false);
    }
  }, [upcomingAssignments]);

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
    fetchAssignments();
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Your academic overview and recent activity"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loadingStats}
          >
            Refresh
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingStats && stats.length === 0 ? (
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
              subtitle={s.description}
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
                <Link to="/scores" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col gap-2"
                  >
                    <BookOpen className="h-5 w-5" />
                    <div className="flex flex-col">
                      <span className="text-sm">View Scores</span>
                      <span className="text-xs text-muted-foreground">View your academic performance and detailed grade breakdowns</span>
                    </div>
                  </Button>
                </Link>
                <Link to="/assignments" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col gap-2"
                  >
                    <ClipboardList className="h-5 w-5" />
                    <span className="text-sm">Assignments</span>
                  </Button>
                </Link>
                <Link to="/timetable" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col gap-2"
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm">Timetable</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Upcoming Assignments
              </CardTitle>
              <CardDescription>
                Track your pending work and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <p className="text-sm text-muted-foreground">
                  Loading assignments…
                </p>
              ) : assignmentsError ? (
                <p className="text-sm text-destructive">{assignmentsError}</p>
              ) : upcomingAssignments.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No pending assignments"
                  description="You're all caught up! New assignments will appear here when teachers add them."
                  action={
                    <Link to="/assignments">
                      <Button variant="outline" size="sm">
                        View Past Assignments
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {assignment.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.subject}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm text-muted-foreground">
                          {assignment.due}
                        </span>
                        <Badge
                          variant={
                            assignment.status === "submitted"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {assignment.status === "submitted"
                            ? "Submitted"
                            : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Link to="/assignments" className="block">
                    <Button variant="ghost" className="w-full mt-2">
                      View all assignments →
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Announcements
              </CardTitle>
              <CardDescription>Latest updates from school</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAnnouncements ? (
                <p className="text-sm text-muted-foreground">
                  Loading announcements…
                </p>
              ) : announcementsError ? (
                <p className="text-sm text-destructive">
                  {announcementsError}
                </p>
              ) : recentAnnouncements.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No announcements"
                  description="New announcements will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {recentAnnouncements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {announcement.date}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs">
                        {announcement.type}
                      </Badge>
                    </div>
                  ))}
                  <Link to="/announcements" className="block">
                    <Button variant="ghost" className="w-full mt-2" size="sm">
                      View all →
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Calendar}
                title="Schedule preview"
                description="Your class schedule will appear here."
                action={
                  <Link to="/timetable">
                    <Button variant="outline" size="sm">
                      View Full Timetable
                    </Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
