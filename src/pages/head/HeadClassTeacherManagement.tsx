// Replacing file with a complete, validated implementation.
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  MessageSquare,
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
  const [gradeSubmissions, setGradeSubmissions] = useState<GradeSubmission[]>([
    {
      id: 1,
      subject: "Mathematics",
      teacher: "Mr. Johnson",
      submittedOn: "Oct 12, 2025",
      averageScore: 87,
      status: "Pending",
    },
    {
      id: 2,
      subject: "Physics",
      teacher: "Ms. Davis",
      submittedOn: "Oct 11, 2025",
      averageScore: 91,
      status: "Verified",
    },
    {
      id: 3,
      subject: "English Literature",
      teacher: "Mrs. Wilson",
      submittedOn: "Oct 10, 2025",
      averageScore: 83,
      status: "Needs Revision",
    },
    {
      id: 4,
      subject: "Chemistry",
      teacher: "Dr. Brown",
      submittedOn: "Oct 9, 2025",
      averageScore: 89,
      status: "Pending",
    },
  ]);

  // Attendance
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([
    { id: 1, student: "Aisha Khan", status: "Present" },
    { id: 2, student: "Daniel Smith", status: "Present" },
    { id: 3, student: "Maria Rodriguez", status: "Late" },
    { id: 4, student: "Liam Chen", status: "Absent" },
    { id: 5, student: "Sofia Martins", status: "Excused" },
  ]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: 1,
      student: "Isabella Gomez",
      reason: "Medical appointment",
      date: "Oct 16, 2025",
      status: "Pending",
    },
    {
      id: 2,
      student: "Noah Patel",
      reason: "Family travel",
      date: "Oct 18, 2025",
      status: "Approved",
    },
  ]);

  // Messages
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 1,
      sender: "Mr. Johnson",
      role: "Subject Teacher",
      subject: "Mathematics grade update",
      timestamp: "Today, 09:45 AM",
      unread: true,
      body: "Revised score sheet uploaded. Please review before the final submission deadline.",
    },
    {
      id: 2,
      sender: "Head of Academics",
      role: "Head",
      subject: "Final results deadline",
      timestamp: "Yesterday, 05:12 PM",
      unread: false,
      body: "Reminder that all verified results must be submitted before Friday 4 PM.",
    },
    {
      id: 3,
      sender: "Student Council",
      role: "Student",
      subject: "Attendance clarification",
      timestamp: "Oct 13, 2025",
      unread: false,
      body: "Could we confirm excused absences for the debate team participants?",
    },
  ]);

  const [messageFilter, setMessageFilter] = useState<"All" | MessageRole>(
    "All"
  );
  const [composeSubject, setComposeSubject] = useState("");
  const [composeRecipients, setComposeRecipients] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeTag, setComposeTag] = useState("Grade Update");

  const notifications: NotificationItem[] = [
    {
      id: 1,
      title: "Admin review scheduled",
      category: "Academic",
      time: "15 minutes ago",
      message:
        "Head of Academics will review verified results tomorrow at 10:00 AM.",
    },
    {
      id: 2,
      title: "Disciplinary notice",
      category: "Disciplinary",
      time: "1 hour ago",
      message:
        "Report submitted for late attendance on Oct 13. Awaiting your confirmation.",
    },
    {
      id: 3,
      title: "Attendance summary ready",
      category: "Academic",
      time: "Yesterday",
      message:
        "Monthly attendance analytics for Class 11A is available for download.",
    },
  ];

  // Derived
  const totalStudents = 32;
  const verifiedCount = gradeSubmissions.filter(
    (s) => s.status === "Verified"
  ).length;
  const pendingCount = gradeSubmissions.filter(
    (s) => s.status === "Pending"
  ).length;
  const revisionCount = gradeSubmissions.filter(
    (s) => s.status === "Needs Revision"
  ).length;
  const averageScore = Math.round(
    gradeSubmissions.reduce((sum, s) => sum + s.averageScore, 0) /
      gradeSubmissions.length
  );
  const pendingSubmissions = gradeSubmissions.length - verifiedCount;

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
