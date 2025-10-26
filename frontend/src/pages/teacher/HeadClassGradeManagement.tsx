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
  getHeadClassSummary,
  getHeadTeacherClasses,
  type HeadClassAssignment,
  type HeadClassSummary,
} from "@/lib/grades/workflowStore";

const HEAD_TEACHER_ID = "teacher-head-11a";

const HeadClassGradeManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<HeadClassAssignment[]>(() =>
    getHeadTeacherClasses(HEAD_TEACHER_ID)
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
    setClasses(getHeadTeacherClasses(HEAD_TEACHER_ID));
  };

  const handleApprove = () => {
    if (!summary || summary.approved || !summary.canApprove) return;
    const updated = approveClassResults(summary.classId, HEAD_TEACHER_ID);
    if (!updated) {
      toast({
        title: "Unable to finalize",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    setSummary(updated);
    refreshClasses();
    toast({
      title: "Results published",
      description: `${updated.className} rankings are now visible to students.`,
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
  const approvalReady = summary?.canApprove && !isApproved;
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
            Head of Class Grades
          </h1>
          <p className="text-muted-foreground">
            Review subject submissions, consolidate scores, and publish final
            rankings.
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
                isApproved ? "default" : approvalReady ? "secondary" : "outline"
              }
              className="capitalize"
            >
              {isApproved
                ? "approved"
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
                onClick={handleApprove}
                disabled={!approvalReady}
                className="min-w-[12rem]"
                title={
                  approvalReady
                    ? "Publish results"
                    : isApproved
                    ? "Already approved"
                    : "Waiting on subject submissions"
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isApproved ? "Approved" : "Approve & Finalize"}
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
