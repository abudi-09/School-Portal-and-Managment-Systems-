import { useState } from "react";
import { UserPlus, Search, Filter, Hash, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminStudentManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const students = [
    {
      id: 1,
      name: "John Smith",
      studentId: "STU-2024-001",
      grade: "11A",
      registrationType: "New",
      status: "active",
    },
    {
      id: 2,
      name: "Emma Wilson",
      studentId: "STU-2024-002",
      grade: "11A",
      registrationType: "Returning",
      status: "active",
    },
    {
      id: 3,
      name: "Michael Brown",
      studentId: "STU-2024-003",
      grade: "11B",
      registrationType: "New",
      status: "inactive",
    },
    {
      id: 4,
      name: "Sarah Davis",
      studentId: "STU-2024-004",
      grade: "10A",
      registrationType: "Returning",
      status: "active",
    },
  ];

  const handleGenerateId = () => {
    toast({
      title: "Student ID Generated",
      description: "Unique ID STU-2024-005 has been generated successfully.",
    });
  };

  const handleAddStudent = () => {
    toast({
      title: "Student Added",
      description: "New student has been added successfully.",
    });
    setDialogOpen(false);
  };

  const stats = [
    { title: "Total Students", value: students.length, icon: UserPlus, color: "text-primary" },
    { title: "Active", value: students.filter(s => s.status === "active").length, icon: CheckCircle, color: "text-success" },
    { title: "Inactive", value: students.filter(s => s.status === "inactive").length, icon: XCircle, color: "text-muted-foreground" },
    { title: "New This Term", value: students.filter(s => s.registrationType === "New").length, icon: Hash, color: "text-primary" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Management</h1>
          <p className="text-muted-foreground">
            Add, manage, and generate student IDs
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add New Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter student information to create a new account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter student name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade/Class</Label>
                <Select>
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10a">10A</SelectItem>
                    <SelectItem value="10b">10B</SelectItem>
                    <SelectItem value="11a">11A</SelectItem>
                    <SelectItem value="11b">11B</SelectItem>
                    <SelectItem value="12a">12A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="student@school.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+1234567890" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStudent}>
                Add Student & Generate ID
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <SelectValue placeholder="Filter by grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            <SelectItem value="10a">Grade 10A</SelectItem>
            <SelectItem value="10b">Grade 10B</SelectItem>
            <SelectItem value="11a">Grade 11A</SelectItem>
            <SelectItem value="11b">Grade 11B</SelectItem>
            <SelectItem value="12a">Grade 12A</SelectItem>
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
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="returning">Returning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            Manage student accounts and generate unique IDs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-sm">
                    {student.studentId}
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.grade}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.registrationType === "New" ? "default" : "secondary"}>
                      {student.registrationType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.status === "active" ? "default" : "outline"}
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: student.status === "active" ? "Account Deactivated" : "Account Activated",
                            description: `${student.name}'s account has been ${student.status === "active" ? "deactivated" : "activated"}.`,
                          });
                        }}
                      >
                        {student.status === "active" ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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

export default AdminStudentManagement;
