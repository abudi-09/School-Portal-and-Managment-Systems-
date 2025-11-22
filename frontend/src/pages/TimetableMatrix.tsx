import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Printer, Calendar, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/patterns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TimetableMatrix = () => {
  const [activeTab, setActiveTab] = useState('class');

  // Mock class schedule data
  const classSchedule = {
    Monday: [
      { period: '8:00-9:00', subject: 'Mathematics', teacher: 'Mrs. Johnson', room: 'Room 101' },
      { period: '9:00-10:00', subject: 'English', teacher: 'Mr. Smith', room: 'Room 203' },
      { period: '10:00-11:00', subject: 'Physics', teacher: 'Dr. Brown', room: 'Lab 1' },
      { period: '11:00-12:00', subject: 'Chemistry', teacher: 'Dr. Lee', room: 'Lab 2' },
      { period: '12:00-1:00', subject: 'Lunch Break', teacher: '-', room: 'Cafeteria' },
      { period: '1:00-2:00', subject: 'History', teacher: 'Ms. Davis', room: 'Room 305' },
    ],
    Tuesday: [
      { period: '8:00-9:00', subject: 'Biology', teacher: 'Dr. Wilson', room: 'Lab 3' },
      { period: '9:00-10:00', subject: 'Mathematics', teacher: 'Mrs. Johnson', room: 'Room 101' },
      { period: '10:00-11:00', subject: 'English', teacher: 'Mr. Smith', room: 'Room 203' },
      { period: '11:00-12:00', subject: 'Geography', teacher: 'Mr. Taylor', room: 'Room 210' },
      { period: '12:00-1:00', subject: 'Lunch Break', teacher: '-', room: 'Cafeteria' },
      { period: '1:00-2:00', subject: 'Physical Education', teacher: 'Coach Martinez', room: 'Gym' },
    ],
    Wednesday: [
      { period: '8:00-9:00', subject: 'Chemistry', teacher: 'Dr. Lee', room: 'Lab 2' },
      { period: '9:00-10:00', subject: 'Physics', teacher: 'Dr. Brown', room: 'Lab 1' },
      { period: '10:00-11:00', subject: 'Mathematics', teacher: 'Mrs. Johnson', room: 'Room 101' },
      { period: '11:00-12:00', subject: 'English', teacher: 'Mr. Smith', room: 'Room 203' },
      { period: '12:00-1:00', subject: 'Lunch Break', teacher: '-', room: 'Cafeteria' },
      { period: '1:00-2:00', subject: 'Art', teacher: 'Ms. Anderson', room: 'Art Studio' },
    ],
    Thursday: [
      { period: '8:00-9:00', subject: 'History', teacher: 'Ms. Davis', room: 'Room 305' },
      { period: '9:00-10:00', subject: 'Biology', teacher: 'Dr. Wilson', room: 'Lab 3' },
      { period: '10:00-11:00', subject: 'Geography', teacher: 'Mr. Taylor', room: 'Room 210' },
      { period: '11:00-12:00', subject: 'Mathematics', teacher: 'Mrs. Johnson', room: 'Room 101' },
      { period: '12:00-1:00', subject: 'Lunch Break', teacher: '-', room: 'Cafeteria' },
      { period: '1:00-2:00', subject: 'Computer Science', teacher: 'Mr. Garcia', room: 'Lab 4' },
    ],
    Friday: [
      { period: '8:00-9:00', subject: 'English', teacher: 'Mr. Smith', room: 'Room 203' },
      { period: '9:00-10:00', subject: 'Chemistry', teacher: 'Dr. Lee', room: 'Lab 2' },
      { period: '10:00-11:00', subject: 'Physical Education', teacher: 'Coach Martinez', room: 'Gym' },
      { period: '11:00-12:00', subject: 'Music', teacher: 'Ms. Thompson', room: 'Music Room' },
      { period: '12:00-1:00', subject: 'Lunch Break', teacher: '-', room: 'Cafeteria' },
      { period: '1:00-2:00', subject: 'Library Period', teacher: 'Librarian', room: 'Library' },
    ],
  };

  // Mock exam schedule
  const examSchedule = [
    { date: '2024-06-10', day: 'Monday', subject: 'Mathematics', time: '9:00 AM - 12:00 PM', duration: '3 hours', room: 'Exam Hall A' },
    { date: '2024-06-12', day: 'Wednesday', subject: 'English', time: '9:00 AM - 12:00 PM', duration: '3 hours', room: 'Exam Hall B' },
    { date: '2024-06-14', day: 'Friday', subject: 'Physics', time: '9:00 AM - 11:30 AM', duration: '2.5 hours', room: 'Exam Hall A' },
    { date: '2024-06-17', day: 'Monday', subject: 'Chemistry', time: '9:00 AM - 11:30 AM', duration: '2.5 hours', room: 'Exam Hall C' },
    { date: '2024-06-19', day: 'Wednesday', subject: 'Biology', time: '9:00 AM - 11:30 AM', duration: '2.5 hours', room: 'Exam Hall B' },
    { date: '2024-06-21', day: 'Friday', subject: 'History', time: '9:00 AM - 11:00 AM', duration: '2 hours', room: 'Exam Hall A' },
  ];

  const subjectColors: Record<string, string> = {
    Mathematics: 'bg-blue-500/10 text-blue-600 border-blue-200',
    English: 'bg-purple-500/10 text-purple-600 border-purple-200',
    Physics: 'bg-green-500/10 text-green-600 border-green-200',
    Chemistry: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    Biology: 'bg-teal-500/10 text-teal-600 border-teal-200',
    History: 'bg-orange-500/10 text-orange-600 border-orange-200',
    Geography: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
    'Physical Education': 'bg-red-500/10 text-red-600 border-red-200',
    'Computer Science': 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    'Lunch Break': 'bg-secondary text-muted-foreground',
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Timetable Matrix"
        description="Detailed view of your class and exam schedules."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Timetable" }]}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="class" className="gap-2"><Calendar className="h-4 w-4" /> Class Schedule</TabsTrigger>
          <TabsTrigger value="exam" className="gap-2"><Clock className="h-4 w-4" /> Exam Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="class">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Class Schedule</CardTitle>
              <CardDescription>Your class timetable for the current semester</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Color Legend */}
              <div className="mb-6 flex flex-wrap gap-2">
                {Object.keys(subjectColors).slice(0, 6).map((subject) => (
                  <Badge key={subject} variant="outline" className={subjectColors[subject]}>
                    {subject}
                  </Badge>
                ))}
                <Badge variant="outline" className="bg-secondary text-muted-foreground">+ more</Badge>
              </div>

              {/* Timetable Matrix */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[120px] font-bold">Time / Day</TableHead>
                      {Object.keys(classSchedule).map((day) => (
                        <TableHead key={day} className="text-center font-bold min-w-[180px]">{day}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classSchedule.Monday.map((_, periodIndex) => (
                      <TableRow key={periodIndex}>
                        <TableCell className="font-medium bg-muted/20 text-xs">
                          {classSchedule.Monday[periodIndex].period}
                        </TableCell>
                        {Object.keys(classSchedule).map((day) => {
                          const slot = classSchedule[day as keyof typeof classSchedule][periodIndex];
                          const isBreak = slot.subject === 'Lunch Break';
                          
                          return (
                            <TableCell 
                              key={day} 
                              className={`p-2 border-l ${isBreak ? 'bg-secondary/30' : ''}`}
                            >
                              <div className={`p-3 rounded-lg h-full flex flex-col gap-1 ${
                                isBreak ? 'items-center justify-center text-muted-foreground' : 
                                subjectColors[slot.subject] || 'bg-background border'
                              }`}>
                                <span className="font-semibold text-sm line-clamp-1">{slot.subject}</span>
                                {!isBreak && (
                                  <>
                                    <span className="text-xs opacity-80 line-clamp-1">{slot.teacher}</span>
                                    <span className="text-xs opacity-70 flex items-center gap-1">
                                      <MapPin className="h-3 w-3" /> {slot.room}
                                    </span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exam">
          <Card>
            <CardHeader>
              <CardTitle>Examination Schedule</CardTitle>
              <CardDescription>Final exam timetable for this semester</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Venue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examSchedule.map((exam, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{new Date(exam.date).toLocaleDateString()}</TableCell>
                        <TableCell>{exam.day}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={subjectColors[exam.subject]}>
                            {exam.subject}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{exam.time}</TableCell>
                        <TableCell className="text-sm">{exam.duration}</TableCell>
                        <TableCell className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" /> {exam.room}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Important Notes
                </h4>
                <ul className="list-disc list-inside text-sm text-yellow-700/80 space-y-1">
                  <li>Students must arrive 15 minutes before the exam starts</li>
                  <li>Bring your student ID card and necessary stationery</li>
                  <li>Electronic devices are not permitted in the exam hall</li>
                  <li>Check the notice board for any last-minute changes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimetableMatrix;
