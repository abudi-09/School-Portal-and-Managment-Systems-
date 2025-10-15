import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Trophy,
  Target,
  BookOpen,
  Calendar,
  Bell,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Scores = () => {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      type: "grade",
      subject: "Mathematics",
      score: 94,
      message: "Final exam graded",
      date: "2 days ago",
      icon: Star,
    },
    {
      id: 2,
      type: "achievement",
      subject: "Physics",
      score: 91,
      message: "Top performer award",
      date: "1 week ago",
      icon: Trophy,
    },
    {
      id: 3,
      type: "feedback",
      subject: "English",
      score: 88,
      message: "Teacher feedback received",
      date: "3 days ago",
      icon: Bell,
    },
  ];

  // Mock progress data for charts
  const progressData = [
    { month: "Sep", score: 85 },
    { month: "Oct", score: 87 },
    { month: "Nov", score: 89 },
    { month: "Dec", score: 88 },
    { month: "Jan", score: 91 },
    { month: "Feb", score: 90 },
  ];

  const semesterData = {
    semester1: {
      subjects: [
        {
          name: "Mathematics",
          total: 92,
          rank: 5,
          breakdown: { exam: 45, test: 25, assignment: 15, other: 7 },
        },
        {
          name: "Physics",
          total: 88,
          rank: 8,
          breakdown: { exam: 42, test: 24, assignment: 14, other: 8 },
        },
        {
          name: "Chemistry",
          total: 90,
          rank: 6,
          breakdown: { exam: 44, test: 24, assignment: 15, other: 7 },
        },
        {
          name: "English",
          total: 85,
          rank: 12,
          breakdown: { exam: 40, test: 23, assignment: 15, other: 7 },
        },
        {
          name: "History",
          total: 87,
          rank: 9,
          breakdown: { exam: 42, test: 23, assignment: 15, other: 7 },
        },
      ],
      totalScore: 442,
      average: 88.4,
      rank: 8,
    },
    semester2: {
      subjects: [
        {
          name: "Mathematics",
          total: 94,
          rank: 4,
          breakdown: { exam: 46, test: 26, assignment: 15, other: 7 },
        },
        {
          name: "Physics",
          total: 91,
          rank: 6,
          breakdown: { exam: 44, test: 25, assignment: 15, other: 7 },
        },
        {
          name: "Chemistry",
          total: 92,
          rank: 5,
          breakdown: { exam: 45, test: 25, assignment: 15, other: 7 },
        },
        {
          name: "English",
          total: 88,
          rank: 10,
          breakdown: { exam: 42, test: 24, assignment: 15, other: 7 },
        },
        {
          name: "History",
          total: 89,
          rank: 8,
          breakdown: { exam: 43, test: 24, assignment: 15, other: 7 },
        },
      ],
      totalScore: 454,
      average: 90.8,
      rank: 6,
    },
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 80) return "text-accent";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  const renderTranscript = (semesterKey: "semester1" | "semester2") => {
    const data = semesterData[semesterKey];
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-2xl font-bold text-foreground">
                    {data.totalScore}
                  </p>
                </div>
                <Award className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold text-success">
                    {data.average}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Class Rank</p>
                  <p className="text-2xl font-bold text-accent">#{data.rank}</p>
                </div>
                <Badge variant="outline" className="text-lg">
                  Top 10%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Scores</CardTitle>
            <CardDescription>Detailed breakdown by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.subjects.map((subject) => (
                <div
                  key={subject.name}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <h3 className="font-semibold text-foreground">
                          {subject.name}
                        </h3>
                        <Progress
                          value={subject.total}
                          className="flex-1 max-w-xs"
                        />
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p
                            className={`text-2xl font-bold ${getScoreColor(
                              subject.total
                            )}`}
                          >
                            {subject.total}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            out of 100
                          </p>
                        </div>
                        <Badge variant="secondary">Rank #{subject.rank}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDetailed = (semesterKey: "semester1" | "semester2") => {
    const data = semesterData[semesterKey];
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Grade Breakdown</CardTitle>
          <CardDescription>
            View assessment components for each subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.subjects.map((subject) => {
              const isExpanded =
                expandedSubject === `${semesterKey}-${subject.name}`;
              return (
                <div
                  key={subject.name}
                  className="border rounded-lg overflow-hidden"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto hover:bg-secondary"
                    onClick={() =>
                      setExpandedSubject(
                        isExpanded ? null : `${semesterKey}-${subject.name}`
                      )
                    }
                  >
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <span className="font-semibold">{subject.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xl font-bold ${getScoreColor(
                          subject.total
                        )}`}
                      >
                        {subject.total}
                      </span>
                      <Badge variant="outline">Rank #{subject.rank}</Badge>
                    </div>
                  </Button>
                  {isExpanded && (
                    <div className="p-4 bg-secondary/30 border-t space-y-3">
                      {Object.entries(subject.breakdown).map(
                        ([type, score]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-sm font-medium text-muted-foreground capitalize w-24">
                                {type}
                              </span>
                              <Progress
                                value={(score / 50) * 100}
                                className="flex-1"
                              />
                            </div>
                            <span className="font-semibold text-foreground ml-4">
                              {score}
                            </span>
                          </div>
                        )
                      )}
                      <div className="pt-3 border-t flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          Total
                        </span>
                        <span
                          className={`text-lg font-bold ${getScoreColor(
                            subject.total
                          )}`}
                        >
                          {subject.total} / 100
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 rounded-2xl p-8 border border-primary/10 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-7 w-7 text-primary" />
                </div>
                My Academic Scores
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Track your performance, view detailed breakdowns, and monitor
                your academic progress over time.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Academic Year</p>
                <p className="text-lg font-semibold text-foreground">
                  2024-2025
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Semester Tabs */}
        <Tabs defaultValue="semester1" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="semester1">1st Semester</TabsTrigger>
            <TabsTrigger value="semester2">2nd Semester</TabsTrigger>
          </TabsList>

          {/* Semester 1 */}
          <TabsContent value="semester1" className="space-y-6">
            <Tabs defaultValue="transcript">
              <TabsList>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Grades</TabsTrigger>
              </TabsList>
              <TabsContent value="transcript" className="mt-6">
                {renderTranscript("semester1")}
              </TabsContent>
              <TabsContent value="detailed" className="mt-6">
                {renderDetailed("semester1")}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Semester 2 */}
          <TabsContent value="semester2" className="space-y-6">
            <Tabs defaultValue="transcript">
              <TabsList>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Grades</TabsTrigger>
              </TabsList>
              <TabsContent value="transcript" className="mt-6">
                {renderTranscript("semester2")}
              </TabsContent>
              <TabsContent value="detailed" className="mt-6">
                {renderDetailed("semester2")}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Scores;
