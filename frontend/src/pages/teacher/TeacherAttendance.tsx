import { useState } from "react";
import { Calendar, Users, CheckCircle, XCircle, Clock, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

const TeacherAttendance = () => {
  const [selectedClass, setSelectedClass] = useState("11a");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const students = [
    {
      id: 1,
      name: "John Smith",
      rollNo: "11A-001",
      status: "present",
      attendanceRate: 95,
    },
    {
      id: 2,
      name: "Emma Wilson",
      rollNo: "11A-002",
      status: "present",
      attendanceRate: 98,
    },
    {
      id: 3,
      name: "Michael Brown",
      rollNo: "11A-003",
      status: "absent",
      attendanceRate: 72,
    },
    {
      id: 4,
      name: "Sarah Davis",
      rollNo: "11A-004",
      status: "late",
      attendanceRate: 88,
    },
    {
      id: 5,
      name: "James Wilson",
      rollNo: "11A-005",
      status: "present",
      attendanceRate: 92,
    },
  ];

  const absenceRequests = [
    {
      id: 1,
      student: "Michael Brown",
      rollNo: "11A-003",
      date: "2024-11-15",
      reason: "Medical appointment",
      status: "pending",
    },
    {
      id: 2,
      student: "Sarah Davis",
      rollNo: "11A-004",
      date: "2024-11-16",
      reason: "Family emergency",
      status: "pending",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "default";
      case "absent":
        return "destructive";
      case "late":
        return "secondary";
      case "excused":
        return "outline";
      default:
        return "secondary";
    }
  };

  const stats = [
    {
      title: "Present Today",
      value: students.filter((s) => s.status === "present").length,
      total: students.length,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      title: "Absent",
      value: students.filter((s) => s.status === "absent").length,
      total: students.length,
      icon: XCircle,
      color: "text-destructive",
    },
    {
      title: "Late",
      value: students.filter((s) => s.status === "late").length,
      total: students.length,
      icon: Clock,
      color: "text-warning",
    },
    {
      title: "Low Attendance (<75%)",
      value: students.filter((s) => s.attendanceRate < 75).length,
      total: students.length,
      icon: TrendingDown,
      color: "text-destructive",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Attendance Management</h1>
        <p className="text-muted-foreground">
          Record and manage student attendance for your class
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                    <span className="text-lg text-muted-foreground">/{stat.total}</span>
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Take Attendance</CardTitle>
          <CardDescription>Select class and date to record attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11a">11A - Mathematics</SelectItem>
                  <SelectItem value="11b">11B - Mathematics</SelectItem>
                  <SelectItem value="12a">12A - Mathematics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button className="gap-2">
              <Calendar className="h-4 w-4" />
              Submit Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
          <CardDescription>Mark attendance for each student</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Attendance Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{student.rollNo}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell className="text-center">
                    <Select defaultValue={student.status}>
                      <SelectTrigger className="w-32 mx-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Badge
                        variant={
                          student.attendanceRate >= 85
                            ? "default"
                            : student.attendanceRate >= 75
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {student.attendanceRate}%
                      </Badge>
                      {student.attendanceRate < 75 && (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View History
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Absence Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Absence Requests
          </CardTitle>
          <CardDescription>Review and approve student absence requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {absenceRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">{request.student}</p>
                    <Badge variant="outline">{request.rollNo}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Date: {request.date}
                  </p>
                  <p className="text-sm text-foreground">Reason: {request.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Deny
                  </Button>
                  <Button size="sm">Approve</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAttendance;
