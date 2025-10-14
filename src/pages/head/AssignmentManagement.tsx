import { useState } from "react";
import { ClipboardList, Users, BookOpen, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AssignmentManagement = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"teacher" | "subject" | null>(null);

  const classes = [
    { id: "10a", name: "10A", students: 28, classTeacher: "Ms. Johnson", subjects: 8 },
    { id: "10b", name: "10B", students: 30, classTeacher: "Unassigned", subjects: 7 },
    { id: "11a", name: "11A", students: 30, classTeacher: "Ms. Smith", subjects: 9 },
    { id: "11b", name: "11B", students: 32, classTeacher: "Mr. Davis", subjects: 8 },
    { id: "12a", name: "12A", students: 25, classTeacher: "Dr. Williams", subjects: 10 },
  ];

  const teachers = [
    { id: 1, name: "Ms. Smith", department: "Mathematics", assignedClasses: 3 },
    { id: 2, name: "Mr. Johnson", department: "Science", assignedClasses: 2 },
    { id: 3, name: "Dr. Williams", department: "English", assignedClasses: 4 },
    { id: 4, name: "Ms. Johnson", department: "History", assignedClasses: 2 },
    { id: 5, name: "Mr. Davis", department: "Physical Education", assignedClasses: 3 },
  ];

  const subjectAssignments = [
    { class: "11A", subject: "Mathematics", teacher: "Ms. Smith" },
    { class: "11A", subject: "Physics", teacher: "Mr. Johnson" },
    { class: "11A", subject: "English", teacher: "Dr. Williams" },
    { class: "10A", subject: "Mathematics", teacher: "Ms. Smith" },
    { class: "10A", subject: "History", teacher: "Unassigned" },
  ];

  const unassignedCount = classes.filter((c) => c.classTeacher === "Unassigned").length +
    subjectAssignments.filter((s) => s.teacher === "Unassigned").length;

  const openAssignmentDialog = (type: "teacher" | "subject") => {
    setAssignmentType(type);
    setDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Assignment Management</h1>
        <p className="text-muted-foreground">
          Assign class teachers and subject teachers to classes
        </p>
      </div>

      {/* Alert for unassigned */}
      {unassignedCount > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-foreground">
                  Action Required
                </p>
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Classes</p>
                <p className="text-3xl font-bold text-foreground">{classes.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Teachers</p>
                <p className="text-3xl font-bold text-foreground">{teachers.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary text-accent">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Unassigned</p>
                <p className="text-3xl font-bold text-foreground">{unassignedCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary text-warning">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Teacher Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class Teacher Assignment
            </CardTitle>
            <CardDescription>Assign head class teachers to classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">Class {classItem.name}</p>
                    <Badge variant="outline">{classItem.students} students</Badge>
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
                  {classItem.classTeacher === "Unassigned" ? "Assign" : "Change"}
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
            <CardDescription>Assign subject teachers to classes</CardDescription>
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
                  .filter((s) => s.class === classes.find((c) => c.id === selectedClass)?.name)
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
                        onClick={() => openAssignmentDialog("subject")}
                      >
                        {assignment.teacher === "Unassigned" ? "Assign" : "Change"}
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
          <CardDescription>View all teachers and their current assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <p className="font-medium text-foreground mb-1">{teacher.name}</p>
                <p className="text-sm text-muted-foreground mb-2">{teacher.department}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {teacher.assignedClasses} classes
                  </Badge>
                  <Button variant="ghost" size="sm">
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
              {assignmentType === "teacher" ? "Assign Class Teacher" : "Assign Subject Teacher"}
            </DialogTitle>
            <DialogDescription>
              Select a teacher for this assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Teacher</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
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
            <Button onClick={() => setDialogOpen(false)}>Confirm Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentManagement;
