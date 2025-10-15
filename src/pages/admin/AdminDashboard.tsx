import { Users, UserCheck, UserX, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminDashboard = () => {
  const stats = [
    {
      title: "Total Students",
      value: "1,247",
      change: "+12%",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Total Teachers",
      value: "89",
      change: "+3%",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Active Accounts",
      value: "1,298",
      change: "+5%",
      icon: UserCheck,
      color: "text-success",
    },
    {
      title: "Inactive Accounts",
      value: "38",
      change: "-8%",
      icon: UserX,
      color: "text-muted-foreground",
    },
  ];

  const recentActivity = [
    { action: "New student registered", user: "John Doe", time: "2 minutes ago" },
    { action: "Teacher account activated", user: "Sarah Smith", time: "15 minutes ago" },
    { action: "Student ID generated", user: "Emma Wilson", time: "1 hour ago" },
    { action: "Registration approved", user: "Michael Brown", time: "2 hours ago" },
  ];

  const pendingActions = [
    { type: "Registration Approval", count: 12, priority: "high" },
    { type: "Account Activation", count: 5, priority: "medium" },
    { type: "ID Generation", count: 8, priority: "low" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and control center
        </p>
      </div>

      {/* Registration Status Alert */}
      <Alert className="border-primary bg-primary/5">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground">
          <span className="font-semibold">Registration Status:</span> Currently{" "}
          <Badge variant="default" className="ml-1">Open</Badge>
        </AlertDescription>
      </Alert>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingActions.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-medium text-foreground">{item.type}</p>
                  <p className="text-sm text-muted-foreground">{item.count} pending</p>
                </div>
                <Badge
                  variant={
                    item.priority === "high"
                      ? "destructive"
                      : item.priority === "medium"
                      ? "default"
                      : "secondary"
                  }
                >
                  {item.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-sm text-muted-foreground">{activity.user}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current academic term overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Term</p>
              <p className="text-lg font-semibold text-foreground">Fall 2024</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Term Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[65%]" />
                </div>
                <span className="text-sm font-medium text-foreground">65%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Days Remaining</p>
              <p className="text-lg font-semibold text-foreground">42 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
