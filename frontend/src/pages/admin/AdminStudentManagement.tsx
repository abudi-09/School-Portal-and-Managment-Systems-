import { useEffect, useRef, useState } from "react";
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
  RefreshCcw,
  Copy,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import StudentPrintCard, {
  type StudentPrintData,
} from "@/components/students/StudentPrintCard";
import StudentPrintSheet from "@/components/students/StudentPrintSheet";
import TablePagination from "@/components/shared/TablePagination";
import { SkeletonWrapper } from "@/components/skeleton";
import { SkeletonTableRow } from "@/components/skeleton";
import {
  StatCardSkeleton,
  TableSkeletonRows,
} from "@/components/shared/LoadingSkeletons";

type StudentStatus = "active" | "inactive";
type RegistrationType = "New" | "Returning";

type Student = {
  _id?: string;
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

type ApiStudentsListResponse = {
  success: boolean;
  data: {
    students: Array<{
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      studentId: string;
      isActive: boolean;
      academicInfo?: { grade?: string; class?: string };
      profile?: { phone?: string };
    }>;
    pagination: { page: number; limit: number; total: number; pages: number };
  };
  message?: string;
};

type UpdateStudentBody = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  profile: { phone?: string; address?: string };
  academicInfo: { grade?: string; class?: string };
  isActive: boolean;
}>;

type StudentFormState = {
  firstName: string;
  lastName: string;
  email: string;
  grade: string;
  phone: string;
};

