import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  RefreshCcw,
  TrendingUp,
  Users,
  XCircle,
  Save,
  Filter,
  Download,
  Search,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { PageHeader, StatCard, EmptyState } from "@/components/patterns";
import { StudentAttendanceCard, AttendanceStatus } from "@/components/teacher/StudentAttendanceCard";

interface Student {
  id: number;
  name: string;
  rollNo: string;
  attendanceRate: number;
}

type AttendanceRecord = Record<number, AttendanceStatus>;

const formatDateForInput = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
};

const createDefaultAttendance = (students: Student[]): AttendanceRecord => {
  return students.reduce<AttendanceRecord>((record, student) => {
    record[student.id] = "present";
    return record;
  }, {} as AttendanceRecord);
};

const createAttendanceRecord = (
  students: Student[],
  overrides: Partial<AttendanceRecord> = {}
): AttendanceRecord => {
  return { ...createDefaultAttendance(students), ...overrides };
};

const TeacherAttendance = () => {
  const { toast } = useToast();

  const students = useMemo<Student[]>(
    () => [
      { id: 1, name: "John Smith", rollNo: "11A-001", attendanceRate: 95 },
      { id: 2, name: "Emma Wilson", rollNo: "11A-002", attendanceRate: 98 },
      { id: 3, name: "Michael Brown", rollNo: "11A-003", attendanceRate: 72 },
      { id: 4, name: "Sarah Davis", rollNo: "11A-004", attendanceRate: 88 },
      { id: 5, name: "James Wilson", rollNo: "11A-005", attendanceRate: 92 },
      { id: 6, name: "Linda Taylor", rollNo: "11A-006", attendanceRate: 96 },
    ],
    []
  );

  const assignedClass = {
    id: "11A",
    name: "Class 11A - Mathematics",
    homeroom: "Room 305",
  };

  const [activeTab, setActiveTab] = useState<"daily" | "requests" | "summary">("daily");
  const [selectedClass, setSelectedClass] = useState<string>(assignedClass.id);
  const today = formatDateForInput(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [searchQuery, setSearchQuery] = useState("");

  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, AttendanceRecord>>(() => {
    const yesterday = formatDateForInput(new Date(Date.now() - 86400000));
    return {
      [yesterday]: createAttendanceRecord(students, { 3: "absent", 4: "late" }),
    };
  });
  
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord>(
    () => createAttendanceRecord(students)
  );

  useEffect(() => {
    const saved = attendanceByDate[selectedDate];
    setCurrentAttendance(saved ? { ...saved } : createAttendanceRecord(students));
  }, [attendanceByDate, selectedDate, students]);

  const statusSummary = useMemo(() => {
    const summary: Record<AttendanceStatus, number> = {
      present: 0, absent: 0, late: 0, excused: 0,
    };
    students.forEach((student) => {
      const status = currentAttendance[student.id];
      if (status) summary[status] += 1;
    });
    return summary;
  }, [currentAttendance, students]);

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setCurrentAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setCurrentAttendance(
      students.reduce<AttendanceRecord>((record, student) => {
        record[student.id] = status;
        return record;
      }, {} as AttendanceRecord)
    );
  };

  const handleSubmitAttendance = () => {
    setAttendanceByDate((prev) => ({ ...prev, [selectedDate]: { ...currentAttendance } }));
    toast({
      title: "Attendance Saved",
      description: `Attendance for ${selectedDate} has been recorded.`,
    });
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dailyAttendanceRate = Math.round((statusSummary.present / students.length) * 100);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Attendance Management"
        description={`Track and manage attendance for ${assignedClass.name}`}
        actions={
          <div className="flex items-center gap-2">
             <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: "long" })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarPicker
                    mode="single"
                    selected={new Date(selectedDate)}
                    onSelect={(date) => date && setSelectedDate(formatDateForInput(date))}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={handleSubmitAttendance}>
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Present" value={statusSummary.present} icon={CheckCircle} variant="success" subtitle={`${dailyAttendanceRate}% of class`} />
        <StatCard label="Absent" value={statusSummary.absent} icon={XCircle} variant="destructive" />
        <StatCard label="Late" value={statusSummary.late} icon={Clock} variant="warning" />
        <StatCard label="Excused" value={statusSummary.excused} icon={Users} variant="info" />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
          <TabsTrigger value="requests">Permission Requests</TabsTrigger>
          <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Mark Attendance</CardTitle>
                  <CardDescription>{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search student..." 
                      className="pl-8" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon" title="Mark all present" onClick={() => handleMarkAll("present")}>
                    <CheckCircle className="h-4 w-4 text-success" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <EmptyState icon={Users} title="No students found" description="Try adjusting your search query." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredStudents.map((student) => (
                    <StudentAttendanceCard
                      key={student.id}
                      student={student}
                      status={currentAttendance[student.id] || "present"}
                      onStatusChange={handleStatusChange}
                      onViewHistory={() => {}}
                      isSaved={!!attendanceByDate[selectedDate]}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Permission Requests</CardTitle>
              <CardDescription>Review absence requests from students</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState 
                icon={Users} 
                title="No pending requests" 
                description="There are no new permission requests to review." 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Monthly Attendance Summary</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">20</TableCell>
                      <TableCell className="text-center">1</TableCell>
                      <TableCell className="text-center">1</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={student.attendanceRate >= 90 ? "success" : "warning"}>
                          {student.attendanceRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherAttendance;
