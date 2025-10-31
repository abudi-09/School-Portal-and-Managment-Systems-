import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Plus, FileDown, Edit, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TablePagination from "@/components/shared/TablePagination";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/useAuth";
import {
  listSectionsByGradeHead,
  listCoursesByGrade,
  type GradeLevel,
  type SectionResponse,
  type CourseResponse,
} from "@/lib/api/courseSectionApi";
import { getAuthToken } from "@/lib/utils";
import {
  createClassSchedule,
  createExamSchedule,
  deleteClassSchedule,
  deleteExamSchedule,
  getClassSchedules,
  getExamSchedules,
  getTeachers,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  updateClassSchedule,
  updateExamSchedule,
  type BackendClassSchedule,
  type BackendExamSchedule,
  type Room,
} from "@/lib/api/schedulesApi";

interface ClassScheduleItem {
  _id?: string;
  day: string;
  period?: string;
  time: string; // HH:mm-HH:mm
  class: string; // section
  subject: string;
  teacher?: string; // display name
  teacherId?: string; // for editing
  room?: string;
}

interface ExamScheduleItem {
  _id: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm-HH:mm
  class: string; // grade
  subject: string;
  type: string;
  invigilator?: string;
  room?: string;
}

const ScheduleManagement = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  console.log("ScheduleManagement - Auth status:", { user, isAuthenticated });

  const [open, setOpen] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    ClassScheduleItem | ExamScheduleItem | null
  >(null);
  const [isEditingExam, setIsEditingExam] = useState(false);

  // (Filter section removed) Page now shows full schedules without client-side filters

  // Form state
  const [formData, setFormData] = useState({
    day: "",
    period: "",
    startTime: "",
    endTime: "",
    class: "",
    subject: "",
    teacher: "",
    room: "",
    date: "",
    type: "",
    invigilator: "",
  });

  // Dynamic options for Add Class Period
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | "">("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<
    "" | "natural" | "social"
  >("");
  const [availableSections, setAvailableSections] = useState<SectionResponse[]>(
    []
  );
  const [availableSubjects, setAvailableSubjects] = useState<CourseResponse[]>(
    []
  );
  const [availableStreams, setAvailableStreams] = useState<
    Array<"natural" | "social">
  >([]);
  const [assignedTeacherIds, setAssignedTeacherIds] = useState<string[] | null>(
    null
  );
  const [sectionsLoading, setSectionsLoading] = useState(false);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const periods = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];

  const [classSchedule, setClassSchedule] = useState<ClassScheduleItem[]>([]);
  const [examSchedule, setExamSchedule] = useState<ExamScheduleItem[]>([]);
  const [loadingClass, setLoadingClass] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);
  const [teachers, setTeachers] = useState<
    Array<{
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    }>
  >([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsDialogOpen, setRoomsDialogOpen] = useState(false);
  const [roomForm, setRoomForm] = useState<{
    _id?: string;
    name: string;
    capacity?: number;
    active: boolean;
  }>({ name: "", capacity: undefined, active: true });

  const ROWS_PER_PAGE = 6;
  const [classPage, setClassPage] = useState(1);
  const [examPage, setExamPage] = useState(1);

  const classTotalPages = Math.max(
    1,
    Math.ceil(classSchedule.length / ROWS_PER_PAGE)
  );
  const examTotalPages = Math.max(
    1,
    Math.ceil(examSchedule.length / ROWS_PER_PAGE)
  );

  useEffect(() => {
    if (classPage > classTotalPages) setClassPage(classTotalPages);
  }, [classPage, classTotalPages]);
  useEffect(() => {
    if (examPage > examTotalPages) setExamPage(examTotalPages);
  }, [examPage, examTotalPages]);

  const pagedClassSchedule = classSchedule.slice(
    (classPage - 1) * ROWS_PER_PAGE,
    classPage * ROWS_PER_PAGE
  );
  const pagedExamSchedule = examSchedule.slice(
    (examPage - 1) * ROWS_PER_PAGE,
    examPage * ROWS_PER_PAGE
  );

  const gradeOptions = useMemo(() => ["9", "10", "11", "12"], []);
  // (Filter-related dynamic sections removed)
  const classSectionOptions = useMemo(() => {
    const grades = ["9", "10", "11", "12"];
    const sections = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const combos: string[] = [];
    for (const g of grades) {
      for (const s of sections) combos.push(`${g}${s}`);
    }
    return combos;
  }, []);

  // Load class schedules (no page-level filters)
  useEffect(() => {
    const loadClass = async () => {
      try {
        setLoadingClass(true);
        const items = await getClassSchedules();
        const mapped: ClassScheduleItem[] = items.map(
          (it: BackendClassSchedule) => {
            const teacher = teachers.find((t) => t._id === it.teacherId);
            const teacherName = teacher
              ? `${teacher.firstName} ${teacher.lastName}`
              : undefined;
            return {
              _id: it._id,
              day: it.day,
              period: it.period || "",
              time: `${it.startTime}-${it.endTime}`,
              class: it.section,
              subject: it.subject,
              teacher: teacherName,
              teacherId: it.teacherId,
              room: it.room,
            };
          }
        );
        setClassSchedule(mapped);
      } catch (err: unknown) {
        console.error("Failed to load class schedules:", err);
        toast({
          title: "Failed to load class schedules",
          description: String(
            (err as any)?.response?.data?.message ??
              (err as any)?.message ??
              err
          ),
          variant: "destructive" as any,
        });
      } finally {
        setLoadingClass(false);
      }
    };
    void loadClass();
    setClassPage(1);
  }, [teachers, toast]);

  // Load exam schedules (no page-level filters)
  useEffect(() => {
    const loadExam = async () => {
      try {
        setLoadingExam(true);
        const items = await getExamSchedules();
        const mapped: ExamScheduleItem[] = items.map(
          (it: BackendExamSchedule) => ({
            _id: it._id,
            date: new Date(it.date).toISOString().slice(0, 10),
            time: `${it.startTime}-${it.endTime}`,
            class: it.grade,
            subject: it.subject,
            type: it.type,
            invigilator: it.invigilator,
            room: it.room,
          })
        );
        setExamSchedule(mapped);
      } catch (err: unknown) {
        toast({
          title: "Failed to load exam schedules",
          description: String(
            (err as any)?.response?.data?.message ??
              (err as any)?.message ??
              err
          ),
          variant: "destructive" as any,
        });
      } finally {
        setLoadingExam(false);
      }
    };
    void loadExam();
    setExamPage(1);
  }, [toast]);

  // Load teachers on component mount
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachersData = await getTeachers();
        setTeachers(teachersData);
      } catch (err: any) {
        console.error("Failed to load teachers:", err);
        // Don't show toast for teachers loading failure as it's not critical
      }
    };
    void loadTeachers();
  }, []);

  // (Page-level section filter removed)

  // Load rooms on component mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const roomsData = await getRooms();
        setRooms(roomsData);
      } catch (err) {
        console.error("Failed to load rooms:", err);
      }
    };
    void loadRooms();
  }, []);

  const resetForm = () => {
    setFormData({
      day: "",
      period: "",
      startTime: "",
      endTime: "",
      class: "",
      subject: "",
      teacher: "",
      room: "",
      date: "",
      type: "",
      invigilator: "",
    });
    setSelectedGrade("");
    setSelectedSection("");
    setSelectedStream("");
    setAvailableSections([]);
    setAvailableSubjects([]);
    setAssignedTeacherIds(null);
  };

  // Load sections whenever grade changes
  useEffect(() => {
    const loadSections = async () => {
      try {
        setSectionsLoading(true);
        // Require authentication before requesting admin resources
        const token = getAuthToken();
        if (!token || !isAuthenticated) {
          setAvailableSections([]);
          setSelectedSection("");
          return;
        }
        if (!selectedGrade) {
          setAvailableSections([]);
          setSelectedSection("");
          return;
        }
        const res = await listSectionsByGradeHead(selectedGrade as GradeLevel);
        setAvailableSections(res.data.sections);
        // Clear section if not available anymore
        setSelectedSection((prev) =>
          res.data.sections.some((s) => s.label === prev) ? prev : ""
        );
      } catch (e) {
        setAvailableSections([]);
      } finally {
        setSectionsLoading(false);
      }
    };
    void loadSections();
    // For senior grades, pre-load stream options from available courses
    const loadStreams = async () => {
      try {
        const token = getAuthToken();
        if (
          !token ||
          !selectedGrade ||
          (selectedGrade !== 11 && selectedGrade !== 12)
        ) {
          setAvailableStreams([]);
          return;
        }
        const res = await listCoursesByGrade(selectedGrade as GradeLevel);
        const present = Array.from(
          new Set(
            (res.data.courses || [])
              .map((c) => c.stream)
              .filter((s): s is "natural" | "social" => !!s)
          )
        );
        setAvailableStreams(present);
      } catch (e) {
        setAvailableStreams([]);
      }
    };
    void loadStreams();
  }, [selectedGrade, isAuthenticated]);

  // Load subjects whenever grade/stream changes
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const token = getAuthToken();
        if (!token || !isAuthenticated) {
          setAvailableSubjects([]);
          return;
        }
        if (!selectedGrade) {
          setAvailableSubjects([]);
          return;
        }
        const isSenior = selectedGrade === 11 || selectedGrade === 12;
        if (isSenior && !selectedStream) {
          setAvailableSubjects([]);
          return;
        }
        const res = await listCoursesByGrade(
          selectedGrade as GradeLevel,
          selectedGrade === 11 || selectedGrade === 12
            ? selectedStream || undefined
            : undefined
        );
        setAvailableSubjects(res.data.courses);
        // If current subject is not in the list, clear it
        setFormData((prev) =>
          res.data.courses.some((c) => c.name === prev.subject)
            ? prev
            : { ...prev, subject: "" }
        );
      } catch (e) {
        setAvailableSubjects([]);
      }
    };
    void loadSubjects();
  }, [selectedGrade, selectedStream, isAuthenticated]);

  // Load assigned teachers for selected class+subject (if available) to narrow choices
  useEffect(() => {
    const loadAssignedTeachers = async () => {
      try {
        setAssignedTeacherIds(null);
        if (!selectedGrade || !selectedSection || !formData.subject) return;
        const classId = `${selectedGrade}${selectedSection}`;
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${apiBaseUrl}/api/head/subject-assignments?classId=${encodeURIComponent(
            classId
          )}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload?.success) {
          setAssignedTeacherIds(null);
          return;
        }
        type ApiAssignment = { subject: string; teacherName?: string };
        const matches: string[] = (payload.data?.assignments ?? [])
          .filter(
            (a: ApiAssignment) =>
              a.subject === formData.subject && a.teacherName
          )
          .map((a: ApiAssignment) => a.teacherName as string);
        if (matches.length === 0) {
          setAssignedTeacherIds([]);
          return;
        }
        // Map teacher names to ids
        const matchedIds = teachers
          .filter((t) =>
            matches.includes(`${t.firstName} ${t.lastName}`.trim())
          )
          .map((t) => t._id);
        setAssignedTeacherIds(matchedIds);
      } catch (e) {
        setAssignedTeacherIds(null);
      }
    };
    void loadAssignedTeachers();
  }, [selectedGrade, selectedSection, formData.subject, teachers]);

  // Helper to detect time overlap
  const timesOverlap = (
    aStart: string,
    aEnd: string,
    bStart: string,
    bEnd: string
  ) => {
    const toMin = (t: string) => {
      const [h, m] = t.split(":").map((n) => Number(n));
      return h * 60 + m;
    };
    const as = toMin(aStart);
    const ae = toMin(aEnd);
    const bs = toMin(bStart);
    const be = toMin(bEnd);
    return as < be && bs < ae;
  };

  const handleAddClassPeriod = async () => {
    try {
      // Basic validation per requirements
      if (!selectedGrade) throw new Error("Grade is required");
      if (!selectedSection) throw new Error("Section is required");
      const isSenior = selectedGrade === 11 || selectedGrade === 12;
      if (isSenior && !selectedStream)
        throw new Error("Stream is required for grades 11–12");
      if (!formData.subject)
        throw new Error("Subject is required and must be selected");
      if (!formData.day) throw new Error("Day is required");
      if (!formData.startTime || !formData.endTime)
        throw new Error("Start and end time are required");
      if (formData.startTime >= formData.endTime)
        throw new Error("Start time must be before end time");

      // Schedule conflict prevention: teacher overlaps on same day
      if (formData.teacher) {
        const existing = await getClassSchedules({
          teacherId: formData.teacher,
          day: formData.day,
        });
        const conflict = existing.some((s) =>
          timesOverlap(
            formData.startTime,
            formData.endTime,
            s.startTime,
            s.endTime
          )
        );
        if (conflict)
          throw new Error(
            "Selected teacher has a conflicting period at the same time."
          );
      }

      // Compute classId code from grade + section
      const classId = `${selectedGrade}${selectedSection}`;
      const created = await createClassSchedule({
        section: classId,
        day: formData.day,
        period: formData.period || undefined,
        startTime: formData.startTime,
        endTime: formData.endTime,
        subject: formData.subject,
        teacherId: formData.teacher || undefined,
        room: formData.room || undefined,
      });
      // Find teacher name for display
      const teacher = teachers.find((t) => t._id === formData.teacher);
      const teacherName = teacher
        ? `${teacher.firstName} ${teacher.lastName}`
        : undefined;

      setClassSchedule((prev) => [
        ...prev,
        {
          _id: created._id,
          day: created.day,
          period: formData.period,
          time: `${created.startTime}-${created.endTime}`,
          class: created.section,
          subject: created.subject,
          teacher: teacherName,
          teacherId: formData.teacher,
          room: created.room,
        },
      ]);
      toast({ title: "Class period added" });
      resetForm();
      setOpen(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Failed to add";
      toast({
        title: "Add failed",
        description: String(msg),
        variant: "destructive" as any,
      });
    }
  };

  const handleAddExam = async () => {
    try {
      const created = await createExamSchedule({
        grade: formData.class,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        subject: formData.subject,
        type: formData.type,
        invigilator: formData.invigilator || undefined,
        room: formData.room || undefined,
      });
      setExamSchedule((prev) => [
        ...prev,
        {
          _id: created._id,
          date: new Date(created.date).toISOString().slice(0, 10),
          time: `${created.startTime}-${created.endTime}`,
          class: created.grade,
          subject: created.subject,
          type: created.type,
          invigilator: created.invigilator,
          room: created.room,
        },
      ]);
      toast({ title: "Exam scheduled" });
      resetForm();
      setExamDialogOpen(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Failed to schedule";
      toast({
        title: "Schedule failed",
        description: String(msg),
        variant: "destructive" as any,
      });
    }
  };

  // Rooms management handlers
  const refreshRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (e) {
      console.error("Failed to refresh rooms", e);
    }
  };

  const handleSaveRoom = async () => {
    try {
      if (roomForm._id) {
        await updateRoom(roomForm._id, {
          name: roomForm.name,
          capacity: roomForm.capacity,
          active: roomForm.active,
        });
        toast({ title: "Room updated" });
      } else {
        await createRoom({
          name: roomForm.name,
          capacity: roomForm.capacity,
          active: roomForm.active,
        });
        toast({ title: "Room created" });
      }
      await refreshRooms();
      setRoomForm({
        _id: undefined,
        name: "",
        capacity: undefined,
        active: true,
      });
    } catch (err: any) {
      toast({
        title: "Room save failed",
        description: String(
          err?.response?.data?.message ?? err?.message ?? err
        ),
        variant: "destructive" as any,
      });
    }
  };

  const handleEditRoom = (r: Room) => {
    setRoomForm({
      _id: r._id,
      name: r.name,
      capacity: r.capacity,
      active: r.active,
    });
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      await deleteRoom(id);
      await refreshRooms();
      toast({ title: "Room deleted" });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: String(
          err?.response?.data?.message ?? err?.message ?? err
        ),
        variant: "destructive" as any,
      });
    }
  };

  const handleEdit = (
    item: ClassScheduleItem | ExamScheduleItem,
    isExam: boolean
  ) => {
    setEditingItem(item);
    setIsEditingExam(isExam);
    if (isExam) {
      const exam = item as ExamScheduleItem;
      const [startTime, endTime] = exam.time.split("-");
      setFormData({
        day: "",
        period: "",
        startTime,
        endTime,
        class: exam.class,
        subject: exam.subject,
        teacher: "",
        room: exam.room ?? "",
        date: exam.date,
        type: exam.type,
        invigilator: exam.invigilator ?? "",
      });
    } else {
      const cls = item as ClassScheduleItem;
      const [startTime, endTime] = cls.time.split("-");
      setFormData({
        day: cls.day,
        period: cls.period ?? "",
        startTime,
        endTime,
        class: cls.class,
        subject: cls.subject,
        teacher: cls.teacherId ?? "",
        room: cls.room ?? "",
        date: "",
        type: "",
        invigilator: "",
      });
    }
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      if (isEditingExam) {
        const current = editingItem as ExamScheduleItem | null;
        if (!current?._id) throw new Error("Missing exam id");
        const payload = {
          grade: formData.class,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          subject: formData.subject,
          type: formData.type,
          invigilator: formData.invigilator || undefined,
          room: formData.room || undefined,
        };
        const updated = await updateExamSchedule(current._id, payload);
        setExamSchedule((prev) =>
          prev.map((e) =>
            e._id === current._id
              ? {
                  _id: updated._id,
                  date: new Date(updated.date).toISOString().slice(0, 10),
                  time: `${updated.startTime}-${updated.endTime}`,
                  class: updated.grade,
                  subject: updated.subject,
                  type: updated.type,
                  invigilator: updated.invigilator,
                  room: updated.room,
                }
              : e
          )
        );
        toast({ title: "Exam updated" });
      } else {
        const current = editingItem as ClassScheduleItem | null;
        if (!current?._id) throw new Error("Missing class schedule id");
        const payload = {
          section: formData.class,
          day: formData.day,
          period: formData.period || undefined,
          startTime: formData.startTime,
          endTime: formData.endTime,
          subject: formData.subject,
          teacherId: formData.teacher || undefined,
          room: formData.room || undefined,
        };
        const updated = await updateClassSchedule(current._id, payload);
        // Find teacher name for display
        const teacher = teachers.find((t) => t._id === formData.teacher);
        const teacherName = teacher
          ? `${teacher.firstName} ${teacher.lastName}`
          : undefined;

        setClassSchedule((prev) =>
          prev.map((c) =>
            c._id === current._id
              ? {
                  _id: updated._id,
                  day: updated.day,
                  period: formData.period,
                  time: `${updated.startTime}-${updated.endTime}`,
                  class: updated.section,
                  subject: updated.subject,
                  teacher: teacherName,
                  teacherId: formData.teacher,
                  room: updated.room,
                }
              : c
          )
        );
        toast({ title: "Class schedule updated" });
      }
      resetForm();
      setEditDialogOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Update failed";
      toast({
        title: "Update failed",
        description: String(msg),
        variant: "destructive" as any,
      });
    }
  };

  const handleDelete = async (
    item: ClassScheduleItem | ExamScheduleItem,
    isExam: boolean
  ) => {
    try {
      if (isExam) {
        const id = (item as ExamScheduleItem)._id;
        await deleteExamSchedule(id);
        setExamSchedule((prev) => prev.filter((e) => e._id !== id));
        toast({ title: "Exam deleted" });
      } else {
        const id = (item as ClassScheduleItem)._id;
        if (!id) throw new Error("Missing id");
        await deleteClassSchedule(id);
        setClassSchedule((prev) => prev.filter((c) => c._id !== id));
        toast({ title: "Class period deleted" });
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Delete failed";
      toast({
        title: "Delete failed",
        description: String(msg),
        variant: "destructive" as any,
      });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Schedule Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage class timetables and exam schedules
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" />
          Export Schedule
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="class" className="space-y-6">
        <TabsList>
          <TabsTrigger value="class">Class Schedule</TabsTrigger>
          <TabsTrigger value="exam">Exam Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="class" className="space-y-6">
          <div className="flex items-center md:justify-between gap-3">
            <div />
            <div className="flex items-end gap-2">
              <Dialog
                open={open}
                onOpenChange={(isOpen) => {
                  setOpen(isOpen);
                  if (isOpen) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Class Period
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Class Period</DialogTitle>
                    <DialogDescription>
                      Schedule a new class period in the timetable
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Day</Label>
                        <Select
                          value={formData.day}
                          onValueChange={(value) =>
                            setFormData({ ...formData, day: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {days.map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Period</Label>
                        <Select
                          value={formData.period}
                          onValueChange={(value) =>
                            setFormData({ ...formData, period: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            {periods.map((period) => (
                              <SelectItem key={period} value={period}>
                                {period}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startTime: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    {/* Dynamic Grade / Section / Stream */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Grade</Label>
                        <Select
                          value={selectedGrade ? String(selectedGrade) : ""}
                          onValueChange={(value) => {
                            const g = Number(value) as GradeLevel;
                            setSelectedGrade(g);
                            // Clear dependent selections
                            setSelectedSection("");
                            setSelectedStream("");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeOptions.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Section</Label>
                        <Select
                          value={selectedSection}
                          onValueChange={(value) => setSelectedSection(value)}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                selectedGrade
                                  ? sectionsLoading
                                    ? "Loading sections..."
                                    : "Select section"
                                  : "Select grade first"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {!selectedGrade && (
                              <SelectItem value="__disabled" disabled>
                                Select grade first
                              </SelectItem>
                            )}
                            {selectedGrade && sectionsLoading && (
                              <SelectItem value="__loading" disabled>
                                Loading sections...
                              </SelectItem>
                            )}
                            {selectedGrade &&
                              !sectionsLoading &&
                              availableSections.length === 0 && (
                                <SelectItem value="__empty" disabled>
                                  No sections available for this grade
                                </SelectItem>
                              )}
                            {selectedGrade &&
                              !sectionsLoading &&
                              availableSections.length > 0 &&
                              availableSections.map((s) => (
                                <SelectItem key={s.id} value={s.label}>
                                  {s.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {(selectedGrade === 11 || selectedGrade === 12) && (
                        <div className="space-y-2">
                          <Label>Stream</Label>
                          <Select
                            value={selectedStream}
                            onValueChange={(value) =>
                              setSelectedStream(value as "natural" | "social")
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select stream" />
                            </SelectTrigger>
                            <SelectContent>
                              {(availableStreams.length > 0
                                ? availableStreams
                                : (["natural", "social"] as Array<
                                    "natural" | "social"
                                  >)
                              ).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s === "natural"
                                    ? "Natural Science"
                                    : "Social Science"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) =>
                          setFormData({ ...formData, subject: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedGrade || !selectedSection
                                ? "Select grade and section first"
                                : (selectedGrade === 11 ||
                                    selectedGrade === 12) &&
                                  !selectedStream
                                ? "Select stream first"
                                : "Select subject"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubjects.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                              {(selectedGrade === 11 || selectedGrade === 12) &&
                              c.stream
                                ? ` — ${
                                    c.stream === "natural"
                                      ? "Natural"
                                      : "Social"
                                  }`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Teacher</Label>
                      <Select
                        value={formData.teacher}
                        onValueChange={(value) =>
                          setFormData({ ...formData, teacher: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {(assignedTeacherIds && assignedTeacherIds.length > 0
                            ? teachers.filter((t) =>
                                assignedTeacherIds.includes(t._id)
                              )
                            : teachers
                          ).map((teacher) => (
                            <SelectItem key={teacher._id} value={teacher._id}>
                              {teacher.firstName} {teacher.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Room</Label>
                      <Select
                        value={formData.room}
                        onValueChange={(value) =>
                          setFormData({ ...formData, room: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms
                            .filter((r) => r.active)
                            .map((r) => (
                              <SelectItem key={r._id} value={r.name}>
                                {r.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddClassPeriod}>Add Period</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {/* close header wrapper */}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Class Schedule
              </CardTitle>
              <CardDescription>
                View and edit the weekly class timetable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingClass && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-sm text-muted-foreground"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingClass && pagedClassSchedule.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-sm text-muted-foreground"
                      >
                        No schedules found
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingClass &&
                    pagedClassSchedule.map((schedule, index) => (
                      <TableRow key={schedule._id ?? index}>
                        <TableCell className="font-medium">
                          {schedule.day}
                        </TableCell>
                        <TableCell>{schedule.period}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {schedule.time}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{schedule.class}</Badge>
                        </TableCell>
                        <TableCell>{schedule.subject}</TableCell>
                        <TableCell>{schedule.teacher}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {schedule.room}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(schedule, false)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(schedule, false)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={classPage}
                totalPages={classTotalPages}
                onPageChange={setClassPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exam" className="space-y-6">
          <div className="flex items-center md:justify-between gap-3">
            <div />
            <div className="flex items-end gap-2">
              <Dialog
                open={roomsDialogOpen}
                onOpenChange={(isOpen) => {
                  setRoomsDialogOpen(isOpen);
                  if (isOpen) void refreshRooms();
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">Manage Rooms</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Manage Rooms</DialogTitle>
                    <DialogDescription>
                      Add, edit, or remove rooms
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1 col-span-2">
                        <Label>Name</Label>
                        <Input
                          placeholder="e.g. Room 101"
                          value={roomForm.name}
                          onChange={(e) =>
                            setRoomForm({ ...roomForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Capacity</Label>
                        <Input
                          type="number"
                          placeholder="Optional"
                          value={roomForm.capacity ?? ""}
                          onChange={(e) =>
                            setRoomForm({
                              ...roomForm,
                              capacity: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Status</Label>
                        <Select
                          value={roomForm.active ? "active" : "inactive"}
                          onValueChange={(v) =>
                            setRoomForm({ ...roomForm, active: v === "active" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleSaveRoom}>
                          {roomForm._id ? "Update" : "Add"} Room
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rooms.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center text-sm text-muted-foreground"
                              >
                                No rooms
                              </TableCell>
                            </TableRow>
                          ) : (
                            rooms.map((r) => (
                              <TableRow key={r._id}>
                                <TableCell>{r.name}</TableCell>
                                <TableCell>{r.capacity ?? "-"}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={r.active ? "default" : "secondary"}
                                  >
                                    {r.active ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditRoom(r)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" /> Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteRoom(r._id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog
                open={examDialogOpen}
                onOpenChange={(isOpen) => {
                  setExamDialogOpen(isOpen);
                  if (isOpen) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Schedule Exam
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Schedule Exam</DialogTitle>
                    <DialogDescription>
                      Schedule a new examination in the timetable
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startTime: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select
                        value={formData.class}
                        onValueChange={(value) =>
                          setFormData({ ...formData, class: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeOptions.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        placeholder="Enter subject"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Exam Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                          <SelectItem value="Final">Final</SelectItem>
                          <SelectItem value="Quiz">Quiz</SelectItem>
                          <SelectItem value="Test">Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Invigilator</Label>
                      <Select
                        value={formData.invigilator}
                        onValueChange={(value) =>
                          setFormData({ ...formData, invigilator: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select invigilator" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 overflow-y-auto">
                          {teachers.map((t) => {
                            const name = `${t.firstName} ${t.lastName}`.trim();
                            return (
                              <SelectItem key={t._id} value={name}>
                                {name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Room</Label>
                      <Select
                        value={formData.room}
                        onValueChange={(value) =>
                          setFormData({ ...formData, room: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms
                            .filter((r) => r.active)
                            .map((r) => (
                              <SelectItem key={r._id} value={r.name}>
                                {r.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setExamDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddExam}>Schedule Exam</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {/* close header wrapper */}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Exam Schedule
              </CardTitle>
              <CardDescription>Manage examination timetable</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Invigilator</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingExam && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-sm text-muted-foreground"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingExam && pagedExamSchedule.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-sm text-muted-foreground"
                      >
                        No exams found
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingExam &&
                    pagedExamSchedule.map((exam) => (
                      <TableRow key={exam._id}>
                        <TableCell className="font-medium">
                          {exam.date}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {exam.time}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{exam.class}</Badge>
                        </TableCell>
                        <TableCell>{exam.subject}</TableCell>
                        <TableCell>
                          <Badge>{exam.type}</Badge>
                        </TableCell>
                        <TableCell>{exam.invigilator}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {exam.room}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(exam, true)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(exam, true)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={examPage}
                totalPages={examTotalPages}
                onPageChange={setExamPage}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {isEditingExam ? "Exam" : "Class"} Schedule
            </DialogTitle>
            <DialogDescription>
              Update the schedule details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isEditingExam ? (
              <>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Exam Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                      <SelectItem value="Final">Final</SelectItem>
                      <SelectItem value="Quiz">Quiz</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Invigilator</Label>
                  <Select
                    value={formData.invigilator}
                    onValueChange={(value) =>
                      setFormData({ ...formData, invigilator: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select invigilator" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {teachers.map((t) => {
                        const name = `${t.firstName} ${t.lastName}`.trim();
                        return (
                          <SelectItem key={t._id} value={name}>
                            {name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Day</Label>
                    <Select
                      value={formData.day}
                      onValueChange={(value) =>
                        setFormData({ ...formData, day: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Select
                      value={formData.period}
                      onValueChange={(value) =>
                        setFormData({ ...formData, period: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Teacher</Label>
                  <Select
                    value={formData.teacher}
                    onValueChange={(value) =>
                      setFormData({ ...formData, teacher: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher._id} value={teacher._id}>
                          {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={formData.class}
                onValueChange={(value) =>
                  setFormData({ ...formData, class: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {isEditingExam
                    ? gradeOptions.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))
                    : classSectionOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Enter subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Select
                value={formData.room}
                onValueChange={(value) =>
                  setFormData({ ...formData, room: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms
                    .filter((r) => r.active)
                    .map((r) => (
                      <SelectItem key={r._id} value={r.name}>
                        {r.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleManagement;
