import { FormEvent, useMemo, useState, useEffect } from "react";
import { Loader2, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCourse,
  createSection,
  listCoursesByGrade,
  listSectionsByGrade,
  deleteCourse,
  deleteSection,
  updateCourse,
  updateSection,
  listClasses,
  type CourseResponse,
  type GradeLevel,
  type SectionResponse,
} from "@/lib/api/courseSectionApi";
import { TableSkeletonRows } from "@/components/shared/LoadingSkeletons";

const GRADE_LEVELS: GradeLevel[] = [9, 10, 11, 12];

const GRADE_LABEL: Record<GradeLevel, string> = {
  9: "Grade 9",
  10: "Grade 10",
  11: "Grade 11",
  12: "Grade 12",
};

const AdminCourseSectionManagement = () => {
  const [activeGrade, setActiveGrade] = useState<GradeLevel>(9);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Course & Section Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure course offerings and class sections for each senior high
          school grade.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader className="space-y-2">
          <CardTitle>Select Grade Level</CardTitle>
          <CardDescription>
            Switch between grade levels to review existing entries and add new
            ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={String(activeGrade)}
            onValueChange={(value) =>
              setActiveGrade(Number(value) as GradeLevel)
            }
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADE_LEVELS.map((grade) => (
                <TabsTrigger key={grade} value={String(grade)}>
                  {GRADE_LABEL[grade]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <GradePanel grade={activeGrade} />
    </div>
  );
};

const GradePanel = ({ grade }: { grade: GradeLevel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [courseName, setCourseName] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);
  const [isCommon, setIsCommon] = useState(false);
  const [sectionLabel, setSectionLabel] = useState("");
  const [sectionCapacity, setSectionCapacity] = useState("");
  // stream for the add-course form (only used for grades 11 & 12)
  const [formStream, setFormStream] = useState<"natural" | "social" | "">("");
  // stream filter for listing courses (separate from formStream)
  const [filterStream, setFilterStream] = useState<"natural" | "social" | "">(
    ""
  );
  // stream for the add-section form (grades 11 & 12 only)
  const [sectionFormStream, setSectionFormStream] = useState<
    "natural" | "social" | ""
  >("");
  // stream filter for listing sections
  const [sectionFilterStream, setSectionFilterStream] = useState<
    "natural" | "social" | ""
  >("");

  const coursesQuery = useQuery<CourseResponse[]>({
    queryKey: ["admin", "courses", grade, filterStream],
    queryFn: async () => {
      const response = await listCoursesByGrade(
        grade,
        filterStream || undefined
      );
      return response.data.courses;
    },
  });

  const sectionsQuery = useQuery<SectionResponse[]>({
    queryKey: ["admin", "sections", grade, sectionFilterStream],
    queryFn: async () => {
      const response = await listSectionsByGrade(
        grade,
        sectionFilterStream || undefined
      );
      return response.data.sections;
    },
  });

  const classesQuery = useQuery({
    queryKey: ["admin", "classes"],
    queryFn: async () => {
      const response = await listClasses();
      return response.data.classes;
    },
  });

  const sortedCourses = useMemo(() => {
    return [...(coursesQuery.data ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [coursesQuery.data]);

  const sortedSections = useMemo(() => {
    return [...(sectionsQuery.data ?? [])].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [sectionsQuery.data]);

  type ApiClass = {
    classId: string;
    grade: number | string;
    section?: string;
    name?: string;
    updatedAt?: string;
  };
  const classesForGrade = useMemo(() => {
    const data = (classesQuery.data ?? []) as ApiClass[];
    return data.filter((c) => Number(c.grade) === grade);
  }, [classesQuery.data, grade]);

  const createCourseMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      isMandatory: boolean;
      stream?: "natural" | "social";
      isCommon?: boolean;
    }) =>
      createCourse({
        grade,
        name: payload.name,
        isMandatory: payload.isMandatory,
        stream: payload.stream,
        isCommon: payload.isCommon,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData<CourseResponse[]>(
        ["admin", "courses", grade, filterStream],
        (previous = []) => [
          result.data.course,
          ...previous.filter((c) => c.id !== result.data.course.id),
        ]
      );
      toast({
        title: "Course added",
        description: `${result.data.course.name} is now available for ${GRADE_LABEL[grade]}.`,
      });
      setCourseName("");
      setIsMandatory(false);
      setFormStream("");
      setIsCommon(false);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unable to create course.";
      toast({
        title: "Failed to add course",
        description: message,
        variant: "destructive",
      });
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: (payload: {
      label: string;
      capacity?: number;
      stream?: "natural" | "social";
    }) =>
      createSection({
        grade,
        label: payload.label,
        capacity: payload.capacity,
        stream: payload.stream,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData<SectionResponse[]>(
        ["admin", "sections", grade, sectionFilterStream],
        (previous = []) => [
          result.data.section,
          ...previous.filter((s) => s.id !== result.data.section.id),
        ]
      );
      toast({
        title: "Section added",
        description: `${result.data.section.label} is ready for ${GRADE_LABEL[grade]}.`,
      });
      setSectionLabel("");
      setSectionCapacity("");
      setSectionFormStream("");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unable to create section.";
      toast({
        title: "Failed to add section",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: (result) => {
      queryClient.setQueryData<CourseResponse[]>(
        ["admin", "courses", grade, filterStream],
        (previous = []) =>
          previous.filter((c) => c.id !== result.data.course.id)
      );
      toast({
        title: "Course deleted",
        description: `${result.data.course.name} has been removed.`,
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unable to delete course.";
      toast({
        title: "Failed to delete course",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => deleteSection(id),
    onSuccess: (result) => {
      queryClient.setQueryData<SectionResponse[]>(
        ["admin", "sections", grade, sectionFilterStream],
        (previous = []) =>
          previous.filter((s) => s.id !== result.data.section.id)
      );
      toast({
        title: "Section deleted",
        description: `${result.data.section.label} has been removed.`,
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unable to delete section.";
      toast({
        title: "Failed to delete section",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    type: "course" | "section";
    id: string;
    label: string;
  } | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    type: "course" | "section";
    id: string;
  } | null>(null);

  const [editCourseName, setEditCourseName] = useState("");
  const [editIsMandatory, setEditIsMandatory] = useState(false);
  const [editIsCommon, setEditIsCommon] = useState(false);
  const [editFormStream, setEditFormStream] = useState<
    "natural" | "social" | ""
  >("");
  const [editSectionLabel, setEditSectionLabel] = useState("");
  const [editSectionCapacity, setEditSectionCapacity] = useState<string>("");
  const [editSectionStream, setEditSectionStream] = useState<
    "natural" | "social" | ""
  >("");

  const updateCourseMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        name?: string;
        isMandatory?: boolean;
        stream?: "natural" | "social";
        isCommon?: boolean;
      };
    }) => updateCourse(id, payload),
    onSuccess: (result) => {
      queryClient.setQueryData<CourseResponse[]>(
        ["admin", "courses", grade, filterStream],
        (previous = []) =>
          previous.map((c) =>
            c.id === result.data.course.id ? result.data.course : c
          )
      );
      toast({
        title: "Course updated",
        description: `${result.data.course.name} updated.`,
      });
      setEditOpen(false);
      setEditTarget(null);
      setEditFormStream("");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unable to update course.";
      toast({
        title: "Failed to update course",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        label?: string;
        capacity?: number;
        stream?: "natural" | "social";
      };
    }) => updateSection(id, payload),
    onSuccess: (result) => {
      queryClient.setQueryData<SectionResponse[]>(
        ["admin", "sections", grade, sectionFilterStream],
        (previous = []) =>
          previous.map((s) =>
            s.id === result.data.section.id ? result.data.section : s
          )
      );
      toast({
        title: "Section updated",
        description: `${result.data.section.label} updated.`,
      });
      setEditOpen(false);
      setEditTarget(null);
      setEditSectionStream("");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unable to update section.";
      toast({
        title: "Failed to update section",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    try {
      if (confirmTarget.type === "course") {
        await deleteCourseMutation.mutateAsync(confirmTarget.id);
      } else {
        await deleteSectionMutation.mutateAsync(confirmTarget.id);
      }
    } catch (error) {
      // errors handled in mutation onError
    } finally {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  };

  const handleAddCourse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = courseName.trim();

    if (!trimmedName) {
      toast({
        title: "Course name required",
        description: "Provide a course name before submitting.",
        variant: "destructive",
      });
      return;
    }

    const isDuplicateCourse = sortedCourses.some((course) => {
      const sameName =
        course.name.trim().toLowerCase() === trimmedName.toLowerCase();
      if (![11, 12].includes(grade)) return sameName;
      // For senior grades, duplicate if same name and same scope (common or stream-specific)
      if (isCommon) return sameName && !!course.isCommon;
      const sameStream = (course.stream || "") === (formStream || "");
      return sameName && sameStream && !course.isCommon;
    });
    if (isDuplicateCourse) {
      toast({
        title: "Duplicate course",
        description: "This course already exists for the selected grade.",
        variant: "destructive",
      });
      return;
    }

    // For senior grades require either stream OR common (but not both)
    if ([11, 12].includes(grade) && !(formStream || isCommon)) {
      toast({
        title: "Stream or common required",
        description:
          "For Grades 11–12, select a stream or mark the course as common for both streams.",
        variant: "destructive",
      });
      return;
    }
    if ([11, 12].includes(grade) && formStream && isCommon) {
      toast({
        title: "Invalid selection",
        description: "A course cannot be both stream-specific and common.",
        variant: "destructive",
      });
      return;
    }

    createCourseMutation.mutate({
      name: trimmedName,
      isMandatory,
      stream: isCommon ? undefined : formStream || undefined,
      isCommon: isCommon || undefined,
    });
  };

  const handleAddSection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedLabel = sectionLabel.trim();
    const trimmedCapacity = sectionCapacity.trim();

    if (!trimmedLabel) {
      toast({
        title: "Section label required",
        description: "Provide a section label before submitting.",
        variant: "destructive",
      });
      return;
    }

    const isDuplicateSection = sortedSections.some((section) => {
      const sameLabel =
        section.label.trim().toLowerCase() === trimmedLabel.toLowerCase();
      if (![11, 12].includes(grade)) return sameLabel;
      const sameStream = (section.stream || "") === (sectionFormStream || "");
      return sameLabel && sameStream;
    });
    if (isDuplicateSection) {
      toast({
        title: "Duplicate section",
        description: "This section already exists for the selected grade.",
        variant: "destructive",
      });
      return;
    }

    let parsedCapacity: number | undefined;
    if (trimmedCapacity) {
      const numericValue = Number(trimmedCapacity);
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        toast({
          title: "Invalid capacity",
          description: "Capacity must be a positive number.",
          variant: "destructive",
        });
        return;
      }
      parsedCapacity = Math.floor(numericValue);
    }

    // Require stream for sections in grades 11 and 12
    if ([11, 12].includes(grade) && !sectionFormStream) {
      toast({
        title: "Stream required",
        description: "Select a stream for senior grade sections.",
        variant: "destructive",
      });
      return;
    }

    createSectionMutation.mutate({
      label: trimmedLabel,
      capacity: parsedCapacity,
      stream: sectionFormStream || undefined,
    });
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value));
    } catch (error) {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>{GRADE_LABEL[grade]} Courses</CardTitle>
          <CardDescription>
            Add or review the courses offered to learners in this grade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddCourse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`course-name-${grade}`}>Course name</Label>
              <Input
                id={`course-name-${grade}`}
                placeholder="e.g. General Mathematics"
                value={courseName}
                onChange={(event) => setCourseName(event.target.value)}
                disabled={createCourseMutation.isPending}
              />
            </div>
            {[11, 12].includes(grade) && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`course-stream-${grade}`}>Stream</Label>
                  <Select
                    value={formStream}
                    onValueChange={(v: string) => {
                      setFormStream((v as "natural" | "social") || "");
                      if (v) setIsCommon(false);
                    }}
                    disabled={isCommon}
                  >
                    <SelectTrigger id={`course-stream-${grade}`}>
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural">Natural Science</SelectItem>
                      <SelectItem value="social">Social Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id={`course-common-${grade}`}
                    checked={isCommon}
                    onCheckedChange={(checked) => {
                      setIsCommon(checked);
                      if (checked) setFormStream("");
                    }}
                    disabled={createCourseMutation.isPending}
                  />
                  <Label
                    htmlFor={`course-common-${grade}`}
                    className="text-sm text-muted-foreground"
                  >
                    Make this a common course for both streams
                  </Label>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Switch
                id={`course-mandatory-${grade}`}
                checked={isMandatory}
                onCheckedChange={setIsMandatory}
                disabled={createCourseMutation.isPending}
              />
              <Label
                htmlFor={`course-mandatory-${grade}`}
                className="text-sm text-muted-foreground"
              >
                Mark as mandatory course
              </Label>
            </div>
            <Button type="submit" disabled={createCourseMutation.isPending}>
              {createCourseMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving
                </span>
              ) : (
                "Add course"
              )}
            </Button>
          </form>

          {coursesQuery.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {(coursesQuery.error instanceof Error
                  ? coursesQuery.error.message
                  : "Unable to fetch courses.") || "Unable to fetch courses."}
              </AlertDescription>
            </Alert>
          )}

          {/* Stream filter for grades 11 & 12 */}
          {[11, 12].includes(grade) && (
            <div className="mb-4">
              <Label className="text-sm">Filter by stream</Label>
              <div className="w-48 mt-2">
                <Select
                  value={filterStream}
                  onValueChange={(v: string) =>
                    // Map the explicit "all" option back to an empty string
                    // so the Select shows the placeholder (cleared state).
                    setFilterStream(
                      v === "all" ? "" : (v as "natural" | "social")
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All streams" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Use a non-empty sentinel value for the "All" option
            because Select items must not use an empty string. */}
                    <SelectItem value="all">All streams</SelectItem>
                    <SelectItem value="natural">Natural Science</SelectItem>
                    <SelectItem value="social">Social Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="rounded-md border border-dashed border-border">
            {/* Show existing classes for this grade as a reference */}
            <div className="p-4 border-b">
              <h3 className="text-sm font-medium">
                Classes for {GRADE_LABEL[grade]}
              </h3>
              {classesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading classes…
                </p>
              ) : classesForGrade.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No classes available for this grade.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {classesForGrade.map((c) => (
                    <span
                      key={c.classId}
                      className="inline-flex items-center px-2 py-1 rounded bg-muted text-sm"
                    >
                      {c.name ?? c.classId}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Course</TableHead>
                  <TableHead>Mandatory</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead className="text-right">Added</TableHead>
                  <TableHead className="text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coursesQuery.isLoading ? (
                  <TableSkeletonRows rows={3} cols={5} />
                ) : sortedCourses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No courses configured for this grade yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        {course.name}
                      </TableCell>
                      <TableCell>{course.isMandatory ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {course.isCommon
                          ? "Common"
                          : course.stream
                          ? course.stream === "natural"
                            ? "Natural"
                            : "Social"
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDate(course.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // open edit dialog populated with course
                              setEditTarget({ type: "course", id: course.id });
                              setEditCourseName(course.name);
                              setEditIsMandatory(!!course.isMandatory);
                              setEditFormStream(course.stream ?? "");
                              setEditIsCommon(!!course.isCommon);
                              setEditOpen(true);
                            }}
                            disabled={updateCourseMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setConfirmTarget({
                                type: "course",
                                id: course.id,
                                label: course.name,
                              });
                              setConfirmOpen(true);
                            }}
                            disabled={deleteCourseMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>{GRADE_LABEL[grade]} Sections</CardTitle>
          <CardDescription>
            Define class sections and optional capacities for scheduling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddSection} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`section-label-${grade}`}>Section label</Label>
              <Input
                id={`section-label-${grade}`}
                placeholder="e.g. STEM A"
                value={sectionLabel}
                onChange={(event) => setSectionLabel(event.target.value)}
                disabled={createSectionMutation.isPending}
              />
            </div>
            {[11, 12].includes(grade) && (
              <div className="space-y-2">
                <Label htmlFor={`section-stream-${grade}`}>Stream</Label>
                <Select
                  value={sectionFormStream}
                  onValueChange={(v: string) =>
                    setSectionFormStream((v as "natural" | "social") || "")
                  }
                >
                  <SelectTrigger id={`section-stream-${grade}`}>
                    <SelectValue placeholder="Select stream" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural Science</SelectItem>
                    <SelectItem value="social">Social Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor={`section-capacity-${grade}`}>
                Capacity (optional)
              </Label>
              <Input
                id={`section-capacity-${grade}`}
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 35"
                value={sectionCapacity}
                onChange={(event) => setSectionCapacity(event.target.value)}
                disabled={createSectionMutation.isPending}
              />
            </div>
            <Button type="submit" disabled={createSectionMutation.isPending}>
              {createSectionMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving
                </span>
              ) : (
                "Add section"
              )}
            </Button>
          </form>

          {sectionsQuery.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {(sectionsQuery.error instanceof Error
                  ? sectionsQuery.error.message
                  : "Unable to fetch sections.") || "Unable to fetch sections."}
              </AlertDescription>
            </Alert>
          )}

          {/* Stream filter for grades 11 & 12 */}
          {[11, 12].includes(grade) && (
            <div className="mb-4">
              <Label className="text-sm">Filter by stream</Label>
              <div className="w-48 mt-2">
                <Select
                  value={sectionFilterStream}
                  onValueChange={(v: string) =>
                    setSectionFilterStream(
                      v === "all" ? "" : (v as "natural" | "social")
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All streams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All streams</SelectItem>
                    <SelectItem value="natural">Natural Science</SelectItem>
                    <SelectItem value="social">Social Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="rounded-md border border-dashed border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Section</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead className="text-right">Added</TableHead>
                  <TableHead className="text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionsQuery.isLoading ? (
                  <TableSkeletonRows rows={3} cols={5} />
                ) : sortedSections.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No sections configured for this grade yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedSections.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell className="font-medium">
                        {section.label}
                      </TableCell>
                      <TableCell>{section.capacity ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {section.stream
                          ? section.stream === "natural"
                            ? "Natural"
                            : "Social"
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDate(section.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditTarget({
                                type: "section",
                                id: section.id,
                              });
                              setEditSectionLabel(section.label);
                              setEditSectionCapacity(
                                section.capacity?.toString() ?? ""
                              );
                              setEditSectionStream(section.stream ?? "");
                              setEditOpen(true);
                            }}
                            disabled={updateSectionMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setConfirmTarget({
                                type: "section",
                                id: section.id,
                                label: section.label,
                              });
                              setConfirmOpen(true);
                            }}
                            disabled={deleteSectionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialog for deletes */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null);
          }
          setConfirmOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmTarget
                ? `Delete ${
                    confirmTarget.type === "course" ? "course" : "section"
                  } "${confirmTarget.label}"?`
                : "Confirm deletion"}
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Deleting {confirmTarget?.type} will
              remove it from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 w-full justify-end">
              <Button
                variant="ghost"
                onClick={() => setConfirmOpen(false)}
                disabled={
                  confirmTarget?.type === "course"
                    ? deleteCourseMutation.isPending
                    : deleteSectionMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={
                  confirmTarget?.type === "course"
                    ? deleteCourseMutation.isPending
                    : deleteSectionMutation.isPending
                }
              >
                {confirmTarget?.type === "course"
                  ? deleteCourseMutation.isPending
                    ? "Deleting..."
                    : "Delete course"
                  : deleteSectionMutation.isPending
                  ? "Deleting..."
                  : "Delete section"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditFormStream("");
          }
          setEditOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? editTarget.type === "course"
                  ? "Edit course"
                  : "Edit section"
                : "Edit"}
            </DialogTitle>
            <DialogDescription>
              Update details and save changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editTarget?.type === "course" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editTarget) return;
                  const trimmed = editCourseName.trim();
                  if (!trimmed) {
                    toast({
                      title: "Course name required",
                      description: "Provide a course name.",
                      variant: "destructive",
                    });
                    return;
                  }
                  // For senior grades ensure stream XOR common
                  if (
                    [11, 12].includes(grade) &&
                    !(editFormStream || editIsCommon)
                  ) {
                    toast({
                      title: "Stream or common required",
                      description:
                        "For Grades 11–12, select a stream or mark the course as common.",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (
                    [11, 12].includes(grade) &&
                    editFormStream &&
                    editIsCommon
                  ) {
                    toast({
                      title: "Invalid selection",
                      description:
                        "A course cannot be both stream-specific and common.",
                      variant: "destructive",
                    });
                    return;
                  }

                  updateCourseMutation.mutate({
                    id: editTarget.id,
                    payload: {
                      name: trimmed,
                      isMandatory: editIsMandatory,
                      stream: editIsCommon
                        ? undefined
                        : editFormStream || undefined,
                      isCommon: editIsCommon || undefined,
                    },
                  });
                }}
              >
                <div className="space-y-2">
                  <Label>Course name</Label>
                  <Input
                    value={editCourseName}
                    onChange={(e) => setEditCourseName(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Switch
                    checked={editIsMandatory}
                    onCheckedChange={setEditIsMandatory}
                  />
                  <Label className="text-sm text-muted-foreground">
                    Mark as mandatory
                  </Label>
                </div>
                {[11, 12].includes(grade) && (
                  <div className="space-y-3 mt-2">
                    <div className="space-y-2">
                      <Label>Stream</Label>
                      <Select
                        value={editFormStream}
                        onValueChange={(v: string) => {
                          setEditFormStream((v as "natural" | "social") || "");
                          if (v) setEditIsCommon(false);
                        }}
                        disabled={editIsCommon}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stream" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="natural">
                            Natural Science
                          </SelectItem>
                          <SelectItem value="social">Social Science</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editIsCommon}
                        onCheckedChange={(checked) => {
                          setEditIsCommon(checked);
                          if (checked) setEditFormStream("");
                        }}
                      />
                      <Label className="text-sm text-muted-foreground">
                        Make this a common course for both streams
                      </Label>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => setEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    disabled={updateCourseMutation.isPending}
                  >
                    {updateCourseMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            ) : editTarget?.type === "section" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editTarget) return;
                  const trimmed = editSectionLabel.trim();
                  if (!trimmed) {
                    toast({
                      title: "Section label required",
                      description: "Provide a section label.",
                      variant: "destructive",
                    });
                    return;
                  }
                  let parsed: number | undefined = undefined;
                  if (editSectionCapacity.trim()) {
                    const n = Number(editSectionCapacity.trim());
                    if (!Number.isFinite(n) || n <= 0) {
                      toast({
                        title: "Invalid capacity",
                        description: "Capacity must be a positive number.",
                        variant: "destructive",
                      });
                      return;
                    }
                    parsed = Math.floor(n);
                  }
                  if ([11, 12].includes(grade) && !editSectionStream) {
                    toast({
                      title: "Stream required",
                      description: "Select a stream for senior grade sections.",
                      variant: "destructive",
                    });
                    return;
                  }
                  updateSectionMutation.mutate({
                    id: editTarget.id,
                    payload: {
                      label: trimmed,
                      capacity: parsed,
                      stream: editSectionStream || undefined,
                    },
                  });
                }}
              >
                <div className="space-y-2">
                  <Label>Section label</Label>
                  <Input
                    value={editSectionLabel}
                    onChange={(e) => setEditSectionLabel(e.target.value)}
                  />
                </div>
                {[11, 12].includes(grade) && (
                  <div className="space-y-2 mt-2">
                    <Label>Stream</Label>
                    <Select
                      value={editSectionStream}
                      onValueChange={(v: string) =>
                        setEditSectionStream((v as "natural" | "social") || "")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stream" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="natural">Natural Science</SelectItem>
                        <SelectItem value="social">Social Science</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2 mt-2">
                  <Label>Capacity (optional)</Label>
                  <Input
                    type="number"
                    value={editSectionCapacity}
                    onChange={(e) => setEditSectionCapacity(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => setEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    disabled={updateSectionMutation.isPending}
                  >
                    {updateSectionMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            ) : (
              <div />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourseSectionManagement;
