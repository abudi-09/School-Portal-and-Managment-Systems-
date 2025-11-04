import { useState } from "react";
import { Calendar, AlertTriangle, TrendingUp, Filter } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AttendanceTracking = () => {
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterMonth, setFilterMonth] = useState("march");

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
  const presentCount = attendanceRecords.filter(
    (r) => r.status === "present"
  ).length;
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
        return (
          <Badge className="bg-success/10 text-success hover:bg-success/20">
            Present
          </Badge>
        );
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "late":
        return (
          <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
            Late
          </Badge>
        );
      case "excused":
        return (
          <Badge className="bg-accent/10 text-accent hover:bg-accent/20">
            Excused
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRecords = attendanceRecords.filter((record) => {
    if (filterSubject !== "all" && record.subject !== filterSubject)
      return false;
    return true;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Attendance Tracking
        </h1>
        <p className="text-muted-foreground">
          Monitor your class attendance and maintain good academic standing
        </p>
      </div>

      {/* Warning Alert */}
      {attendancePercentage < 75 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Attendance Warning</AlertTitle>
          <AlertDescription>
            Your attendance is below 75% — you may be restricted from midterm or
            final exams. Please improve your attendance immediately or consult
            with your class teacher.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-secondary">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <Badge
                variant={attendancePercentage >= 75 ? "default" : "destructive"}
              >
                {attendancePercentage >= 75 ? "Good" : "Critical"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Overall Attendance
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-foreground">
                  {attendancePercentage}%
                </p>
                <div className="text-right text-sm text-muted-foreground">
                  <p>
                    {presentCount} / {totalClasses}
                  </p>
                  <p>classes</p>
                </div>
              </div>
              <Progress value={attendancePercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-secondary">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Present Days</p>
            <p className="text-3xl font-bold text-success">{presentCount}</p>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-secondary">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Absences</p>
            <p className="text-3xl font-bold text-destructive">
              {attendanceRecords.filter((r) => r.status === "absent").length}
            </p>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Attendance</CardTitle>
          <CardDescription>
            Your attendance breakdown by subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(subjectAttendance).map(([subject, data]) => {
              const percentage = Math.round((data.present / data.total) * 100);
              return (
                <div key={subject} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {data.present}/{data.total}
                      </span>
                      <Badge
                        variant={percentage >= 75 ? "default" : "destructive"}
                      >
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Detailed view of your class attendance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Subject</th>
                  <th className="text-left p-4 font-semibold">Teacher</th>
                  <th className="text-center p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr
                    key={index}
                    className="border-b border-border hover:bg-secondary/50 transition-colors"
                  >
                    <td className="p-4">
                      {new Date(record.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4 font-medium">{record.subject}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {record.teacher}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {record.reason || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceTracking;
