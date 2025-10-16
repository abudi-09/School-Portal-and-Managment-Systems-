import { useState } from "react";
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

interface ClassScheduleItem {
  day: string;
  period: string;
  time: string;
  class: string;
  subject: string;
  teacher: string;
  room: string;
}

interface ExamScheduleItem {
  id: number;
  date: string;
  time: string;
  class: string;
  subject: string;
  type: string;
  invigilator: string;
  room: string;
}

const ScheduleManagement = () => {
  const [open, setOpen] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    ClassScheduleItem | ExamScheduleItem | null
  >(null);
  const [isEditingExam, setIsEditingExam] = useState(false);

  // Form state for add/edit dialogs
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

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];

  const [classSchedule, setClassSchedule] = useState<ClassScheduleItem[]>([
    {
      day: "Monday",
      period: "1st",
      time: "08:00-09:00",
      class: "11A",
      subject: "Math",
      teacher: "Ms. Smith",
      room: "R-201",
    },
    {
      day: "Monday",
      period: "2nd",
      time: "09:00-10:00",
      class: "10A",
      subject: "English",
      teacher: "Dr. Williams",
      room: "R-105",
    },
    {
      day: "Tuesday",
      period: "1st",
      time: "08:00-09:00",
      class: "12A",
      subject: "Physics",
      teacher: "Mr. Johnson",
      room: "Lab-1",
    },
  ]);

  const [examSchedule, setExamSchedule] = useState<ExamScheduleItem[]>([
    {
      id: 1,
      date: "2024-11-20",
      time: "09:00-11:00",
      class: "11A",
      subject: "Mathematics",
      type: "Mid-Term",
      invigilator: "Ms. Smith",
      room: "Exam Hall A",
    },
    {
      id: 2,
      date: "2024-11-22",
      time: "09:00-11:00",
      class: "10A",
      subject: "English",
      type: "Mid-Term",
      invigilator: "Dr. Williams",
      room: "Exam Hall B",
    },
    {
      id: 3,
      date: "2024-11-25",
      time: "13:00-15:00",
      class: "12A",
      subject: "Physics",
      type: "Mid-Term",
      invigilator: "Mr. Johnson",
      room: "Exam Hall A",
    },
  ]);

  // CRUD functions
  const handleAddClassPeriod = () => {
    const newPeriod: ClassScheduleItem = {
      day: formData.day,
      period: formData.period,
      time: `${formData.startTime}-${formData.endTime}`,
      class: formData.class,
      subject: formData.subject,
      teacher: formData.teacher,
      room: formData.room,
    };
    setClassSchedule([...classSchedule, newPeriod]);
    resetForm();
    setOpen(false);
  };

  const handleAddExam = () => {
    const newExam: ExamScheduleItem = {
      id: Math.max(...examSchedule.map((e) => e.id)) + 1,
      date: formData.date,
      time: `${formData.startTime}-${formData.endTime}`,
      class: formData.class,
      subject: formData.subject,
      type: formData.type,
      invigilator: formData.invigilator,
      room: formData.room,
    };
    setExamSchedule([...examSchedule, newExam]);
    resetForm();
    setExamDialogOpen(false);
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
        room: exam.room,
        date: exam.date,
        type: exam.type,
        invigilator: exam.invigilator,
      });
    } else {
      const cls = item as ClassScheduleItem;
      const [startTime, endTime] = cls.time.split("-");
      setFormData({
        day: cls.day,
        period: cls.period,
        startTime,
        endTime,
        class: cls.class,
        subject: cls.subject,
        teacher: cls.teacher,
        room: cls.room,
        date: "",
        type: "",
        invigilator: "",
      });
    }
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (isEditingExam) {
      const updatedExam: ExamScheduleItem = {
        ...(editingItem as ExamScheduleItem),
        date: formData.date,
        time: `${formData.startTime}-${formData.endTime}`,
        class: formData.class,
        subject: formData.subject,
        type: formData.type,
        invigilator: formData.invigilator,
        room: formData.room,
      };
      setExamSchedule(
        examSchedule.map((exam) =>
          exam.id === updatedExam.id ? updatedExam : exam
        )
      );
    } else {
      const updatedClass: ClassScheduleItem = {
        ...(editingItem as ClassScheduleItem),
        day: formData.day,
        period: formData.period,
        time: `${formData.startTime}-${formData.endTime}`,
        class: formData.class,
        subject: formData.subject,
        teacher: formData.teacher,
        room: formData.room,
      };
      setClassSchedule(
        classSchedule.map((cls, index) =>
          index === classSchedule.indexOf(editingItem as ClassScheduleItem)
            ? updatedClass
            : cls
        )
      );
    }
    resetForm();
    setEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (
    item: ClassScheduleItem | ExamScheduleItem,
    isExam: boolean
  ) => {
    if (isExam) {
      setExamSchedule(
        examSchedule.filter((exam) => exam.id !== (item as ExamScheduleItem).id)
      );
    } else {
      setClassSchedule(classSchedule.filter((cls) => cls !== item));
    }
  };

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
          <div className="flex justify-end">
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
              <DialogContent>
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
                          setFormData({ ...formData, endTime: e.target.value })
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
                        <SelectItem value="10A">10A</SelectItem>
                        <SelectItem value="10B">10B</SelectItem>
                        <SelectItem value="11A">11A</SelectItem>
                        <SelectItem value="11B">11B</SelectItem>
                        <SelectItem value="12A">12A</SelectItem>
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
                        <SelectItem value="Ms. Smith">Ms. Smith</SelectItem>
                        <SelectItem value="Mr. Johnson">Mr. Johnson</SelectItem>
                        <SelectItem value="Dr. Williams">
                          Dr. Williams
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Input
                      placeholder="Enter room number"
                      value={formData.room}
                      onChange={(e) =>
                        setFormData({ ...formData, room: e.target.value })
                      }
                    />
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
                  {classSchedule.map((schedule, index) => (
                    <TableRow key={index}>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exam" className="space-y-6">
          <div className="flex justify-end">
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
              <DialogContent>
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
                          setFormData({ ...formData, endTime: e.target.value })
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
                        <SelectItem value="10A">10A</SelectItem>
                        <SelectItem value="10B">10B</SelectItem>
                        <SelectItem value="11A">11A</SelectItem>
                        <SelectItem value="11B">11B</SelectItem>
                        <SelectItem value="12A">12A</SelectItem>
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
                      <SelectContent>
                        <SelectItem value="Ms. Smith">Ms. Smith</SelectItem>
                        <SelectItem value="Mr. Johnson">Mr. Johnson</SelectItem>
                        <SelectItem value="Dr. Williams">
                          Dr. Williams
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Input
                      placeholder="Enter room number"
                      value={formData.room}
                      onChange={(e) =>
                        setFormData({ ...formData, room: e.target.value })
                      }
                    />
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
                  {examSchedule.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.date}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
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
                    <SelectContent>
                      <SelectItem value="Ms. Smith">Ms. Smith</SelectItem>
                      <SelectItem value="Mr. Johnson">Mr. Johnson</SelectItem>
                      <SelectItem value="Dr. Williams">Dr. Williams</SelectItem>
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
                      <SelectItem value="Ms. Smith">Ms. Smith</SelectItem>
                      <SelectItem value="Mr. Johnson">Mr. Johnson</SelectItem>
                      <SelectItem value="Dr. Williams">Dr. Williams</SelectItem>
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
                  <SelectItem value="10A">10A</SelectItem>
                  <SelectItem value="10B">10B</SelectItem>
                  <SelectItem value="11A">11A</SelectItem>
                  <SelectItem value="11B">11B</SelectItem>
                  <SelectItem value="12A">12A</SelectItem>
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
              <Input
                placeholder="Enter room number"
                value={formData.room}
                onChange={(e) =>
                  setFormData({ ...formData, room: e.target.value })
                }
              />
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
