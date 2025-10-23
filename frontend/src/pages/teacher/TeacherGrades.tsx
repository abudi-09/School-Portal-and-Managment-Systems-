import { useMemo, useState, useEffect } from "react";
import {
  Save,
  Send,
  Download,
  Users,
  Plus,
  Pencil,
  Trash2,
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

const TeacherGrades = () => {
  const [selectedClass, setSelectedClass] = useState("11a");
  const [status, setStatus] = useState<
    "draft" | "submitted" | "verified" | "approved"
  >("draft");
  // ----- Dynamic Columns and Grades (local state only) -----
  type Column = { id: string; name: string; maxScore: number };
  type ScoreValue = number | ""; // empty string when unset for nicer input UX
  type StudentRow = { id: number; name: string; rollNo: string };

  const initialStudents: StudentRow[] = [
    { id: 1, name: "John Smith", rollNo: "11A-001" },
    { id: 2, name: "Emma Wilson", rollNo: "11A-002" },
    { id: 3, name: "Michael Brown", rollNo: "11A-003" },
    { id: 4, name: "Sarah Davis", rollNo: "11A-004" },
  ];

  // Start with three standard columns
  const [columns, setColumns] = useState<Column[]>([
    { id: "col_test", name: "Test", maxScore: 100 },
    { id: "col_exam", name: "Exam", maxScore: 100 },
    { id: "col_assignment", name: "Assignment", maxScore: 100 },
  ]);

  // Grades per student per column
  const [scores, setScores] = useState<
    Record<number, Record<string, ScoreValue>>
  >(() => {
    const map: Record<number, Record<string, ScoreValue>> = {};
    for (const s of initialStudents) {
      map[s.id] = { col_test: 85, col_exam: 92, col_assignment: 88 };
    }
    return map;
  });

  const students: StudentRow[] = initialStudents;

  // Derived totals and averages per student
  const colMaxTotal = useMemo(
    () => columns.reduce((sum, c) => sum + (Number(c.maxScore) || 0), 0),
    [columns]
  );

  const getStudentTotal = (studentId: number) => {
    const row = scores[studentId] || {};
    return columns.reduce((sum, c) => {
      const v = row[c.id];
      return sum + (typeof v === "number" ? v : 0);
    }, 0);
  };

  const getStudentAveragePct = (studentId: number) => {
    const total = getStudentTotal(studentId);
    const denom = colMaxTotal || 1;
    return (total / denom) * 100;
  };

  // Add Column dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColMax, setNewColMax] = useState("100");

  const addColumn = () => {
    const name = newColName.trim();
    const max = Number(newColMax);
    if (!name) return;
    if (!Number.isFinite(max) || max <= 0) return;
    const id = `col_${Math.random().toString(36).slice(2, 9)}`;
    const col: Column = { id, name, maxScore: max };
    setColumns((prev) => [...prev, col]);
    setScores((prev) => {
      const next = { ...prev };
      for (const s of students) {
        next[s.id] = { ...(next[s.id] || {}), [id]: "" };
      }
      return next;
    });
    setAddOpen(false);
    setNewColName("");
    setNewColMax("100");
  };

  // Edit Column dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<Column | null>(null);
  const [editName, setEditName] = useState("");
  const [editMax, setEditMax] = useState("100");

  const startEdit = (col: Column) => {
    setEditingCol(col);
    setEditName(col.name);
    setEditMax(String(col.maxScore));
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editingCol) return;
    const name = editName.trim();
    const max = Number(editMax);
    if (!name) return;
    if (!Number.isFinite(max) || max <= 0) return;
    setColumns((prev) =>
      prev.map((c) =>
        c.id === editingCol.id ? { ...c, name, maxScore: max } : c
      )
    );
    setEditOpen(false);
    setEditingCol(null);
  };

  // Delete Column confirm state
  const [deleteCol, setDeleteCol] = useState<Column | null>(null);
  const confirmDelete = () => {
    if (!deleteCol) return;
    const id = deleteCol.id;
    setColumns((prev) => prev.filter((c) => c.id !== id));
    setScores((prev) => {
      const next: typeof prev = {};
      for (const sId of Object.keys(prev)) {
        const row = { ...prev[Number(sId)] };
        delete row[id];
        next[Number(sId)] = row;
      }
      return next;
    });
    setDeleteCol(null);
  };

  // Pagination for grades table
  const ROWS_PER_PAGE = 6;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(students.length / ROWS_PER_PAGE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const pagedStudents = students.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  const completionPercentage = 75;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Grade Management
          </h1>
          <p className="text-muted-foreground">
            Enter and manage student grades for your classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button className="gap-2">
            <Send className="h-4 w-4" />
            Submit for Review
          </Button>
        </div>
      </div>

      {/* Stats and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Grading Status
                </p>
                <Badge
                  variant={
                    status === "approved"
                      ? "default"
                      : status === "submitted"
                      ? "secondary"
                      : "outline"
                  }
                  className="capitalize"
                >
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

      {/* Grading Workflow Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grading Workflow</CardTitle>
              <CardDescription>
                Track the approval process for grades
              </CardDescription>
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10a">10A - Mathematics</SelectItem>
                <SelectItem value="11a">11A - Mathematics</SelectItem>
                <SelectItem value="11b">11B - Mathematics</SelectItem>
                <SelectItem value="12a">12A - Mathematics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === "draft" ||
                    status === "submitted" ||
                    status === "verified" ||
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
                    status === "submitted" ||
                    status === "verified" ||
                    status === "approved"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">Head Class Review</p>
                  <p className="text-xs text-muted-foreground">
                    Verify & calculate
                  </p>
                </div>
              </div>
              <div className="flex-1 h-0.5 bg-border mx-4" />

              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === "verified" || status === "approved"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Head Approval</p>
                  <p className="text-xs text-muted-foreground">Final review</p>
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

            {/* Status Message */}
            {status === "draft" && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  Complete grade entry and submit for Head Class Teacher review
                </p>
              </div>
            )}
            {status === "submitted" && (
              <div className="p-3 rounded-lg bg-secondary border">
                <p className="text-sm text-muted-foreground">
                  Grades submitted - waiting for Head Class Teacher verification
                </p>
              </div>
            )}
            {status === "verified" && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-accent">
                  Verified by Head Class Teacher - awaiting Head of School
                  approval
                </p>
              </div>
            )}
            {status === "approved" && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-success">
                  Grades approved and published - now visible to students
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grades Table (Dynamic Columns) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Student Grades</CardTitle>
              <CardDescription>
                Create, rename, and delete evaluation columns. Scores update
                totals automatically.
              </CardDescription>
            </div>
            <Button className="gap-2" onClick={() => setAddOpen(true)}>
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
                          onClick={() => startEdit(col)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteCol(col)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Average (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
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
                          value={scores[student.id]?.[col.id] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setScores((prev) => {
                              const cur = { ...(prev[student.id] || {}) };
                              // store number if numeric else empty string
                              const n = Number(val);
                              cur[col.id] =
                                val === ""
                                  ? ""
                                  : Number.isFinite(n)
                                  ? Math.max(0, Math.min(n, col.maxScore))
                                  : "";
                              return { ...prev, [student.id]: cur };
                            });
                          }}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold">
                      {getStudentTotal(student.id)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          getStudentAveragePct(student.id) >= 85
                            ? "default"
                            : "secondary"
                        }
                      >
                        {getStudentAveragePct(student.id).toFixed(1)}%
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

      {/* Add Column Modal */}
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
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g., Quiz, Project, Mid Exam"
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
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={addColumn}>Add</Button>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Column Modal */}
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
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={saveEdit} disabled={!editingCol}>
              Save
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Column Confirmation */}
      <AlertDialog
        open={!!deleteCol}
        onOpenChange={(open) => !open && setDeleteCol(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this column?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the column "{deleteCol?.name}" and
              all scores under it? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
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
