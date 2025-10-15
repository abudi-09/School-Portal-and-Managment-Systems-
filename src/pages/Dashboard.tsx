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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const upcomingAssignments = [
    {
      id: 1,
      title: "Physics Lab Report",
      subject: "Physics",
      due: "Tomorrow",
      status: "pending",
    },
    {
      id: 2,
      title: "English Essay",
      subject: "English",
      due: "3 days",
      status: "pending",
    },
    {
      id: 3,
      title: "Math Problem Set",
      subject: "Mathematics",
      due: "5 days",
      status: "submitted",
    },
  ];

  const recentAnnouncements = [
    { id: 1, title: "Midterm Schedule Released", date: "Today", type: "exam" },
    {
      id: 2,
      title: "Science Fair Next Week",
      date: "Yesterday",
      type: "event",
    },
    {
      id: 3,
      title: "Library Hours Extended",
      date: "2 days ago",
      type: "info",
    },
  ];

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
