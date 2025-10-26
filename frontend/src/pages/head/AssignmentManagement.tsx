import { useState } from "react";
import {
  ClipboardList,
  Users,
  BookOpen,
  AlertCircle,
  Eye,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
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
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Local types
type Teacher = {
  id: number;
  name: string;
  department: string;
  assignedClasses: number;
  email?: string;
  phone?: string;
  qualifications?: string[];
  experience?: string;
  classTeacherAssignments?: string[];
  subjectAssignments?: { class: string; subject: string }[];
};

const AssignmentManagement = () => {
  // Classes
  const [classes, setClasses] = useState([
    {
      id: "10a",
      name: "10A",
      students: 28,
      classTeacher: "Ms. Johnson",
      subjects: 8,
    },
    {
      id: "10b",
      name: "10B",
      students: 30,
      classTeacher: "Unassigned",
      subjects: 7,
    },
    {
      id: "11a",
      name: "11A",
      students: 30,
      classTeacher: "Ms. Smith",
      subjects: 9,
    },
    {
      id: "11b",
      name: "11B",
      students: 32,
      classTeacher: "Mr. Davis",
      subjects: 8,
    },
    {
      id: "12a",
      name: "12A",
      students: 25,
      classTeacher: "Dr. Williams",
      subjects: 10,
    },
  ] as { id: string; name: string; students: number; classTeacher: string; subjects: number }[]);

  const [teachers, setTeachers] = useState<Teacher[]>([
    {
      id: 1,
      name: "Ms. Smith",
      department: "Mathematics",
      assignedClasses: 3,
      email: "smith.mathematics@school.edu",
      phone: "+1 (555) 123-4567",
      qualifications: ["M.Sc. Mathematics", "B.Ed.", "Teaching License"],
      experience: "8 years",
      classTeacherAssignments: ["11A"],
      subjectAssignments: [
        { class: "11A", subject: "Mathematics" },
        { class: "10A", subject: "Mathematics" },
        { class: "12A", subject: "Mathematics" },
      ],
    },
    {
      id: 2,
      name: "Mr. Johnson",
      department: "Science",
      assignedClasses: 2,
      email: "johnson.science@school.edu",
      phone: "+1 (555) 234-5678",
      qualifications: [
        "M.Sc. Physics",
        "B.Sc. Chemistry",
        "Teaching Certificate",
      ],
      experience: "12 years",
      classTeacherAssignments: [],
      subjectAssignments: [
        { class: "11A", subject: "Physics" },
        { class: "12A", subject: "Physics" },
      ],
    },
    {
      id: 3,
      name: "Dr. Williams",
      department: "English",
      assignedClasses: 4,
      email: "williams.english@school.edu",
      phone: "+1 (555) 345-6789",
      qualifications: [
        "Ph.D. English Literature",
        "M.A. English",
        "TESOL Certificate",
      ],
      experience: "15 years",
      classTeacherAssignments: ["12A"],
      subjectAssignments: [
        { class: "11A", subject: "English" },
        { class: "10A", subject: "English" },
        { class: "12A", subject: "English" },
        { class: "11B", subject: "English" },
      ],
    },
    {
      id: 4,
      name: "Ms. Johnson",
      department: "History",
      assignedClasses: 2,
      email: "johnson.history@school.edu",
      phone: "+1 (555) 456-7890",
      qualifications: [
        "M.A. History",
        "B.A. Social Studies",
        "Teaching License",
      ],
      experience: "6 years",
      classTeacherAssignments: ["10A"],
      subjectAssignments: [
        { class: "10A", subject: "History" },
        { class: "11B", subject: "History" },
      ],
    },
    {
      id: 5,
      name: "Mr. Davis",
      department: "Physical Education",
      assignedClasses: 3,
      email: "davis.pe@school.edu",
      phone: "+1 (555) 567-8901",
      qualifications: [
        "B.Sc. Physical Education",
        "Sports Coaching Certificate",
        "First Aid Certified",
      ],
      experience: "10 years",
      classTeacherAssignments: ["11B"],
      subjectAssignments: [
        { class: "10A", subject: "Physical Education" },
        { class: "11A", subject: "Physical Education" },
        { class: "12A", subject: "Physical Education" },
      ],
    },
  ]);

  const [subjectAssignments, setSubjectAssignments] = useState([
    { class: "11A", subject: "Mathematics", teacher: "Ms. Smith" },
    { class: "11A", subject: "Physics", teacher: "Mr. Johnson" },
    { class: "11A", subject: "English", teacher: "Dr. Williams" },
    { class: "10A", subject: "Mathematics", teacher: "Ms. Smith" },
    { class: "10A", subject: "History", teacher: "Unassigned" },
  ] as { class: string; subject: string; teacher: string }[]);

  // Search state
  const [teacherSearch, setTeacherSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  // UI state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"teacher" | "subject">(
    "teacher"
  );
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [teacherDetailsOpen, setTeacherDetailsOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const unassignedCount =
    classes.filter((c) => c.classTeacher === "Unassigned").length +
    subjectAssignments.filter((s) => s.teacher === "Unassigned").length;

  const openAssignmentDialog = (type: "teacher" | "subject") => {
    setAssignmentType(type);
    setSelectedTeacherId(null);
    setDialogOpen(true);
  };

  const openTeacherDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setTeacherDetailsOpen(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedTeacherId) {
      setDialogOpen(false);
      return;
    }
    const teacherIdNum = parseInt(selectedTeacherId, 10);
    const teacher = teachers.find((t) => t.id === teacherIdNum);
    if (!teacher) {
      setDialogOpen(false);
      return;
    }

    if (assignmentType === "teacher") {
      const cls = classes.find((c) => c.id === selectedClass);
      if (!cls) {
        setDialogOpen(false);
        return;
      }
      const prevTeacherName = cls.classTeacher;

      // update class assignment
      setClasses((prev) =>
        prev.map((c) =>
          c.id === selectedClass ? { ...c, classTeacher: teacher.name } : c
        )
      );

      // remove previous teacher assignment if applicable
      if (prevTeacherName && prevTeacherName !== "Unassigned") {
        setTeachers((prev) =>
          prev.map((t) =>
            t.name === prevTeacherName
              ? {
                  ...t,
                  assignedClasses: Math.max(0, (t.assignedClasses || 1) - 1),
                  classTeacherAssignments: (
                    t.classTeacherAssignments || []
                  ).filter((x) => x !== cls.name),
                }
              : t
          )
        );
      }

      // add to new teacher
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === teacher.id
            ? {
                ...t,
                assignedClasses: (t.assignedClasses || 0) + 1,
                classTeacherAssignments: [
                  ...(t.classTeacherAssignments || []),
                  cls.name,
                ],
              }
            : t
        )
      );
    }

    if (assignmentType === "subject") {
      const clsName = classes.find((c) => c.id === selectedClass)?.name;
      if (!clsName || !selectedSubject) {
        setDialogOpen(false);
        return;
      }
      setSubjectAssignments((prev) =>
        prev.map((sa) =>
          sa.class === clsName && sa.subject === selectedSubject
            ? { ...sa, teacher: teacher.name }
            : sa
        )
      );
    }

    setDialogOpen(false);
    setSelectedTeacherId(null);
    setSelectedSubject(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Assignment Management
        </h1>
        <p className="text-gray-600">
          Assign class teachers and subject teachers to classes
        </p>
      </div>

      {/* Alert for unassigned */}
      {unassignedCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-gray-900">Action Required</p>
                <p className="text-sm text-gray-600">
                  {unassignedCount} unassigned positions this term
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {classes.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-100 text-gray-700">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Teachers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {teachers.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-100 text-gray-700">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unassigned</p>
                <p className="text-3xl font-bold text-gray-900">
                  {unassignedCount}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-100 text-gray-700">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-gray-600">
            Frequently used assignment management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
              <Users className="h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                Assign Class Teacher
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group">
              <ClipboardList className="h-8 w-8 text-gray-400 group-hover:text-green-500 mb-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                Assign Subject Teacher
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group">
              <Eye className="h-8 w-8 text-gray-400 group-hover:text-purple-500 mb-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                View Teacher Details
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all group">
              <BookOpen className="h-8 w-8 text-gray-400 group-hover:text-orange-500 mb-3" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">
                Assignment Report
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Teacher Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class Teacher Assignment
            </CardTitle>
            <CardDescription>
              Assign head class teachers to classes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-3">
              <Input
                placeholder="Search classes by name or teacher"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
              />
            </div>

            {classes
              .filter((classItem) => {
                if (!classSearch) return true;
                const q = classSearch.toLowerCase();
                return (
                  classItem.name.toLowerCase().includes(q) ||
                  classItem.classTeacher.toLowerCase().includes(q)
                );
              })
              .map((classItem) => (
                <div
                  key={classItem.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">
                        Class {classItem.name}
                      </p>
                      <Badge variant="outline">
                        {classItem.students} students
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Class Teacher:{" "}
                      <span
                        className={
                          classItem.classTeacher === "Unassigned"
                            ? "text-warning font-medium"
                            : "text-foreground"
                        }
                      >
                        {classItem.classTeacher}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedClass(classItem.id);
                      openAssignmentDialog("teacher");
                    }}
                  >
                    {classItem.classTeacher === "Unassigned"
                      ? "Assign"
                      : "Change"}
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Subject Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Subject Teacher Assignment
            </CardTitle>
            <CardDescription>
              Assign subject teachers to classes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      Class {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClass && (
              <div className="space-y-3 pt-4">
                {subjectAssignments
                  .filter(
                    (s) =>
                      s.class ===
                      classes.find((c) => c.id === selectedClass)?.name
                  )
                  .map((assignment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                    >
                      <div>
                        <p className="font-medium text-foreground mb-1">
                          {assignment.subject}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Teacher:{" "}
                          <span
                            className={
                              assignment.teacher === "Unassigned"
                                ? "text-warning font-medium"
                                : "text-foreground"
                            }
                          >
                            {assignment.teacher}
                          </span>
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSubject(assignment.subject);
                          openAssignmentDialog("subject");
                        }}
                      >
                        {assignment.teacher === "Unassigned"
                          ? "Assign"
                          : "Change"}
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Teachers */}
      <Card>
        <CardHeader>
          <CardTitle>Available Teachers</CardTitle>
          <CardDescription>
            View all teachers and their current assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <p className="font-medium text-foreground mb-1">
                  {teacher.name}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {teacher.department}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {teacher.assignedClasses} classes
                  </Badge>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openTeacherDetails(teacher)}
                    className="bg-gray-600 hover:bg-gray-700 text-white gap-2 px-4 py-2 rounded-full flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {assignmentType === "teacher"
                ? "Assign Class Teacher"
                : "Assign Subject Teacher"}
            </DialogTitle>
            <DialogDescription>
              Select a teacher for this assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Teacher</Label>
              <Input
                placeholder="Search teacher by name or dept"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
              />
              <Select
                value={selectedTeacherId ?? undefined}
                onValueChange={(v) => setSelectedTeacherId(v ?? null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers
                    .filter((t) => {
                      if (!teacherSearch) return true;
                      const q = teacherSearch.toLowerCase();
                      return (
                        t.name.toLowerCase().includes(q) ||
                        t.department.toLowerCase().includes(q)
                      );
                    })
                    .map((teacher) => (
                      <SelectItem
                        key={teacher.id}
                        value={teacher.id.toString()}
                      >
                        {teacher.name} - {teacher.department}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAssignment}>
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teacher Details Dialog */}
      <Dialog open={teacherDetailsOpen} onOpenChange={setTeacherDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gray-100 text-gray-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedTeacher?.name}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedTeacher?.department} Department
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Comprehensive overview of teacher assignments, qualifications, and
              responsibilities
            </DialogDescription>
          </DialogHeader>

          {selectedTeacher && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <Card className="border-gray-200">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <div className="p-1.5 rounded-full bg-gray-100">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Email Address
                          </Label>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="p-2 rounded-full bg-gray-100">
                              <Mail className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedTeacher.email}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Phone Number
                          </Label>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="p-2 rounded-full bg-gray-100">
                              <Phone className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedTeacher.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Teaching Experience
                          </Label>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="p-2 rounded-full bg-gray-100">
                              <Calendar className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedTeacher.experience}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Total Class Assignments
                          </Label>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="p-2 rounded-full bg-gray-100">
                              <BookOpen className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedTeacher.assignedClasses} classes assigned
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Qualifications */}
                <Card className="border-gray-200">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <div className="p-1.5 rounded-full bg-gray-100">
                        <GraduationCap className="h-4 w-4 text-gray-600" />
                      </div>
                      Academic Qualifications
                    </CardTitle>
                    <CardDescription className="text-gray-700">
                      Professional certifications and educational background
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                      {selectedTeacher.qualifications?.map(
                        (qual: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300"
                          >
                            <GraduationCap className="h-3 w-3 mr-2" />
                            {qual}
                          </Badge>
                        )
                      )}
                    </div>
                    {(!selectedTeacher.qualifications ||
                      selectedTeacher.qualifications.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No qualifications recorded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Class Teacher Assignments */}
                {selectedTeacher.classTeacherAssignments &&
                  selectedTeacher.classTeacherAssignments.length > 0 && (
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50 border-b border-gray-200">
                        <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                          <div className="p-1.5 rounded-full bg-gray-100">
                            <Users className="h-4 w-4 text-gray-600" />
                          </div>
                          Class Teacher Responsibilities
                        </CardTitle>
                        <CardDescription className="text-gray-700">
                          Classes where this teacher serves as the primary class
                          coordinator
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {selectedTeacher.classTeacherAssignments.map(
                            (className: string, index: number) => (
                              <div
                                key={index}
                                className="rounded-xl bg-gray-50 border border-gray-200 p-4"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 rounded-full bg-gray-200 text-gray-700">
                                    <Users className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-lg">
                                      Class {className}
                                    </p>
                                    <Badge
                                      variant="secondary"
                                      className="bg-gray-100 text-gray-700 border-gray-300 text-xs"
                                    >
                                      Primary Teacher
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 font-medium">
                                  Head Class Coordinator
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Subject Assignments */}
                {selectedTeacher.subjectAssignments &&
                  selectedTeacher.subjectAssignments.length > 0 && (
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50 border-b border-gray-200">
                        <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                          <div className="p-1.5 rounded-full bg-gray-100">
                            <BookOpen className="h-4 w-4 text-gray-600" />
                          </div>
                          Subject Teaching Assignments
                        </CardTitle>
                        <CardDescription className="text-gray-700">
                          Specific subjects and classes assigned for teaching
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {selectedTeacher.subjectAssignments.map(
                            (
                              assignment: { class: string; subject: string },
                              index: number
                            ) => (
                              <div
                                key={index}
                                className="rounded-xl bg-gray-50 border border-gray-200 p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-gray-200 text-gray-700">
                                      <BookOpen className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900 text-lg">
                                        {assignment.subject}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge
                                          variant="outline"
                                          className="bg-gray-100 text-gray-700 border-gray-300 text-xs"
                                        >
                                          Class {assignment.class}
                                        </Badge>
                                        <Badge
                                          variant="secondary"
                                          className="bg-gray-100 text-gray-800 border-gray-300 text-xs"
                                        >
                                          Subject Teacher
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-gray-700 font-medium">
                                      Assigned
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Workload Summary */}
                <Card className="border-gray-200">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <div className="p-1.5 rounded-full bg-gray-100">
                        <ClipboardList className="h-4 w-4 text-gray-600" />
                      </div>
                      Workload Analytics Dashboard
                    </CardTitle>
                    <CardDescription className="text-gray-700">
                      Comprehensive overview of teaching responsibilities and
                      workload distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
                        <div className="flex items-center justify-center mb-3">
                          <div className="p-3 rounded-full bg-gray-200 text-gray-700">
                            <Users className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {selectedTeacher.classTeacherAssignments?.length || 0}
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          Class Teacher Roles
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
                        <div className="flex items-center justify-center mb-3">
                          <div className="p-3 rounded-full bg-gray-200 text-gray-700">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {selectedTeacher.subjectAssignments?.length || 0}
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          Subject Assignments
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
                        <div className="flex items-center justify-center mb-3">
                          <div className="p-3 rounded-full bg-gray-200 text-gray-700">
                            <ClipboardList className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {selectedTeacher.assignedClasses}
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          Total Classes
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
                        <div className="flex items-center justify-center mb-3">
                          <div className="p-3 rounded-full bg-gray-200 text-gray-700">
                            <GraduationCap className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {selectedTeacher.qualifications?.length || 0}
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          Qualifications
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTeacherDetailsOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentManagement;
