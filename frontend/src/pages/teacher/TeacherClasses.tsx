import {
  Calendar,
  Clock,
  BookOpen,
  FileText,
  Users,
  Target,
  TrendingUp,
  Award,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClassItem {
  id: number;
  class: string;
  subject: string;
  students: number;
  period: string;
}

const TeacherClasses = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const assignedClasses = [
    {
      id: 1,
      class: "10A",
      subject: "Mathematics",
      students: 28,
      period: "1st & 2nd",
    },
    {
      id: 2,
      class: "11A",
      subject: "Mathematics",
      students: 30,
      period: "3rd & 4th",
    },
    {
      id: 3,
      class: "11B",
      subject: "Mathematics",
      students: 32,
      period: "5th",
    },
    {
      id: 4,
      class: "12A",
      subject: "Mathematics",
      students: 25,
      period: "6th & 7th",
    },
  ];

  const weeklySchedule = [
    {
      day: "Monday",
      time: "08:00 - 09:30",
      class: "11A",
      subject: "Mathematics",
      room: "R-201",
    },
    {
      day: "Monday",
      time: "10:00 - 11:30",
      class: "12A",
      subject: "Mathematics",
      room: "R-201",
    },
    {
      day: "Tuesday",
      time: "08:00 - 09:30",
      class: "10A",
      subject: "Mathematics",
      room: "R-202",
    },
    {
      day: "Tuesday",
      time: "13:00 - 14:30",
      class: "11B",
      subject: "Mathematics",
      room: "R-201",
    },
    {
      day: "Wednesday",
      time: "08:00 - 09:30",
      class: "11A",
      subject: "Mathematics",
      room: "R-201",
    },
    {
      day: "Wednesday",
      time: "10:00 - 11:30",
      class: "12A",
      subject: "Mathematics",
      room: "R-201",
    },
    {
      day: "Thursday",
      time: "08:00 - 09:30",
      class: "10A",
      subject: "Mathematics",
      room: "R-202",
    },
    {
      day: "Thursday",
      time: "13:00 - 14:30",
      class: "11B",
      subject: "Mathematics",
      room: "R-201",
    },
    {
      day: "Friday",
      time: "08:00 - 09:30",
      class: "11A",
      subject: "Mathematics",
      room: "R-201",
    },
    {
      day: "Friday",
      time: "10:00 - 11:30",
      class: "12A",
      subject: "Mathematics",
      room: "R-201",
    },
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            My Classes
          </h1>
          <p className="text-muted-foreground">
            View your assigned classes and schedules
          </p>
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
                <span className="font-semibold text-foreground">
                  {item.students}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => {
                  setSelectedClass(item);
                  setIsModalOpen(true);
                }}
              >
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
              <CardDescription>
                Your teaching schedule for this week
              </CardDescription>
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
                      <TableCell className="font-medium">
                        {schedule.day}
                      </TableCell>
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
                      <TableCell className="text-muted-foreground">
                        {schedule.room}
                      </TableCell>
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
                      <TableCell className="text-muted-foreground">
                        {exam.room}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Class Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl">
                  Class {selectedClass?.class}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {selectedClass?.subject} • {selectedClass?.period} Period
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedClass && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {selectedClass.students}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Students
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">85%</p>
                        <p className="text-xs text-muted-foreground">
                          Attendance
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">A-</p>
                        <p className="text-xs text-muted-foreground">
                          Avg Grade
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">12</p>
                        <p className="text-xs text-muted-foreground">
                          Assignments
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Information Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="students">Students</TabsTrigger>
                  <TabsTrigger value="responsibilities">
                    Responsibilities
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Class Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Subject:
                          </span>
                          <span className="font-medium">
                            {selectedClass.subject}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Grade:</span>
                          <span className="font-medium">
                            Grade {selectedClass.class.charAt(0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Section:
                          </span>
                          <span className="font-medium">
                            {selectedClass.class.slice(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Period:</span>
                          <span className="font-medium">
                            {selectedClass.period}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Student Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Total Students:
                          </span>
                          <span className="font-medium">
                            {selectedClass.students}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Boys:</span>
                          <span className="font-medium">
                            {Math.floor(selectedClass.students * 0.55)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Girls:</span>
                          <span className="font-medium">
                            {Math.floor(selectedClass.students * 0.45)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Class Average:
                          </span>
                          <span className="font-medium">87.5%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Weekly Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {weeklySchedule
                          .filter(
                            (schedule) => schedule.class === selectedClass.class
                          )
                          .map((schedule, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="font-medium">
                                  {schedule.day}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{schedule.time}</span>
                                <span>{schedule.room}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="students" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Top Performing Students
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          {
                            name: "Alice Johnson",
                            grade: "A+",
                            attendance: "98%",
                          },
                          { name: "Bob Smith", grade: "A", attendance: "95%" },
                          {
                            name: "Charlie Brown",
                            grade: "A-",
                            attendance: "92%",
                          },
                        ].map((student, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <span className="font-medium">
                                {student.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <Badge variant="secondary">{student.grade}</Badge>
                              <span className="text-muted-foreground">
                                {student.attendance}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="responsibilities" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Your Responsibilities
                      </CardTitle>
                      <CardDescription>
                        Detailed description of your role and responsibilities
                        for this class
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        {(
                          user as {
                            employmentInfo?: { responsibilities?: string };
                          }
                        )?.employmentInfo?.responsibilities ? (
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm leading-relaxed">
                              {
                                (
                                  user as {
                                    employmentInfo?: {
                                      responsibilities?: string;
                                    };
                                  }
                                )?.employmentInfo?.responsibilities
                              }
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              No specific responsibilities have been assigned
                              yet.
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Contact your head teacher for detailed role
                              assignment.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherClasses;
