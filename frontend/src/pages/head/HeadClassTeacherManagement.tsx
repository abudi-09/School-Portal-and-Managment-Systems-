// Replacing file with a complete, validated implementation.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
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
import type { User } from "@/contexts/auth-types";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  applyHeadAssignments,
  getAllClasses,
  setClassHead,
  applyServerClasses,
} from "@/lib/grades/workflowStore";

type GradeStatus = "Pending" | "Verified" | "Needs Revision";
type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";
type MessageRole = "Subject Teacher" | "Head" | "Student";

interface GradeSubmission {
  id: number;
  subject: string;
  teacher: string;
  submittedOn: string;
  averageScore: number;
  status: GradeStatus;
}

interface AttendanceRecord {
  id: number;
  student: string;
  status: AttendanceStatus;
}

interface LeaveRequest {
  id: number;
  student: string;
  reason: string;
  date: string;
  status: "Pending" | "Approved" | "Denied";
}

interface MessageItem {
  id: number;
  sender: string;
  role: MessageRole;
  subject: string;
  timestamp: string;
  unread: boolean;
  body: string;
}

interface NotificationItem {
  id: number;
  title: string;
  category: "Academic" | "Disciplinary";
  time: string;
  message: string;
}

type ApiTeacher = User & {
  _id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  employmentInfo?: {
    responsibilities?: string;
  } | null;
};

type ClassRow = {
  id: string;
  name: string;
  grade: string;
  section: string;
  headTeacherId?: string;
  headTeacherName?: string;
};

const normalizeTeacherId = (teacher: ApiTeacher): string => {
  if (typeof teacher.id === "string" && teacher.id) return teacher.id;
  if (typeof teacher._id === "string" && teacher._id) return teacher._id;
  const rawId = teacher._id as unknown;
  if (rawId && typeof rawId === "object" && "toString" in rawId) {
    return (rawId as { toString(): string }).toString();
  }
  return "";
};

const formatTeacherName = (teacher?: ApiTeacher | null): string => {
  if (!teacher) return "";
  if (teacher.fullName?.trim()) return teacher.fullName.trim();
  if (teacher.name?.trim()) return teacher.name.trim();
  const parts = [teacher.firstName, teacher.lastName]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (teacher.email?.trim()) return teacher.email.trim();
  return "Unnamed Teacher";
};

const parseClassId = (classId: string): { grade: string; section: string } => {
  if (!classId) return { grade: "", section: "" };
  const match = classId.match(/^(.*?)([A-Za-z])$/);
  if (!match) return { grade: classId.toUpperCase(), section: "" };
  return {
    grade: match[1].toUpperCase(),
    section: match[2].toUpperCase(),
  };
};

const gradeStatusTone: Record<GradeStatus, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Verified: "bg-emerald-100 text-emerald-700",
  "Needs Revision": "bg-rose-100 text-rose-700",
};

const attendanceTone: Record<AttendanceStatus, string> = {
  Present: "bg-emerald-100 text-emerald-700",
  Absent: "bg-rose-100 text-rose-700",
  Late: "bg-amber-100 text-amber-700",
  Excused: "bg-sky-100 text-sky-700",
};

const leaveTone: Record<"Pending" | "Approved" | "Denied", string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Denied: "bg-rose-100 text-rose-700",
};

