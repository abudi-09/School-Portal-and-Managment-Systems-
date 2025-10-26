import { useEffect, useMemo, useState } from "react";
import {
  Save,
  Send,
  Download,
  Users,
  Plus,
  Pencil,
  Trash2,
  Info,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import TablePagination from "@/components/shared/TablePagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  addTeacherColumn,
  deleteTeacherColumn,
  editTeacherColumn,
  getTeacherAssignments,
  getTeacherSheet,
  submitGradeSheet,
  updateTeacherScore,
  type GradeColumn,
  type TeacherSheetView,
} from "@/lib/grades/workflowStore";

const TEACHER_ID = "teacher-math";

type AssignmentOption = {
  key: string;
  label: string;
  status: "draft" | "submitted" | "approved";
};

const TeacherGrades = () => {
  const [assignments, setAssignments] = useState(() =>
    getTeacherAssignments(TEACHER_ID)
  );
  const [selectedKey, setSelectedKey] = useState(() =>
    assignments.length
      ? `${assignments[0].classId}|${assignments[0].subjectId}`
      : ""
  );
  const [sheetView, setSheetView] = useState<TeacherSheetView | null>(() => {
    if (!assignments.length) return null;
    const first = assignments[0];
    return getTeacherSheet(TEACHER_ID, first.classId, first.subjectId);
  });

  const [addOpen, setAddOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColMax, setNewColMax] = useState("100");

  const [editOpen, setEditOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<GradeColumn | null>(null);
  const [editName, setEditName] = useState("");
  const [editMax, setEditMax] = useState("100");

  const [deleteCol, setDeleteCol] = useState<GradeColumn | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!selectedKey) {
      setSheetView(null);
      return;
    }
    const [classId, subjectId] = selectedKey.split("|");
    if (!classId || !subjectId) return;
    const next = getTeacherSheet(TEACHER_ID, classId, subjectId);
    setSheetView(next);
  }, [selectedKey]);

  const refreshAssignments = () => {
    setAssignments(getTeacherAssignments(TEACHER_ID));
  };

  const assignmentOptions: AssignmentOption[] = useMemo(
    () =>
      assignments.map((item) => ({
        key: `${item.classId}|${item.subjectId}`,
        label: `${item.className} • ${item.subjectName}`,
        status: item.status,
      })),
    [assignments]
  );

  const students = sheetView?.students ?? [];
  const columns = sheetView?.columns ?? [];
  const scores = sheetView?.scores ?? {};
  const status = sheetView?.status ?? "draft";
  const isLocked = status !== "draft";
  const completionPercentage = sheetView?.completion ?? 0;
  const totalPages = Math.max(1, Math.ceil(students.length / 6));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedStudents = students.slice((page - 1) * 6, page * 6);

  const statusBadgeVariant =
    status === "approved"
      ? "default"
      : status === "submitted"
      ? "secondary"
      : "outline";

  const handleScoreChange = (
    studentId: string,
    columnId: string,
    rawValue: string
  ) => {
    if (!sheetView) return;
    const parsed = rawValue === "" ? "" : Number(rawValue);
    const updated = updateTeacherScore({
      sheetId: sheetView.sheetId,
      studentId,
      columnId,
      value: parsed,
    });
    if (updated) {
      setSheetView(updated);
      refreshAssignments();
    }
  };

  const handleAddColumn = () => {
    if (!sheetView) return;
    const name = newColName.trim();
    const maxValue = Number(newColMax);
    if (!name) return;
    if (!Number.isFinite(maxValue) || maxValue <= 0) return;
    const updated = addTeacherColumn({
      sheetId: sheetView.sheetId,
      name,
      maxScore: maxValue,
    });
    if (updated) {
      setSheetView(updated);
      setAddOpen(false);
      setNewColName("");
      setNewColMax("100");
      refreshAssignments();
    }
  };

  const handleSaveEdit = () => {
    if (!sheetView || !editingCol) return;
    const name = editName.trim();
    const maxValue = Number(editMax);
    if (!name) return;
    if (!Number.isFinite(maxValue) || maxValue <= 0) return;
    const updated = editTeacherColumn({
      sheetId: sheetView.sheetId,
      columnId: editingCol.id,
      name,
      maxScore: maxValue,
    });
    if (updated) {
      setSheetView(updated);
      setEditOpen(false);
      setEditingCol(null);
      refreshAssignments();
    }
  };

  const handleConfirmDelete = () => {
    if (!sheetView || !deleteCol) return;
    const updated = deleteTeacherColumn({
      sheetId: sheetView.sheetId,
      columnId: deleteCol.id,
    });
    if (updated) {
      setSheetView(updated);
      refreshAssignments();
    }
    setDeleteCol(null);
  };

  const handleSubmit = () => {
    if (!sheetView) return;
    const updated = submitGradeSheet(sheetView.sheetId);
    if (updated) {
      setSheetView(updated);
      refreshAssignments();
    }
  };

  const handleSaveDraft = () => {
    if (!selectedKey) return;
    const [classId, subjectId] = selectedKey.split("|");
    const refreshed = getTeacherSheet(TEACHER_ID, classId, subjectId);
    setSheetView(refreshed);
  };

  const getStudentTotal = (studentId: string) => {
    if (!sheetView) return 0;
    return sheetView.totals[studentId] ?? 0;
  };

  const getStudentAverage = (studentId: string) => {
    if (!sheetView) return 0;
    return sheetView.averages[studentId] ?? 0;
  };

  const lockMessage = sheetView?.lockReason;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Grade Management
          </h1>
          <p className="text-muted-foreground">
            Add evaluation columns, enter scores, and submit your subject grade
            sheet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" disabled>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleSaveDraft}
            disabled={!sheetView}
          >
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button
            className="gap-2"
            onClick={handleSubmit}
            disabled={!sheetView || isLocked || completionPercentage < 100}
          >
            <Send className="h-4 w-4" /> Submit for Review
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Grading Status
                </p>
                <Badge variant={statusBadgeVariant} className="capitalize">
                  {status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {students.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <Users className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-sm font-medium">{completionPercentage}%</p>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grading Workflow</CardTitle>
              <CardDescription>
                Select a class and subject to manage the grade sheet
              </CardDescription>
            </div>
            <Select value={selectedKey} onValueChange={setSelectedKey}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select class & subject" />
              </SelectTrigger>
              <SelectContent>
                {assignmentOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === "draft" ||
                    status === "submitted" ||
                    status === "approved"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Teacher Entry</p>
                  <p className="text-xs text-muted-foreground">Input scores</p>
                </div>
              </div>
              <div className="flex-1 h-0.5 bg-border mx-4" />

              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === "submitted" || status === "approved"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">Head Class Review</p>
                  <p className="text-xs text-muted-foreground">
                    Verification & ranking
                  </p>
                </div>
              </div>
              <div className="flex-1 h-0.5 bg-border mx-4" />

              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === "approved"
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  ✓
                </div>
                <div>
                  <p className="font-medium text-sm">Published</p>
                  <p className="text-xs text-muted-foreground">
                    Visible to students
                  </p>
                </div>
              </div>
            </div>

            {status === "draft" && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  Complete grade entry and submit for Head Class Teacher review.
                </p>
              </div>
            )}
            {status === "submitted" && (
              <div className="p-3 rounded-lg bg-secondary border">
                <p className="text-sm text-muted-foreground">
                  Grade sheet submitted and locked. Awaiting head-of-class
                  processing.
                </p>
              </div>
            )}
            {status === "approved" && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-success">
                  Class results are final. Students can view their ranks.
                </p>
              </div>
            )}
            {lockMessage && (
              <div className="flex items-center gap-3 rounded-md border border-border p-3 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>{lockMessage}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Student Grades</CardTitle>
              <CardDescription>
                Manage evaluation columns and student scores for this subject.
              </CardDescription>
            </div>
            <Button
              className="gap-2"
              onClick={() => setAddOpen(true)}
              disabled={isLocked || !sheetView}
            >
              <Plus className="h-4 w-4" /> Add Column
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Student Name</TableHead>
                  {columns.map((col) => (
                    <TableHead
                      key={col.id}
                      className="text-center align-middle"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>
                          {col.name} ({col.maxScore})
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingCol(col);
                            setEditName(col.name);
                            setEditMax(String(col.maxScore));
                            setEditOpen(true);
                          }}
                          disabled={isLocked}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteCol(col)}
                          disabled={isLocked}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Subject Score</TableHead>
                  <TableHead className="text-center">Average (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedStudents.map((student, idx) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {idx + 1 + (page - 1) * 6}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.rollNo}
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.id} className="text-center">
                        <Input
                          type="number"
                          className="w-24 text-center"
                          min={0}
                          max={col.maxScore}
                          value={
                            scores[student.id]?.[col.id] === null ||
                            scores[student.id]?.[col.id] === undefined
                              ? ""
                              : scores[student.id]?.[col.id]
                          }
                          onChange={(event) =>
                            handleScoreChange(
                              student.id,
                              col.id,
                              event.target.value
                            )
                          }
                          disabled={isLocked}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold">
                      {getStudentTotal(student.id)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          getStudentAverage(student.id) >= 85
                            ? "default"
                            : "secondary"
                        }
                      >
                        {getStudentAverage(student.id).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="pt-4">
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Evaluation Column</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Evaluation Name</Label>
              <Input
                value={newColName}
                onChange={(event) => setNewColName(event.target.value)}
                placeholder="e.g., Quiz, Project, Mid Exam"
                disabled={isLocked}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Score</Label>
              <Input
                type="number"
                min={1}
                value={newColMax}
                onChange={(event) => setNewColMax(event.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleAddColumn} disabled={isLocked}>
              Add
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Evaluation Name</Label>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Score</Label>
              <Input
                type="number"
                min={1}
                value={editMax}
                onChange={(event) => setEditMax(event.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSaveEdit} disabled={isLocked}>
              Save
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteCol}
        onOpenChange={(open) => !open && setDeleteCol(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this column?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the column "{deleteCol?.name}" and
              remove its scores? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={isLocked}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeacherGrades;
