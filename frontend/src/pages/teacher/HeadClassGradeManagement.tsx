import { useMemo, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  Send,
  Download,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubjectScore {
  subject: string;
  score: number | null; // Null means the subject teacher has not submitted yet.
  teacher: string;
}

interface StudentGrade {
  id: string;
  name: string;
  subjects: SubjectScore[];
  total: number;
  average: number;
  rank: number;
  status: "incomplete" | "pending" | "verified" | "approved";
  hasAllScores: boolean;
}

const HeadClassGradeManagement = () => {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [selectedTerm, setSelectedTerm] = useState("midterm");

  // Aggregate subject submissions into overall student performance.
  const students: StudentGrade[] = useMemo(() => {
    const rawStudents: Array<
      Omit<
        StudentGrade,
        "total" | "average" | "rank" | "status" | "hasAllScores"
      > & {
        subjects: SubjectScore[];
      }
    > = [
      {
        id: "1",
        name: "Alice Johnson",
        subjects: [
          { subject: "Mathematics", score: 85, teacher: "Mr. Smith" },
          { subject: "English", score: 90, teacher: "Ms. Davis" },
          { subject: "Science", score: 88, teacher: "Dr. Wilson" },
          { subject: "History", score: 92, teacher: "Mrs. Brown" },
        ],
      },
      {
        id: "2",
        name: "Bob Smith",
        subjects: [
          { subject: "Mathematics", score: 78, teacher: "Mr. Smith" },
          { subject: "English", score: 82, teacher: "Ms. Davis" },
          { subject: "Science", score: 85, teacher: "Dr. Wilson" },
          { subject: "History", score: 80, teacher: "Mrs. Brown" },
        ],
      },
      {
        id: "3",
        name: "Carol White",
        subjects: [
          { subject: "Mathematics", score: 92, teacher: "Mr. Smith" },
          { subject: "English", score: 88, teacher: "Ms. Davis" },
          { subject: "Science", score: 90, teacher: "Dr. Wilson" },
          { subject: "History", score: 85, teacher: "Mrs. Brown" },
        ],
      },
      {
        id: "4",
        name: "David Brown",
        subjects: [
          { subject: "Mathematics", score: 70, teacher: "Mr. Smith" },
          { subject: "English", score: 75, teacher: "Ms. Davis" },
          { subject: "Science", score: 72, teacher: "Dr. Wilson" },
          { subject: "History", score: 78, teacher: "Mrs. Brown" },
        ],
      },
      {
        id: "5",
        name: "Emma Davis",
        subjects: [
          { subject: "Mathematics", score: 95, teacher: "Mr. Smith" },
          { subject: "English", score: 87, teacher: "Ms. Davis" },
          { subject: "Science", score: null, teacher: "Dr. Wilson" },
          { subject: "History", score: 89, teacher: "Mrs. Brown" },
        ],
      },
    ];

    const mappedStudents: StudentGrade[] = rawStudents.map((student) => {
      const validScores = student.subjects.filter((s) => s.score !== null);
      const total = validScores.reduce(
        (sum, subject) => sum + (subject.score ?? 0),
        0
      );
      const average = validScores.length > 0 ? total / validScores.length : 0;
      const hasAllScores = student.subjects.every((s) => s.score !== null);

      return {
        id: student.id,
        name: student.name,
        subjects: student.subjects,
        total,
        average,
        rank: 0,
        status: hasAllScores ? "pending" : "incomplete",
        hasAllScores,
      };
    });

    mappedStudents.sort((a, b) => b.total - a.total);
    mappedStudents.forEach((student, index) => {
      student.rank = index + 1;
    });

    return mappedStudents;
  }, []);

  const completedStudents = students.filter((student) => student.hasAllScores);
  const classAverage =
    completedStudents.reduce((sum, student) => sum + student.average, 0) /
    (completedStudents.length || 1);
  const pendingCount = students.filter(
    (student) => student.status === "pending"
  ).length;
  const incompleteCount = students.filter(
    (student) => student.status === "incomplete"
  ).length;
  const highestScore =
    completedStudents.length > 0
      ? Math.max(...completedStudents.map((student) => student.average))
      : 0;

  const handleSubmitToHead = () => {
    toast({
      title: "Grades Submitted",
      description:
        "Final grades have been submitted to Head of School for approval.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Exporting Report",
      description: "Class performance report is being generated...",
    });
  };

  const getStatusColor = (status: StudentGrade["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "verified":
        return "bg-blue-500";
      case "incomplete":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="pt-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Additional Role
        </div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Grade Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Head Class Teacher - Final Grade Review
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button onClick={handleSubmitToHead}>
              <Send className="mr-2 h-4 w-4" />
              Submit to Head of School
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
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

          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="midterm">Mid-Term Exam</SelectItem>
              <SelectItem value="final">Final Exam</SelectItem>
              <SelectItem value="quarterly">Quarterly Assessment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Class Average</CardDescription>
              <CardTitle className="text-3xl">
                {classAverage.toFixed(2)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={classAverage} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Students</CardDescription>
              <CardTitle className="text-3xl">{students.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All enrolled students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Complete Grades</CardDescription>
              <CardTitle className="text-3xl">{pendingCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ready for review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Incomplete Grades</CardDescription>
              <CardTitle className="text-3xl">{incompleteCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Awaiting submissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Highest Score</CardDescription>
              <CardTitle className="text-3xl">
                {highestScore.toFixed(1)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Top performer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Grading Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">
                  Subject Teachers Submitted
                </span>
              </div>
              <div className="h-px bg-border flex-1 mx-4" />
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Head Teacher Review</span>
              </div>
              <div className="h-px bg-muted flex-1 mx-4" />
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Head of School Approval
                </span>
              </div>
              <div className="h-px bg-muted flex-1 mx-4" />
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Published to Students
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Performance - {selectedClass}</CardTitle>
            <CardDescription>
              Review and calculate final rankings from subject teacher
              submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Student Name</TableHead>
                  {students[0]?.subjects.map((subject) => (
                    <TableHead key={subject.subject} className="text-center">
                      {subject.subject}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Average</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      #{student.rank}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    {student.subjects.map((subject) => (
                      <TableCell key={subject.subject} className="text-center">
                        {subject.score !== null ? (
                          <span className="font-medium">{subject.score}</span>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Pending
                          </span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold">
                      {student.total}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {student.average.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(student.status)}>
                        {student.status}
                      </Badge>
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

export default HeadClassGradeManagement;
