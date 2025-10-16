import { useMemo, useState } from "react";
import {
  GraduationCap,
  Search,
  Filter,
  AlertTriangle,
  CalendarCheck,
  BarChart3,
  Award,
  User,
  Eye,
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type StudentStatus = "active" | "inactive" | "on-leave";

type SubjectPerformance = {
  subject: string;
  grade: string;
  classAverage: number;
};

type AttendanceSnapshot = {
  period: string;
  rate: number;
};

type Student = {
  id: number;
  name: string;
  studentId: string;
  gradeLevel: string;
  section: string;
  classRank: number;
  gradeAverage: number;
  gpa: number;
  attendanceRate: number;
  status: StudentStatus;
  guardian: string;
  contact: string;
  alerts: string[];
  subjects: SubjectPerformance[];
  attendanceHistory: AttendanceSnapshot[];
};

const STUDENTS: Student[] = [
  {
    id: 1,
    name: "John Smith",
    studentId: "STU-2024-001",
    gradeLevel: "Grade 11",
    section: "Science A",
    classRank: 4,
    gradeAverage: 91,
    gpa: 3.85,
    attendanceRate: 95,
    status: "active",
    guardian: "Robert Smith",
    contact: "robert.smith@example.com",
    alerts: [],
    subjects: [
      { subject: "Mathematics", grade: "A", classAverage: 89 },
      { subject: "Physics", grade: "A", classAverage: 87 },
      { subject: "Chemistry", grade: "B+", classAverage: 85 },
      { subject: "English", grade: "A", classAverage: 91 },
    ],
    attendanceHistory: [
      { period: "September", rate: 97 },
      { period: "October", rate: 95 },
      { period: "November", rate: 93 },
    ],
  },
  {
    id: 2,
    name: "Emma Wilson",
    studentId: "STU-2024-002",
    gradeLevel: "Grade 11",
    section: "Science A",
    classRank: 2,
    gradeAverage: 94,
    gpa: 3.92,
    attendanceRate: 98,
    status: "active",
    guardian: "Laura Wilson",
    contact: "laura.wilson@example.com",
    alerts: ["Monitor workload to avoid burnout"],
    subjects: [
      { subject: "Mathematics", grade: "A", classAverage: 89 },
      { subject: "Physics", grade: "A+", classAverage: 90 },
      { subject: "Chemistry", grade: "A", classAverage: 88 },
      { subject: "English", grade: "A", classAverage: 91 },
    ],
    attendanceHistory: [
      { period: "September", rate: 98 },
      { period: "October", rate: 99 },
      { period: "November", rate: 97 },
    ],
  },
  {
    id: 3,
    name: "Michael Brown",
    studentId: "STU-2024-003",
    gradeLevel: "Grade 11",
    section: "Commerce B",
    classRank: 18,
    gradeAverage: 73,
    gpa: 2.91,
    attendanceRate: 72,
    status: "active",
    guardian: "Stephanie Brown",
    contact: "stephanie.brown@example.com",
    alerts: ["Low attendance flagged", "Follow-up tutoring recommended"],
    subjects: [
      { subject: "Accounting", grade: "C", classAverage: 74 },
      { subject: "Business Studies", grade: "B-", classAverage: 76 },
      { subject: "Mathematics", grade: "C", classAverage: 71 },
      { subject: "English", grade: "B", classAverage: 78 },
    ],
    attendanceHistory: [
      { period: "September", rate: 75 },
      { period: "October", rate: 70 },
      { period: "November", rate: 71 },
    ],
  },
  {
    id: 4,
    name: "Sarah Davis",
    studentId: "STU-2024-004",
    gradeLevel: "Grade 10",
    section: "STEM A",
    classRank: 6,
    gradeAverage: 88,
    gpa: 3.45,
    attendanceRate: 88,
    status: "active",
    guardian: "Karen Davis",
    contact: "karen.davis@example.com",
    alerts: ["Upcoming science fair project"],
    subjects: [
      { subject: "Mathematics", grade: "A-", classAverage: 86 },
      { subject: "Biology", grade: "A", classAverage: 88 },
      { subject: "Chemistry", grade: "B+", classAverage: 84 },
      { subject: "English", grade: "A", classAverage: 90 },
    ],
    attendanceHistory: [
      { period: "September", rate: 90 },
      { period: "October", rate: 87 },
      { period: "November", rate: 88 },
    ],
  },
  {
    id: 5,
    name: "James Wilson",
    studentId: "STU-2024-005",
    gradeLevel: "Grade 12",
    section: "Humanities A",
    classRank: 8,
    gradeAverage: 86,
    gpa: 3.3,
    attendanceRate: 92,
    status: "active",
    guardian: "Peter Wilson",
    contact: "peter.wilson@example.com",
    alerts: ["Pending university application essays"],
    subjects: [
      { subject: "History", grade: "A", classAverage: 84 },
      { subject: "Geography", grade: "B+", classAverage: 82 },
      { subject: "Economics", grade: "B", classAverage: 80 },
      { subject: "English", grade: "A-", classAverage: 88 },
    ],
    attendanceHistory: [
      { period: "September", rate: 93 },
      { period: "October", rate: 92 },
      { period: "November", rate: 91 },
    ],
  },
  {
    id: 6,
    name: "Lisa Anderson",
    studentId: "STU-2024-006",
    gradeLevel: "Grade 10",
    section: "STEM B",
    classRank: 26,
    gradeAverage: 65,
    gpa: 2.4,
    attendanceRate: 68,
    status: "inactive",
    guardian: "Michael Anderson",
    contact: "michael.anderson@example.com",
    alerts: ["Extended leave approved", "Requires reintegration plan"],
    subjects: [
      { subject: "Mathematics", grade: "D+", classAverage: 73 },
      { subject: "Biology", grade: "C", classAverage: 76 },
      { subject: "Chemistry", grade: "C-", classAverage: 72 },
      { subject: "English", grade: "C", classAverage: 78 },
    ],
    attendanceHistory: [
      { period: "September", rate: 70 },
      { period: "October", rate: 66 },
      { period: "November", rate: 68 },
    ],
  },
];

const StudentManagement = () => {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">(
    "all"
  );
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  const students = STUDENTS;

  // Combine the active filters for flexible exploration.
  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.studentId.toLowerCase().includes(normalizedSearch);

      const matchesGrade =
        gradeFilter === "all" || student.gradeLevel === gradeFilter;
      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;

      const atRisk = student.attendanceRate < 80 || student.gradeAverage < 75;
      const highPerformer = student.gpa >= 3.8;

      const matchesPerformance =
        performanceFilter === "all" ||
        (performanceFilter === "at-risk" && atRisk) ||
        (performanceFilter === "high-performer" && highPerformer);

      return (
        matchesSearch && matchesGrade && matchesStatus && matchesPerformance
      );
    });
  }, [students, searchTerm, gradeFilter, statusFilter, performanceFilter]);

  const uniqueGrades = useMemo(
    () => Array.from(new Set(students.map((student) => student.gradeLevel))),
    [students]
  );

  const averageAttendance = useMemo(() => {
    if (students.length === 0) {
      return 0;
    }
    const totalAttendance = students.reduce(
      (sum, student) => sum + student.attendanceRate,
      0
    );
    return Math.round((totalAttendance / students.length) * 10) / 10;
  }, [students]);

  const averageGpa = useMemo(() => {
    if (students.length === 0) {
      return 0;
    }
    const totalGpa = students.reduce((sum, student) => sum + student.gpa, 0);
    return Math.round((totalGpa / students.length) * 100) / 100;
  }, [students]);

  const atRiskStudents = useMemo(
    () =>
      students.filter(
        (student) => student.attendanceRate < 80 || student.gradeAverage < 75
      ),
    [students]
  );

  const toggleStudent = (id: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((studentId) => studentId !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    const visibleIds = filteredStudents.map((student) => student.id);
    const allSelected = visibleIds.every((id) => selectedStudents.includes(id));

    setSelectedStudents((prev) => {
      if (allSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }

      const merged = new Set([...prev, ...visibleIds]);
      return Array.from(merged);
    });
  };

  const someFilteredSelected = filteredStudents.some((student) =>
    selectedStudents.includes(student.id)
  );
  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) => selectedStudents.includes(student.id));

  const stats = [
    {
      title: "Total Students",
      value: students.length,
      icon: GraduationCap,
      color: "text-primary",
    },
    {
      title: "Average Attendance",
      value: `${averageAttendance}%`,
      icon: CalendarCheck,
      color: "text-blue-500",
    },
    {
      title: "Average GPA",
      value: averageGpa.toFixed(2),
      icon: BarChart3,
      color: "text-emerald-500",
    },
    {
      title: "At-Risk Students",
      value: atRiskStudents.length,
      icon: AlertTriangle,
      color: "text-destructive",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Student Management
          </h1>
          <p className="text-muted-foreground">
            Manage student accounts and monitor performance
          </p>
        </div>
        {selectedStudents.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedStudents.length} selected
            </Badge>
            <Button variant="outline" size="sm">
              Bulk Activate
            </Button>
            <Button variant="outline" size="sm">
              Bulk Deactivate
            </Button>
            <Button variant="secondary" size="sm">
              Export Snapshot
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-secondary/60 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or student ID"
            className="pl-10"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            <SelectValue placeholder="Filter by grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {uniqueGrades.map((grade) => (
              <SelectItem key={grade} value={grade}>
                {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value: StudentStatus | "all") =>
            setStatusFilter(value)
          }
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
        <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Performance focus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Performance</SelectItem>
            <SelectItem value="at-risk">At-Risk</SelectItem>
            <SelectItem value="high-performer">High Performers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>
            Comprehensive oversight of academic performance, attendance metrics,
            and class standings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      allFilteredSelected
                        ? true
                        : someFilteredSelected
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Grade / Section</TableHead>
                <TableHead className="text-center">Attendance</TableHead>
                <TableHead className="text-center">Score (100%)</TableHead>
                <TableHead className="text-center">Class Rank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const atRisk =
                  student.attendanceRate < 80 || student.gradeAverage < 75;
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.studentId}
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary">{student.gradeLevel}</Badge>
                        <Badge variant="outline">
                          Section {student.section}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Badge
                          variant={
                            student.attendanceRate >= 90
                              ? "default"
                              : student.attendanceRate >= 80
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {student.attendanceRate}%
                        </Badge>
                        {student.attendanceRate < 80 && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          student.gradeAverage >= 85 ? "default" : "secondary"
                        }
                      >
                        {student.gradeAverage}/100%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">#{student.classRank}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.status === "active" ? "default" : "outline"
                        }
                      >
                        {student.status}
                      </Badge>
                      {atRisk && (
                        <Badge variant="destructive" className="ml-2">
                          At-Risk
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProfileStudent(student)}
                          className="hover:bg-primary/5 hover:border-primary/20 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          {student.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground"
                  >
                    No students match the selected filters right now.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Profile Dialog */}
      <Dialog
        open={!!profileStudent}
        onOpenChange={() => setProfileStudent(null)}
      >
        <DialogContent className="max-w-5xl max-h-[95vh] p-0">
          <div className="flex flex-col h-full max-h-[95vh]">
            <DialogHeader className="px-6 py-6 border-b bg-gradient-to-br from-primary/8 via-primary/5 to-blue-50/30 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="space-y-1">
                    <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight">
                      {profileStudent?.name}
                    </DialogTitle>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-medium">
                        {profileStudent?.studentId}
                      </Badge>
                      <Badge
                        variant={
                          profileStudent?.status === "active"
                            ? "default"
                            : "outline"
                        }
                        className="font-medium"
                      >
                        {profileStudent?.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Academic Score
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {profileStudent?.gradeAverage}/100%
                    </div>
                  </div>
                  <div className="w-px h-12 bg-border"></div>
                  <div className="text-right space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Attendance Rate
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        profileStudent?.attendanceRate >= 90
                          ? "text-green-600"
                          : profileStudent?.attendanceRate >= 80
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {profileStudent?.attendanceRate}%
                    </div>
                  </div>
                  <div className="w-px h-12 bg-border"></div>
                  <div className="text-right space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Class Position
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      #{profileStudent?.classRank}
                    </div>
                  </div>
                </div>
              </div>

              <DialogDescription className="text-base text-muted-foreground mt-4 flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                Comprehensive academic performance and attendance analytics
                <div className="w-1 h-1 bg-primary rounded-full"></div>
              </DialogDescription>
            </DialogHeader>

            {profileStudent && (
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Academic Profile
                        </CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground/80">
                          Core academic identifiers
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-3 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Academic Level
                            </dt>
                            <dd>
                              <Badge
                                variant="secondary"
                                className="font-medium"
                              >
                                {profileStudent.gradeLevel}
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Class Section
                            </dt>
                            <dd>
                              <Badge variant="outline">
                                {profileStudent.section}
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Class Position
                            </dt>
                            <dd>
                              <Badge variant="outline" className="font-medium">
                                #{profileStudent.classRank}
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Academic Score (100%)
                            </dt>
                            <dd>
                              <Badge
                                variant={
                                  profileStudent.gradeAverage >= 85
                                    ? "default"
                                    : "secondary"
                                }
                                className="font-medium"
                              >
                                {profileStudent.gradeAverage}
                              </Badge>
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <CalendarCheck className="h-4 w-4" />
                          Attendance Metrics
                        </CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground/80">
                          Engagement and contact summary
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-3 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Current Attendance Rate
                            </dt>
                            <dd>
                              <Badge
                                variant={
                                  profileStudent.attendanceRate >= 90
                                    ? "default"
                                    : profileStudent.attendanceRate >= 80
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="font-medium"
                              >
                                {profileStudent.attendanceRate}%
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Enrollment Status
                            </dt>
                            <dd>
                              <Badge
                                variant={
                                  profileStudent.status === "active"
                                    ? "default"
                                    : "outline"
                                }
                                className="font-medium"
                              >
                                {profileStudent.status}
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Primary Guardian
                            </dt>
                            <dd className="text-right font-medium">
                              {profileStudent.guardian}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Guardian Contact
                            </dt>
                            <dd className="text-right font-medium">
                              {profileStudent.contact}
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Performance Overview
                        </CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground/80">
                          Holistic performance snapshot
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-3 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Academic Status
                            </dt>
                            <dd>
                              <Badge
                                variant={
                                  profileStudent.attendanceRate < 80 ||
                                  profileStudent.gradeAverage < 75
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {profileStudent.attendanceRate < 80 ||
                                profileStudent.gradeAverage < 75
                                  ? "Requires Attention"
                                  : "Satisfactory"}
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Performance Level
                            </dt>
                            <dd>
                              <Badge
                                variant={
                                  profileStudent.gradeAverage >= 85
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {profileStudent.gradeAverage >= 85
                                  ? "Superior"
                                  : "Standard"}
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Attendance Rate
                            </dt>
                            <dd className="font-medium">
                              {profileStudent.attendanceRate}%
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Academic Score
                            </dt>
                            <dd className="font-medium">
                              {profileStudent.gradeAverage}%
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Subject Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Subject Performance Analytics
                      </CardTitle>
                      <CardDescription>
                        Detailed subject-wise performance breakdown and
                        comparative analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {profileStudent.subjects.map((subject, index) => (
                          <div
                            key={index}
                            className="space-y-3 p-4 border rounded-lg bg-muted/30"
                          >
                            <header className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-sm text-foreground">
                                  {subject.subject}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Curriculum alignment & cohort standing
                                </p>
                              </div>
                              <Badge
                                variant={
                                  subject.grade.startsWith("A")
                                    ? "default"
                                    : subject.grade.startsWith("B")
                                    ? "secondary"
                                    : "outline"
                                }
                                className="font-medium"
                              >
                                {subject.grade}
                              </Badge>
                            </header>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <div className="flex flex-col gap-0.5">
                                <dt className="text-muted-foreground">
                                  Individual Performance
                                </dt>
                                <dd className="font-medium">
                                  {subject.grade === "A"
                                    ? "95+%"
                                    : subject.grade === "A-"
                                    ? "90-94%"
                                    : subject.grade === "B+"
                                    ? "85-89%"
                                    : subject.grade === "B"
                                    ? "80-84%"
                                    : "75-79%"}
                                </dd>
                              </div>
                              <div className="flex flex-col gap-0.5 text-right">
                                <dt className="text-muted-foreground">
                                  Class Benchmark
                                </dt>
                                <dd className="font-medium">
                                  {subject.classAverage}%
                                </dd>
                              </div>
                              <div className="col-span-2 text-xs text-muted-foreground border-t pt-2">
                                Performance level:&nbsp;
                                {subject.grade === "A"
                                  ? "Outstanding"
                                  : subject.grade === "A-"
                                  ? "Excellent"
                                  : subject.grade === "B+"
                                  ? "Very Good"
                                  : subject.grade === "B"
                                  ? "Good"
                                  : "Satisfactory"}
                              </div>
                            </dl>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Attendance History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5" />
                        Attendance Tracking
                      </CardTitle>
                      <CardDescription>
                        Historical attendance patterns and trend analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-[2fr,1fr,1fr] items-center text-xs uppercase tracking-wide text-muted-foreground/80">
                        <span>Period</span>
                        <span className="text-right">Attendance</span>
                        <span className="text-right">Status</span>
                      </div>
                      <div className="space-y-3">
                        {profileStudent.attendanceHistory.map(
                          (period, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-[2fr,1fr,1fr] items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                <span className="font-medium text-foreground">
                                  {period.period}
                                </span>
                              </div>
                              <span className="text-right text-sm font-medium">
                                {period.rate}%
                              </span>
                              <span className="flex justify-end">
                                <Badge
                                  variant={
                                    period.rate >= 90
                                      ? "default"
                                      : period.rate >= 80
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {period.rate >= 90
                                    ? "Excellent"
                                    : period.rate >= 80
                                    ? "Good"
                                    : "Needs Attention"}
                                </Badge>
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Alerts */}
                  {profileStudent.alerts.length > 0 && (
                    <Card className="border-destructive/50 bg-destructive/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                          Critical Alerts & Notifications
                        </CardTitle>
                        <CardDescription>
                          Urgent matters requiring immediate administrative
                          attention
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {profileStudent.alerts.map((alert, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                            >
                              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-destructive">
                                  {alert}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Immediate administrative intervention required
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            )}

            <DialogFooter className="px-6 py-4 border-t bg-muted/30">
              <Button
                variant="outline"
                onClick={() => setProfileStudent(null)}
                className="min-w-[100px]"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentManagement;