const INITIAL_STUDENTS: Student[] = [];

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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [newStudentForm, setNewStudentForm] =
    useState<StudentFormState>(EMPTY_STUDENT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    studentId: string;
    password: string;
    fullName: string;
    action: "created" | "reset";
  } | null>(null);
  const { toast } = useToast();
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as HeadersInit;
  };

  // Fetch students from API
  const studentsQuery = useQuery({
    queryKey: ["admin", "students"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${apiBaseUrl}/api/users/students?limit=100`, {
        headers: authHeaders(),
      });
      const data = (await res.json()) as ApiStudentsListResponse;
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load students");
      }
      const list = data.data.students.map((s) => ({
        id: s._id,
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        studentId: s.studentId,
        grade: s.academicInfo?.grade ?? s.academicInfo?.class,
        registrationType: "New" as RegistrationType,
        status: s.isActive ? "active" : "inactive",
        phone: s.profile?.phone,
      })) as Student[];
      return list;
    },
  });

  useEffect(() => {
    if (studentsQuery.data) {
      setStudents(studentsQuery.data);
    }
  }, [studentsQuery.data]);

  const resetNewStudentForm = () => {
    setNewStudentForm(EMPTY_STUDENT_FORM);
  };

  const handleCopyCredentials = async (studentId: string, password: string) => {
    try {
      await navigator.clipboard.writeText(
        `Student ID: ${studentId}\nTemporary Password: ${password}`
      );
      toast({
        title: "Copied",
        description: "Credentials copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy credentials automatically.",
        variant: "destructive",
      });
    }
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

    // Client-side validations to match server rules and avoid generic 500s
    const emailTrimmed = email.trim().toLowerCase();
    if (!/@gmail\.com$/i.test(emailTrimmed)) {
      toast({
        title: "Invalid email",
        description: "Email must be a Gmail address (ends with @gmail.com).",
        variant: "destructive",
      });
      return;
    }

    const phoneTrimmed = phone.trim();
    if (phoneTrimmed && !/^\+?[\d\s\-()]+$/.test(phoneTrimmed)) {
      toast({
        title: "Invalid phone number",
        description:
          "Please enter a valid phone number (digits, spaces, +, -, parentheses).",
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
      email: emailTrimmed,
      profile: phoneTrimmed ? { phone: phoneTrimmed } : undefined,
      academicInfo: normalizedGrade
        ? { grade: normalizedGrade, class: normalizedGrade }
        : undefined,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/students`, {
        method: "POST",
        headers: authHeaders(),
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
      const credentials = data?.data?.credentials as
        | { studentId?: string; temporaryPassword?: string }
        | undefined;

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

      // Add the new student to local state immediately so actions like
      // printing (all/selected) include the freshly-created student's
      // credentials even before the background query refresh completes.
      setStudents((prev) => {
        // avoid duplicate if already present
        if (prev.some((s) => s.studentId === newStudent.studentId)) return prev;
        return [newStudent, ...prev];
      });

      await queryClient.invalidateQueries({ queryKey: ["admin", "students"] });

      toast({
        title: "Student Added",
        description: `Assigned ID ${
          newStudent.studentId
        } to ${getStudentFullName(newStudent)}.`,
      });

      if (credentials?.temporaryPassword) {
        setGeneratedCredentials({
          studentId:
            credentials.studentId ?? newStudent.studentId ?? "Unknown ID",
          password: credentials.temporaryPassword,
          fullName: getStudentFullName(newStudent),
          action: "created",
        });
        const sid =
          credentials.studentId ?? newStudent.studentId ?? "Unknown ID";
        setCredentialsMap((m) => ({
          ...m,
          [sid]: credentials.temporaryPassword!,
        }));
      }

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
    setSelectedStudent(student);
    setViewDialogOpen(true);
  };

  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [credentialsMap, setCredentialsMap] = useState<Record<string, string>>(
    {}
  );
  // Selection for bulk printing
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allSelected =
    students.length > 0 && students.every((s) => selected[s.id]);
  const toggleAll = (checked: boolean | string) => {
    const flag = Boolean(checked);
    const next: Record<string, boolean> = {};
    for (const s of students) next[s.id] = flag;
    setSelected(next);
  };
  const toggleOne = (id: string, checked: boolean | string) => {
    setSelected((prev) => ({ ...prev, [id]: Boolean(checked) }));
  };
  const selectedStudents = students.filter((s) => selected[s.id]);
  const printSelectedDisabled = selectedStudents.length === 0;

  // Printing state and refs
  const bulkPrintRef = useRef<HTMLDivElement | null>(null);
  const [bulkPrintData, setBulkPrintData] = useState<StudentPrintData[]>([]);
  const singlePrintRef = useRef<HTMLDivElement | null>(null);

  const handleBulkPrint = useReactToPrint({
    content: () => bulkPrintRef.current,
    documentTitle: "Student-Credentials",
    pageStyle: `
      @page { size: A4 portrait; margin: 10mm; }
      @media print { 
        html, body { background: #fff; }
        .break-after { page-break-after: always; }
      }
    `,
    onAfterPrint: () => setBulkPrintData([]),
  });
  const handleSinglePrint = useReactToPrint({
    content: () => singlePrintRef.current,
    documentTitle: generatedCredentials
      ? `ID-${generatedCredentials.studentId}`
      : "Student-Credential",
    pageStyle: `@page { size: A6 portrait; margin: 8mm; }`,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(searchTerm.trim().toLowerCase()),
      300
    );
    return () => clearTimeout(t);
  }, [searchTerm, setDebouncedSearch]);

  // helpers for the View dialog: prefer the most-recent generatedCredentials, fall back to the session map
  const viewedStudentId =
    selectedStudent?.studentId ?? generatedCredentials?.studentId ?? undefined;
  const viewedPassword =
    selectedStudent &&
    generatedCredentials?.studentId === selectedStudent.studentId
      ? generatedCredentials.password
      : selectedStudent
      ? credentialsMap[selectedStudent.studentId]
      : undefined;

  const handleCopyStudentId = async (studentId?: string) => {
    if (!studentId) return;
    try {
      await navigator.clipboard.writeText(studentId);
      toast({
        title: "Copied",
        description: "Student ID copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy Student ID.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!studentId) return;
    const target = students.find((student) => student.id === studentId);
    const fullName = target ? getStudentFullName(target) : "this student";
    const confirmed = window.confirm(
      `Are you sure you want to remove ${fullName}?`
    );
    if (!confirmed) return;
    deleteMutation.mutate(studentId);
  };

  const handleUpdateStudent = () => {
    // Placeholder open-dialog handler (UI wiring); below mutation handles save
    setEditDialogOpen(false);
    setSelectedStudent(null);
  };

  const activateMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const url = `${apiBaseUrl}/api/users/students/${id}/${
        active ? "activate" : "deactivate"
      }`;
      const res = await fetch(url, { method: "PATCH", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Failed to toggle status");
      return data;
    },
    onSuccess: async (_data, variables) => {
      toast({
        title: variables.active ? "Account Activated" : "Account Deactivated",
        description: `The student's account has been ${
          variables.active ? "activated" : "deactivated"
        }.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Action failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; body: UpdateStudentBody }) => {
      const res = await fetch(
        `${apiBaseUrl}/api/users/students/${payload.id}`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(payload.body),
        }
      );
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Failed to update student");
      return data;
    },
    onSuccess: async () => {
      toast({
        title: "Student Updated",
        description: "Student information has been updated successfully.",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(
        `${apiBaseUrl}/api/users/students/${id}/reset-password`,
        {
          method: "PATCH",
          headers: authHeaders(),
        }
      );
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Failed to reset password");
      return data as {
        data?: {
          credentials?: { studentId?: string; temporaryPassword?: string };
        };
      };
    },
    onSuccess: (data, variables) => {
      const credentials = data?.data?.credentials;
      if (credentials?.temporaryPassword) {
        const target = students.find((s) => s.id === variables.id);
        setGeneratedCredentials({
          studentId: credentials.studentId ?? target?.studentId ?? "",
          password: credentials.temporaryPassword,
          fullName: target ? getStudentFullName(target) : "The student",
          action: "reset",
        });
        if (credentials.studentId) {
          setCredentialsMap((m) => ({
            ...m,
            [credentials.studentId!]: credentials.temporaryPassword!,
          }));
        }
      }
      toast({
        title: "Password Reset",
        description: "A temporary password has been generated.",
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Reset failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiBaseUrl}/api/users/students/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Failed to remove student");
      return data;
    },
    onSuccess: async () => {
      toast({
        title: "Student Removed",
        description: "The student has been deactivated successfully.",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Removal failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const filteredStudents = students.filter((s) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch;
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    return (
      (s.studentId || "").toLowerCase().includes(q) ||
      name.includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.grade || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q)
    );
  });

  // Pagination: 6 rows per page for all tables
  const ROWS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / ROWS_PER_PAGE)
  );
  const indexOfLast = currentPage * ROWS_PER_PAGE;
  const indexOfFirst = indexOfLast - ROWS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(indexOfFirst, indexOfLast);

  // Reset to page 1 when filters/search change or when current page goes out of bounds
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const stats = [
    {
      title: "Total Students",
      value: filteredStudents.length,
      icon: UserPlus,
      color: "text-gray-600",
    },
    {
      title: "Active",
      value: filteredStudents.filter((s) => s.status === "active").length,
      icon: CheckCircle,
      color: "text-gray-600",
    },
    {
      title: "Inactive",
      value: filteredStudents.filter((s) => s.status === "inactive").length,
      icon: XCircle,
      color: "text-gray-600",
    },
    {
      title: "New This Term",
      value: filteredStudents.filter((s) => s.registrationType === "New")
        .length,
      icon: Hash,
      color: "text-gray-600",
    },
  ];

  return (
    <>
      <div className="p-4 md:p-8 space-y-6">
        <section className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Student Management
              </h1>
              <p className="text-gray-600">
                Add, manage, and generate student IDs
              </p>
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
                            handleNewStudentChange(
                              "firstName",
                              event.target.value
                            )
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
                            handleNewStudentChange(
                              "lastName",
                              event.target.value
                            )
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
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateStudent}>Update Student</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={Boolean(generatedCredentials)}
            onOpenChange={(open) => {
              if (!open) setGeneratedCredentials(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {generatedCredentials?.action === "reset"
                    ? "Temporary Password Generated"
                    : "Student Credentials"}
                </DialogTitle>
                <DialogDescription>
                  Share these credentials securely with the student. They won't
                  be shown again.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {generatedCredentials?.fullName && (
                  <div className="space-y-1">
                    <Label>Student</Label>
                    <p className="font-semibold text-gray-900">
                      {generatedCredentials.fullName}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <Label>Student ID</Label>
                  <code className="inline-block rounded bg-gray-100 px-2 py-1 text-sm text-gray-900">
                    {generatedCredentials?.studentId}
                  </code>
                </div>
                <div className="space-y-1">
                  <Label>Temporary Password</Label>
                  <code className="inline-block rounded bg-gray-100 px-2 py-1 text-sm text-gray-900">
                    {generatedCredentials?.password}
                  </code>
                  <p className="text-xs text-gray-500">
                    Ask the student to reset their password after signing in.
                  </p>
                </div>
              </div>
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {/* hidden single print content for the newly created/reset credentials */}
                {generatedCredentials && (
                  <div
                    className="sr-only print:not-sr-only"
                    ref={singlePrintRef}
                  >
                    <StudentPrintCard
                      data={{
                        name: generatedCredentials.fullName,
                        studentId: generatedCredentials.studentId,
                        password: generatedCredentials.password,
                      }}
                    />
                  </div>
                )}
                <Button
                  type="button"
                  onClick={() => handleSinglePrint && handleSinglePrint()}
                >
                  Print
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    generatedCredentials &&
                    handleCopyCredentials(
                      generatedCredentials.studentId,
                      generatedCredentials.password
                    )
                  }
                  className="justify-center sm:justify-start"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy credentials
                </Button>
                <Button
                  type="button"
                  onClick={() => setGeneratedCredentials(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {studentsQuery.isLoading && students.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <StatCardSkeleton key={i} />
                ))
              : stats.map((stat) => (
                  <Card key={stat.title} className="border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            {stat.title}
                          </p>
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
        </section>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
            <Input
              placeholder="Search students..."
              className="pl-10 border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            {/* Bulk actions toolbar */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const data: StudentPrintData[] = students.map((s) => ({
                      name: `${s.firstName} ${s.lastName}`,
                      studentId: s.studentId,
                      password: credentialsMap[s.studentId] ?? "N/A",
                    }));
                    setBulkPrintData(data);
                    setTimeout(() => handleBulkPrint && handleBulkPrint(), 0);
                  }}
                  disabled={students.length === 0}
                >
                  Print All Students
                </Button>
                <Button
                  onClick={() => {
                    const data: StudentPrintData[] = selectedStudents.map(
                      (s) => ({
                        name: `${s.firstName} ${s.lastName}`,
                        studentId: s.studentId,
                        password: credentialsMap[s.studentId] ?? "N/A",
                      })
                    );
                    setBulkPrintData(data);
                    setTimeout(() => handleBulkPrint && handleBulkPrint(), 0);
                  }}
                  disabled={printSelectedDisabled}
                >
                  Print Selected
                </Button>
              </div>
            </div>
            <SkeletonWrapper
              isLoading={studentsQuery.isLoading && students.length === 0}
              skeleton={
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <TableHead
                          key={i}
                          className="text-gray-700 font-semibold"
                        >
                          <span aria-hidden> </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, r) => (
                      <SkeletonTableRow key={r} cols={7} />
                    ))}
                  </TableBody>
                </Table>
              }
            >
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 hover:bg-gray-50">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
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
                  {studentsQuery.isLoading && students.length === 0 && (
                    <TableSkeletonRows rows={6} cols={7} />
                  )}
                  {paginatedStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      <TableCell>
                        <Checkbox
                          checked={!!selected[student.id]}
                          onCheckedChange={(v) => toggleOne(student.id, v)}
                          aria-label={`Select ${getStudentFullName(student)}`}
                        />
                      </TableCell>
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
                            onClick={() =>
                              activateMutation.mutate({
                                id: student.id,
                                active: student.status !== "active",
                              })
                            }
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
                            onClick={() => {
                              const confirmed = window.confirm(
                                `Generate a new password for ${getStudentFullName(
                                  student
                                )}?`
                              );
                              if (!confirmed) return;
                              resetPasswordMutation.mutate({ id: student.id });
                            }}
                            className="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          >
                            <RefreshCcw className="h-4 w-4 mr-1" />
                            Reset Password
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
            </SkeletonWrapper>
            {/* Pagination controls */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-4"
            />
          </CardContent>
        </Card>
        {/* Hidden bulk print container */}
        {bulkPrintData.length > 0 && (
          <div className="sr-only print:not-sr-only" ref={bulkPrintRef}>
            <StudentPrintSheet items={bulkPrintData} />
          </div>
        )}
      </div>
      {/* View Student Dialog (pro-level) */}
      <Dialog
        open={viewDialogOpen}
        onOpenChange={(open) => setViewDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex flex-col">
              <DialogTitle className="text-lg">Student Details</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {selectedStudent ? getStudentFullName(selectedStudent) : "—"}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2 py-4">
            {/* Primary Info */}
            <section aria-labelledby="primary-info" className="space-y-3">
              <h3
                id="primary-info"
                className="text-sm font-semibold text-gray-700"
              >
                Primary Information
              </h3>
              <div className="rounded border border-gray-100 bg-white p-4 shadow-sm">
                <dl className="grid gap-y-2">
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-gray-500">Student ID</dt>
                    <dd className="flex items-center gap-2">
                      <code className="font-mono text-sm text-gray-900">
                        {selectedStudent?.studentId ?? "—"}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleCopyStudentId(selectedStudent?.studentId)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </dd>
                  </div>

                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-gray-500">Full name</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {selectedStudent
                        ? getStudentFullName(selectedStudent)
                        : "—"}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-700 break-words">
                      {selectedStudent?.email ?? "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* Academic & Contact */}
            <section aria-labelledby="academic-contact" className="space-y-3">
              <h3
                id="academic-contact"
                className="text-sm font-semibold text-gray-700"
              >
                Academic & Contact
              </h3>
              <div className="rounded border border-gray-100 bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-500">Grade / Class</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {selectedStudent?.grade ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-700">
                    {selectedStudent?.phone ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-500">Status</dt>
                  <dd>
                    <Badge
                      variant={
                        selectedStudent?.status === "active"
                          ? "default"
                          : "outline"
                      }
                      className="border-gray-300"
                    >
                      {selectedStudent?.status ?? "—"}
                    </Badge>
                  </dd>
                </div>
              </div>
            </section>

            {/* Generated Credentials */}
            <section
              aria-labelledby="credentials"
              className="space-y-3 md:col-span-2"
            >
              <h3
                id="credentials"
                className="text-sm font-semibold text-gray-700"
              >
                Credentials
              </h3>
              <div className="rounded border border-gray-100 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500">
                    Temporary credentials (visible immediately after
                    create/reset)
                  </p>
                  {selectedStudent &&
                  (generatedCredentials?.studentId ===
                    selectedStudent.studentId ||
                    credentialsMap[selectedStudent.studentId]) ? (
                    <div className="mt-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Student ID</p>
                          <p className="font-mono text-sm">{viewedStudentId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            Temporary Password
                          </p>
                          <p className="font-mono text-sm">
                            {passwordRevealed ? viewedPassword : "••••••••"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      No temporary credentials available for this student.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPasswordRevealed((v) => !v)}
                  >
                    {passwordRevealed ? "Hide" : "Reveal"}
                  </Button>
                  {selectedStudent && viewedPassword && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleCopyCredentials(
                            viewedStudentId ?? "",
                            viewedPassword ?? ""
                          )
                        }
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy credentials
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (!selectedStudent) return;
                      const confirmed = window.confirm(
                        `Generate a new temporary password for ${getStudentFullName(
                          selectedStudent
                        )}?`
                      );
                      if (!confirmed) return;
                      resetPasswordMutation.mutate({ id: selectedStudent.id });
                    }}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Last updated: not tracked
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setViewDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminStudentManagement;
