import {
  Users,
  GraduationCap,
  Calendar,
  TrendingUp,
  Bell,
  AlertCircle,
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
import { useEffect, useState } from "react";
import { StatCardSkeleton } from "@/components/shared/LoadingSkeletons";

const HeadDashboard = () => {
  const [isDemoLoading, setIsDemoLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsDemoLoading(false), 500);
    return () => clearTimeout(t);
  }, []);
  const stats = [
    {
      title: "Total Teachers",
      value: "45",
      change: "+3",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Total Students",
      value: "842",
      change: "+25",
      icon: GraduationCap,
      color: "text-accent",
    },
    {
      title: "Active Accounts",
      value: "887",
      inactive: "12",
      icon: TrendingUp,
      color: "text-success",
    },
    {
      title: "Upcoming Schedules",
      value: "18",
      icon: Calendar,
      color: "text-warning",
    },
  ];

  const pendingApprovals = [
    {
      id: 1,
      type: "Teacher Registration",
      name: "Dr. Michael Chen",
      subject: "Physics",
      date: "2024-11-15",
      priority: "high",
    },
    {
      id: 2,
      type: "Student Activation",
      name: "Emma Thompson",
      class: "Grade 10A",
      date: "2024-11-15",
      priority: "medium",
    },
    {
      id: 3,
      type: "Teacher Registration",
      name: "Sarah Williams",
      subject: "English Literature",
      date: "2024-11-14",
      priority: "high",
    },
  ];

  const recentActivity = [
    {
      action: "New teacher approved",
      user: "Ms. Johnson",
      time: "2 hours ago",
    },
    { action: "Class schedule updated", user: "System", time: "5 hours ago" },
    { action: "Announcement posted", user: "You", time: "1 day ago" },
    {
      action: "Student grades approved",
      user: "Head Class Teacher",
      time: "1 day ago",
    },
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isDemoLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : stats.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg bg-secondary ${stat.color}`}
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
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    {stat.inactive && (
                      <p className="text-sm text-muted-foreground">
                        ({stat.inactive} inactive)
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Teacher-to-Student Ratio</CardTitle>
            <CardDescription>Current academic year overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ratio</span>
              <span className="text-2xl font-bold text-foreground">1:18.7</span>
            </div>
            <Progress value={67} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Optimal range: 1:15 to 1:20
            </p>
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
                  Pending Approvals
                </CardTitle>
                <CardDescription>
                  Actions requiring your attention
                </CardDescription>
              </div>
              <Badge variant="destructive">{pendingApprovals.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingApprovals.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{item.type}</Badge>
                    <Badge
                      variant={
                        item.priority === "high" ? "destructive" : "secondary"
                      }
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="font-medium text-foreground mb-1">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.subject || item.class} • {item.date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
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
            <CardDescription>Latest system updates and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HeadDashboard;
