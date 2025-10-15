import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Timetable = () => {
  const [permissionReason, setPermissionReason] = useState("");
  const [permissionDate, setPermissionDate] = useState("");

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

  const permissions = [
    {
      id: 1,
      date: "2025-10-10",
      reason: "Medical appointment",
      status: "approved",
    },
    {
      id: 2,
      date: "2025-10-08",
      reason: "Family emergency",
      status: "pending",
    },
  ];

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      Mathematics: "bg-blue-500/10 text-blue-700 border-blue-200",
      Physics: "bg-purple-500/10 text-purple-700 border-purple-200",
      Chemistry: "bg-green-500/10 text-green-700 border-green-200",
      English: "bg-amber-500/10 text-amber-700 border-amber-200",
      History: "bg-red-500/10 text-red-700 border-red-200",
      "Computer Science": "bg-teal-500/10 text-teal-700 border-teal-200",
      "Physical Education": "bg-orange-500/10 text-orange-700 border-orange-200",
      Art: "bg-pink-500/10 text-pink-700 border-pink-200",
      Music: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
    };
    return colors[subject] || "bg-gray-500/10 text-gray-700 border-gray-200";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Timetable</h1>
          <p className="text-muted-foreground mt-1">
            Your class and exam schedule
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" className="gap-2">
              <FileText className="h-4 w-4" />
              Request Permission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Absence Permission</DialogTitle>
              <DialogDescription>
                Submit a request to be absent from class
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Select value={permissionDate} onValueChange={setPermissionDate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-10-14">October 14, 2025</SelectItem>
                    <SelectItem value="2025-10-15">October 15, 2025</SelectItem>
                    <SelectItem value="2025-10-16">October 16, 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for absence..."
                  value={permissionReason}
                  onChange={(e) => setPermissionReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button className="w-full">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="class" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="class">Class Schedule</TabsTrigger>
          <TabsTrigger value="exam">Exam Schedule</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {/* Class Schedule */}
        <TabsContent value="class" className="space-y-6">
          {weekSchedule.map((day) => (
            <Card key={day.day}>
              <CardHeader>
                <CardTitle>{day.day}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {day.classes.map((classItem, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getSubjectColor(classItem.subject)}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{classItem.subject}</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{classItem.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{classItem.room}</span>
                            </div>
                            <p className="text-muted-foreground">{classItem.teacher}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Exam Schedule */}
        <TabsContent value="exam" className="space-y-4">
          {examSchedule.map((exam, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
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
                  <Badge variant="secondary">{exam.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{exam.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{exam.room}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Permissions */}
        <TabsContent value="permissions" className="space-y-4">
          {permissions.map((permission) => (
            <Card key={permission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      {new Date(permission.date).toLocaleDateString()}
                    </CardTitle>
                    <CardDescription>{permission.reason}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      permission.status === "approved"
                        ? "default"
                        : permission.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {permission.status}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Timetable;
