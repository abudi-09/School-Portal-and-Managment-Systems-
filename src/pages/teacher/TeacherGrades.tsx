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
  const [status, setStatus] = useState("draft");

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

      {/* Class Selection and Workflow */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Class</CardTitle>
              <CardDescription>Choose the class to enter grades for</CardDescription>
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
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-muted-foreground">Teacher inputs scores</span>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-muted-foreground">Head Class Teacher reviews</span>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-muted-foreground">Head of School approves</span>
            </div>
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
