import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Clock,
  RefreshCcw,
  TrendingUp,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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

type AbsenceStatus = "pending" | "approved" | "denied";

interface AbsenceRequest {
  id: number;
  student: string;
  rollNo: string;
  date: string;
  reason: string;
  status: AbsenceStatus;
}

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
    className: "border-success bg-success/10 text-success",
    icon: CheckCircle,
  },
  absent: {
    label: "Absent",
    className: "border-destructive bg-destructive/10 text-destructive",
    icon: XCircle,
  },
  late: {
    label: "Late",
    className: "border-warning bg-warning/10 text-warning",
    icon: Clock,
  },
  excused: {
    label: "Excused",
    className: "border-accent bg-accent/10 text-accent",
    icon: Users,
  },
};

const statusVisuals: Record<
  AttendanceStatus,
  {
    card: string;
    badge: string;
    button: string;
    buttonActive: string;
  }
> = {
  present: {
    card: "border-success/20 bg-success/10",
    badge: "bg-success/10 text-success",
    button: "border-success/20 text-success hover:bg-success/10",
    buttonActive:
      "border-success bg-success/10 text-success hover:bg-success/20",
  },
  absent: {
    card: "border-destructive/20 bg-destructive/10",
    badge: "bg-destructive/10 text-destructive",
    button: "border-destructive/20 text-destructive hover:bg-destructive/10",
    buttonActive:
      "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
  late: {
    card: "border-warning/20 bg-warning/10",
    badge: "bg-warning/10 text-warning",
    button: "border-warning/20 text-warning hover:bg-warning/10",
    buttonActive:
      "border-warning bg-warning/10 text-warning hover:bg-warning/20",
  },
  excused: {
    card: "border-accent/20 bg-accent/10",
    badge: "bg-accent/10 text-accent",
    button: "border-accent/20 text-accent hover:bg-accent/10",
    buttonActive: "border-accent bg-accent/10 text-accent hover:bg-accent/20",
  },
};

const statusOrder: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
];

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

  const [activeTab, setActiveTab] = useState<"daily" | "requests" | "summary">(
    "daily"
  );
  const [selectedClass, setSelectedClass] = useState<string>(assignedClass.id);

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

  const initialAbsenceRequests = useMemo(
    () => [
      {
        id: 1,
        student: "Michael Brown",
        rollNo: "11A-003",
        date: formatDateForInput(new Date(Date.now() - 86400000)),
        reason: "Medical appointment",
        status: "pending" as AbsenceStatus,
      },
      {
        id: 2,
        student: "Sarah Davis",
        rollNo: "11A-004",
        date: formatDateForInput(new Date(Date.now() - 3 * 86400000)),
        reason: "Family emergency",
        status: "pending" as AbsenceStatus,
      },
    ],
    []
  );
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>(
    initialAbsenceRequests as AbsenceRequest[]
  );

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

  const pendingRequests = useMemo(
    () =>
      absenceRequests.filter((request) => request.status === "pending").length,
    [absenceRequests]
  );

  const totalStudents = students.length;
  const selectedDateObj = useMemo(
    () => new Date(`${selectedDate}T00:00:00`),
    [selectedDate]
  );
  const selectedDateLabel = useMemo(
    () =>
      new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [selectedDate]
  );
  const dailyAttendanceRate = useMemo(() => {
    if (!totalStudents) return 0;
    const rate = (statusSummary.present / totalStudents) * 100;
    return Math.round(rate * 10) / 10;
  }, [statusSummary.present, totalStudents]);
  const summaryCards = useMemo(
    () => [
      {
        key: "total" as const,
        label: "Total",
        value: totalStudents,
        icon: Users,
        accent: "bg-muted text-foreground border-border",
      },
      {
        key: "present" as const,
        label: "Present",
        value: statusSummary.present,
        icon: CheckCircle,
        accent: "bg-success/10 text-success border-success/20",
      },
      {
        key: "absent" as const,
        label: "Absent",
        value: statusSummary.absent,
        icon: XCircle,
        accent: "bg-destructive/10 text-destructive border-destructive/20",
      },
      {
        key: "late" as const,
        label: "Late",
        value: statusSummary.late,
        icon: Clock,
        accent: "bg-warning/10 text-warning border-warning/20",
      },
      {
        key: "excused" as const,
        label: "Excused",
        value: statusSummary.excused,
        icon: Users,
        accent: "bg-accent/10 text-accent border-accent/20",
      },
    ],
    [
      statusSummary.absent,
      statusSummary.excused,
      statusSummary.late,
      statusSummary.present,
      totalStudents,
    ]
  );

  const monthlyAggregate = useMemo(() => {
    if (!attendanceHistory.length || !totalStudents) {
      return {
        sessions: attendanceHistory.length,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        averageRate: 0,
      };
    }

    const totals = attendanceHistory.reduce(
      (acc, entry) => ({
        sessions: acc.sessions + 1,
        present: acc.present + entry.totals.present,
        absent: acc.absent + entry.totals.absent,
        late: acc.late + entry.totals.late,
        excused: acc.excused + entry.totals.excused,
      }),
      { sessions: 0, present: 0, absent: 0, late: 0, excused: 0 }
    );

    const averageRate =
      Math.round(
        (totals.present / (totals.sessions * totalStudents)) * 100 * 10
      ) / 10;

    return { ...totals, averageRate };
  }, [attendanceHistory, totalStudents]);

  const handleApproveRequest = (id: number) => {
    setAbsenceRequests((prev) =>
      prev.map((request) =>
        request.id === id
          ? { ...request, status: "approved" as const }
          : request
      )
    );
    toast({
      title: "Request approved",
      description: "Absence request has been approved and recorded.",
    });
  };

  const handleDenyRequest = (id: number) => {
    setAbsenceRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: "denied" as const } : request
      )
    );
    toast({
      title: "Request denied",
      description: "The absence request has been denied.",
      variant: "destructive",
    });
  };

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
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Attendance Management
              </h1>
              <p className="text-muted-foreground">
                Track and manage student attendance for your classes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11A">Grade 11-A</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-left sm:w-48"
                  >
                    <Calendar className="h-4 w-4" />
                    {selectedDateLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarPicker
                    mode="single"
                    selected={selectedDateObj}
                    onSelect={(date) =>
                      date && setSelectedDate(formatDateForInput(date))
                    }
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setSelectedDate(today)}
              >
                <RefreshCcw className="h-4 w-4" />
                Today
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <Card
                key={card.key}
                className={cn(
                  "rounded-2xl border shadow-sm transition-colors",
                  card.accent
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="text-3xl font-semibold text-foreground">
                        {card.value}
                      </p>
                      {card.key === "present" && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {dailyAttendanceRate}% present today
                        </p>
                      )}
                      {card.key === "total" && pendingRequests > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pendingRequests} permission request
                          {pendingRequests > 1 ? "s" : ""} pending
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg bg-muted/10 p-2">
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "daily" | "requests" | "summary")
            }
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3 gap-2 sm:w-auto">
              <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
              <TabsTrigger value="requests">Permission Requests</TabsTrigger>
              <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Mark Attendance – {selectedDateLabel}</CardTitle>
                    <CardDescription>
                      {assignedClass.name} • Homeroom {assignedClass.homeroom}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-success">
                    <TrendingUp className="h-4 w-4" />
                    {dailyAttendanceRate}% present
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {students.map((student) => {
                      const status = currentAttendance[student.id] ?? "present";
                      const visuals = statusVisuals[status];

                      return (
                        <div
                          key={student.id}
                          className={cn(
                            "rounded-2xl border p-4 transition-colors",
                            visuals.card
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {student.rollNo}
                              </p>
                              <p className="text-lg font-semibold text-foreground">
                                {student.name}
                              </p>
                            </div>
                            <Badge
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold",
                                visuals.badge
                              )}
                            >
                              {statusMeta[status].label}
                            </Badge>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Attendance rate</span>
                            <span className="font-medium text-foreground">
                              {student.attendanceRate}%
                            </span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {statusOrder.map((option) => (
                              <Button
                                key={option}
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(student.id, option)
                                }
                                className={cn(
                                  "justify-center text-xs font-medium",
                                  statusVisuals[option].button,
                                  option === status &&
                                    statusVisuals[option].buttonActive
                                )}
                              >
                                {statusMeta[option].label}
                              </Button>
                            ))}
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {attendanceByDate[selectedDate]?.[student.id]
                                ? "Saved in last submission"
                                : "Not yet submitted"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() =>
                                handleOpenStudentHistory(student.id)
                              }
                            >
                              View history
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAll("present")}
                      >
                        Mark all present
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAll("absent")}
                      >
                        Mark all absent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAll("late")}
                      >
                        Mark all late
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={hasSavedRecord ? "default" : "secondary"}>
                        {hasSavedRecord ? "Submitted" : "Draft"}
                      </Badge>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleResetDay}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Reset
                      </Button>
                      <Button
                        className="gap-2"
                        onClick={handleSubmitAttendance}
                        disabled={!hasUnsavedChanges}
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        Save Attendance
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Permission Requests</CardTitle>
                  <CardDescription>
                    Review absence or permission requests submitted by students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {absenceRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No permission requests have been submitted.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {absenceRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-foreground">
                              {request.student}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.rollNo} •{" "}
                              {formatReadableDate(request.date)}
                            </p>
                            <p className="mt-1 text-sm text-foreground">
                              {request.reason}
                            </p>
                            <Badge
                              variant={
                                request.status === "pending"
                                  ? "secondary"
                                  : request.status === "approved"
                                  ? "default"
                                  : "destructive"
                              }
                              className="mt-2"
                            >
                              {request.status === "pending"
                                ? "Pending approval"
                                : request.status === "approved"
                                ? "Approved"
                                : "Denied"}
                            </Badge>
                          </div>
                          {request.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => handleDenyRequest(request.id)}
                              >
                                Deny
                              </Button>
                              <Button
                                onClick={() => handleApproveRequest(request.id)}
                              >
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Overview</CardTitle>
                  <CardDescription>
                    Attendance submissions captured for {assignedClass.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {monthlyAggregate.sessions === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Submit attendance to start building your monthly summary.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase">
                          Sessions submitted
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {monthlyAggregate.sessions}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase">
                          Present total
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {monthlyAggregate.present}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase">
                          Absences recorded
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {monthlyAggregate.absent}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase">
                          Average attendance
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {monthlyAggregate.averageRate}%
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Absent</TableHead>
                          <TableHead>Late</TableHead>
                          <TableHead>Excused</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceHistory.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-6 text-center text-sm text-muted-foreground"
                            >
                              No attendance history recorded yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          attendanceHistory.map((entry) => (
                            <TableRow key={entry.date}>
                              <TableCell className="font-medium">
                                {formatReadableDate(entry.date)}
                              </TableCell>
                              <TableCell>{entry.totals.present}</TableCell>
                              <TableCell>{entry.totals.absent}</TableCell>
                              <TableCell>{entry.totals.late}</TableCell>
                              <TableCell>{entry.totals.excused}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
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
                                        ? "border-success bg-success/10 text-success"
                                        : "border-warning bg-warning/10 text-warning"
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
