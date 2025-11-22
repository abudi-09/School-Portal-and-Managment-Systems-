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
  CheckCircle2,
  Circle,
  Lock,
  FileSpreadsheet,
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
  DialogFooter,
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
import { PageHeader, StatCard, EmptyState } from "@/components/patterns";
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
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Grade Management"
        description="Add evaluation columns, enter scores, and submit your subject grade sheet."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={!sheetView}
            >
              <Save className="h-4 w-4 mr-2" /> Save Draft
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!sheetView || isLocked || completionPercentage < 100}
            >
              <Send className="h-4 w-4 mr-2" /> Submit
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Grading Status"
          value={status}
          icon={status === "approved" ? CheckCircle2 : status === "submitted" ? Lock : FileSpreadsheet}
          variant={status === "approved" ? "success" : status === "submitted" ? "info" : "default"}
          className="capitalize"
        />
        <StatCard
          label="Total Students"
          value={students.length}
          icon={Users}
          variant="default"
        />
        <Card>
          <CardContent className="p-6 flex flex-col justify-center h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Completion</span>
              <span className="text-lg font-bold">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Workflow & Selection */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Grading Workflow</CardTitle>
              <CardDescription>Select a class and subject to manage</CardDescription>
            </div>
            <Select value={selectedKey} onValueChange={setSelectedKey}>
              <SelectTrigger className="w-full md:w-72">
                <SelectValue placeholder="Select class & subject" />
              </SelectTrigger>
              <SelectContent>
                {assignmentOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{option.label}</span>
                      <Badge variant="outline" className="text-[10px] h-5 capitalize">
                        {option.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative flex items-center justify-between w-full max-w-3xl mx-auto py-6">
            {/* Progress Line */}
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-muted -z-10" />
            
            {/* Steps */}
            {[
              { id: 1, label: "Teacher Entry", desc: "Input scores", active: true },
              { id: 2, label: "Head Review", desc: "Verification", active: status !== "draft" },
              { id: 3, label: "Published", desc: "Visible to students", active: status === "approved" },
            ].map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center bg-background px-2">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    step.active
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-muted text-muted-foreground"
                  }`}
                >
                  {idx === 2 && step.active ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                </div>
                <p className="mt-2 text-sm font-medium">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Status Messages */}
          {status === "draft" && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Complete grade entry and submit for Head Class Teacher review.
            </div>
          )}
          {status === "submitted" && (
            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-sm flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Grade sheet submitted and locked. Awaiting head-of-class processing.
            </div>
          )}
          {status === "approved" && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Class results are final. Students can view their ranks.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Sheet */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Grades</CardTitle>
              <CardDescription>Manage scores for {sheetView?.className} - {sheetView?.subjectName}</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              disabled={isLocked || !sheetView}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Column
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!sheetView ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="No Sheet Selected"
              description="Please select a class and subject to view grades."
            />
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Student</TableHead>
                      {columns.map((col) => (
                        <TableHead key={col.id} className="text-center min-w-[120px]">
                          <div className="flex flex-col items-center gap-1 py-2">
                            <span className="font-semibold text-foreground">{col.name}</span>
                            <span className="text-xs font-normal text-muted-foreground">Max: {col.maxScore}</span>
                            {!isLocked && (
                              <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setEditingCol(col);
                                    setEditName(col.name);
                                    setEditMax(String(col.maxScore));
                                    setEditOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteCol(col)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-bold bg-muted/30 w-24">Total</TableHead>
                      <TableHead className="text-center font-bold bg-muted/30 w-24">Avg %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedStudents.map((student, idx) => (
                      <TableRow key={student.id}>
                        <TableCell className="text-center text-muted-foreground">
                          {idx + 1 + (page - 1) * 6}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                          </div>
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col.id} className="text-center p-2">
                            <Input
                              type="number"
                              className="w-20 text-center mx-auto h-9"
                              min={0}
                              max={col.maxScore}
                              value={scores[student.id]?.[col.id] ?? ""}
                              onChange={(e) => handleScoreChange(student.id, col.id, e.target.value)}
                              disabled={isLocked}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold bg-muted/10">
                          {getStudentTotal(student.id)}
                        </TableCell>
                        <TableCell className="text-center bg-muted/10">
                          <Badge
                            variant={getStudentAverage(student.id) >= 85 ? "success" : "secondary"}
                          >
                            {getStudentAverage(student.id).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4">
                <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Evaluation Column</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Evaluation Name</Label>
              <Input
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g., Quiz 1, Midterm"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Score</Label>
              <Input
                type="number"
                min={1}
                value={newColMax}
                onChange={(e) => setNewColMax(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddColumn}>Add Column</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Evaluation Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Score</Label>
              <Input
                type="number"
                min={1}
                value={editMax}
                onChange={(e) => setEditMax(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCol} onOpenChange={(open) => !open && setDeleteCol(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCol?.name}"? All entered scores for this column will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
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
