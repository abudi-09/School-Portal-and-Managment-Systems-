import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Send, Download, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentGrade {
  id: string;
  name: string;
  mathematics: number;
  english: number;
  science: number;
  history: number;
  total: number;
  average: number;
  rank: number;
  status: "pending" | "verified" | "approved";
}

const HeadClassGradeManagement = () => {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [selectedTerm, setSelectedTerm] = useState("midterm");

  // Mock data
  const students: StudentGrade[] = [
    { id: "1", name: "Alice Johnson", mathematics: 85, english: 90, science: 88, history: 92, total: 355, average: 88.75, rank: 1, status: "verified" },
    { id: "2", name: "Bob Smith", mathematics: 78, english: 82, science: 85, history: 80, total: 325, average: 81.25, rank: 2, status: "verified" },
    { id: "3", name: "Carol White", mathematics: 92, english: 88, science: 90, history: 85, total: 355, average: 88.75, rank: 1, status: "pending" },
    { id: "4", name: "David Brown", mathematics: 70, english: 75, science: 72, history: 78, total: 295, average: 73.75, rank: 4, status: "verified" },
  ];

  const classAverage = students.reduce((sum, s) => sum + s.average, 0) / students.length;
  const pendingCount = students.filter(s => s.status === "pending").length;

  const handleSubmitToHead = () => {
    toast({
      title: "Grades Submitted",
      description: "Final grades have been submitted to Head of School for approval.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Exporting Report",
      description: "Class performance report is being generated...",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "verified": return "bg-blue-500";
      default: return "bg-yellow-500";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Grade Management</h1>
            <p className="text-muted-foreground mt-1">Head Class Teacher - Final Grade Review</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Class Average</CardDescription>
              <CardTitle className="text-3xl">{classAverage.toFixed(2)}%</CardTitle>
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
              <p className="text-sm text-muted-foreground">All grades recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle className="text-3xl">{pendingCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Highest Score</CardDescription>
              <CardTitle className="text-3xl">92%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Above target
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
                <span className="text-sm font-medium">Subject Teachers Submitted</span>
              </div>
              <div className="h-px bg-border flex-1 mx-4" />
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Head Teacher Review</span>
              </div>
              <div className="h-px bg-muted flex-1 mx-4" />
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Head of School Approval</span>
              </div>
              <div className="h-px bg-muted flex-1 mx-4" />
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Published to Students</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Performance - {selectedClass}</CardTitle>
            <CardDescription>Review and calculate final rankings</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-center">Mathematics</TableHead>
                  <TableHead className="text-center">English</TableHead>
                  <TableHead className="text-center">Science</TableHead>
                  <TableHead className="text-center">History</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Average</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">#{student.rank}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-center">{student.mathematics}</TableCell>
                    <TableCell className="text-center">{student.english}</TableCell>
                    <TableCell className="text-center">{student.science}</TableCell>
                    <TableCell className="text-center">{student.history}</TableCell>
                    <TableCell className="text-center font-semibold">{student.total}</TableCell>
                    <TableCell className="text-center font-semibold">{student.average}%</TableCell>
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
