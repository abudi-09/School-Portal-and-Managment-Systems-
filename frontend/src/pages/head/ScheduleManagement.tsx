import { useState } from "react";
import { Calendar, Clock, Plus, FileDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const ScheduleManagement = () => {
  const [open, setOpen] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];

  const classSchedule = [
    { day: "Monday", period: "1st", time: "08:00-09:00", class: "11A", subject: "Math", teacher: "Ms. Smith", room: "R-201" },
    { day: "Monday", period: "2nd", time: "09:00-10:00", class: "10A", subject: "English", teacher: "Dr. Williams", room: "R-105" },
    { day: "Tuesday", period: "1st", time: "08:00-09:00", class: "12A", subject: "Physics", teacher: "Mr. Johnson", room: "Lab-1" },
  ];

  const examSchedule = [
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
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Schedule Management</h1>
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
            <Dialog open={open} onOpenChange={setOpen}>
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
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((day) => (
                            <SelectItem key={day} value={day.toLowerCase()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Period</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          {periods.map((period) => (
                            <SelectItem key={period} value={period.toLowerCase()}>
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
                      <Input type="time" />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input type="time" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10a">10A</SelectItem>
                        <SelectItem value="10b">10B</SelectItem>
                        <SelectItem value="11a">11A</SelectItem>
                        <SelectItem value="11b">11B</SelectItem>
                        <SelectItem value="12a">12A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input placeholder="Enter subject" />
                  </div>
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smith">Ms. Smith</SelectItem>
                        <SelectItem value="johnson">Mr. Johnson</SelectItem>
                        <SelectItem value="williams">Dr. Williams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Input placeholder="Enter room number" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setOpen(false)}>Add Period</Button>
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
              <CardDescription>View and edit the weekly class timetable</CardDescription>
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
                      <TableCell className="font-medium">{schedule.day}</TableCell>
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
                      <TableCell className="text-muted-foreground">{schedule.room}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
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
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Schedule Exam
            </Button>
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
                      <TableCell className="text-muted-foreground">{exam.room}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleManagement;
