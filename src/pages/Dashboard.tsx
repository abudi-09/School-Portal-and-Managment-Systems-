import { Award, TrendingUp, ClipboardList, Calendar, Bell, Trophy } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const upcomingAssignments = [
    { id: 1, title: "Physics Lab Report", subject: "Physics", due: "Tomorrow", status: "pending" },
    { id: 2, title: "English Essay", subject: "English", due: "3 days", status: "pending" },
    { id: 3, title: "Math Problem Set", subject: "Mathematics", due: "5 days", status: "submitted" },
  ];

  const recentAnnouncements = [
    { id: 1, title: "Midterm Schedule Released", date: "Today", type: "exam" },
    { id: 2, title: "Science Fair Next Week", date: "Yesterday", type: "event" },
    { id: 3, title: "Library Hours Extended", date: "2 days ago", type: "info" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          Welcome, John 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your academics today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current GPA"
          value="3.85"
          icon={Award}
          trend={{ value: "+0.15", isPositive: true }}
          description="Above average"
          variant="success"
        />
        <StatCard
          title="Class Rank"
          value="#8"
          icon={Trophy}
          description="Out of 120 students"
          variant="accent"
        />
        <StatCard
          title="Pending Assignments"
          value="5"
          icon={ClipboardList}
          description="2 due this week"
          variant="warning"
        />
        <StatCard
          title="Attendance Rate"
          value="96%"
          icon={TrendingUp}
          description="Excellent record"
          variant="success"
        />
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "My Scores", icon: Award, href: "/scores" },
            { name: "Assignments", icon: ClipboardList, href: "/assignments" },
            { name: "Timetable", icon: Calendar, href: "/timetable" },
            { name: "Announcements", icon: Bell, href: "/announcements" },
          ].map((item) => (
            <Link key={item.name} to={item.href}>
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <item.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{item.name}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Upcoming Assignments
            </CardTitle>
            <CardDescription>Your pending tasks and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{assignment.due}</span>
                    <Badge
                      variant={assignment.status === "submitted" ? "default" : "secondary"}
                    >
                      {assignment.status === "submitted" ? "Submitted" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/assignments">
              <Button variant="link" className="w-full mt-4">
                View all assignments →
              </Button>
            </Link>
          </CardContent>
        </Card>

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
            <div className="space-y-4">
              {recentAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{announcement.title}</p>
                    <p className="text-sm text-muted-foreground">{announcement.date}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {announcement.type}
                  </Badge>
                </div>
              ))}
            </div>
            <Link to="/announcements">
              <Button variant="link" className="w-full mt-4">
                View all announcements →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