export default function HeadClassTeacherManagement() {
  // Role-gated modules (conceptual)
  // if (user.role === 'teacher' && user.isHeadClassTeacher) {
  //   enableModules(['GradeManagement', 'AttendanceManagement', 'Communication']);
  // }

  // Grades
  // Remove mock grade submissions — rely on real data sources when available
  const [gradeSubmissions, setGradeSubmissions] = useState<GradeSubmission[]>(
    []
  );

  // Attendance
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Messages
  const [messages, setMessages] = useState<MessageItem[]>([]);

  const [messageFilter, setMessageFilter] = useState<"All" | MessageRole>(
    "All"
  );
  const [composeSubject, setComposeSubject] = useState("");
  const [composeRecipients, setComposeRecipients] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeTag, setComposeTag] = useState("Grade Update");

  const notifications: NotificationItem[] = [];

  // Derived
  const totalStudents = 0;
  const verifiedCount = gradeSubmissions.filter(
    (s) => s.status === "Verified"
  ).length;
  const pendingCount = gradeSubmissions.filter(
    (s) => s.status === "Pending"
  ).length;
  const revisionCount = gradeSubmissions.filter(
    (s) => s.status === "Needs Revision"
  ).length;
  const averageScore =
    gradeSubmissions.length === 0
      ? 0
      : Math.round(
          gradeSubmissions.reduce((sum, s) => sum + s.averageScore, 0) /
            gradeSubmissions.length
        );
  const pendingSubmissions = Math.max(
    0,
    gradeSubmissions.length - verifiedCount
  );

  const attendanceSummary = useMemo(() => {
    const totals = attendanceRecords.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      { Present: 0, Absent: 0, Late: 0, Excused: 0 } as Record<
        AttendanceStatus,
        number
      >
    );
    return {
      totals,
      presentRate: Math.round(
        (totals.Present / attendanceRecords.length) * 100
      ),
    };
  }, [attendanceRecords]);

  // Actions
  const updateGradeStatus = (id: number, status: GradeStatus) =>
    setGradeSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  const markAllPresent = () =>
    setAttendanceRecords((prev) =>
      prev.map((r) => ({ ...r, status: "Present" }))
    );
  const updateAttendanceStatus = (id: number, status: AttendanceStatus) =>
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  const updateLeaveStatus = (
    id: number,
    status: "Pending" | "Approved" | "Denied"
  ) =>
    setLeaveRequests((prev) =>
      prev.map((lr) => (lr.id === id ? { ...lr, status } : lr))
    );
  const markMessageAsRead = (id: number) =>
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, unread: false } : m))
    );

  const filteredMessages = useMemo(
    () =>
      messageFilter === "All"
        ? messages
        : messages.filter((m) => m.role === messageFilter),
    [messageFilter, messages]
  );

  const handleSendMessage = () => {
    if (
      !composeSubject.trim() ||
      !composeRecipients.trim() ||
      !composeBody.trim()
    )
      return;
    setMessages((prev) => [
      {
        id: prev.length + 1,
        sender: "You",
        role: "Head",
        subject: `${composeTag}: ${composeSubject}`,
        timestamp: "Just now",
        unread: false,
        body: composeBody,
      },
      ...prev,
    ]);
    setComposeSubject("");
    setComposeRecipients("");
    setComposeBody("");
    setComposeTag("Grade Update");
  };

  const canSubmitFinalResults = gradeSubmissions.every(
    (s) => s.status === "Verified"
  );

  // --- Head Class Teacher Assignment ---
  const { user } = useAuth();
  const { toast } = useToast();
  const isAuthorizedForAssignment =
    user?.role === "head" || user?.role === "admin";
  // Class list now loads from backend; we keep a fallback to the local store in case of network issues
  const [serverClasses, setServerClasses] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [classSnapshot, setClassSnapshot] = useState(() => getAllClasses());
  const [assignmentMap, setAssignmentMap] = useState<
    Record<string, { headTeacherId: string; headTeacherName: string }>
  >({});
  const classRows = useMemo<ClassRow[]>(() => {
    const base = serverClasses.map((cls) => {
      const { grade, section } = parseClassId(cls.id);
      const override = assignmentMap[cls.id];
      return {
        id: cls.id,
        name: cls.name,
        grade,
        section,
        headTeacherId: override?.headTeacherId,
        headTeacherName: override?.headTeacherName,
      } satisfies ClassRow;
    });
    return base.sort((a, b) => {
      if (a.grade === b.grade) return a.section.localeCompare(b.section);
      return a.grade.localeCompare(b.grade, undefined, { numeric: true });
    });
  }, [assignmentMap, serverClasses]);
  const grades = useMemo(
    () =>
      Array.from(new Set(classRows.map((cls) => cls.grade))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
    [classRows]
  );
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  useEffect(() => {
    if (!selectedGrade && grades.length > 0) {
      setSelectedGrade(grades[0]);
      return;
    }
    if (selectedGrade && !grades.includes(selectedGrade)) {
      setSelectedGrade(grades[0] ?? "");
    }
  }, [grades, selectedGrade]);
  const sections = useMemo(() => {
    if (!selectedGrade) return [] as string[];
    return classRows
      .filter((cls) => cls.grade === selectedGrade)
      .map((cls) => cls.section)
      .filter(Boolean)
      .sort();
  }, [classRows, selectedGrade]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  useEffect(() => {
    if (!sections.length) {
      setSelectedSection("");
      return;
    }
    setSelectedSection((prev) =>
      prev && sections.includes(prev) ? prev : sections[0]
    );
  }, [sections]);
  const activeClass = useMemo(
    () =>
      classRows.find(
        (cls) => cls.grade === selectedGrade && cls.section === selectedSection
      ) ?? null,
    [classRows, selectedGrade, selectedSection]
  );

  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const teacherOptions = useMemo(
    () =>
      teachers
        .map((teacher) => ({
          id: normalizeTeacherId(teacher),
          name: formatTeacherName(teacher),
        }))
        .filter((entry) => entry.id),
    [teachers]
  );
  const selectedTeacher = useMemo(
    () =>
      teachers.find(
        (teacher) => normalizeTeacherId(teacher) === selectedTeacherId
      ) ?? null,
    [selectedTeacherId, teachers]
  );
  const currentHeadId = activeClass?.headTeacherId ?? "";
  const currentHeadName = activeClass?.headTeacherName ?? "Unassigned";
  const assignButtonDisabled =
    !isAuthorizedForAssignment ||
    !activeClass ||
    !selectedTeacherId ||
    selectedTeacherId === currentHeadId ||
    assigning;

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

  const refreshClassesFromStore = () => {
    setClassSnapshot(getAllClasses());
  };

  const fetchClasses = useCallback(
    async (showToast = false) => {
      if (!isAuthorizedForAssignment) return;
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication required");
        const res = await fetch(`${apiBaseUrl}/api/classes`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = (await res.json()) as {
          success: boolean;
          message?: string;
          data?: {
            classes?: Array<{
              classId: string;
              grade: string;
              section: string;
              name: string;
            }>;
          };
        };
        if (!res.ok || !payload.success) {
          throw new Error(payload.message || "Failed to fetch classes");
        }
        const classes = (payload.data?.classes ?? []).map((c) => ({
          id: c.classId,
          name: c.name,
        }));
        // Persist/merge classes into local workflow store so the Head UI
        // reflects the admin-managed canonical classes and sections.
        applyServerClasses(classes);
        setServerClasses(classes);
        if (showToast) {
          toast({
            title: "Classes refreshed",
            description: `Loaded ${classes.length} classes from server.`,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch classes";
        console.error("Class list fetch error", error);
        // Keep fallback to local store; surface a toast for visibility
        toast({
          title: "Unable to load classes",
          description: message,
          variant: "destructive",
        });
      }
    },
    [apiBaseUrl, isAuthorizedForAssignment, toast]
  );

  const fetchTeachers = useCallback(async () => {
    if (!isAuthorizedForAssignment) return;
    setTeachersLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");
      // Request only approved teachers so the Head assigns from verified staff
      const url = `${apiBaseUrl}/api/head/teachers?limit=1000&isApproved=true`;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = (await res.json()) as {
        success: boolean;
        message?: string;
        data?: { teachers?: ApiTeacher[]; pagination?: unknown };
      };
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || "Failed to fetch teachers");
      }
      const teachersList = (payload.data?.teachers ?? []).map((teacher) => {
        const normalized: ApiTeacher = {
          ...teacher,
          id: normalizeTeacherId(teacher),
          name: formatTeacherName(teacher),
        };
        return normalized;
      });
      teachersList.sort((a, b) =>
        formatTeacherName(a).localeCompare(formatTeacherName(b))
      );
      setTeachers(teachersList);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load teachers";
      console.error("Teacher fetch error", error);
      toast({
        title: "Unable to load teachers",
        description: message,
        variant: "destructive",
      });
    } finally {
      setTeachersLoading(false);
    }
  }, [apiBaseUrl, isAuthorizedForAssignment, toast]);

  useEffect(() => {
    if (!isAuthorizedForAssignment) return;
    void fetchTeachers();
  }, [fetchTeachers, isAuthorizedForAssignment]);

  type AssignmentApiEntry = {
    classId: string;
    grade: string;
    section: string;
    headTeacherId?: string;
    headTeacherName?: string;
  };

  const fetchAssignments = useCallback(
    async (showToast = false) => {
      if (!isAuthorizedForAssignment) return;
      setAssignmentsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication required");
        const res = await fetch(`${apiBaseUrl}/api/head/class-assignments`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = (await res.json()) as {
          success: boolean;
          message?: string;
          data?: { assignments?: AssignmentApiEntry[] };
        };
        if (!res.ok || !payload.success) {
          throw new Error(payload.message || "Failed to fetch assignments");
        }
        const assignments = payload.data?.assignments ?? [];
        const map: Record<
          string,
          { headTeacherId: string; headTeacherName: string }
        > = {};
        assignments.forEach((entry) => {
          if (entry.classId && entry.headTeacherId && entry.headTeacherName) {
            map[entry.classId] = {
              headTeacherId: entry.headTeacherId,
              headTeacherName: entry.headTeacherName,
            };
          }
        });
        setAssignmentMap(map);
        applyHeadAssignments(
          assignments
            .filter(
              (entry) =>
                entry.classId && entry.headTeacherId && entry.headTeacherName
            )
            .map((entry) => ({
              classId: entry.classId,
              headTeacherId: entry.headTeacherId ?? "",
              headTeacherName: entry.headTeacherName ?? "",
            }))
        );
        refreshClassesFromStore();
        if (showToast) {
          toast({
            title: "Assignments refreshed",
            description: "Latest head teacher assignments loaded.",
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch assignments";
        console.error("Class assignment fetch error", error);
        toast({
          title: "Unable to load assignments",
          description: message,
          variant: "destructive",
        });
      } finally {
        setAssignmentsLoading(false);
      }
    },
    [apiBaseUrl, isAuthorizedForAssignment, toast]
  );

  useEffect(() => {
    refreshClassesFromStore();
    if (isAuthorizedForAssignment) {
      void fetchClasses(false);
      void fetchAssignments(false);
    }
  }, [fetchAssignments, fetchClasses, isAuthorizedForAssignment]);

  useEffect(() => {
    if (!activeClass) {
      setSelectedTeacherId("");
      return;
    }
    if (selectedTeacherId && selectedTeacherId === activeClass.headTeacherId) {
      return;
    }
    setSelectedTeacherId(activeClass.headTeacherId ?? "");
  }, [activeClass, selectedTeacherId]);

  const handleAssignHeadTeacher = async () => {
    if (!isAuthorizedForAssignment) {
      toast({
        title: "Not authorized",
        description: "Only head or admin users can assign class teachers.",
        variant: "destructive",
      });
      return;
    }
    if (!activeClass) {
      toast({
        title: "Select a class",
        description: "Choose a grade and section before assigning.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedTeacherId) {
      toast({
        title: "Select a teacher",
        description: "Choose a teacher from the list to assign as head.",
        variant: "destructive",
      });
      return;
    }
    if (selectedTeacherId === currentHeadId) {
      toast({
        title: "No change",
        description: "The selected teacher is already assigned to this class.",
      });
      return;
    }

    setAssigning(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");
      const res = await fetch(
        `${apiBaseUrl}/api/head/class-assignments/${activeClass.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ teacherId: selectedTeacherId }),
        }
      );
      const payload = (await res.json()) as {
        success: boolean;
        message?: string;
        data?: { assignment?: AssignmentApiEntry };
      };
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || "Failed to assign head teacher");
      }
      const assignment = payload.data?.assignment;
      if (
        assignment?.classId &&
        assignment.headTeacherId &&
        assignment.headTeacherName
      ) {
        setAssignmentMap((prev) => ({
          ...prev,
          [assignment.classId]: {
            headTeacherId: assignment.headTeacherId as string,
            headTeacherName: assignment.headTeacherName as string,
          },
        }));
        setClassHead(
          assignment.classId,
          assignment.headTeacherId,
          assignment.headTeacherName
        );
        refreshClassesFromStore();
      }
      toast({
        title: "Head teacher assigned",
        description: `${formatTeacherName(
          selectedTeacher
        )} is now responsible for Grade ${selectedGrade}${selectedSection}.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to assign head teacher";
      console.error("Assignment error", error);
      toast({
        title: "Assignment failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleSelectForRow = (row: ClassRow) => {
    setSelectedGrade(row.grade);
    setSelectedSection(row.section);
    if (row.headTeacherId) {
      setSelectedTeacherId(row.headTeacherId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Total Students
                </CardTitle>
                <CardDescription>Class 11A</CardDescription>
              </div>
              <div className="rounded-xl bg-primary/20 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-foreground">
                {totalStudents}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Active learners this term
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-200/40 to-emerald-100/30 dark:from-emerald-900/40 dark:to-emerald-800/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Average Score
                </CardTitle>
                <CardDescription>Across all subjects</CardDescription>
              </div>
              <div className="rounded-xl bg-emerald-500/15 p-3">
                <Award className="h-6 w-6 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-foreground">
                {averageScore}%
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Steady performance trend
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-200/40 to-amber-100/30 dark:from-amber-900/40 dark:to-amber-800/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Top Performer
                </CardTitle>
                <CardDescription>Current leader</CardDescription>
              </div>
              <div className="rounded-xl bg-amber-500/15 p-3">
                <ArrowUpRight className="h-6 w-6 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                Aisha Khan
              </p>
              <p className="text-sm text-muted-foreground">Overall score 96%</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-rose-200/40 to-rose-100/30 dark:from-rose-900/40 dark:to-rose-800/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Pending Actions
                </CardTitle>
                <CardDescription>Verification queue</CardDescription>
              </div>
              <div className="rounded-xl bg-rose-500/15 p-3">
                <AlertCircle className="h-6 w-6 text-rose-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-foreground">
                {pendingSubmissions}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Submissions awaiting review
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Class Head Assignment
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Assign or replace the head class teacher for each grade and
                  section.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => void fetchAssignments(true)}
                  disabled={assignmentsLoading}
                >
                  {assignmentsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                  Refresh assignments
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isAuthorizedForAssignment ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-amber-500/60 bg-amber-500/10 p-4 text-sm text-amber-700">
                <AlertCircle className="h-5 w-5" />
                Only head or admin accounts can manage class teacher
                assignments.
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade-select">Grade</Label>
                    <Select
                      value={selectedGrade}
                      onValueChange={setSelectedGrade}
                    >
                      <SelectTrigger id="grade-select">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.length === 0 ? (
                          <div className="px-2 py-1 text-sm text-muted-foreground">
                            No classes available
                          </div>
                        ) : (
                          grades.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              Grade {grade}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section-select">Section</Label>
                    <Select
                      value={selectedSection}
                      onValueChange={setSelectedSection}
                      disabled={!sections.length}
                    >
                      <SelectTrigger id="section-select">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.length === 0 ? (
                          <div className="px-2 py-1 text-sm text-muted-foreground">
                            No sections available
                          </div>
                        ) : (
                          sections.map((section) => (
                            <SelectItem key={section} value={section}>
                              Section {section}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-1">
                    <Label htmlFor="teacher-select">Teacher</Label>
                    <Select
                      value={selectedTeacherId}
                      onValueChange={setSelectedTeacherId}
                      disabled={teachersLoading || teacherOptions.length === 0}
                    >
                      <SelectTrigger id="teacher-select">
                        <SelectValue
                          placeholder={
                            teachersLoading
                              ? "Loading teachers..."
                              : "Select teacher"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {teacherOptions.length === 0 ? (
                          <div className="px-2 py-1 text-sm text-muted-foreground">
                            {teachersLoading
                              ? "Fetching teachers"
                              : "No teachers available"}
                          </div>
                        ) : (
                          teacherOptions.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {teachersLoading
                        ? "Fetching approved teachers..."
                        : `${teacherOptions.length} approved teachers available`}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Current head teacher</Label>
                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground">
                      {activeClass ? currentHeadName : "Select a class"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeClass
                        ? `Class ID: ${activeClass.id}`
                        : "Choose grade and section to manage the assignment"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleAssignHeadTeacher}
                    disabled={assignButtonDisabled}
                    className="gap-2"
                  >
                    {assigning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : currentHeadId ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {currentHeadId
                      ? "Reassign head teacher"
                      : "Assign head teacher"}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      refreshClassesFromStore();
                      if (isAuthorizedForAssignment)
                        void fetchAssignments(true);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sync with server
                  </Button>
                </div>

                <div className="overflow-hidden rounded-xl border">
                  <Table>
                    <TableHeader className="bg-muted/50 text-muted-foreground">
                      <TableRow>
                        <TableHead className="w-[120px]">Grade</TableHead>
                        <TableHead className="w-[120px]">Section</TableHead>
                        <TableHead>Class name</TableHead>
                        <TableHead>Head teacher</TableHead>
                        <TableHead className="w-[140px] text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classRows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-sm text-muted-foreground"
                          >
                            No classes available. Please add classes in the
                            system or try syncing again.
                          </TableCell>
                        </TableRow>
                      ) : (
                        classRows.map((row) => {
                          const isActive =
                            row.grade === selectedGrade &&
                            row.section === selectedSection;
                          return (
                            <TableRow
                              key={row.id}
                              className={isActive ? "bg-primary/5" : undefined}
                            >
                              <TableCell className="font-medium text-foreground">
                                {row.grade}
                              </TableCell>
                              <TableCell>{row.section}</TableCell>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>
                                {row.headTeacherName ? (
                                  <Badge variant="secondary">
                                    {row.headTeacherName}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-muted-foreground"
                                  >
                                    Unassigned
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSelectForRow(row)}
                                  className="gap-2"
                                >
                                  <ArrowUpRight className="h-4 w-4" />
                                  {row.headTeacherId ? "Reassign" : "Assign"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Left column: Grade, Attendance, Communication */}
          <div className="space-y-6">
            {/* Grade Management */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold text-foreground">
                      Grade Management
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Review subject submissions, verify accuracy, and escalate
                      final reports.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export Overview
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      disabled={!canSubmitFinalResults}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Submit Final Results
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card className="bg-secondary/40 shadow-none">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                        Verified
                      </CardDescription>
                      <CardTitle className="text-2xl font-semibold text-foreground">
                        {verifiedCount}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-2 w-full rounded-full bg-emerald-500/20">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{
                            width: `${
                              (verifiedCount / gradeSubmissions.length) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-secondary/40 shadow-none">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                        Pending
                      </CardDescription>
                      <CardTitle className="text-2xl font-semibold text-foreground">
                        {pendingCount}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-2 w-full rounded-full bg-amber-500/20">
                        <div
                          className="h-2 rounded-full bg-amber-500"
                          style={{
                            width: `${
                              (pendingCount / gradeSubmissions.length) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-secondary/40 shadow-none">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                        Needs revision
                      </CardDescription>
                      <CardTitle className="text-2xl font-semibold text-foreground">
                        {revisionCount}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-2 w-full rounded-full bg-rose-500/20">
                        <div
                          className="h-2 rounded-full bg-rose-500"
                          style={{
                            width: `${
                              (revisionCount / gradeSubmissions.length) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Teacher
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Submitted
                        </th>
                        <th className="px-4 py-3 text-center font-semibold">
                          Avg Score
                        </th>
                        <th className="px-4 py-3 text-center font-semibold">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {gradeSubmissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-muted/40">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {submission.subject}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {submission.teacher}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {submission.submittedOn}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-foreground">
                            {submission.averageScore}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                gradeStatusTone[submission.status]
                              }`}
                            >
                              {submission.status === "Pending"
                                ? "Pending Review"
                                : submission.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() =>
                                  updateGradeStatus(submission.id, "Verified")
                                }
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                Verify
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() =>
                                  updateGradeStatus(
                                    submission.id,
                                    "Needs Revision"
                                  )
                                }
                              >
                                <XCircle className="h-4 w-4 text-rose-500" />
                                Request Revision
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Management */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold text-foreground">
                      Attendance Management
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Track daily attendance, manage leave permissions, and
                      review trends.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={markAllPresent}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Mark All Present
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export Attendance
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Card className="shadow-none bg-secondary/40">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                        Present Rate
                      </CardDescription>
                      <CardTitle className="text-2xl font-semibold text-foreground">
                        {attendanceSummary.presentRate}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-2 w-full rounded-full bg-emerald-500/20">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${attendanceSummary.presentRate}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  {Object.entries(attendanceSummary.totals).map(
                    ([key, value]) => (
                      <Card key={key} className="shadow-none bg-secondary/40">
                        <CardHeader className="pb-2">
                          <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                            {key}
                          </CardDescription>
                          <CardTitle className="text-2xl font-semibold text-foreground">
                            {value}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              attendanceTone[key as AttendanceStatus]
                            }`}
                          >
                            {key}
                          </span>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="tracker" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tracker">Daily Tracker</TabsTrigger>
                    <TabsTrigger value="requests">Leave Requests</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tracker" className="space-y-4">
                    <div className="overflow-hidden rounded-xl border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60 text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">
                              Student
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Status
                            </th>
                            <th className="px-4 py-3 text-right font-semibold">
                              Update
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {attendanceRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-muted/40">
                              <td className="px-4 py-3 font-medium text-foreground">
                                {record.student}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  className={`px-2.5 py-1 ${
                                    attendanceTone[record.status]
                                  }`}
                                >
                                  {record.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  {(
                                    [
                                      "Present",
                                      "Absent",
                                      "Late",
                                      "Excused",
                                    ] as AttendanceStatus[]
                                  ).map((status) => (
                                    <Button
                                      key={status}
                                      variant={
                                        record.status === status
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() =>
                                        updateAttendanceStatus(
                                          record.id,
                                          status
                                        )
                                      }
                                    >
                                      {status}
                                    </Button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="requests" className="space-y-4">
                    {leaveRequests.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No leave requests awaiting action.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {leaveRequests.map((request) => (
                          <div
                            key={request.id}
                            className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <p className="text-base font-semibold text-foreground">
                                {request.student}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.reason}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Requested for {request.date}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className={`px-2.5 py-1 ${
                                  leaveTone[request.status]
                                }`}
                              >
                                {request.status}
                              </Badge>
                              <Separator
                                orientation="vertical"
                                className="hidden h-8 md:block"
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateLeaveStatus(request.id, "Approved")
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateLeaveStatus(request.id, "Denied")
                                  }
                                >
                                  Deny
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="summary" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Card className="bg-secondary/40 shadow-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-semibold text-foreground">
                            Weekly Overview
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            Attendance trend for the last 5 school days
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {["Mon", "Tue", "Wed", "Thu", "Fri"].map(
                            (day, index) => (
                              <div key={day} className="space-y-1">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                  <span>{day}</span>
                                  <span>{94 + index}% present</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted">
                                  <div
                                    className="h-2 rounded-full bg-primary"
                                    style={{ width: `${94 + index}%` }}
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-secondary/40 shadow-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-semibold text-foreground">
                            Absence Reasons
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            Top reported reasons this month
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {[
                            { reason: "Medical", percentage: 45 },
                            { reason: "Family", percentage: 32 },
                            { reason: "Extracurricular", percentage: 15 },
                            { reason: "Other", percentage: 8 },
                          ].map((item) => (
                            <div key={item.reason} className="space-y-1">
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{item.reason}</span>
                                <span>{item.percentage}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-emerald-500"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Communication & Notifications */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold text-foreground">
                      Communication & Notifications
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Collaborate with subject teachers, students, and
                      leadership teams.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {["All", "Subject Teacher", "Head", "Student"].map(
                      (filter) => (
                        <Button
                          key={filter}
                          variant={
                            messageFilter === filter ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setMessageFilter(filter as typeof messageFilter)
                          }
                        >
                          {filter}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                  <div className="rounded-xl border p-6">
                    <h3 className="text-lg font-semibold text-foreground">
                      Compose message
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Send updates or requests to teachers, students, or
                      leadership.
                    </p>
                    <div className="mt-4 space-y-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-foreground">
                          Recipients
                        </label>
                        <Input
                          placeholder="e.g. Mr. Johnson, Class 11A"
                          value={composeRecipients}
                          onChange={(e) => setComposeRecipients(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-foreground">
                          Subject
                        </label>
                        <Input
                          placeholder="Subject line"
                          value={composeSubject}
                          onChange={(e) => setComposeSubject(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-foreground">
                          Tag
                        </label>
                        <Tabs
                          value={composeTag}
                          onValueChange={(v) => setComposeTag(v)}
                        >
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="Grade Update">
                              Grade Update
                            </TabsTrigger>
                            <TabsTrigger value="Attendance Issue">
                              Attendance Issue
                            </TabsTrigger>
                            <TabsTrigger value="Announcement">
                              Announcement
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-foreground">
                          Message
                        </label>
                        <Textarea
                          rows={5}
                          placeholder="Write your message..."
                          value={composeBody}
                          onChange={(e) => setComposeBody(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Button variant="outline" className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Attach file
                        </Button>
                        <Button onClick={handleSendMessage} className="gap-2">
                          <Bell className="h-4 w-4" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        Messages
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {filteredMessages.filter((m) => m.unread).length} unread
                      </span>
                    </div>
                    <div className="space-y-4">
                      {filteredMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`rounded-xl border p-4 transition-colors ${
                            message.unread
                              ? "border-primary/40 bg-primary/5"
                              : "hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">
                                  {message.sender}
                                </span>
                                <Badge variant="secondary">
                                  {message.role}
                                </Badge>
                              </div>
                              <p className="text-base font-medium text-foreground">
                                {message.subject}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {message.body}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">
                                {message.timestamp}
                              </span>
                              {message.unread && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markMessageAsRead(message.id)}
                                >
                                  Mark read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        Notifications
                      </h3>
                      <Badge variant="secondary">Live</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Stay informed about approvals, escalations, and
                      class-level alerts.
                    </p>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="space-y-2 rounded-lg bg-muted/40 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">
                              {n.title}
                            </span>
                            <Badge
                              variant={
                                n.category === "Academic"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {n.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {n.message}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {n.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border p-5">
                    <h3 className="text-lg font-semibold text-foreground">
                      Quick actions
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Shortcuts to common workflows for head class teachers.
                    </p>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Download consolidated results template
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3"
                      >
                        <Calendar className="h-4 w-4" />
                        Schedule teacher coordination meeting
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Review attendance irregularities
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Verification Summary & Role Context */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Verification Summary
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Progress of collaborative workflows from subject teachers to
                  head approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subject teacher submissions</span>
                    <span>{gradeSubmissions.length} received</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${(gradeSubmissions.length / 6) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Verified and forwarded</span>
                    <span>{verifiedCount}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${(verifiedCount / 6) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Pending revisions</span>
                    <span>{revisionCount}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-rose-500"
                      style={{ width: `${(revisionCount / 6) * 100}%` }}
                    />
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    Workflow guidance
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>
                      Teachers finalize subject marks and submit to you for
                      verification.
                    </li>
                    <li>
                      Verified results are forwarded to heads/admin for
                      consolidation.
                    </li>
                    <li>
                      Flag discrepancies by requesting revisions with contextual
                      notes.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Role Context
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Head class teacher privileges layered on top of standard
                  teacher capabilities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-xl border border-dashed p-4">
                  <p className="font-semibold text-foreground">
                    Base teacher access
                  </p>
                  <p>
                    Dashboard · Assignments · Grade result page · Announcements
                    · Assigned classes · Profile page
                  </p>
                </div>
                <div className="rounded-xl border border-dashed p-4">
                  <p className="font-semibold text-foreground">
                    Extended modules (conditional)
                  </p>
                  <p>
                    Grade management · Attendance management · Communication hub
                    · Approval workflows
                  </p>
                </div>
                <div className="rounded-xl border border-dashed p-4">
                  <p className="font-semibold text-foreground">
                    Activation logic
                  </p>
                  <pre className="mt-2 rounded-lg bg-muted p-3 font-mono text-xs text-foreground">{`if (user.role === 'teacher' && user.isHeadClassTeacher) {\n  enableModules(['GradeManagement', 'AttendanceManagement', 'Communication']);\n}`}</pre>
                  <p className="mt-2">
                    Modules appear as dashboard extensions so teachers
                    seamlessly switch between subject tasks and class-level
                    oversight.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
