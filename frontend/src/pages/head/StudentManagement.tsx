import { useState } from "react";
import { GraduationCap, Search, Filter, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

const StudentManagement = () => {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  const students = [
    {
      id: 1,
      name: "John Smith",
      studentId: "STU-2024-001",
      class: "11A",
      attendance: 95,
      status: "active",
    },
    {
      id: 2,
      name: "Emma Wilson",
      studentId: "STU-2024-002",
      class: "11A",
      attendance: 98,
      status: "active",
    },
    {
      id: 3,
      name: "Michael Brown",
      studentId: "STU-2024-003",
      class: "11B",
      attendance: 72,
      status: "active",
    },
    {
      id: 4,
      name: "Sarah Davis",
      studentId: "STU-2024-004",
      class: "10A",
      attendance: 88,
      status: "active",
    },
    {
      id: 5,
      name: "James Wilson",
      studentId: "STU-2024-005",
      class: "12A",
      attendance: 92,
      status: "active",
    },
    {
      id: 6,
      name: "Lisa Anderson",
      studentId: "STU-2024-006",
      class: "10B",
      attendance: 68,
      status: "inactive",
    },
  ];

  const toggleStudent = (id: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedStudents(
      selectedStudents.length === students.length ? [] : students.map((s) => s.id)
    );
  };

  const stats = [
    {
      title: "Total Students",
      value: students.length,
      icon: GraduationCap,
      color: "text-primary",
    },
    {
      title: "Active",
      value: students.filter((s) => s.status === "active").length,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      title: "Inactive",
      value: students.filter((s) => s.status === "inactive").length,
      icon: XCircle,
      color: "text-muted-foreground",
    },
    {
      title: "Low Attendance",
      value: students.filter((s) => s.attendance < 75).length,
      icon: AlertTriangle,
      color: "text-destructive",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Management</h1>
          <p className="text-muted-foreground">
            Manage student accounts and monitor performance
          </p>
        </div>
        {selectedStudents.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedStudents.length} selected
            </Badge>
            <Button variant="outline" size="sm">
              Bulk Activate
            </Button>
            <Button variant="outline" size="sm">
              Bulk Deactivate
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-10" />
        </div>
        <Select>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            <SelectItem value="10a">Class 10A</SelectItem>
            <SelectItem value="10b">Class 10B</SelectItem>
            <SelectItem value="11a">Class 11A</SelectItem>
            <SelectItem value="11b">Class 11B</SelectItem>
            <SelectItem value="12a">Class 12A</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="low-attendance">Low Attendance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            Manage student accounts and monitor attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedStudents.length === students.length}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-center">Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.studentId}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.class}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Badge
                        variant={
                          student.attendance >= 85
                            ? "default"
                            : student.attendance >= 75
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {student.attendance}%
                      </Badge>
                      {student.attendance < 75 && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.status === "active" ? "default" : "outline"}
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      {student.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManagement;
