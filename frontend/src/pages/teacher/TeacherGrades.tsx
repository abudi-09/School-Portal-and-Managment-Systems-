import { useState } from "react";
import { Save, Send, Download, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const TeacherGrades = () => {
  const [selectedClass, setSelectedClass] = useState("11a");
  const [status, setStatus] = useState<"draft" | "submitted" | "verified" | "approved">("draft");
  const [grades, setGrades] = useState<{ [key: string]: { [key: string]: number } }>({});

  const students = [
    {
      id: 1,
      name: "John Smith",
      rollNo: "11A-001",
      test: 85,
      exam: 92,
      assignment: 88,
      total: 265,
      average: 88.3,
    },
    {
      id: 2,
      name: "Emma Wilson",
      rollNo: "11A-002",
      test: 90,
      exam: 95,
      assignment: 92,
      total: 277,
      average: 92.3,
    },
    {
      id: 3,
      name: "Michael Brown",
      rollNo: "11A-003",
      test: 78,
      exam: 82,
      assignment: 80,
      total: 240,
      average: 80.0,
    },
    {
      id: 4,
      name: "Sarah Davis",
      rollNo: "11A-004",
      test: 88,
      exam: 90,
      assignment: 85,
      total: 263,
      average: 87.7,
    },
  ];

  const completionPercentage = 75;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Grade Management</h1>
          <p className="text-muted-foreground">
            Enter and manage student grades for your classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button className="gap-2">
            <Send className="h-4 w-4" />
            Submit for Review
          </Button>
        </div>
      </div>

      {/* Stats and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Grading Status</p>
                <Badge
                  variant={
                    status === "approved"
                      ? "default"
                      : status === "submitted"
                      ? "secondary"
                      : "outline"
                  }
                  className="capitalize"
                >
                  {status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                <p className="text-3xl font-bold text-foreground">{students.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <Users className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-sm font-medium">{completionPercentage}%</p>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grading Workflow Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grading Workflow</CardTitle>
              <CardDescription>Track the approval process for grades</CardDescription>
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10a">10A - Mathematics</SelectItem>
                <SelectItem value="11a">11A - Mathematics</SelectItem>
                <SelectItem value="11b">11B - Mathematics</SelectItem>
                <SelectItem value="12a">12A - Mathematics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === "draft" || status === "submitted" || status === "verified" || status === "approved"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Teacher Entry</p>
                  <p className="text-xs text-muted-foreground">Input scores</p>
                </div>
              </div>
              <div className="flex-1 h-0.5 bg-border mx-4" />
              
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === "submitted" || status === "verified" || status === "approved"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">Head Class Review</p>
                  <p className="text-xs text-muted-foreground">Verify & calculate</p>
                </div>
              </div>
              <div className="flex-1 h-0.5 bg-border mx-4" />
              
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === "verified" || status === "approved"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Head Approval</p>
                  <p className="text-xs text-muted-foreground">Final review</p>
                </div>
              </div>
              <div className="flex-1 h-0.5 bg-border mx-4" />
              
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === "approved"
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  ✓
                </div>
                <div>
                  <p className="font-medium text-sm">Published</p>
                  <p className="text-xs text-muted-foreground">Visible to students</p>
                </div>
              </div>
            </div>

            {/* Status Message */}
            {status === "draft" && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  Complete grade entry and submit for Head Class Teacher review
                </p>
              </div>
            )}
            {status === "submitted" && (
              <div className="p-3 rounded-lg bg-secondary border">
                <p className="text-sm text-muted-foreground">
                  Grades submitted - waiting for Head Class Teacher verification
                </p>
              </div>
            )}
            {status === "verified" && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-accent">
                  Verified by Head Class Teacher - awaiting Head of School approval
                </p>
              </div>
            )}
            {status === "approved" && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-success">
                  Grades approved and published - now visible to students
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Grades</CardTitle>
          <CardDescription>
            Enter test, exam, and assignment scores for each student
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-center">Test (100)</TableHead>
                  <TableHead className="text-center">Exam (100)</TableHead>
                  <TableHead className="text-center">Assignment (100)</TableHead>
                  <TableHead className="text-center">Total (300)</TableHead>
                  <TableHead className="text-center">Average (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{student.rollNo}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={student.test}
                        className="w-20 text-center"
                        min="0"
                        max="100"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={student.exam}
                        className="w-20 text-center"
                        min="0"
                        max="100"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={student.assignment}
                        className="w-20 text-center"
                        min="0"
                        max="100"
                      />
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {student.total}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={student.average >= 85 ? "default" : "secondary"}>
                        {student.average.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherGrades;
