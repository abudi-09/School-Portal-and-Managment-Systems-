import { Calendar, Clock, BookOpen, FileText } from "lucide-react";
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

const TeacherClasses = () => {
  const assignedClasses = [
    { id: 1, class: "10A", subject: "Mathematics", students: 28, period: "1st & 2nd" },
    { id: 2, class: "11A", subject: "Mathematics", students: 30, period: "3rd & 4th" },
    { id: 3, class: "11B", subject: "Mathematics", students: 32, period: "5th" },
    { id: 4, class: "12A", subject: "Mathematics", students: 25, period: "6th & 7th" },
  ];

  const weeklySchedule = [
    { day: "Monday", time: "08:00 - 09:30", class: "11A", subject: "Mathematics", room: "R-201" },
    { day: "Monday", time: "10:00 - 11:30", class: "12A", subject: "Mathematics", room: "R-201" },
    { day: "Tuesday", time: "08:00 - 09:30", class: "10A", subject: "Mathematics", room: "R-202" },
    { day: "Tuesday", time: "13:00 - 14:30", class: "11B", subject: "Mathematics", room: "R-201" },
    { day: "Wednesday", time: "08:00 - 09:30", class: "11A", subject: "Mathematics", room: "R-201" },
    { day: "Wednesday", time: "10:00 - 11:30", class: "12A", subject: "Mathematics", room: "R-201" },
    { day: "Thursday", time: "08:00 - 09:30", class: "10A", subject: "Mathematics", room: "R-202" },
    { day: "Thursday", time: "13:00 - 14:30", class: "11B", subject: "Mathematics", room: "R-201" },
    { day: "Friday", time: "08:00 - 09:30", class: "11A", subject: "Mathematics", room: "R-201" },
    { day: "Friday", time: "10:00 - 11:30", class: "12A", subject: "Mathematics", room: "R-201" },
  ];

  const examSchedule = [
    {
      date: "2024-11-20",
      time: "09:00 - 11:00",
      class: "11A",
      subject: "Mathematics",
      type: "Mid-Term",
      room: "Exam Hall A",
    },
    {
      date: "2024-11-22",
      time: "09:00 - 11:00",
      class: "10A",
      subject: "Mathematics",
      type: "Mid-Term",
      room: "Exam Hall B",
    },
    {
      date: "2024-11-25",
      time: "13:00 - 15:00",
      class: "12A",
      subject: "Mathematics",
      type: "Mid-Term",
      room: "Exam Hall A",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Classes</h1>
          <p className="text-muted-foreground">View your assigned classes and schedules</p>
        </div>
        <Button variant="outline">Request Leave</Button>
      </div>

      {/* Assigned Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {assignedClasses.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-lg bg-secondary">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <Badge variant="secondary">{item.period}</Badge>
              </div>
              <CardTitle className="mt-4">Class {item.class}</CardTitle>
              <CardDescription>{item.subject}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Students:</span>
                <span className="font-semibold text-foreground">{item.students}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule Tabs */}
      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList>
          <TabsTrigger value="weekly">Class Schedule</TabsTrigger>
          <TabsTrigger value="exams">Exam Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Class Schedule
              </CardTitle>
              <CardDescription>Your teaching schedule for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Room</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklySchedule.map((schedule, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{schedule.day}</TableCell>
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
                      <TableCell className="text-muted-foreground">{schedule.room}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exam Schedule
              </CardTitle>
              <CardDescription>Upcoming exams for your classes</CardDescription>
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
                    <TableHead>Room</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examSchedule.map((exam, index) => (
                    <TableRow key={index}>
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
                      <TableCell className="text-muted-foreground">{exam.room}</TableCell>
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

export default TeacherClasses;
