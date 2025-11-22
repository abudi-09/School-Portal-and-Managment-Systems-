import { useState } from "react";
import { Calendar, AlertTriangle, TrendingUp, CheckCircle2, Clock, XCircle, Filter } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader, StatCard, FilterBar, EmptyState } from "@/components/patterns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AttendanceTracking = () => {
  const [filterSubject, setFilterSubject] = useState("all");

  // Mock attendance data
  const attendanceRecords = [
    {
      date: "2024-03-01",
      subject: "Mathematics",
      status: "present",
      teacher: "Mrs. Johnson",
    },
    {
      date: "2024-03-01",
      subject: "English",
      status: "present",
      teacher: "Mr. Smith",
    },
    {
      date: "2024-03-02",
      subject: "Physics",
      status: "absent",
      teacher: "Dr. Brown",
      reason: "Sick leave",
    },
    {
      date: "2024-03-02",
      subject: "Chemistry",
      status: "present",
      teacher: "Dr. Lee",
    },
    {
      date: "2024-03-03",
      subject: "Biology",
      status: "late",
      teacher: "Dr. Wilson",
    },
    {
      date: "2024-03-03",
      subject: "History",
      status: "present",
      teacher: "Ms. Davis",
    },
    {
      date: "2024-03-04",
      subject: "Mathematics",
      status: "present",
      teacher: "Mrs. Johnson",
    },
    {
      date: "2024-03-04",
      subject: "English",
      status: "excused",
      teacher: "Mr. Smith",
      reason: "School event",
    },
    {
      date: "2024-03-05",
      subject: "Geography",
      status: "present",
      teacher: "Mr. Taylor",
    },
    {
      date: "2024-03-05",
      subject: "Physical Education",
      status: "absent",
      teacher: "Coach Martinez",
      reason: "Medical",
    },
  ];

  // Calculate overall attendance
  const totalClasses = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status === "present").length;
  const absentCount = attendanceRecords.filter((r) => r.status === "absent").length;
  const lateCount = attendanceRecords.filter((r) => r.status === "late").length;
  const excusedCount = attendanceRecords.filter((r) => r.status === "excused").length;
  
  const attendancePercentage = Math.round((presentCount / totalClasses) * 100);

  // Subject-wise attendance
  const subjectAttendance = attendanceRecords.reduce((acc, record) => {
    if (!acc[record.subject]) {
      acc[record.subject] = { total: 0, present: 0 };
    }
    acc[record.subject].total++;
    if (record.status === "present") {
      acc[record.subject].present++;
    }
    return acc;
  }, {} as Record<string, { total: number; present: number }>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Present</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "late":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Late</Badge>;
      case "excused":
        return <Badge variant="secondary">Excused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRecords = attendanceRecords.filter((record) => {
    if (filterSubject !== "all" && record.subject !== filterSubject) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Attendance Tracking"
        description="Monitor your class attendance and maintain good academic standing."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Attendance" }]}
      />

      {/* Warning Alert */}
      {attendancePercentage < 75 && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Attendance Warning</AlertTitle>
          <AlertDescription>
            Your attendance is below 75% — you may be restricted from midterm or final exams. Please improve your attendance immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${attendancePercentage}%`}
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          description={`${presentCount}/${totalClasses} classes attended`}
          trend={attendancePercentage >= 75 ? "up" : "down"}
          trendValue={attendancePercentage >= 75 ? "Good Standing" : "Critical"}
        />
        <StatCard
          title="Present"
          value={presentCount}
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          description="Classes present"
        />
        <StatCard
          title="Absent"
          value={absentCount}
          icon={<XCircle className="h-4 w-4 text-destructive" />}
          description="Classes missed"
        />
        <StatCard
          title="Late/Excused"
          value={lateCount + excusedCount}
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          description={`${lateCount} late, ${excusedCount} excused`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subject-wise Attendance */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Subject Breakdown</CardTitle>
            <CardDescription>Attendance by subject</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(subjectAttendance).map(([subject, data]) => {
              const percentage = Math.round((data.present / data.total) * 100);
              return (
                <div key={subject} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{subject}</span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2" 
                    indicatorClassName={percentage < 75 ? "bg-destructive" : "bg-primary"}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Attendance History</CardTitle>
                <CardDescription>Detailed log of your attendance</CardDescription>
              </div>
              <FilterBar
                onSearch={() => {}} // No search needed for this simple list
                filters={[
                  {
                    key: "subject",
                    label: "Subject",
                    options: [
                      { label: "All Subjects", value: "all" },
                      { label: "Mathematics", value: "Mathematics" },
                      { label: "English", value: "English" },
                      { label: "Physics", value: "Physics" },
                      { label: "Chemistry", value: "Chemistry" },
                    ],
                    value: filterSubject,
                    onChange: setFilterSubject,
                  },
                ]}
                className="w-full sm:w-auto"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{record.subject}</TableCell>
                      <TableCell className="text-muted-foreground">{record.teacher}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{record.reason || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="No records found"
                description="Try changing the filter."
                icon={Calendar}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceTracking;
