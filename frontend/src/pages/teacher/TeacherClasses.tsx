import {
  Calendar,
  Clock,
  BookOpen,
  FileText,
  Users,
  Target,
  TrendingUp,
  Award,
  MapPin,
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
import { useAuth } from "@/contexts/useAuth";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/shared/TablePagination";
import { PageHeader, StatCard, EmptyState } from "@/components/patterns";

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
  const ROWS_PER_PAGE = 6;
  const [weeklyPage, setWeeklyPage] = useState(1);
  const [examPage, setExamPage] = useState(1);

  // Mock Data
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
    { date: "2024-11-20", time: "09:00 - 11:00", class: "11A", subject: "Mathematics", type: "Mid-Term", room: "Exam Hall A" },
    { date: "2024-11-22", time: "09:00 - 11:00", class: "10A", subject: "Mathematics", type: "Mid-Term", room: "Exam Hall B" },
    { date: "2024-11-25", time: "13:00 - 15:00", class: "12A", subject: "Mathematics", type: "Mid-Term", room: "Exam Hall A" },
  ];

  // Pagination calculations
  const weeklyTotalPages = Math.max(1, Math.ceil(weeklySchedule.length / ROWS_PER_PAGE));
  const examTotalPages = Math.max(1, Math.ceil(examSchedule.length / ROWS_PER_PAGE));

  const pagedWeekly = weeklySchedule.slice((weeklyPage - 1) * ROWS_PER_PAGE, weeklyPage * ROWS_PER_PAGE);
  const pagedExams = examSchedule.slice((examPage - 1) * ROWS_PER_PAGE, examPage * ROWS_PER_PAGE);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="My Classes"
        description="View your assigned classes and schedules"
        actions={<Button variant="outline">Request Leave</Button>}
      />

      {/* Assigned Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {assignedClasses.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
            setSelectedClass(item);
            setIsModalOpen(true);
          }}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <Badge variant="secondary">{item.period}</Badge>
              </div>
              <CardTitle className="mt-4 text-xl">Class {item.class}</CardTitle>
              <CardDescription>{item.subject}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" /> Students
                </span>
                <span className="font-semibold">{item.students}</span>
              </div>
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
              {weeklySchedule.length === 0 ? (
                <EmptyState icon={Calendar} title="No classes scheduled" description="Your schedule is empty for this week." />
              ) : (
                <>
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
                      {pagedWeekly.map((schedule, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{schedule.day}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {schedule.time}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{schedule.class}</Badge></TableCell>
                          <TableCell>{schedule.subject}</TableCell>
                          <TableCell className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {schedule.room}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4">
                    <TablePagination currentPage={weeklyPage} totalPages={weeklyTotalPages} onPageChange={setWeeklyPage} />
                  </div>
                </>
              )}
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
              {examSchedule.length === 0 ? (
                <EmptyState icon={FileText} title="No exams scheduled" description="You have no upcoming exams." />
              ) : (
                <>
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
                      {pagedExams.map((exam, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{exam.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {exam.time}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{exam.class}</Badge></TableCell>
                          <TableCell>{exam.subject}</TableCell>
                          <TableCell><Badge>{exam.type}</Badge></TableCell>
                          <TableCell className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {exam.room}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4">
                    <TablePagination currentPage={examPage} totalPages={examTotalPages} onPageChange={setExamPage} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Class Details Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              Class {selectedClass?.class}
              <Badge variant="outline" className="ml-2 text-sm font-normal">{selectedClass?.subject}</Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedClass?.period} Period • Academic Year 2024-2025
            </DialogDescription>
          </DialogHeader>

          {selectedClass && (
            <div className="space-y-8 mt-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Students" value={selectedClass.students} icon={Users} variant="default" />
                <StatCard label="Attendance" value="85%" icon={TrendingUp} variant="success" />
                <StatCard label="Avg Grade" value="A-" icon={Award} variant="info" />
                <StatCard label="Assignments" value={12} icon={Target} variant="warning" />
              </div>

              {/* Detailed Information Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="students">Students</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Class Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Subject</span>
                          <span className="font-medium">{selectedClass.subject}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Grade Level</span>
                          <span className="font-medium">Grade {selectedClass.class.charAt(0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Section</span>
                          <span className="font-medium">{selectedClass.class.slice(1)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Period</span>
                          <span className="font-medium">{selectedClass.period}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Demographics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Total Students</span>
                          <span className="font-medium">{selectedClass.students}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Boys</span>
                          <span className="font-medium">{Math.floor(selectedClass.students * 0.55)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Girls</span>
                          <span className="font-medium">{Math.floor(selectedClass.students * 0.45)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        {weeklySchedule
                          .filter((s) => s.class === selectedClass.class)
                          .map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">{s.day}</Badge>
                                <span className="font-medium text-sm">{s.time}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" /> {s.room}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="students" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Performers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { name: "Alice Johnson", grade: "A+", attendance: "98%" },
                          { name: "Bob Smith", grade: "A", attendance: "95%" },
                          { name: "Charlie Brown", grade: "A-", attendance: "92%" },
                        ].map((student, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {student.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <span className="font-medium">{student.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <Badge variant={index === 0 ? "default" : "secondary"}>{student.grade}</Badge>
                              <span className="text-muted-foreground">{student.attendance}</span>
                            </div>
                          </div>
                        ))}
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
