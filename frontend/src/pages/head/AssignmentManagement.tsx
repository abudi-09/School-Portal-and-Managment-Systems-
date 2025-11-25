import { useState, useEffect, Fragment, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "@/lib/utils";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  listClasses,
  listSectionsByGradeHead,
  type SectionResponse,
  type GradeLevel,
} from "@/lib/api/courseSectionApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  grade?: string;
  subjects?: string[];
  stream?: string;
};

const AssignmentManagement = () => {
  // Classes and teachers are loaded from the server for head assignment management
  const [classes, setClasses] = useState<
    {
      id: string;
      name: string;
      grade?: number | string;
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
  const navigate = useNavigate();
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<"class" | "subject">("class");

  // Server bootstrap: load classes, teachers, and subject assignments
  const fetchServerData = async () => {
    try {
      // Load classes (aligned with admin management)
      try {
        const classesPayload = await listClasses();
        console.log("Classes loaded:", classesPayload);
        const mapped = (classesPayload.data?.classes ?? []).map((c) => ({
          id: c.classId,
          name: c.name || `${c.grade}${String(c.section).toUpperCase()}`,
          grade: c.grade,
          section: c.section,
          classTeacher: "Unassigned",
        }));
        setClasses(mapped);
      } catch (err) {
        console.error("Failed to fetch classes list", err);
        setClasses([]);
      }

      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      if (!token) {
        // If no auth, clear dependent state and exit
        setTeachers([]);
        setSubjectAssignmentsServer([]);
        setSubjectAssignments([]);
        return;
      }

      // Fetch teachers for head view
      /* eslint-disable @typescript-eslint/no-explicit-any */
      try {
        const teachersRes = await fetch(
          `${apiBaseUrl}/api/head/teachers?status=approved&limit=200`,
          { headers }
        );
        const teachersPayload = await teachersRes.json().catch(() => ({}));
        console.log("Teachers loaded:", teachersPayload);
        if (teachersRes.ok && (teachersPayload as any)?.success) {
          type ApiTeacher = {
            _id?: string;
            firstName?: string;
            lastName?: string;
            email?: string;
            qualifications?: string[];
            experience?: string;
            classTeacherAssignments?: string[];
            subjectAssignments?: { class: string; subject: string }[];
            assignedClassIds?: string[];
            academicInfo?: {
              grade?: string;
              subjects?: string[];
              stream?: string;
            };
            profile?: { department?: string; phone?: string };
            department?: string;
            phone?: string;
          };
          const tv: Teacher[] = (
            (teachersPayload as any).data?.teachers ?? []
          ).map((t: ApiTeacher) => ({
            id: t._id ?? "",
            name:
              `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || "Unknown",
            department: t.department ?? t.profile?.department ?? "",
            assignedClasses: Array.isArray(t.assignedClassIds)
              ? t.assignedClassIds.length
              : 0,
            email: t.email,
            phone: t.profile?.phone ?? t.phone,
            qualifications: t.qualifications ?? [],
            experience: t.experience ?? "",
            classTeacherAssignments: t.classTeacherAssignments ?? [],
            subjectAssignments: t.subjectAssignments ?? [],
            grade: t.academicInfo?.grade,
            subjects: t.academicInfo?.subjects ?? [],
            stream: t.academicInfo?.stream,
          }));
          setTeachers(tv);
          setTeachersError(null);
        } else {
          console.warn(
            "Failed to load teachers from server",
            (teachersPayload as any)?.message
          );
          setTeachersError(
            (teachersPayload as any)?.message || "Failed to load teachers"
          );
        }
      } catch (err) {
        console.warn("Teachers fetch error", err);
        setTeachersError(String(err));
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */

      // Fetch subject assignments snapshot (used to show current state)
      /* eslint-disable @typescript-eslint/no-explicit-any */
      try {
        const saRes = await fetch(
          `${apiBaseUrl}/api/head/subject-assignments`,
          { headers }
        );
        const saPayload = await saRes.json().catch(() => ({}));
        if (saRes.ok && (saPayload as any)?.success) {
          type ApiAssignment = {
            classId: string;
            subject: string;
            teacherName?: string;
          };
          const list = ((saPayload as any).data?.assignments ?? []).map(
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
      /* eslint-enable @typescript-eslint/no-explicit-any */
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
  // Pagination for class teacher assignment (client-side)
  const [teacherPage, setTeacherPage] = useState<number>(1);
  const TEACHER_PAGE_LIMIT = 6;
  const [classSearch, setClassSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  // Track per-teacher expanded assignment controls
  // Expand per-teacher assignment container
  const [expandedByTeacher, setExpandedByTeacher] = useState<
    Record<string, boolean>
  >({});
  const [gradeByTeacher, setGradeByTeacher] = useState<Record<string, string>>(
    {}
  );
  const [streamByTeacher, setStreamByTeacher] = useState<
    Record<string, "natural" | "social" | "">
  >({});
  const [sectionByTeacher, setSectionByTeacher] = useState<
    Record<string, string>
  >({});
  const [sectionOptsByTeacher, setSectionOptsByTeacher] = useState<
    Record<string, SectionResponse[]>
  >({});
  const [sectionsLoadingByTeacher, setSectionsLoadingByTeacher] = useState<
    Record<string, boolean>
  >({});

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
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [loadingSubjectTeachers, setLoadingSubjectTeachers] = useState(false);
  const [subjectTeacherOptions, setSubjectTeacherOptions] = useState<
    { id: string; name: string; department?: string }[]
  >([]);
  const [subjectTeachersError, setSubjectTeachersError] = useState<
    string | null
  >(null);
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
        // Require auth token before calling admin endpoints — avoid 403 when
        // not logged in.
        const token = localStorage.getItem("token");
        if (!token) {
          setSubjectOptions([]);
          setSubjectAssignmentsServer([]);
          setSubjectAssignments([]);
          return;
        }
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const cls = classes.find((c) => c.id === selectedClass);
        if (!cls || !cls.grade) return;

        let stream: "natural" | "social" | undefined;

        // Resolve stream for Grade 11/12 to ensure we get the correct subjects
        if (Number(cls.grade) >= 11) {
          try {
            const secRes = await listSectionsByGradeHead(
              Number(cls.grade) as GradeLevel
            );
            const found = secRes.data?.sections?.find(
              (s) => s.label.toLowerCase() === cls.section?.toLowerCase()
            );
            if (found) stream = found.stream;
          } catch (e) {
            console.warn("Failed to resolve stream for class", e);
          }
        }

        // fetch courses for grade (keep existing behavior for class-scoped subjects)
        const qs = new URLSearchParams({ grade: String(cls.grade) });
        if (stream) qs.append("stream", stream);

        const coursesRes = await fetch(
          `${apiBaseUrl}/api/head/courses?${qs.toString()}`,
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

  // --- Subject list for grade/stream cascade (used in subject-assignment flow) ---
  useEffect(() => {
    const loadSubjectsForGrade = async () => {
      if (!selectedGrade) return;
      // for grades 11/12 require stream
      if ((selectedGrade === 11 || selectedGrade === 12) && !selectedStream)
        return;
      setLoadingSubjects(true);
      setSubjectsError(null);
      try {
        const token = getAuthToken() || localStorage.getItem("token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;
        const qs = new URLSearchParams({ grade: String(selectedGrade) });
        if (selectedStream) qs.append("stream", String(selectedStream));
        const res = await fetch(
          `${apiBaseUrl}/api/head/courses?${qs.toString()}`,
          { headers }
        );
        const payload = await res.json().catch(() => ({}));
        if (res.ok && payload?.success) {
          const courseArr = (payload.data?.courses ?? []) as Array<{
            name: string;
          }>;
          setSubjectOptions(courseArr.map((c) => c.name));
        } else {
          setSubjectsError(payload?.message || "Failed to load subjects");
          setSubjectOptions([]);
        }
      } catch (err) {
        setSubjectsError(String(err));
        setSubjectOptions([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    void loadSubjectsForGrade();
  }, [selectedGrade, selectedStream, apiBaseUrl]);

  // fetch teachers filtered by grade/stream/subject
  useEffect(() => {
    const loadTeachersForSubject = async () => {
      if (assignmentType !== "subject") return;
      if (!selectedGrade || !selectedSubject) return;
      if ((selectedGrade === 11 || selectedGrade === 12) && !selectedStream)
        return;
      setLoadingSubjectTeachers(true);
      setSubjectTeachersError(null);
      try {
        // Debug: log current selection that drives the request
        // eslint-disable-next-line no-console
        console.debug("loadTeachersForSubject() called with:", {
          assignmentType,
          selectedGrade,
          selectedStream,
          selectedSubject,
        });
        const token = getAuthToken() || localStorage.getItem("token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;
        const params = new URLSearchParams({
          grade: String(selectedGrade),
          subject: selectedSubject,
        });
        if (selectedStream) params.append("stream", String(selectedStream));
        const url = `${apiBaseUrl}/api/head/teachers/by-subject?${params.toString()}`;
        // Debug: log final URL
        // eslint-disable-next-line no-console
        console.debug("fetching teachers by subject url:", url);
        const res = await fetch(url, { headers });
        const payload = await res.json().catch(() => ({}));
        // Debug: log response status and payload
        // eslint-disable-next-line no-console
        console.debug("teachers/by-subject response", {
          status: res.status,
          ok: res.ok,
          payload,
        });
        if (res.ok && payload?.success) {
          const teacherArr = (payload.data?.teachers ?? []) as Array<{
            _id?: string;
            id?: string;
            name: string;
            department?: string;
          }>;
          setSubjectTeacherOptions(
            teacherArr
              .map((t) => ({
                id: t._id ?? t.id ?? t.name,
                name: t.name,
                department: t.department,
              }))
              .filter(Boolean)
          );
        } else {
          setSubjectTeachersError(payload?.message || "No teachers found");
          setSubjectTeacherOptions([]);
        }
      } catch (err) {
        setSubjectTeachersError(String(err));
        setSubjectTeacherOptions([]);
      } finally {
        setLoadingSubjectTeachers(false);
      }
    };
    void loadTeachersForSubject();
  }, [
    assignmentType,
    selectedGrade,
    selectedStream,
    selectedSubject,
    apiBaseUrl,
  ]);

  const unassignedCount =
    classes.filter((c) => c.classTeacher === "Unassigned").length +
    subjectAssignments.filter((s) => s.teacher === "Unassigned").length;

  const openAssignmentDialog = (type: "teacher" | "subject") => {
    setAssignmentType(type);
    setSelectedTeacherId(null);
    if (type === "subject") {
      // Pre-fill grade from currently selected class if available
      if (selectedClass) {
        const cls = classes.find((c) => c.id === selectedClass);
        const g =
          typeof cls?.grade === "string"
            ? parseInt(cls!.grade as string, 10)
            : (cls?.grade as number | undefined);
        setSelectedGrade(g ?? null);
      } else {
        setSelectedGrade(null);
      }
      // Reset downstream selections
      setSelectedStream(null);
      // keep any previously-selected subject (do not overwrite)
      setSubjectTeacherOptions([]);
    } else {
      // Reset cascade when doing class teacher assignment
      setSelectedGrade(null);
      setSelectedStream(null);
      setSelectedSubject(null);
      setSubjectTeacherOptions([]);
    }
    setDialogOpen(true);
  };

  const openTeacherDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setTeacherDetailsOpen(true);
  };

  // Directly assign a teacher as head for the selected class
  const assignHeadDirect = async (teacherId: string, classId: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      // capture existing class info to update teacher counts locally after success
      const clsBefore = classes.find((c) => c.id === classId);
      const prevTeacherName = clsBefore?.classTeacher;
      const className = clsBefore?.name ?? classId;

      let res = await fetch(
        `${apiBaseUrl}/api/head/class-assignments/${classId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ teacherId }),
        }
      );
      type AssignResponse = {
        success?: boolean;
        message?: string;
        code?: string;
      };
      let payload: AssignResponse = (await res
        .json()
        .catch(() => ({}))) as AssignResponse;
      if (res.status === 409 && payload?.code === "CONFIRM_REASSIGN") {
        res = await fetch(
          `${apiBaseUrl}/api/head/class-assignments/${classId}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({ teacherId, confirmReassign: true }),
          }
        );
        payload = (await res.json().catch(() => ({}))) as AssignResponse;
      }
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to assign class head");
      }

      toast({
        title: "Head assigned",
        description: payload?.message || "Assignment saved",
      });
      const newHeadName = teachers.find((t) => t.id === teacherId)?.name;
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classId
            ? { ...c, classTeacher: newHeadName || c.classTeacher }
            : c
        )
      );

      // Update teachers counts and assignments locally
      setTeachers((prev) =>
        prev.map((t) => {
          // decrement previous head's counters
          if (
            prevTeacherName &&
            t.name === prevTeacherName &&
            prevTeacherName !== "Unassigned"
          ) {
            const updatedAssignments = (t.classTeacherAssignments || []).filter(
              (x) => x !== className
            );
            return {
              ...t,
              assignedClasses: Math.max(0, (t.assignedClasses || 1) - 1),
              classTeacherAssignments: updatedAssignments,
            };
          }
          // increment new head's counters
          if (t.id === teacherId) {
            const already = (t.classTeacherAssignments || []).includes(
              className
            );
            return {
              ...t,
              assignedClasses: (t.assignedClasses || 0) + (already ? 0 : 1),
              classTeacherAssignments: already
                ? t.classTeacherAssignments
                : [...(t.classTeacherAssignments || []), className],
            };
          }
          return t;
        })
      );
    } catch (error: unknown) {
      console.error("Assign head error", error);
      const msg = error instanceof Error ? error.message : String(error);
      toast({
        title: "Assignment failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  // Helpers for expanded assignment controls per teacher
  const toggleExpanded = (teacherId: string) => {
    const opening = !expandedByTeacher[teacherId];
    setExpandedByTeacher((prev) => ({
      ...prev,
      [teacherId]: !prev[teacherId],
    }));
    // prime defaults when opening first time
    if (opening) {
      const t = teachers.find((x) => x.id === teacherId);
      const existingGrade =
        gradeByTeacher[teacherId] ?? (t?.grade ? String(t.grade) : "");
      const existingStream = streamByTeacher[teacherId] ?? t?.stream ?? "";
      if (!gradeByTeacher[teacherId] && t?.grade) {
        setGradeByTeacher((p) => ({ ...p, [teacherId]: String(t.grade) }));
      }
      // Prime stream state if teacher already has one (useful for grades 11/12)
      if (!streamByTeacher[teacherId] && t?.stream) {
        const val =
          t.stream === "natural" || t.stream === "social"
            ? (t.stream as "natural" | "social")
            : "";
        setStreamByTeacher((p) => ({ ...p, [teacherId]: val }));
      }
      // If grade is present and either it's 9/10 or (11/12 and stream already present), fetch sections
      const gNum = Number(existingGrade);
      if ([9, 10].includes(gNum)) {
        void fetchSectionsFor(teacherId);
      } else if ([11, 12].includes(gNum) && existingStream) {
        void fetchSectionsFor(teacherId);
      }
    }
  };

  const fetchSectionsFor = async (teacherId: string) => {
    const gradeStr = gradeByTeacher[teacherId];
    const stream = streamByTeacher[teacherId];
    const gNum = Number(gradeStr);
    if (![9, 10, 11, 12].includes(gNum)) return;
    setSectionsLoadingByTeacher((p) => ({ ...p, [teacherId]: true }));
    try {
      const res = await listSectionsByGradeHead(
        gNum as GradeLevel,
        gNum >= 11 ? stream || undefined : undefined
      );
      setSectionOptsByTeacher((p) => ({
        ...p,
        [teacherId]: res.data.sections || [],
      }));
    } catch (e) {
      setSectionOptsByTeacher((p) => ({ ...p, [teacherId]: [] }));
    } finally {
      setSectionsLoadingByTeacher((p) => ({ ...p, [teacherId]: false }));
    }
  };

  const onChangeGrade = async (teacherId: string, grade: string) => {
    setGradeByTeacher((p) => ({ ...p, [teacherId]: grade }));
    // reset selections
    setStreamByTeacher((p) => ({ ...p, [teacherId]: "" }));
    setSectionByTeacher((p) => ({ ...p, [teacherId]: "" }));
    // 9/10: fetch sections immediately
    const gNum = Number(grade);
    if (gNum === 9 || gNum === 10) {
      await fetchSectionsFor(teacherId);
    } else {
      // clear until stream selected
      setSectionOptsByTeacher((p) => ({ ...p, [teacherId]: [] }));
    }
  };

  const onChangeStream = async (
    teacherId: string,
    stream: "natural" | "social"
  ) => {
    setStreamByTeacher((p) => ({ ...p, [teacherId]: stream }));
    setSectionByTeacher((p) => ({ ...p, [teacherId]: "" }));
    await fetchSectionsFor(teacherId);
  };

  const onAssignHeadFromExpanded = async (teacherId: string) => {
    const grade = gradeByTeacher[teacherId];
    const section = sectionByTeacher[teacherId];
    if (!grade || !section) return;
    // Try to find existing class id; otherwise compute grade+section
    const match = classes.find(
      (c) =>
        String(c.grade) === String(grade) &&
        String(c.section).toUpperCase() === String(section).toUpperCase()
    );
    const classId = match
      ? match.id
      : `${grade}${String(section).toUpperCase()}`;
    await assignHeadDirect(teacherId, classId);
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

          let res = await fetch(
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
          let payload = await res.json().catch(() => ({}));

          // Handle conflict / reassign confirmation
          if (res.status === 409 && payload?.code === "CONFIRM_REASSIGN") {
            res = await fetch(
              `${apiBaseUrl}/api/head/subject-assignments/${cls.id}`,
              {
                method: "PUT",
                headers,
                body: JSON.stringify({
                  subject: selectedSubject,
                  teacherId: teacher.id,
                  confirmReassign: true,
                }),
              }
            );
            payload = await res.json().catch(() => ({}));
          }

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
            <button
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 transition-all group"
              onClick={() => {
                setActiveTab("class");
                // scroll tabs into view
                setTimeout(
                  () =>
                    tabsRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    }),
                  50
                );
              }}
            >
              <Users className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                Assign Class Teacher
              </span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 transition-all group"
              onClick={() => {
                setActiveTab("subject");
                setTimeout(
                  () =>
                    tabsRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    }),
                  50
                );
              }}
            >
              <ClipboardList className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                Assign Subject Teacher
              </span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 transition-all group"
              onClick={() => navigate("/head/teachers")}
            >
              <Eye className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                View Teacher Details
              </span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 transition-all group"
              onClick={() => navigate("/head/schedules")}
            >
              <BookOpen className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-3" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                Schedule Management
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Panels */}
      {/*
        Stack the assignment panels vertically so Class Teacher Assignment
        and Subject Teacher Assignment appear up/down instead of side-by-side.
        Removing the `lg:grid-cols-2` breakpoint forces a single-column layout
        on all screen sizes (keeps responsiveness while meeting the UX request).
      */}
      <div ref={tabsRef}>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "class" | "subject")}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="class">Class Teacher Assignment</TabsTrigger>
            <TabsTrigger value="subject">
              Subject Teacher Assignment
            </TabsTrigger>
          </TabsList>
          <TabsContent value="class">
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
                    placeholder="Search teachers by name or subject"
                    value={teacherSearch}
                    onChange={(e) => {
                      setTeacherSearch(e.target.value);
                      setTeacherPage(1);
                    }}
                  />
                </div>

                {(() => {
                  const q = teacherSearch.trim().toLowerCase();
                  const filteredTeachers = teachers.filter((t) => {
                    if (!q) return true;
                    const subjMatch = (t.subjects || []).some((s) =>
                      s.toLowerCase().includes(q)
                    );
                    return (
                      t.name.toLowerCase().includes(q) ||
                      (t.department || "").toLowerCase().includes(q) ||
                      subjMatch
                    );
                  });

                  // paginate client-side
                  const total = filteredTeachers.length;
                  const totalPages = Math.max(
                    1,
                    Math.ceil(total / TEACHER_PAGE_LIMIT)
                  );
                  const start = (teacherPage - 1) * TEACHER_PAGE_LIMIT;
                  const pagedTeachers = filteredTeachers.slice(
                    start,
                    start + TEACHER_PAGE_LIMIT
                  );

                  if (filteredTeachers.length === 0) {
                    return (
                      <div className="text-sm text-muted-foreground py-6 text-center">
                        No teachers available. Approve teachers first or adjust
                        your search.
                      </div>
                    );
                  }

                  return (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead className="text-right">Assign</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedTeachers.map((t) => {
                            const expanded = !!expandedByTeacher[t.id];
                            const selGrade =
                              gradeByTeacher[t.id] ??
                              (t.grade ? String(t.grade) : "");
                            const selStream = streamByTeacher[t.id] ?? "";
                            const selSection = sectionByTeacher[t.id] ?? "";
                            const sectionOpts =
                              sectionOptsByTeacher[t.id] ?? [];
                            const loadingSections =
                              !!sectionsLoadingByTeacher[t.id];
                            return (
                              <Fragment key={t.id}>
                                <TableRow>
                                  <TableCell className="font-medium">
                                    {t.name}
                                  </TableCell>
                                  <TableCell>{t.grade ?? "—"}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {(t.subjects ?? []).length === 0 ? (
                                        <span className="text-sm text-muted-foreground">
                                          —
                                        </span>
                                      ) : (
                                        (t.subjects ?? []).map((s) => (
                                          <Badge key={s} variant="secondary">
                                            {s}
                                          </Badge>
                                        ))
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      onClick={() => toggleExpanded(t.id)}
                                    >
                                      {(t.assignedClasses ?? 0) > 0
                                        ? "Reassign"
                                        : "Assign as Head of Class"}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                {expanded && (
                                  <TableRow>
                                    <TableCell colSpan={4}>
                                      <div className="p-4 bg-secondary rounded-md flex flex-col gap-3 items-start">
                                        <div className="flex items-center gap-2">
                                          <Label className="mr-1">Grade</Label>
                                          <Select
                                            value={selGrade || undefined}
                                            onValueChange={(v) =>
                                              onChangeGrade(t.id, v)
                                            }
                                          >
                                            <SelectTrigger className="w-28">
                                              <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="9">
                                                9
                                              </SelectItem>
                                              <SelectItem value="10">
                                                10
                                              </SelectItem>
                                              <SelectItem value="11">
                                                11
                                              </SelectItem>
                                              <SelectItem value="12">
                                                12
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        {(Number(selGrade) === 11 ||
                                          Number(selGrade) === 12) && (
                                          <div className="flex items-center gap-2">
                                            <Label className="mr-1">
                                              Stream
                                            </Label>
                                            <Select
                                              value={selStream || undefined}
                                              onValueChange={(v) =>
                                                onChangeStream(
                                                  t.id,
                                                  v as "natural" | "social"
                                                )
                                              }
                                            >
                                              <SelectTrigger className="w-36">
                                                <SelectValue placeholder="Choose" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="natural">
                                                  Natural
                                                </SelectItem>
                                                <SelectItem value="social">
                                                  Social
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <Label className="mr-1">
                                            Section
                                          </Label>
                                          <Select
                                            value={selSection || undefined}
                                            onValueChange={(v) =>
                                              setSectionByTeacher((p) => ({
                                                ...p,
                                                [t.id]: v,
                                              }))
                                            }
                                            disabled={
                                              loadingSections ||
                                              !selGrade ||
                                              (Number(selGrade) >= 11 &&
                                                !selStream)
                                            }
                                          >
                                            <SelectTrigger className="w-36">
                                              <SelectValue
                                                placeholder={
                                                  loadingSections
                                                    ? "Loading..."
                                                    : "Choose"
                                                }
                                              />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {sectionOpts.length === 0 &&
                                              !loadingSections ? (
                                                <div className="px-2 py-1 text-sm text-muted-foreground">
                                                  No sections
                                                </div>
                                              ) : (
                                                sectionOpts.map((s) => (
                                                  <SelectItem
                                                    key={s.id}
                                                    value={s.label}
                                                  >
                                                    {s.label}
                                                  </SelectItem>
                                                ))
                                              )}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            disabled={
                                              !selGrade ||
                                              !selSection ||
                                              (Number(selGrade) >= 11 &&
                                                !selStream)
                                            }
                                            onClick={() =>
                                              onAssignHeadFromExpanded(t.id)
                                            }
                                          >
                                            Confirm Assign
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleExpanded(t.id)}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>

                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Page {teacherPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={teacherPage <= 1}
                            onClick={() =>
                              setTeacherPage((p) => Math.max(1, p - 1))
                            }
                          >
                            Previous
                          </Button>
                          <Button
                            size="sm"
                            disabled={teacherPage >= totalPages}
                            onClick={() =>
                              setTeacherPage((p) => Math.min(totalPages, p + 1))
                            }
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subject">
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
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
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
                        subjectAssignmentsServer.map((a) => [
                          a.subject,
                          a.teacher,
                        ])
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
                              {row.teacher === "Unassigned"
                                ? "Assign"
                                : "Change"}
                            </Button>
                          </div>
                        ));
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Available Teachers section removed: list is now presented on Teacher Management page */}

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Select
                    value={selectedGrade ? String(selectedGrade) : undefined}
                    onValueChange={(v) => {
                      const g = v ? parseInt(v) : null;
                      setSelectedGrade(g);
                      // reset downstream selections
                      setSelectedStream(null);
                      setSelectedSubject(null);
                      setSubjectTeacherOptions([]);
                      setSelectedTeacherId(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {[9, 10, 11, 12].map((g) => (
                        <SelectItem key={g} value={String(g)}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Stream</Label>
                  <Select
                    value={selectedStream ?? undefined}
                    onValueChange={(v) => {
                      setSelectedStream(v ?? null);
                      setSelectedSubject(null);
                      setSubjectTeacherOptions([]);
                      setSelectedTeacherId(null);
                    }}
                    disabled={!(selectedGrade === 11 || selectedGrade === 12)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedGrade === 11 || selectedGrade === 12
                            ? "Select stream"
                            : "N/A for this grade"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural">Natural</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select
                    value={selectedSubject ?? undefined}
                    onValueChange={(v) => setSelectedSubject(v ?? null)}
                    disabled={
                      !selectedGrade ||
                      ((Number(selectedGrade) === 11 ||
                        Number(selectedGrade) === 12) &&
                        !selectedStream) ||
                      loadingSubjects ||
                      (subjectOptions.length === 0 && !subjectsError)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedGrade
                            ? "Select grade first"
                            : (Number(selectedGrade) === 11 ||
                                Number(selectedGrade) === 12) &&
                              !selectedStream
                            ? "Select stream first"
                            : loadingSubjects
                            ? "Loading subjects..."
                            : subjectOptions.length
                            ? "Choose subject"
                            : subjectsError || "No subjects"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectsError && (
                        <div className="px-2 py-1 text-sm text-destructive">
                          {subjectsError}
                        </div>
                      )}
                      {subjectOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                disabled={
                  assignmentType === "subject" &&
                  (!selectedGrade ||
                    ((Number(selectedGrade) === 11 ||
                      Number(selectedGrade) === 12) &&
                      !selectedStream) ||
                    !selectedSubject)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {assignmentType === "subject" ? (
                    !selectedGrade ||
                    ((Number(selectedGrade) === 11 ||
                      Number(selectedGrade) === 12) &&
                      !selectedStream) ||
                    !selectedSubject ? (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        {!selectedGrade
                          ? "Select grade first"
                          : (Number(selectedGrade) === 11 ||
                              Number(selectedGrade) === 12) &&
                            !selectedStream
                          ? "Select stream first"
                          : !selectedSubject
                          ? "Select subject first"
                          : ""}
                      </div>
                    ) : loadingSubjectTeachers ? (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        Loading teachers...
                      </div>
                    ) : subjectTeachersError ? (
                      <div className="px-2 py-1 text-sm text-destructive">
                        {subjectTeachersError}
                      </div>
                    ) : subjectTeacherOptions.length === 0 ? (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No active teachers match this grade/stream/subject
                      </div>
                    ) : (
                      subjectTeacherOptions
                        .filter((t) => {
                          if (!teacherSearch) return true;
                          const q = teacherSearch.toLowerCase();
                          return (
                            t.name.toLowerCase().includes(q) ||
                            (t.department ?? "").toLowerCase().includes(q)
                          );
                        })
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} - {t.department}
                          </SelectItem>
                        ))
                    )
                  ) : (
                    (() => {
                      const filtered = teachers.filter((t) => {
                        if (!teacherSearch) return true;
                        const q = teacherSearch.toLowerCase();
                        return (
                          t.name.toLowerCase().includes(q) ||
                          t.department.toLowerCase().includes(q)
                        );
                      });
                      if (filtered.length === 0) {
                        return (
                          <div className="px-2 py-1 text-sm text-muted-foreground">
                            No teachers available. Approve teachers first.
                          </div>
                        );
                      }
                      return filtered.map((teacher) => (
                        <SelectItem
                          key={teacher.id}
                          value={teacher.id.toString()}
                        >
                          {teacher.name} - {teacher.department}
                        </SelectItem>
                      ));
                    })()
                  )}
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
