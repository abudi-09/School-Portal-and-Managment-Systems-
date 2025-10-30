import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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
  id: string; // MongoDB _id
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
  // Classes and teachers are loaded from the server for head assignment management
  const [classes, setClasses] = useState<
    {
      id: string;
      name: string;
      grade?: string;
      section?: string;
      students?: number;
      classTeacher?: string;
      subjects?: number;
    }[]
  >([]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [subjectAssignments, setSubjectAssignments] = useState<
    { class: string; subject: string; teacher: string }[]
  >([]);

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
  const { toast } = useToast();

  // Fetch approved teachers and classes from the server
  type ApiTeacher = {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    department?: string;
    assignedClassIds?: string[];
    phone?: string;
    qualifications?: string[];
    experience?: string;
    classTeacherAssignments?: string[];
    subjectAssignments?: { class: string; subject: string }[];
  };

  type ApiClass = {
    classId: string;
    name?: string;
    grade?: string;
    section?: string;
  };

  const fetchServerData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Fetch classes (provide safe defaults so UI doesn't crash when fields are missing)
      const classesRes = await fetch(`${apiBaseUrl}/api/classes`, { headers });
      const classesPayload = await classesRes.json().catch(() => ({}));
      if (classesRes.ok && classesPayload?.success) {
        const svc = (classesPayload.data?.classes ?? []).map((c: ApiClass) => ({
          id: c.classId,
          name: c.name,
          grade: c.grade,
          section: c.section,
          // defaults used by the UI
          classTeacher: "Unassigned",
          students: 0,
        }));
        setClasses(svc);

        // Fetch current head assignments and merge them into the classes list
        try {
          const caRes = await fetch(
            `${apiBaseUrl}/api/head/class-assignments`,
            {
              headers,
            }
          );
          const caPayload = await caRes.json().catch(() => ({}));
          if (caRes.ok && caPayload?.success) {
            const assignments: any[] = caPayload.data?.assignments ?? [];
            setClasses((prev) =>
              prev.map((cls) => {
                const match = assignments.find(
                  (a) =>
                    String(a.classId ?? "").toLowerCase() ===
                    String(cls.id ?? "").toLowerCase()
                );
                return {
                  ...cls,
                  classTeacher:
                    match?.headTeacherName ?? cls.classTeacher ?? "Unassigned",
                };
              })
            );
          }
        } catch (err) {
          console.warn("Failed to fetch class head assignments", err);
        }
      } else {
        console.warn(
          "Failed to load classes from server",
          classesPayload?.message
        );
      }
      // Fetch teachers for head view
      try {
        const teachersRes = await fetch(
          `${apiBaseUrl}/api/head/teachers?limit=200`,
          { headers }
        );
        const teachersPayload = await teachersRes.json().catch(() => ({}));
        if (teachersRes.ok && teachersPayload?.success) {
          const tv = (teachersPayload.data?.teachers ?? []).map(
            (t: ApiTeacher) => ({
              id: t._id ?? String(t.id ?? ""),
              name:
                `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() ||
                (t as any).name ||
                "Unknown",
              department:
                (t as any).department ?? (t as any).profile?.department ?? "",
              assignedClasses: Array.isArray(t.assignedClassIds)
                ? t.assignedClassIds.length
                : (t as any).assignedClasses ?? 0,
              email: t.email,
              phone: (t as any).profile?.phone ?? (t as any).phone,
              qualifications: t.qualifications ?? [],
              experience: t.experience ?? "",
              classTeacherAssignments: t.classTeacherAssignments ?? [],
              subjectAssignments: t.subjectAssignments ?? [],
            })
          );
          setTeachers(tv);
          setTeachersError(null);
        } else {
          console.warn(
            "Failed to load teachers from server",
            teachersPayload?.message
          );
          setTeachersError(
            teachersPayload?.message || "Failed to load teachers"
          );
        }
      } catch (err) {
        console.warn("Teachers fetch error", err);
        setTeachersError(String(err));
      }

      // Fetch subject assignments snapshot (used for selected class)
      try {
        const saRes = await fetch(
          `${apiBaseUrl}/api/head/subject-assignments`,
          { headers }
        );
        const saPayload = await saRes.json().catch(() => ({}));
        if (saRes.ok && saPayload?.success) {
          type ApiAssignment = {
            classId: string;
            subject: string;
            teacherName?: string;
          };
          const list = (saPayload.data?.assignments ?? []).map(
            (a: ApiAssignment) => ({
              class: a.classId,
              subject: a.subject,
              teacher: a.teacherName ?? "Unassigned",
            })
          );
          setSubjectAssignmentsServer(list);
          setSubjectAssignments(
            list.map((s) => ({
              class: classes.find((c) => c.id === s.class)?.name ?? s.class,
              subject: s.subject,
              teacher: s.teacher,
            }))
          );
        }
      } catch (err) {
        console.warn("Failed to load subject assignments", err);
      }
    } catch (error) {
      console.error("Error fetching server data", error);
    }
  };

  // Load data on mount
  useEffect(() => {
    void fetchServerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [subjectAssignmentsServer, setSubjectAssignmentsServer] = useState<
    { class: string; subject: string; teacher: string }[]
  >([]);
  const [teacherDetailsOpen, setTeacherDetailsOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  // When selectedClass changes, fetch course subjects for its grade and existing assignments
  useEffect(() => {
    const loadForClass = async () => {
      if (!selectedClass) return;
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const cls = classes.find((c) => c.id === selectedClass);
        if (!cls || !cls.grade) return;

        // fetch courses for grade
        const coursesRes = await fetch(
          `${apiBaseUrl}/api/admin/courses?grade=${cls.grade}`,
          { headers }
        );
        const coursesPayload = await coursesRes.json().catch(() => ({}));
        if (coursesRes.ok && coursesPayload?.success) {
          type ApiCourse = { name: string };
          const opts = (coursesPayload.data?.courses ?? []).map(
            (c: ApiCourse) => c.name
          );
          setSubjectOptions(opts);
        } else {
          setSubjectOptions([]);
        }

        // fetch existing subject assignments for class
        const saRes = await fetch(
          `${apiBaseUrl}/api/head/subject-assignments?classId=${selectedClass}`,
          { headers }
        );
        const saPayload = await saRes.json().catch(() => ({}));
        if (saRes.ok && saPayload?.success) {
          type ApiAssignment = {
            classId: string;
            subject: string;
            teacherName?: string;
          };
          const list = (saPayload.data?.assignments ?? []).map(
            (a: ApiAssignment) => ({
              class: a.classId,
              subject: a.subject,
              teacher: a.teacherName ?? "Unassigned",
            })
          );
          setSubjectAssignmentsServer(list);
          if (subjectAssignments.length === 0) {
            setSubjectAssignments(
              list.map((s) => ({
                class: classes.find((c) => c.id === s.class)?.name ?? s.class,
                subject: s.subject,
                teacher: s.teacher,
              }))
            );
          }
        }
      } catch (error) {
        console.error("Error loading subjects/assignments for class", error);
      }
    };
    void loadForClass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, classes]);

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

    const teacher = teachers.find((t) => t.id === selectedTeacherId);
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
      // Persist class head assignment to server
      (async () => {
        try {
          const token = localStorage.getItem("token");
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch(
            `${apiBaseUrl}/api/head/class-assignments/${cls.id}`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify({ teacherId: teacher.id }),
            }
          );
          const payload = await res.json().catch(() => ({}));
          if (!res.ok || !payload.success) {
            throw new Error(payload.message || "Failed to assign class head");
          }
          toast({
            title: "Head assigned",
            description: `${teacher.name} assigned to ${cls.name}`,
          });
          // Optimistically update UI
          const prevTeacherName = cls.classTeacher;
          setClasses((prev) =>
            prev.map((c) =>
              c.id === selectedClass ? { ...c, classTeacher: teacher.name } : c
            )
          );
          if (prevTeacherName && prevTeacherName !== "Unassigned") {
            setTeachers((prev) =>
              prev.map((t) =>
                t.name === prevTeacherName
                  ? {
                      ...t,
                      assignedClasses: Math.max(
                        0,
                        (t.assignedClasses || 1) - 1
                      ),
                      classTeacherAssignments: (
                        t.classTeacherAssignments || []
                      ).filter((x) => x !== cls.name),
                    }
                  : t
              )
            );
          }
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
        } catch (error: unknown) {
          console.error("Failed to save head class assignment", error);
          const msg = error instanceof Error ? error.message : String(error);
          toast({
            title: "Assignment failed",
            description: msg,
            variant: "destructive",
          });
        }
      })();
    }

    if (assignmentType === "subject") {
      const cls = classes.find((c) => c.id === selectedClass);
      if (!cls || !selectedSubject) {
        setDialogOpen(false);
        return;
      }
      // Persist subject assignment to server
      (async () => {
        try {
          const token = localStorage.getItem("token");
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (token) headers.Authorization = `Bearer ${token}`;

          const res = await fetch(
            `${apiBaseUrl}/api/head/subject-assignments/${cls.id}`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify({
                subject: selectedSubject,
                teacherId: teacher.id,
              }),
            }
          );
          const payload = await res.json().catch(() => ({}));
          if (!res.ok || !payload.success) {
            throw new Error(
              payload.message || "Failed to assign subject teacher"
            );
          }
          toast({
            title: "Subject assigned",
            description: `${teacher.name} → ${selectedSubject} (${cls.name})`,
          });

          // Update local subject assignments state
          setSubjectAssignments((prev) => {
            const className = cls.name;
            const updated = prev.filter(
              (s) => !(s.class === className && s.subject === selectedSubject)
            );
            updated.push({
              class: className,
              subject: selectedSubject,
              teacher: teacher.name,
            });
            return updated;
          });

          // update server-backed assignments snapshot
          setSubjectAssignmentsServer((prev) => {
            const without = prev.filter(
              (s) => !(s.class === cls.id && s.subject === selectedSubject)
            );
            without.push({
              class: cls.id,
              subject: selectedSubject,
              teacher: teacher.name,
            });
            return without;
          });
        } catch (error: unknown) {
          console.error("Failed to save subject assignment", error);
          const msg = error instanceof Error ? error.message : String(error);
          toast({
            title: "Assignment failed",
            description: msg,
            variant: "destructive",
          });
          // fallback to local update so UI remains responsive
          const clsName = cls.name;
          setSubjectAssignments((prev) => {
            const updated = prev.filter(
              (s) => !(s.class === clsName && s.subject === selectedSubject)
            );
            updated.push({
              class: clsName,
              subject: selectedSubject,
              teacher: teacher.name,
            });
            return updated;
          });
        }
      })();
    }

    setDialogOpen(false);
    setSelectedTeacherId(null);
    setSelectedSubject(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Assignment Management
        </h1>
        <p className="text-muted-foreground">
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
                <p className="font-medium text-foreground">Action Required</p>
                <p className="text-sm text-muted-foreground">
                  {unassignedCount} unassigned positions this term
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card rounded-2xl shadow-sm border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Classes
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {classes.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card rounded-2xl shadow-sm border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Teachers
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {teachers.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card rounded-2xl shadow-sm border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Unassigned</p>
                <p className="text-3xl font-bold text-foreground">
                  {unassignedCount}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card rounded-2xl shadow-sm border border-border">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-foreground">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Frequently used assignment management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 transition-all group">
              <Users className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                Assign Class Teacher
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 transition-all group">
              <ClipboardList className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                Assign Subject Teacher
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 transition-all group">
              <Eye className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                View Teacher Details
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 transition-all group">
              <BookOpen className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
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
                  (classItem.name ?? "").toLowerCase().includes(q) ||
                  (classItem.classTeacher ?? "").toLowerCase().includes(q)
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
                {(() => {
                  const cls = classes.find((c) => c.id === selectedClass);
                  const nameMap = new Map(
                    subjectAssignmentsServer.map((a) => [a.subject, a.teacher])
                  );
                  const list = subjectOptions.map((subj) => ({
                    subject: subj,
                    teacher: nameMap.get(subj) ?? "Unassigned",
                  }));
                  return list
                    .filter((row) =>
                      subjectSearch
                        ? row.subject
                            .toLowerCase()
                            .includes(subjectSearch.toLowerCase())
                        : true
                    )
                    .map((row, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                      >
                        <div>
                          <p className="font-medium text-foreground mb-1">
                            {row.subject}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Teacher:{" "}
                            <span
                              className={
                                row.teacher === "Unassigned"
                                  ? "text-warning font-medium"
                                  : "text-foreground"
                              }
                            >
                              {row.teacher}
                            </span>
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubject(row.subject);
                            openAssignmentDialog("subject");
                          }}
                        >
                          {row.teacher === "Unassigned" ? "Assign" : "Change"}
                        </Button>
                      </div>
                    ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Teachers */}
      {teachersError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Unable to load teachers
                </p>
                <p className="text-sm text-muted-foreground">{teachersError}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    void fetchServerData();
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : teachers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="font-medium text-foreground mb-1">
              No approved teachers found
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              There are no approved/active teachers available for assignment.
              Ensure teachers are approved and you are logged in with a head
              account.
            </p>
            <Button onClick={() => void fetchServerData()}>Reload</Button>
          </CardContent>
        </Card>
      ) : null}
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
                    className="gap-2 px-4 py-2 rounded-full flex items-center"
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
            {assignmentType === "subject" && (
              <div className="space-y-2">
                <Label>Select Subject</Label>
                <Select
                  value={selectedSubject ?? undefined}
                  onValueChange={(v) => setSelectedSubject(v ?? null)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        subjectOptions.length
                          ? "Choose subject"
                          : "No subjects available"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.length === 0 ? (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No subjects available for this class
                      </div>
                    ) : (
                      subjectOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
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
              <div className="p-3 rounded-full bg-muted text-muted-foreground">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {selectedTeacher?.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedTeacher?.department} Department
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Comprehensive overview of teacher assignments, qualifications, and
              responsibilities
            </DialogDescription>
          </DialogHeader>

          {selectedTeacher && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <Card className="border-border">
                  <CardHeader className="bg-muted border-b border-border">
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      <div className="p-1.5 rounded-full bg-muted text-muted-foreground">
                        <Users className="h-4 w-4" />
                      </div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                            Email Address
                          </Label>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                            <div className="p-2 rounded-full bg-muted text-muted-foreground">
                              <Mail className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {selectedTeacher.email}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                            Phone Number
                          </Label>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                            <div className="p-2 rounded-full bg-muted text-muted-foreground">
                              <Phone className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {selectedTeacher.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                            Teaching Experience
                          </Label>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                            <div className="p-2 rounded-full bg-muted text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {selectedTeacher.experience}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                            Total Class Assignments
                          </Label>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                            <div className="p-2 rounded-full bg-muted text-muted-foreground">
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {selectedTeacher.assignedClasses} classes assigned
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Qualifications */}
                <Card className="border-border">
                  <CardHeader className="bg-muted border-b border-border">
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      <div className="p-1.5 rounded-full bg-muted text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      Academic Qualifications
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
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
                            className="px-4 py-2 text-sm font-medium bg-muted text-foreground border border-border"
                          >
                            <GraduationCap className="h-3 w-3 mr-2" />
                            {qual}
                          </Badge>
                        )
                      )}
                    </div>
                    {(!selectedTeacher.qualifications ||
                      selectedTeacher.qualifications.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
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
                                className="rounded-xl bg-card border border-border p-4"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 rounded-full bg-muted text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-foreground text-lg">
                                      Class {className}
                                    </p>
                                    <Badge
                                      variant="secondary"
                                      className="bg-muted text-foreground border-border text-xs"
                                    >
                                      Primary Teacher
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">
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
                                className="rounded-xl bg-card border border-border p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-muted text-muted-foreground">
                                      <BookOpen className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-foreground text-lg">
                                        {assignment.subject}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge
                                          variant="outline"
                                          className="bg-muted text-foreground border-border text-xs"
                                        >
                                          Class {assignment.class}
                                        </Badge>
                                        <Badge
                                          variant="secondary"
                                          className="bg-muted text-foreground border-border text-xs"
                                        >
                                          Subject Teacher
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-muted-foreground font-medium">
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
