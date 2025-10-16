import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Clock,
  RefreshCcw,
  TrendingDown,
  Users,
  XCircle,
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
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface Student {
  id: number;
  name: string;
  rollNo: string;
  attendanceRate: number;
}

type AttendanceRecord = Record<number, AttendanceStatus>;

type StudentHistoryEntry = {
  date: string;
  status: AttendanceStatus;
  saved: boolean;
};

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

const formatReadableDate = (value: string) => {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const statusMeta: Record<
  AttendanceStatus,
  { label: string; className: string; icon: typeof CheckCircle }
> = {
  present: {
    label: "Present",
    className: "border-emerald-500 bg-emerald-50 text-emerald-600",
    icon: CheckCircle,
  },
  absent: {
    label: "Absent",
    className: "border-red-500 bg-red-50 text-red-600",
    icon: XCircle,
  },
  late: {
    label: "Late",
    className: "border-amber-500 bg-amber-50 text-amber-600",
    icon: Clock,
  },
  excused: {
    label: "Excused",
    className: "border-sky-500 bg-sky-50 text-sky-600",
    icon: Users,
  },
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
    ],
    []
  );

  const assignedClass = {
    id: "11A",
    name: "Class 11A - Mathematics",
    homeroom: "Room 305",
    session: "Academic Year 2024/2025",
  };

  const today = formatDateForInput(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [attendanceByDate, setAttendanceByDate] = useState<
    Record<string, AttendanceRecord>
  >(() => {
    const yesterday = formatDateForInput(new Date(Date.now() - 86400000));
    const twoDaysAgo = formatDateForInput(new Date(Date.now() - 2 * 86400000));

    return {
      [yesterday]: createAttendanceRecord(students, { 3: "absent", 4: "late" }),
      [twoDaysAgo]: createAttendanceRecord(students, {
        2: "absent",
        5: "late",
      }),
    };
  });
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord>(
    () => createAttendanceRecord(students)
  );
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyStudentId, setHistoryStudentId] = useState<number | null>(null);

  useEffect(() => {
    const saved = attendanceByDate[selectedDate];
    setCurrentAttendance(
      saved ? { ...saved } : createAttendanceRecord(students)
    );
  }, [attendanceByDate, selectedDate, students]);

  const statusSummary = useMemo(() => {
    const summary: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    students.forEach((student) => {
      const status = currentAttendance[student.id];
      if (status) {
        summary[status] += 1;
      }
    });

    return summary;
  }, [currentAttendance, students]);

  const hasSavedRecord = Boolean(attendanceByDate[selectedDate]);

  const hasUnsavedChanges = useMemo(() => {
    if (!hasSavedRecord) {
      return true;
    }

    const saved = attendanceByDate[selectedDate];
    return students.some(
      (student) => saved?.[student.id] !== currentAttendance[student.id]
    );
  }, [
    attendanceByDate,
    currentAttendance,
    hasSavedRecord,
    selectedDate,
    students,
  ]);

  const selectedHistoryStudent = useMemo(
    () =>
      historyStudentId == null
        ? null
        : students.find((student) => student.id === historyStudentId) ?? null,
    [historyStudentId, students]
  );

  const studentHistory = useMemo(() => {
    if (historyStudentId == null) {
      return [] as StudentHistoryEntry[];
    }

    const entries: StudentHistoryEntry[] = [];

    Object.entries(attendanceByDate).forEach(([date, record]) => {
      const status = record[historyStudentId];
      if (status) {
        entries.push({ date, status, saved: true });
      }
    });

    const currentStatus = currentAttendance[historyStudentId];
    if (currentStatus) {
      const savedForSelectedDate = Boolean(attendanceByDate[selectedDate]);
      const existingIndex = entries.findIndex(
        (entry) => entry.date === selectedDate
      );
      const currentEntry = {
        date: selectedDate,
        status: currentStatus,
        saved: savedForSelectedDate,
      };

      if (existingIndex >= 0) {
        entries[existingIndex] = currentEntry;
      } else {
        entries.push(currentEntry);
      }
    }

    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceByDate, currentAttendance, historyStudentId, selectedDate]);

  const studentHistorySummary = useMemo(() => {
    const totals: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    studentHistory.forEach((entry) => {
      totals[entry.status] += 1;
    });

    return totals;
  }, [studentHistory]);

  const totalHistorySessions = studentHistory.length;
  const mostRecentHistoryDate = studentHistory[0]?.date ?? null;

  const handleHistoryDialogChange = (open: boolean) => {
    setHistoryModalOpen(open);
    if (!open) {
      setHistoryStudentId(null);
    }
  };

  const handleOpenStudentHistory = (studentId: number) => {
    setHistoryStudentId(studentId);
    setHistoryModalOpen(true);
  };

  const stats = useMemo(
    () => [
      {
        title: "Marked Present",
        value: statusSummary.present,
        total: students.length,
        icon: CheckCircle,
        color: "text-emerald-500",
      },
      {
        title: "Marked Absent",
        value: statusSummary.absent,
        total: students.length,
        icon: XCircle,
        color: "text-red-500",
      },
      {
        title: "Marked Late",
        value: statusSummary.late,
        total: students.length,
        icon: Clock,
        color: "text-amber-500",
      },
      {
        title: "Excused",
        value: statusSummary.excused,
        total: students.length,
        icon: Users,
        color: "text-blue-500",
      },
    ],
    [
      statusSummary.absent,
      statusSummary.excused,
      statusSummary.late,
      statusSummary.present,
      students.length,
    ]
  );

  const absenceRequests = [
    {
      id: 1,
      student: "Michael Brown",
      rollNo: "11A-003",
      date: formatDateForInput(new Date(Date.now() - 86400000)),
      reason: "Medical appointment",
    },
    {
      id: 2,
      student: "Sarah Davis",
      rollNo: "11A-004",
      date: formatDateForInput(new Date(Date.now() - 3 * 86400000)),
      reason: "Family emergency",
    },
  ];

  const attendanceHistory = useMemo(
    () =>
      Object.entries(attendanceByDate)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, record]) => {
          const totals: Record<AttendanceStatus, number> = {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
          };

          students.forEach((student) => {
            const status = record[student.id];
            if (status) {
              totals[status] += 1;
            }
          });

          return {
            date,
            totals,
          };
        }),
    [attendanceByDate, students]
  );

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setCurrentAttendance((previous) => {
      const updated: AttendanceRecord = {
        ...previous,
        [studentId]: status,
      };

      if (status !== "present") {
        students.forEach((student) => {
          if (!updated[student.id]) {
            updated[student.id] = "present";
          }
        });
      }

      return updated;
    });
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setCurrentAttendance(
      students.reduce<AttendanceRecord>((record, student) => {
        record[student.id] = status;
        return record;
      }, {} as AttendanceRecord)
    );
  };

  const handleResetDay = () => {
    const saved = attendanceByDate[selectedDate];
    setCurrentAttendance(
      saved ? { ...saved } : createAttendanceRecord(students)
    );
  };

  const handleSubmitAttendance = () => {
    setAttendanceByDate((previous) => ({
      ...previous,
      [selectedDate]: { ...currentAttendance },
    }));

    toast({
      title: "Attendance saved",
      description: `Attendance for ${formatReadableDate(
        selectedDate
      )} is recorded for ${assignedClass.name}.`,
    });
  };

  return (
    <>
      <div className="p-4 md:p-8 space-y-6">
        <div className="space-y-2">
          <Badge variant="secondary" className="uppercase tracking-wide">
            Head Class Teacher
          </Badge>
          <h1 className="text-3xl font-bold text-foreground">
            Attendance Management
          </h1>
          <p className="text-muted-foreground">
            Record the daily attendance for {assignedClass.name} and keep a
            complete log for your homeroom.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Class Overview</CardTitle>
              <CardDescription>
                Your head class details for quick reference
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Class</span>
                <span className="text-sm font-medium text-foreground">
                  {assignedClass.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Homeroom</span>
                <span className="text-sm font-medium text-foreground">
                  {assignedClass.homeroom}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Students Assigned
                </span>
                <span className="text-sm font-medium text-foreground">
                  {students.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Session</span>
                <span className="text-sm font-medium text-foreground">
                  {assignedClass.session}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission Status</CardTitle>
              <CardDescription>
                Track progress for the selected date
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selected Date</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatReadableDate(selectedDate)}
                  </p>
                </div>
                <Badge variant={hasSavedRecord ? "default" : "outline"}>
                  {hasSavedRecord ? "Submitted" : "Draft"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleMarkAll("present")}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark all present
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleMarkAll("absent")}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Mark all absent
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleMarkAll("late")}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Everyone late
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetDay}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset day
                </Button>
              </div>
              <Button
                type="button"
                className="gap-2"
                onClick={handleSubmitAttendance}
                disabled={!hasUnsavedChanges}
              >
                <ClipboardCheck className="h-4 w-4" />
                {hasSavedRecord ? "Update attendance" : "Submit attendance"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                      <span className="text-lg text-muted-foreground">
                        /{stat.total}
                      </span>
                    </p>
                  </div>
                  <div className={`rounded-lg bg-secondary ${stat.color} p-3`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Take Attendance</CardTitle>
            <CardDescription>
              Attendance is restricted to your assigned head class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <p className="mb-2 text-sm text-muted-foreground">Homeroom</p>
                <Input value={assignedClass.name} readOnly />
              </div>
              <div className="flex-1">
                <p className="mb-2 text-sm text-muted-foreground">
                  Attendance date
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={selectedDate}
                    max={today}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedDate(today)}
                  >
                    <Calendar className="h-4 w-4" />
                    Today
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Attendance</CardTitle>
            <CardDescription>
              Update the status for each student and submit when complete
            </CardDescription>
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
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {student.rollNo}
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell className="text-center">
                      <Select
                        value={currentAttendance[student.id]}
                        onValueChange={(value) =>
                          handleStatusChange(
                            student.id,
                            value as AttendanceStatus
                          )
                        }
                      >
                        <SelectTrigger className="mx-auto w-36">
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenStudentHistory(student.id)}
                      >
                        View history
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Absence Requests
            </CardTitle>
            <CardDescription>
              Review and approve student absence requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {absenceRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg bg-secondary p-4"
                >
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {request.student}
                      </p>
                      <Badge variant="outline">{request.rollNo}</Badge>
                    </div>
                    <p className="mb-1 text-sm text-muted-foreground">
                      Date: {formatReadableDate(request.date)}
                    </p>
                    <p className="text-sm text-foreground">
                      Reason: {request.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm">
                      Deny
                    </Button>
                    <Button type="button" size="sm">
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Attendance History
            </CardTitle>
            <CardDescription>
              Saved submissions for your head class
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {attendanceHistory.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No saved attendance yet. Submit today to populate the history.
              </p>
            )}
            {attendanceHistory.map((entry) => (
              <div
                key={entry.date}
                className="flex flex-col gap-2 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {formatReadableDate(entry.date)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {assignedClass.name} · {students.length} students
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3" /> {entry.totals.present}{" "}
                    present
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <XCircle className="h-3 w-3" /> {entry.totals.absent} absent
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" /> {entry.totals.late} late
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" /> {entry.totals.excused} excused
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={historyModalOpen} onOpenChange={handleHistoryDialogChange}>
        <DialogContent className="max-w-3xl">
          {selectedHistoryStudent ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedHistoryStudent.name}'s attendance history
                </DialogTitle>
                <DialogDescription>
                  {totalHistorySessions > 0 && mostRecentHistoryDate
                    ? `Complete record for ${
                        assignedClass.name
                      }. Latest update ${formatReadableDate(
                        mostRecentHistoryDate
                      )}.`
                    : `No attendance submissions recorded for ${selectedHistoryStudent.name} yet.`}
                </DialogDescription>
              </DialogHeader>

              {totalHistorySessions > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {(
                      [
                        "present",
                        "absent",
                        "late",
                        "excused",
                      ] as AttendanceStatus[]
                    ).map((status) => {
                      const MetaIcon = statusMeta[status].icon;
                      return (
                        <Card key={status}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              {statusMeta[status].label}
                              <MetaIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="mt-2 text-2xl font-semibold text-foreground">
                              {studentHistorySummary[status]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {studentHistorySummary[status] === 1
                                ? "session"
                                : "sessions"}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="rounded-lg border border-border">
                    <ScrollArea className="max-h-80">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Record state</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentHistory.map((entry) => {
                            const StatusIcon = statusMeta[entry.status].icon;
                            return (
                              <TableRow key={entry.date}>
                                <TableCell className="font-medium">
                                  {formatReadableDate(entry.date)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`flex items-center gap-2 border px-3 py-1 text-xs font-semibold ${
                                      statusMeta[entry.status].className
                                    }`}
                                  >
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {statusMeta[entry.status].label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      entry.saved
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                        : "border-amber-500 bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {entry.saved ? "Submitted" : "Pending save"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Attendance history will show here after you submit records for
                  this student.
                </p>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeacherAttendance;
