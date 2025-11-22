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
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
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

      {/* Subjects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Subject Breakdown</h2>
          <p className="text-sm text-muted-foreground">
            {currentData.subjects.length} subjects
          </p>
        </div>

        {currentData.subjects.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <EmptyState
                icon={BookOpen}
                title="No scores available"
                description="Scores will appear here once your teachers grade your assessments."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentData.subjects.map((subject) => {
              const isExpanded = expandedSubject === subject.name;

              return (
                <Card
                  key={subject.name}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {subject.name}
                          </CardTitle>
                          <CardDescription>
                            Rank: #{subject.rank} in class
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-2xl font-bold">{subject.total}</p>
                          <p className="text-xs text-muted-foreground">/ 100</p>
                        </div>
                        <Badge variant={getGradeColor(subject.grade)} className="px-3">
                          {subject.grade}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedSubject(isExpanded ? null : subject.name)
                          }
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {Object.entries(subject.breakdown).map(([type, score]) => (
                            <div
                              key={type}
                              className="p-4 rounded-lg border bg-muted/30"
                            >
                              <p className="text-xs text-muted-foreground capitalize mb-1">
                                {type}
                              </p>
                              <p className="text-xl font-bold">{score}</p>
                              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{
                                    width: `${(score / 50) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Performance Indicator */}
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <TrendingUp className="h-4 w-4 text-success" />
                          <p className="text-sm">
                            <span className="font-medium">Strong performance</span>
                            {" - "}
                            <span className="text-muted-foreground">
                              Keep up the good work!
                            </span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scores;
