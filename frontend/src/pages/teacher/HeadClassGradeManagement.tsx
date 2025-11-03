import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  CalendarClock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/useAuth";
import {
  approveClassResults,
  submitClassFinal,
  getHeadClassSummary,
  getHeadTeacherClasses,
  applyServerClasses,
  applyHeadAssignments,
  type HeadClassAssignment,
  type HeadClassSummary,
} from "@/lib/grades/workflowStore";
// Use the authenticated user's id as the Head Teacher identifier

const HeadClassGradeManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const headId = user?.id || "";
  const [classes, setClasses] = useState<HeadClassAssignment[]>(() =>
    headId ? getHeadTeacherClasses(String(headId)) : []
  );
  const [selectedClassId, setSelectedClassId] = useState(
    () => classes[0]?.classId ?? ""
  );
  const [summary, setSummary] = useState<HeadClassSummary | null>(() =>
    classes[0] ? getHeadClassSummary(classes[0].classId) : null
  );

  useEffect(() => {
    if (!classes.length) {
      setSelectedClassId("");
      return;
    }
    if (
      !selectedClassId ||
      !classes.some((cls) => cls.classId === selectedClassId)
    ) {
      setSelectedClassId(classes[0].classId);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) {
      setSummary(null);
      return;
    }
    setSummary(getHeadClassSummary(selectedClassId));
  }, [selectedClassId]);

  const refreshClasses = () => {
    if (!headId) return;
    setClasses(getHeadTeacherClasses(String(headId)));
  };

  // Bootstrap classes and head assignments from the server so the store
  // reflects the canonical admin-managed data for the logged-in head teacher.
  useEffect(() => {
    if (!headId) return;
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
    const token = localStorage.getItem("token");
    if (!token) return;
    (async () => {
      try {
        // 1) Load all classes (grade/section identifiers)
        const clsRes = await fetch(`${apiBaseUrl}/api/classes`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (clsRes.ok) {
          const payload = (await clsRes.json()) as {
            success: boolean;
            data?: { classes?: Array<{ classId: string; name: string }> };
          };
          const entries = (payload.data?.classes ?? []).map((c) => ({
            id: c.classId,
            name: c.name,
          }));
          if (entries.length) applyServerClasses(entries);
        }

        // 2) Load head-of-class assignments and merge into the store
        const asgRes = await fetch(`${apiBaseUrl}/api/head/class-assignments`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (asgRes.ok) {
          const payload = (await asgRes.json()) as {
            success: boolean;
            data?: {
              assignments?: Array<{
                classId: string;
                headTeacherId: string;
                headTeacherName: string;
              }>;
            };
          };
          const mine = (payload.data?.assignments ?? []).filter(
            (a) => a.headTeacherId === headId
          );
          if (mine.length) {
            applyHeadAssignments(
              mine.map((a) => ({
                classId: a.classId,
                headTeacherId: a.headTeacherId,
                headTeacherName: a.headTeacherName,
              }))
            );
          }
        }
      } catch (err) {
        // Non-fatal: the UI will continue with whatever is in the store
        console.error("Bootstrap head classes failed", err);
      } finally {
        refreshClasses();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headId]);

  const handleSubmitForApproval = () => {
    if (!summary || summary.approved || !summary.canApprove) return;
    if (!headId) return;
    const updated = submitClassFinal(summary.classId, String(headId));
    if (!updated) {
      toast({
        title: "Unable to submit",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    setSummary(updated);
    refreshClasses();
    toast({
      title: "Submitted for approval",
      description: `${updated.className} final rankings sent to Head of School.`,
    });
  };

  const subjectHeaders = useMemo(() => summary?.subjects ?? [], [summary]);
  const rankings = useMemo(() => summary?.rows ?? [], [summary]);

  const submittedSubjects = useMemo(() => {
    return subjectHeaders.filter(
      (subject) =>
        subject.status === "submitted" || subject.status === "approved"
    ).length;
  }, [subjectHeaders]);

  const totalSubjects = subjectHeaders.length;
  const submissionProgress = totalSubjects
    ? Math.round((submittedSubjects / totalSubjects) * 100)
    : 0;
  const averageScore = useMemo(() => {
    if (!rankings.length) return 0;
    const total = rankings.reduce((acc, row) => acc + row.average, 0);
    return total / rankings.length;
  }, [rankings]);
  const topRank = rankings[0];
  const missingSubjects = summary?.missingSubjects ?? [];
  const isApproved = summary?.approved ?? false;
  const isSubmitted = summary?.submitted ?? false;
  const approvalReady = summary?.canApprove && !isApproved && !isSubmitted;
  const lastUpdatedAt = useMemo(() => {
    if (!summary) return null;
    if (summary.approved && summary.approvedAt) return summary.approvedAt;
    let latest: string | null = null;
    subjectHeaders.forEach((subject) => {
      if (!subject.submittedAt) return;
      if (!latest || subject.submittedAt > latest) {
        latest = subject.submittedAt;
      }
    });
    return latest;
  }, [summary, subjectHeaders]);

  if (!user || user.role !== "teacher" || !user.isHeadClassTeacher) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Restricted Access</CardTitle>
            <CardDescription>
              Only teachers assigned as head of class can view consolidated
              grades.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!classes.length) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Head Class Assignment</CardTitle>
            <CardDescription>
              You are not assigned to any class as head teacher yet. Please
              contact the administrator for access.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            All Grades Management
          </h1>
          <p className="text-muted-foreground">
            Review subject submissions, consolidate scores, determine rankings,
            and submit to the Head of School for approval.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.classId} value={cls.classId}>
                  {cls.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {summary && (
            <Badge
              variant={
                isApproved
                  ? "default"
                  : isSubmitted
                  ? "secondary"
                  : approvalReady
                  ? "secondary"
                  : "outline"
              }
              className="capitalize"
            >
              {isApproved
                ? "approved"
                : isSubmitted
                ? "submitted for approval"
                : approvalReady
                ? "ready for approval"
                : "waiting on subjects"}
            </Badge>
          )}
        </div>
      </div>

      {summary?.approved && summary.approvedAt && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Results finalized</AlertTitle>
          <AlertDescription>
            Published on {new Date(summary.approvedAt).toLocaleString()} —
            students can now view their standings.
          </AlertDescription>
        </Alert>
      )}

      {!isApproved && isSubmitted && summary?.submittedAt && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Awaiting Head of School approval</AlertTitle>
          <AlertDescription>
            Submitted on {new Date(summary.submittedAt).toLocaleString()} — you
            will be notified once a decision is made.
          </AlertDescription>
        </Alert>
      )}

      {!isApproved && missingSubjects.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Waiting for subject submissions</AlertTitle>
          <AlertDescription>
            {missingSubjects.join(", ")} still need to submit their final
            scores.
          </AlertDescription>
        </Alert>
      )}

      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total students</CardDescription>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Users className="h-6 w-6 text-primary" />
                {summary.students.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Subjects submitted</CardDescription>
              <CardTitle className="text-3xl">
                {submittedSubjects}/{totalSubjects}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={submissionProgress} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Class average</CardDescription>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <FileCheck className="h-6 w-6 text-primary" />
                {averageScore.toFixed(2)}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Top performer</CardDescription>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Trophy className="h-6 w-6 text-primary" />
                {topRank ? topRank.studentName : "TBD"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {topRank
                  ? `${topRank.total} pts • rank ${topRank.position}`
                  : "Pending submissions"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {summary && (
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Approval workflow</CardTitle>
              <CardDescription>
                Finalize rankings once every subject teacher has submitted their
                sheet.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmitForApproval}
                disabled={!approvalReady}
                className="min-w-[12rem]"
                title={
                  approvalReady
                    ? "Submit to Head for approval"
                    : isApproved
                    ? "Already approved"
                    : isSubmitted
                    ? "Already submitted"
                    : "Waiting on subject submissions"
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isApproved
                  ? "Approved"
                  : isSubmitted
                  ? "Submitted"
                  : "Submit to Head for Approval"}
              </Button>
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                <span>
                  {lastUpdatedAt
                    ? `Last updated ${new Date(lastUpdatedAt).toLocaleString()}`
                    : "Waiting for submissions"}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Subject submission tracker</CardTitle>
            <CardDescription>
              Monitor who has submitted and who is still pending before
              publishing results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {subjectHeaders.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-sm">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {subject.teacherName}
                    </p>
                  </div>
                  <Badge
                    variant={
                      subject.status === "approved"
                        ? "default"
                        : subject.status === "submitted"
                        ? "secondary"
                        : "outline"
                    }
                    className="capitalize"
                  >
                    {subject.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>All subjects score sheet</CardTitle>
            <CardDescription>
              Totals, averages, and ranking are updated automatically from
              submitted subject sheets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  {subjectHeaders.map((subject) => (
                    <TableHead key={subject.id} className="text-center">
                      {subject.name}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((row) => (
                  <TableRow key={row.studentId}>
                    <TableCell className="font-semibold">
                      #{row.position}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{row.studentName}</span>
                        <span className="text-xs text-muted-foreground">
                          {row.rollNo}
                        </span>
                      </div>
                    </TableCell>
                    {subjectHeaders.map((subject) => {
                      const score = row.subjectScores[subject.id]?.score;
                      return (
                        <TableCell key={subject.id} className="text-center">
                          {typeof score === "number" ? (
                            <span className="font-medium">{score}</span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Pending
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold">
                      {row.total}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={row.average >= 85 ? "default" : "secondary"}
                      >
                        {row.average.toFixed(2)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HeadClassGradeManagement;
