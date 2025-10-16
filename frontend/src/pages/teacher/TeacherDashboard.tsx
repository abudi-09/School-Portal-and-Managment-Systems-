import { BookOpen, Users, ClipboardCheck, Calendar, Bell, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const TeacherDashboard = () => {
  const { user } = useAuth();
  
  const stats = [
    { title: "Total Classes", value: "5", icon: BookOpen, color: "text-primary" },
    { title: "Total Students", value: "127", icon: Users, color: "text-accent" },
    { title: "Pending Grading", value: "18", icon: ClipboardCheck, color: "text-warning" },
    { title: "Upcoming Exams", value: "3", icon: Calendar, color: "text-success" },
  ];

  const quickActions = [
    { title: "Upload Assignment", href: "/teacher/assignments", icon: ClipboardCheck },
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
          Welcome back, {user?.name || 'Teacher'} 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your classes today
          {user?.isHeadClassTeacher && <span className="ml-1">(Head Class Teacher)</span>}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
            <CardDescription>Tasks requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {urgentActions.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-1">{item.task}</p>
                  <p className="text-sm text-muted-foreground">{item.deadline}</p>
                </div>
                <Badge variant={item.deadline.includes("today") ? "destructive" : "secondary"}>
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
            <CardDescription>Messages from administration and staff</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground">{notification.title}</p>
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
                  <p className="text-xs text-muted-foreground">{notification.date}</p>
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
