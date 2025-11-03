import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// no filters needed
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/useAuth";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle } from "lucide-react";

// Helper types
type Student = { id: string; name: string; rollNo?: string };
type Course = { _id: string; name: string };

const gradeOptions = ["9", "10", "11", "12"];
const streamOptions = ["natural", "social"] as const;

// Toggle mock mode via env; default to true per request
const USE_MOCK = (import.meta.env.VITE_USE_MOCK_SCORES ?? "true") === "true";

// Mock data generators
const mockSectionsByGrade: Record<string, string[]> = {
  "9": ["A", "B", "C"],
  "10": ["A", "B", "C"],
  "11-natural": ["A", "B"],
  "11-social": ["A", "B"],
  "12-natural": ["A"],
  "12-social": ["A"],
};

function getMockSections(grade: string, stream: string) {
  if (!grade) return [] as string[];
  if (grade === "11" || grade === "12") {
    return mockSectionsByGrade[`${grade}-${stream || "natural"}`] || [];
  }
  return mockSectionsByGrade[grade] || [];
}

function getMockStudents(count = 20): Student[] {
  return Array.from({ length: count }).map((_, i) => {
    const n = i + 1;
    return {
      id: `S${n.toString().padStart(3, "0")}`,
      name: `Student ${n}`,
      rollNo: `R-${n.toString().padStart(3, "0")}`,
    };
  });
}

function getMockCourses(grade: string, stream: string): Course[] {
  const base9 = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Civics",
  ];
  const base10 = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History",
  ];
  const natural = ["Mathematics", "Physics", "Chemistry", "Biology", "English"];
  const social = [
    "Mathematics",
    "History",
    "Geography",
    "Economics",
    "English",
  ];
  const list =
    grade === "9"
      ? base9
      : grade === "10"
      ? base10
      : stream === "social"
      ? social
      : natural;
  return list.map((name, idx) => ({ _id: `C${idx + 1}`, name }));
}

function seedMockScores(students: Student[], courses: Course[]) {
  const map: Record<string, Record<string, number>> = {};
  students.forEach((s) => {
    map[s.id] = {};
    courses.forEach((c, ci) => {
      // Deterministic pseudo-random but repeatable
      const base = (s.id.charCodeAt(1) + s.id.charCodeAt(2) + ci * 17) % 61; // 0..60
      const score = 40 + (base % 61); // 40..100
      map[s.id][c._id] = Math.min(100, Math.max(0, score));
    });
  });
  return map as Record<string, Record<string, number | null>>;
}

