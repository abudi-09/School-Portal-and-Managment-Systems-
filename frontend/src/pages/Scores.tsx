import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/patterns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/patterns";
import { EmptyState } from "@/components/patterns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Scores = () => {
  const [selectedSemester, setSelectedSemester] = useState("semester1");

  const semesterData = {
    semester1: {
      subjects: [
        {
          name: "Mathematics",
          total: 92,
          grade: "A",
          rank: 5,
          breakdown: { exam: 45, test: 25, assignment: 15, quiz: 7 },
        },
        {
          name: "Physics",
          total: 88,
          grade: "A-",
          rank: 8,
          breakdown: { exam: 42, test: 24, assignment: 14, quiz: 8 },
        },
        {
          name: "Chemistry",
          total: 90,
          grade: "A",
          rank: 6,
          breakdown: { exam: 44, test: 24, assignment: 15, quiz: 7 },
        },
        {
          name: "English",
          total: 85,
          grade: "B+",
          rank: 12,
          breakdown: { exam: 40, test: 23, assignment: 15, quiz: 7 },
        },
        {
          name: "History",
          total: 87,
          grade: "B+",
          rank: 9,
          breakdown: { exam: 42, test: 23, assignment: 15, quiz: 7 },
        },
      ],
    },
    semester2: {
      subjects: [
        {
          name: "Mathematics",
          total: 94,
          grade: "A",
          rank: 3,
          breakdown: { exam: 46, test: 26, assignment: 15, quiz: 7 },
        },
        {
          name: "Physics",
          total: 91,
          grade: "A",
          rank: 5,
          breakdown: { exam: 44, test: 25, assignment: 15, quiz: 7 },
        },
        {
          name: "Chemistry",
          total: 89,
          grade: "A-",
          rank: 7,
          breakdown: { exam: 43, test: 24, assignment: 15, quiz: 7 },
        },
        {
          name: "English",
          total: 88,
          grade: "A-",
          rank: 8,
          breakdown: { exam: 42, test: 24, assignment: 15, quiz: 7 },
        },
        {
          name: "History",
          total: 90,
          grade: "A",
          rank: 6,
          breakdown: { exam: 44, test: 24, assignment: 15, quiz: 7 },
        },
      ],
    },
  };

  const currentData = semesterData[selectedSemester as keyof typeof semesterData];
  const totalScore = currentData.subjects.reduce((sum, s) => sum + s.total, 0);
  const averageScore = (totalScore / currentData.subjects.length).toFixed(1);
  const averageRank = Math.round(
    currentData.subjects.reduce((sum, s) => sum + s.rank, 0) / currentData.subjects.length
  );

  // Helper to compute stats for any subject list
  const computeStats = (subjects: { total: number; rank: number }[]) => {
    if (!subjects || subjects.length === 0) return { totalScore: 0, averageScore: "0.0", averageRank: 0 };
    const total = subjects.reduce((s, x) => s + (x.total || 0), 0);
    const avg = (total / subjects.length).toFixed(1);
    const avgRank = Math.round(subjects.reduce((s, x) => s + (x.rank || 0), 0) / subjects.length);
    return { totalScore: total, averageScore: avg, averageRank: avgRank };
  };

  const sem1 = computeStats(semesterData.semester1.subjects);
  const sem2 = computeStats(semesterData.semester2.subjects);
  const combined = {
    totalScore: sem1.totalScore + sem2.totalScore,
    averageScore: ((parseFloat(sem1.averageScore) + parseFloat(sem2.averageScore)) / 2).toFixed(1),
    averageRank: Math.round((sem1.averageRank + sem2.averageRank) / 2),
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "default";
    if (grade.startsWith("B")) return "secondary";
    if (grade.startsWith("C")) return "outline";
    return "destructive";
  };

  const getScoreVariant = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 80) return "info";
    if (score >= 70) return "warning";
    return "destructive";
  };

  // Collapsible subject details component (local to Scores)
  const SubjectCollapse = ({
    subject,
  }: {
    subject: {
      name: string;
      total: number;
      grade: string;
      rank: number;
      breakdown: Record<string, number>;
    };
  }) => {
    const [open, setOpen] = useState(false);

    return (
      <div className="card-toggle">
        <div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="w-full text-left p-4 flex items-center justify-between gap-4 focus:outline-none focus-visible:ring focus-visible:ring-primary/50"
          >
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg mb-0">{subject.name}</CardTitle>
                <Badge variant={getGradeColor(subject.grade)} className="uppercase text-[10px]">{subject.grade}</Badge>
              </div>
              <CardDescription className="mb-0">Rank: #{subject.rank}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold">{subject.total}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
              {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="p-4">
              <div className="w-full overflow-hidden">
                <div className="bg-card shadow-sm rounded-md border border-border/50">
                  <table className="min-w-full divide-y divide-border/50 text-sm leading-6">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Assessment</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Out Of</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border/50">
                      {Object.entries(subject.breakdown).map(([type, score]) => (
                        <tr key={type} className="bg-card hover:bg-muted/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-foreground capitalize">{type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-foreground">{score}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-muted-foreground">50</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/10 font-semibold">
                        <td className="px-6 py-4 text-foreground">Total</td>
                        <td className="px-6 py-4 text-right text-foreground">{subject.total}</td>
                        <td className="px-6 py-4 text-right text-muted-foreground">100</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Scores & Grades"
        description="View your academic performance and detailed grade breakdowns"
        actions={
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semester1">Semester 1</SelectItem>
              <SelectItem value="semester2">Semester 2</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          label="Total Score"
          value={totalScore}
          icon={Target}
          subtitle={`Out of ${currentData.subjects.length * 100}`}
          variant="info"
        />
        <StatCard
          label="Average Score"
          value={averageScore}
          icon={Award}
          subtitle="Across all subjects"
          variant="success"
        />
        <StatCard
          label="Average Rank"
          value={averageRank}
          icon={TrendingUp}
          subtitle="Class position"
          variant="default"
        />
      </div>

      {/* Tabbed content: Semester Overview + Subject Details */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList aria-label="Scores Sections" className="gap-2">
          <TabsTrigger value="overview">Semester Overview</TabsTrigger>
          <TabsTrigger value="details">Subject Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="transition-opacity duration-200 ease-in-out" aria-live="polite">
          <div className="grid gap-6">
            {/* Semester One */}
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Semester One</CardTitle>
                <CardDescription>Summary for Semester 1</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard label="Total Score" value={sem1.totalScore} icon={Target} subtitle={`Out of ${semesterData.semester1.subjects.length * 100}`} variant="info" />
                  <StatCard label="Average Score" value={sem1.averageScore} icon={Award} subtitle="Average across subjects" variant="success" />
                  <StatCard label="Average Rank" value={sem1.averageRank} icon={TrendingUp} subtitle="Class position" variant="default" />
                </div>
              </CardContent>
            </Card>

            {/* Semester Two */}
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Semester Two</CardTitle>
                <CardDescription>Summary for Semester 2</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard label="Total Score" value={sem2.totalScore} icon={Target} subtitle={`Out of ${semesterData.semester2.subjects.length * 100}`} variant="info" />
                  <StatCard label="Average Score" value={sem2.averageScore} icon={Award} subtitle="Average across subjects" variant="success" />
                  <StatCard label="Average Rank" value={sem2.averageRank} icon={TrendingUp} subtitle="Class position" variant="default" />
                </div>
              </CardContent>
            </Card>

            {/* Combined */}
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Combined (Both Semesters)</CardTitle>
                <CardDescription>Average across semesters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard label="Total Score" value={combined.totalScore} icon={Target} subtitle={`Out of ${(semesterData.semester1.subjects.length + semesterData.semester2.subjects.length) * 100}`} variant="info" />
                  <StatCard label="Average Score" value={combined.averageScore} icon={Award} subtitle="Average of both semesters" variant="success" />
                  <StatCard label="Average Rank" value={combined.averageRank} icon={TrendingUp} subtitle="Combined class position" variant="default" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="transition-opacity duration-200 ease-in-out">
          <div className="grid gap-4">
            {currentData.subjects.map((subject) => (
              <Card key={subject.name} className="transition-transform transform hover:-translate-y-0.5">
                <SubjectCollapse subject={subject} />
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Scores;
