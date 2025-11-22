import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/patterns";
import { EmptyState } from "@/components/patterns";

const Timetable = () => {
  const [permissionReason, setPermissionReason] = useState("");
  const [permissionDate, setPermissionDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const weekSchedule = [
    {
      day: "Monday",
      classes: [
        { time: "08:00 - 09:30", subject: "Mathematics", teacher: "Mr. Johnson", room: "Room 301" },
        { time: "09:45 - 11:15", subject: "Physics", teacher: "Dr. Smith", room: "Lab 101" },
        { time: "11:30 - 13:00", subject: "English", teacher: "Ms. Davis", room: "Room 205" },
        { time: "14:00 - 15:30", subject: "History", teacher: "Mr. Brown", room: "Room 402" },
      ],
    },
    {
      day: "Tuesday",
      classes: [
        { time: "08:00 - 09:30", subject: "Chemistry", teacher: "Dr. Wilson", room: "Lab 102" },
        { time: "09:45 - 11:15", subject: "Mathematics", teacher: "Mr. Johnson", room: "Room 301" },
        { time: "11:30 - 13:00", subject: "Physical Education", teacher: "Coach Martinez", room: "Gym" },
        { time: "14:00 - 15:30", subject: "Computer Science", teacher: "Ms. Lee", room: "Lab 201" },
      ],
    },
    {
      day: "Wednesday",
      classes: [
        { time: "08:00 - 09:30", subject: "English", teacher: "Ms. Davis", room: "Room 205" },
        { time: "09:45 - 11:15", subject: "Physics", teacher: "Dr. Smith", room: "Lab 101" },
        { time: "11:30 - 13:00", subject: "Mathematics", teacher: "Mr. Johnson", room: "Room 301" },
        { time: "14:00 - 15:30", subject: "Art", teacher: "Ms. Garcia", room: "Art Studio" },
      ],
    },
    {
      day: "Thursday",
      classes: [
        { time: "08:00 - 09:30", subject: "History", teacher: "Mr. Brown", room: "Room 402" },
        { time: "09:45 - 11:15", subject: "Chemistry", teacher: "Dr. Wilson", room: "Lab 102" },
        { time: "11:30 - 13:00", subject: "Computer Science", teacher: "Ms. Lee", room: "Lab 201" },
        { time: "14:00 - 15:30", subject: "Physics", teacher: "Dr. Smith", room: "Lab 101" },
      ],
    },
    {
      day: "Friday",
      classes: [
        { time: "08:00 - 09:30", subject: "Mathematics", teacher: "Mr. Johnson", room: "Room 301" },
        { time: "09:45 - 11:15", subject: "English", teacher: "Ms. Davis", room: "Room 205" },
        { time: "11:30 - 13:00", subject: "Music", teacher: "Mr. Taylor", room: "Music Room" },
        { time: "14:00 - 15:30", subject: "Chemistry", teacher: "Dr. Wilson", room: "Lab 102" },
      ],
    },
  ];

  const examSchedule = [
    {
      subject: "Mathematics",
      date: "2025-10-20",
      time: "09:00 - 11:00",
      room: "Hall A",
      type: "Midterm",
    },
    {
      subject: "Physics",
      date: "2025-10-22",
      time: "09:00 - 11:00",
      room: "Hall B",
      type: "Midterm",
    },
    {
      subject: "Chemistry",
      date: "2025-10-24",
      time: "09:00 - 11:00",
      room: "Hall A",
      type: "Midterm",
    },
    {
      subject: "English",
      date: "2025-10-26",
      time: "14:00 - 16:00",
      room: "Hall C",
      type: "Midterm",
    },
    {
      subject: "History",
      date: "2025-10-28",
      time: "14:00 - 16:00",
      room: "Hall B",
      type: "Midterm",
    },
  ];

  const handleSubmitPermission = () => {
    // TODO: Implement permission request submission
    console.log("Permission request:", { permissionDate, permissionReason });
    setDialogOpen(false);
    setPermissionReason("");
    setPermissionDate("");
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Timetable & Schedule"
        description="View your class schedule, exam dates, and request absence permissions"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Request Permission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Absence Permission</DialogTitle>
                <DialogDescription>
                  Submit a request to be absent from class. Your request will be reviewed by your teacher.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Select value={permissionDate} onValueChange={setPermissionDate}>
                    <SelectTrigger id="date">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025-10-20">October 20, 2025</SelectItem>
                      <SelectItem value="2025-10-21">October 21, 2025</SelectItem>
                      <SelectItem value="2025-10-22">October 22, 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why you need to be absent..."
                    value={permissionReason}
                    onChange={(e) => setPermissionReason(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitPermission}
                  disabled={!permissionDate || !permissionReason.trim()}
                >
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Tabs */}
      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedule">Class Schedule</TabsTrigger>
          <TabsTrigger value="exams">Exam Schedule</TabsTrigger>
        </TabsList>

        {/* Class Schedule */}
        <TabsContent value="schedule" className="space-y-4">
          {weekSchedule.map((day) => (
            <Card key={day.day}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {day.day}
                </CardTitle>
                <CardDescription>{day.classes.length} classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {day.classes.map((classItem, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[120px]">
                        <Clock className="h-4 w-4" />
                        <span>{classItem.time}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{classItem.subject}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {classItem.teacher}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                        <MapPin className="h-4 w-4" />
                        <span>{classItem.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Exam Schedule */}
        <TabsContent value="exams" className="space-y-4">
          {examSchedule.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <EmptyState
                  icon={CalendarIcon}
                  title="No upcoming exams"
                  description="Exam schedules will appear here when they are announced."
                />
              </CardContent>
            </Card>
          ) : (
            examSchedule.map((exam, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {exam.subject}
                      </CardTitle>
                      <CardDescription>
                        {new Date(exam.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">{exam.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{exam.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{exam.room}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Timetable;
