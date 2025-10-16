import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, AlertTriangle, CalendarIcon, Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface StudentAttendance {
  id: string;
  name: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
  hasRequest: boolean;
}

interface AttendanceRequest {
  id: string;
  studentName: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "denied";
}

const HeadClassAttendance = () => {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<AttendanceRequest | null>(null);

  // Mock data
  const students: StudentAttendance[] = [
    { id: "1", name: "Alice Johnson", totalDays: 100, present: 95, absent: 3, late: 2, excused: 0, attendanceRate: 95, hasRequest: false },
    { id: "2", name: "Bob Smith", totalDays: 100, present: 88, absent: 10, late: 2, excused: 0, attendanceRate: 88, hasRequest: true },
    { id: "3", name: "Carol White", totalDays: 100, present: 72, absent: 25, late: 3, excused: 0, attendanceRate: 72, hasRequest: true },
    { id: "4", name: "David Brown", totalDays: 100, present: 80, absent: 15, late: 5, excused: 0, attendanceRate: 80, hasRequest: false },
  ];

  const absenceRequests: AttendanceRequest[] = [
    { id: "1", studentName: "Bob Smith", date: "2024-01-15", reason: "Medical appointment", status: "pending" },
    { id: "2", studentName: "Carol White", date: "2024-01-16", reason: "Family emergency", status: "pending" },
  ];

  const classAverage = students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length;
  const criticalCount = students.filter(s => s.attendanceRate < 75).length;

  const handleMarkAttendance = (studentId: string, status: string) => {
    toast({
      title: "Attendance Updated",
      description: `Student marked as ${status} for ${format(selectedDate, "MMM dd, yyyy")}`,
    });
  };

  const handleApproveRequest = (requestId: string) => {
    toast({
      title: "Request Approved",
      description: "Absence request has been approved.",
    });
    setSelectedRequest(null);
  };

  const handleDenyRequest = (requestId: string) => {
    toast({
      title: "Request Denied",
      description: "Absence request has been denied.",
      variant: "destructive",
    });
    setSelectedRequest(null);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
            <p className="text-muted-foreground mt-1">Head Class Teacher - Daily Attendance Tracking</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Filters & Date Picker */}
        <div className="flex gap-4 items-center">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10-A">Class 10-A</SelectItem>
              <SelectItem value="10-B">Class 10-B</SelectItem>
              <SelectItem value="10-C">Class 10-C</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-64 justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Class Attendance Rate</CardDescription>
              <CardTitle className="text-3xl">{classAverage.toFixed(1)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={classAverage} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Present Today</CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {students.filter(s => s.attendanceRate > 90).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Regular attendance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Critical (&lt;75%)</CardDescription>
              <CardTitle className="text-3xl text-red-500">{criticalCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Requests</CardDescription>
              <CardTitle className="text-3xl text-yellow-500">
                {absenceRequests.filter(r => r.status === "pending").length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Absence Requests */}
        {absenceRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Absence Requests</CardTitle>
              <CardDescription>Review and approve student absence requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {absenceRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{request.studentName}</p>
                      <p className="text-sm text-muted-foreground">{request.date} - {request.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApproveRequest(request.id)}>
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDenyRequest(request.id)}>
                        <XCircle className="mr-1 h-4 w-4" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance - {selectedClass}</CardTitle>
            <CardDescription>Record daily attendance and view patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-center">Total Days</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Late</TableHead>
                  <TableHead className="text-center">Excused</TableHead>
                  <TableHead className="text-center">Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className={student.attendanceRate < 75 ? "bg-red-50 dark:bg-red-950/20" : ""}>
                    <TableCell className="font-medium">
                      {student.name}
                      {student.hasRequest && (
                        <Badge variant="outline" className="ml-2">
                          Request Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{student.totalDays}</TableCell>
                    <TableCell className="text-center text-green-600">{student.present}</TableCell>
                    <TableCell className="text-center text-red-600">{student.absent}</TableCell>
                    <TableCell className="text-center text-yellow-600">{student.late}</TableCell>
                    <TableCell className="text-center text-blue-600">{student.excused}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Progress value={student.attendanceRate} className="h-2 w-16" />
                        <span className="font-medium">{student.attendanceRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.attendanceRate < 75 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Critical
                        </Badge>
                      ) : student.attendanceRate < 85 ? (
                        <Badge variant="secondary">At Risk</Badge>
                      ) : (
                        <Badge className="bg-green-500">Good</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(student.id, "Present")}>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(student.id, "Absent")}>
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(student.id, "Late")}>
                          <Clock className="h-4 w-4 text-yellow-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HeadClassAttendance;
