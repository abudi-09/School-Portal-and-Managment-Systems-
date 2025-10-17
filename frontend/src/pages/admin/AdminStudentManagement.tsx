import { useState } from "react";
import type { FormEvent } from "react";
import {
  UserPlus,
  Search,
  Filter,
  Hash,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

type StudentStatus = "active" | "inactive";
type RegistrationType = "New" | "Returning";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  grade?: string;
  registrationType: RegistrationType;
  status: StudentStatus;
  phone?: string;
};

type StudentFormState = {
  firstName: string;
  lastName: string;
  email: string;
  grade: string;
  phone: string;
};

const INITIAL_STUDENTS: Student[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@school.edu",
    studentId: "STU-2024-001",
    grade: "11A",
    registrationType: "New",
    status: "active",
    phone: "+1 (555) 010-1001",
  },
  {
    id: "2",
    firstName: "Emma",
    lastName: "Wilson",
    email: "emma.wilson@school.edu",
    studentId: "STU-2024-002",
    grade: "11A",
    registrationType: "Returning",
    status: "active",
    phone: "+1 (555) 010-1002",
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@school.edu",
    studentId: "STU-2024-003",
    grade: "11B",
    registrationType: "New",
    status: "inactive",
    phone: "+1 (555) 010-1003",
  },
  {
    id: "4",
    firstName: "Sarah",
    lastName: "Davis",
    email: "sarah.davis@school.edu",
    studentId: "STU-2024-004",
    grade: "10A",
    registrationType: "Returning",
    status: "active",
    phone: "+1 (555) 010-1004",
  },
];

const EMPTY_STUDENT_FORM: StudentFormState = {
  firstName: "",
  lastName: "",
  email: "",
  grade: "",
  phone: "",
};

const getStudentFullName = (student: Student) =>
  [student.firstName, student.lastName].filter(Boolean).join(" ");

const AdminStudentManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [newStudentForm, setNewStudentForm] =
    useState<StudentFormState>(EMPTY_STUDENT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

  const resetNewStudentForm = () => {
    setNewStudentForm(EMPTY_STUDENT_FORM);
  };

  const handleNewStudentChange = (
    field: keyof StudentFormState,
    value: string
  ) => {
    setNewStudentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateTemporaryPassword = () => {
    const random = Math.random().toString(36).substring(2, 8);
    return `Stu@${random.padEnd(6, "0")}`;
  };

  const handleAddStudent = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const { firstName, lastName, email, grade, phone } = newStudentForm;

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: "Missing information",
        description: "First name, last name, and email are required.",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication required",
        description:
          "Please log in again as an administrator to add new students.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const normalizedGrade = grade ? grade.toUpperCase() : undefined;

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: generateTemporaryPassword(),
      profile: phone.trim() ? { phone: phone.trim() } : undefined,
      academicInfo: normalizedGrade
        ? { grade: normalizedGrade, class: normalizedGrade }
        : undefined,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const validationMessage = Array.isArray(data?.errors)
          ? data.errors.map((err: { msg?: string }) => err.msg).join(", ")
          : undefined;
        const message =
          validationMessage || data?.message || "Failed to create student.";
        throw new Error(message);
      }

      const created = data?.data?.student;

      if (!created || !created.studentId) {
        throw new Error("Invalid response received from the server.");
      }

      const newStudent: Student = {
        id: created._id ?? `temp-${Date.now()}`,
        firstName: created.firstName ?? payload.firstName,
        lastName: created.lastName ?? payload.lastName,
        email: created.email ?? payload.email,
        studentId: created.studentId,
        grade:
          created.academicInfo?.grade ??
          created.academicInfo?.class ??
          normalizedGrade,
        registrationType: "New",
        status: "active",
        phone: created.profile?.phone ?? payload.profile?.phone,
      };

      setStudents((prev) => [...prev, newStudent]);

      toast({
        title: "Student Added",
        description: `Assigned ID ${
          newStudent.studentId
        } to ${getStudentFullName(newStudent)}.`,
      });

      resetNewStudentForm();
      setDialogOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected error while creating the student.";
      toast({
        title: "Unable to add student",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditDialogOpen(true);
  };

  const handleViewStudent = (student: Student) => {
    // View student details logic here
    toast({
      title: "Student Details",
      description: `Viewing details for ${getStudentFullName(student)}`,
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    // Delete student logic here
    toast({
      title: "Student Deleted",
      description: "Student has been removed from the system.",
    });
  };

  const handleUpdateStudent = () => {
    // Update student logic here
    setEditDialogOpen(false);
    setSelectedStudent(null);
    toast({
      title: "Student Updated",
      description: "Student information has been updated successfully.",
    });
  };

  const stats = [
    {
      title: "Total Students",
      value: students.length,
      icon: UserPlus,
      color: "text-gray-600",
    },
    {
      title: "Active",
      value: students.filter((s) => s.status === "active").length,
      icon: CheckCircle,
      color: "text-gray-600",
    },
    {
      title: "Inactive",
      value: students.filter((s) => s.status === "inactive").length,
      icon: XCircle,
      color: "text-gray-600",
    },
    {
      title: "New This Term",
      value: students.filter((s) => s.registrationType === "New").length,
      icon: Hash,
      color: "text-gray-600",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Student Management
          </h1>
          <p className="text-gray-600">Add, manage, and generate student IDs</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              resetNewStudentForm();
              setIsSubmitting(false);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gray-600 hover:bg-gray-700 text-white border-gray-600">
              <UserPlus className="h-4 w-4" />
              Add New Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddStudent} className="space-y-6">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter student information to create a new account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newStudentForm.firstName}
                      onChange={(event) =>
                        handleNewStudentChange("firstName", event.target.value)
                      }
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newStudentForm.lastName}
                      onChange={(event) =>
                        handleNewStudentChange("lastName", event.target.value)
                      }
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudentForm.email}
                    onChange={(event) =>
                      handleNewStudentChange("email", event.target.value)
                    }
                    placeholder="student@school.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade/Class</Label>
                  <Select
                    value={newStudentForm.grade}
                    onValueChange={(value) =>
                      handleNewStudentChange("grade", value)
                    }
                  >
                    <SelectTrigger id="grade" className="border-gray-300">
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newStudentForm.phone}
                    onChange={(event) =>
                      handleNewStudentChange("phone", event.target.value)
                    }
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetNewStudentForm();
                    setDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Student & Generate ID"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
            <DialogDescription>
              Update student details and account information
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  defaultValue={getStudentFullName(selectedStudent)}
                  placeholder="Enter student name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-grade">Grade/Class</Label>
                <Select
                  defaultValue={
                    selectedStudent.grade
                      ? selectedStudent.grade.toLowerCase()
                      : undefined
                  }
                >
                  <SelectTrigger id="edit-grade">
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
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  defaultValue={selectedStudent.email}
                  placeholder="student@school.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  defaultValue={selectedStudent.phone}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select defaultValue={selectedStudent.status}>
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStudent}>Update Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
          <Input
            placeholder="Search students..."
            className="pl-10 border-gray-300"
          />
        </div>
        <Select>
          <SelectTrigger className="w-full md:w-48 border-gray-300">
            <Filter className="h-4 w-4 mr-2 text-gray-600" />
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
          <SelectTrigger className="w-full md:w-48 border-gray-300">
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
      <Card className="border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-gray-900">All Students</CardTitle>
          <CardDescription className="text-gray-600">
            Manage student accounts and generate unique IDs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-gray-50">
                <TableHead className="text-gray-700 font-semibold">
                  Student ID
                </TableHead>
                <TableHead className="text-gray-700 font-semibold">
                  Name
                </TableHead>
                <TableHead className="text-gray-700 font-semibold">
                  Grade
                </TableHead>
                <TableHead className="text-gray-700 font-semibold">
                  Registration
                </TableHead>
                <TableHead className="text-gray-700 font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow
                  key={student.id}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  <TableCell className="font-mono text-sm text-gray-900">
                    {student.studentId}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {getStudentFullName(student)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-gray-300 text-gray-700"
                    >
                      {student.grade ? student.grade.toUpperCase() : "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        student.registrationType === "New"
                          ? "default"
                          : "secondary"
                      }
                      className="bg-gray-100 text-gray-800 border-gray-300"
                    >
                      {student.registrationType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        student.status === "active" ? "default" : "outline"
                      }
                      className={
                        student.status === "active"
                          ? "bg-gray-100 text-gray-800 border-gray-300"
                          : "border-gray-300 text-gray-700"
                      }
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStudent(student)}
                        className="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewStudent(student)}
                        className="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast({
                            title:
                              student.status === "active"
                                ? "Account Deactivated"
                                : "Account Activated",
                            description: `${getStudentFullName(
                              student
                            )}'s account has been ${
                              student.status === "active"
                                ? "deactivated"
                                : "activated"
                            }.`,
                          });
                        }}
                        className="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        {student.status === "active" ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-gray-600 hover:bg-gray-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
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