export default function AllScoreManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<string>("natural");

  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [scores, setScores] = useState<
    Record<string, Record<string, number | null>>
  >({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSenior = useMemo(
    () => selectedGrade === "11" || selectedGrade === "12",
    [selectedGrade]
  );
  const classId = useMemo(
    () =>
      selectedGrade && selectedSection
        ? `${selectedGrade}${selectedSection}`
        : "",
    [selectedGrade, selectedSection]
  );

  // Auto-detect assigned class for head-of-class
  useEffect(() => {
    (async () => {
      if (!user || user.role !== "teacher" || !user.isHeadClassTeacher) return;
      if (USE_MOCK) {
        setSelectedGrade("11");
        setSelectedSection("A");
        setSelectedStream("natural");
        return;
      }
      try {
        const res = await fetch(`${apiBaseUrl}/api/teacher/my-head-class`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("No head-of-class assignment");
        const data = await res.json();
        const { grade, section } = data?.data || {};
        setSelectedGrade(grade || "");
        setSelectedSection(section || "");
      } catch (e) {
        toast({ title: "No assignment", description: "You are not assigned as head-of-class.", variant: "destructive" });
      }
    })();
  }, [user, apiBaseUrl, token, toast]);

  // No section picker; class is derived from assignment

  // Load students and courses when grade/section/stream pickers are set
  useEffect(() => {
    (async () => {
      if (!selectedGrade || !selectedSection) return;
      setLoading(true);
      try {
        if (USE_MOCK) {
          const stuList = getMockStudents(24);
          const crsList = getMockCourses(selectedGrade, selectedStream);
          setStudents(stuList);
          setCourses(crsList);
          const seeded = seedMockScores(stuList, crsList);
          setScores(seeded);
        } else {
          // Students (teacher-accessible)
          const stuQs = new URLSearchParams({
            grade: selectedGrade,
            section: selectedSection,
          });
          const stuRes = await fetch(
            `${apiBaseUrl}/api/teacher/students?${stuQs.toString()}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const stuPayload = await stuRes.json();
          const stuList: Student[] = stuPayload?.data?.students ?? [];
          setStudents(stuList);

          // Derive subjects from evaluations present for this class
          const scRes = await fetch(
            `${apiBaseUrl}/api/teacher/class-scores?${new URLSearchParams({ grade: selectedGrade, section: selectedSection }).toString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const scPayload = await scRes.json();
          const evalGroups: Array<{
            courseId: string;
            courseName: string;
            scores: { studentId: string; score: number; maxScore: number }[];
          }> = scPayload?.data?.evaluations ?? [];
          const crsList: Course[] = evalGroups.map((g) => ({ _id: g.courseId, name: g.courseName || g.courseId }));
          setCourses(crsList);

          // Build initial empty scores map
          const base: Record<string, Record<string, number | null>> = {};
          stuList.forEach((s) => {
            base[s.id] = {};
            crsList.forEach((c) => (base[s.id][c._id] = null));
          });
          setScores(base);

          // Fill in scores from grouped evaluations
          evalGroups.forEach((grp) => {
            const byStudent = new Map<string, { sum: number; cnt: number }>();
            grp.scores.forEach((ev) => {
              const max = Math.max(1, Number(ev.maxScore || 0));
              const val = Math.max(0, Math.min(1, Number(ev.score || 0) / max));
              const curr = byStudent.get(ev.studentId) || { sum: 0, cnt: 0 };
              curr.sum += val;
              curr.cnt += 1;
              byStudent.set(ev.studentId, curr);
            });
            setScores((prev) => {
              const next = { ...prev };
              stuList.forEach((s) => {
                const agg = byStudent.get(s.id);
                next[s.id] = next[s.id] || {};
                next[s.id][grp.courseId] = agg
                  ? Math.round((agg.sum / agg.cnt) * 100)
                  : null;
              });
              return next;
            });
          });
        }
      } catch (err) {
        console.error("Load data failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [
    selectedGrade,
    selectedSection,
    selectedStream,
    classId,
    apiBaseUrl,
    token,
  ]);

  // Compute totals and ranks (with tie handling)
  const rows = useMemo(() => {
    if (!students.length || !courses.length)
      return [] as Array<{
        studentId: string;
        name: string;
        rollNo?: string;
        total: number;
        average: number;
        rank: number;
        subjectScores: Record<string, number | null>;
      }>;
    const out: Array<{
      studentId: string;
      name: string;
      rollNo?: string;
      total: number;
      average: number;
      rank: number;
      subjectScores: Record<string, number | null>;
    }> = [];
    students.forEach((s) => {
      const subjectScores: Record<string, number | null> = {};
      let sum = 0;
      let count = 0;
      courses.forEach((c) => {
        const sc = scores[s.id]?.[c._id] ?? null;
        subjectScores[c._id] = sc;
        if (typeof sc === "number") {
          sum += sc;
          count += 1;
        }
      });
      const total = sum;
      const average = courses.length ? sum / courses.length : 0; // include missing as 0 to encourage completeness
      out.push({
        studentId: s.id,
        name: s.name,
        rollNo: s.rollNo,
        total: Math.round(total),
        average: Math.round(average * 100) / 100,
        rank: 0,
        subjectScores,
      });
    });
    out.sort((a, b) => b.total - a.total);
    // assign ranks with ties
    let currentRank = 0;
    let lastScore = -1;
    out.forEach((r, idx) => {
      if (r.total !== lastScore) {
        currentRank = idx + 1;
        lastScore = r.total;
      }
      r.rank = currentRank;
    });
    return out;
  }, [students, courses, scores]);

  const allScoresPresent = useMemo(() => {
    if (!students.length || !courses.length) return false;
    return students.every((s) =>
      courses.every((c) => typeof scores[s.id]?.[c._id] === "number")
    );
  }, [students, courses, scores]);

  const averageScore = useMemo(() => {
    if (!rows.length) return 0;
    const sum = rows.reduce((acc, r) => acc + r.average, 0);
    return Math.round((sum / rows.length) * 100) / 100;
  }, [rows]);

  const handleSubmit = async () => {
    if (!user || user.role !== "teacher" || !user.isHeadClassTeacher) return;
    if (!selectedGrade || !selectedSection) return;
    if (!allScoresPresent) {
      toast({
        title: "Incomplete",
        description: "All subject scores must be present before finalization.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        toast({
          title: "Submitted (mock)",
          description: "Scores sent to Head of School (mock).",
        });
        return;
      }
      const payload = {
        grade: selectedGrade,
        section: selectedSection,
        rankings: rows.map((r) => ({
          studentId: r.studentId,
          studentName: r.name,
          rollNo: r.rollNo,
          total: r.total,
          average: r.average,
          rank: r.rank,
          subjectScores: courses.map((c) => ({
            courseId: c._id,
            courseName: c.name,
            score: (scores[r.studentId]?.[c._id] ?? 0) as number,
          })),
        })),
      };
      const res = await fetch(
        `${apiBaseUrl}/api/teacher/class-results/${classId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Submission failed");
      }
      toast({
        title: "Submitted",
        description: "Scores sent to Head of School for approval.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Submission error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== "teacher" || !user.isHeadClassTeacher) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Restricted Access</CardTitle>
            <CardDescription>
              Only head-of-class teachers can manage all scores.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold">All Score Management</h1>
          <p className="text-muted-foreground">
            Review all subject scores, totals and ranks; then finalize and send
            for approval.
          </p>
        </div>
      </div>

      {/* No filters: class/section derived from assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Class</CardTitle>
          <CardDescription>
            {selectedGrade && selectedSection
              ? `${selectedGrade}${selectedSection}`
              : "Detecting head-of-class assignment..."}
          </CardDescription>
        </CardHeader>
      </Card>

      {loading && (
        <Alert>
          <AlertTitle>Loading data...</AlertTitle>
          <AlertDescription>
            Please wait while we fetch students, subjects, and scores.
          </AlertDescription>
        </Alert>
      )}

      {!loading && students.length > 0 && courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Scores</CardTitle>
            <CardDescription>
              Scores out of 100 as submitted by subject teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  {courses.map((c) => (
                    <TableHead key={c._id} className="text-center">
                      {c.name}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.studentId}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.rollNo}
                        </span>
                      </div>
                    </TableCell>
                    {courses.map((c) => {
                      const sc = scores[r.studentId]?.[c._id];
                      return (
                        <TableCell key={c._id} className="text-center">
                          {typeof sc === "number" ? (
                            <span className="font-medium">{sc}</span>
                          ) : (
                            <span className="italic text-muted-foreground">
                              Pending
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold">
                      {r.total}
                    </TableCell>
                    <TableCell className="text-center">#{r.rank}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total students</CardDescription>
              <CardTitle>{students.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Subjects</CardDescription>
              <CardTitle>{courses.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress
                value={
                  courses.length
                    ? Object.values(scores).every((m) =>
                        Object.values(m).every((v) => typeof v === "number")
                      )
                      ? 100
                      : 50
                    : 0
                }
                className="h-2"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Class average</CardDescription>
              <CardTitle>{averageScore.toFixed(2)}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {!loading && selectedGrade && selectedSection && (
        <Card>
          <CardHeader className="flex items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <CardTitle>Finalize</CardTitle>
              <CardDescription>
                Send totals and ranks to Head of School
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {!allScoresPresent && (
                <Badge variant="outline" className="capitalize">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Missing scores
                </Badge>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!allScoresPresent || submitting}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Finalize & Send for
                Approval
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
