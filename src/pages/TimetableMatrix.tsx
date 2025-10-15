import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    'Lunch Break': 'bg-secondary',
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Timetable</h1>
          <p className="text-muted-foreground">
            View your class schedule and upcoming exams
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="class">Class Schedule</TabsTrigger>
          <TabsTrigger value="exam">Exam Schedule</TabsTrigger>
        </TabsList>

        {/* Class Schedule Tab */}
        <TabsContent value="class" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Class Schedule</CardTitle>
              <CardDescription>
                Your class timetable for the current semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Color Legend */}
              <div className="mb-6 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground mr-2">Legend:</span>
                {Object.keys(subjectColors).slice(0, 5).map((subject) => (
                  <Badge key={subject} variant="outline" className={subjectColors[subject]}>
                    {subject}
                  </Badge>
                ))}
                <span className="text-sm text-muted-foreground">+ more</span>
              </div>

              {/* Timetable Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="border border-border p-3 text-left font-semibold min-w-[120px]">
                        Time / Day
                      </th>
                      {Object.keys(classSchedule).map((day) => (
                        <th key={day} className="border border-border p-3 text-center font-semibold min-w-[180px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classSchedule.Monday.map((_, periodIndex) => (
                      <tr key={periodIndex}>
                        <td className="border border-border p-3 bg-secondary/50 font-medium text-sm">
                          {classSchedule.Monday[periodIndex].period}
                        </td>
                        {Object.keys(classSchedule).map((day) => {
                          const slot = classSchedule[day as keyof typeof classSchedule][periodIndex];
                          const isBreak = slot.subject === 'Lunch Break';
                          
                          return (
                            <td 
                              key={day} 
                              className={`border border-border p-3 ${
                                isBreak ? 'bg-secondary/50' : subjectColors[slot.subject] || 'bg-background'
                              }`}
                            >
                              <div className="space-y-1">
                                <p className="font-semibold text-sm">{slot.subject}</p>
                                {!isBreak && (
                                  <>
                                    <p className="text-xs text-muted-foreground">{slot.teacher}</p>
                                    <p className="text-xs text-muted-foreground">{slot.room}</p>
                                  </>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exam Schedule Tab */}
        <TabsContent value="exam" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Examination Schedule</CardTitle>
              <CardDescription>
                Final exam timetable for this semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-semibold">Date</th>
                      <th className="text-left p-4 font-semibold">Day</th>
                      <th className="text-left p-4 font-semibold">Subject</th>
                      <th className="text-left p-4 font-semibold">Time</th>
                      <th className="text-left p-4 font-semibold">Duration</th>
                      <th className="text-left p-4 font-semibold">Venue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examSchedule.map((exam, index) => (
                      <tr key={index} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="p-4 font-medium">
                          {new Date(exam.date).toLocaleDateString()}
                        </td>
                        <td className="p-4">{exam.day}</td>
                        <td className="p-4">
                          <Badge variant="outline" className={subjectColors[exam.subject]}>
                            {exam.subject}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">{exam.time}</td>
                        <td className="p-4 text-sm">{exam.duration}</td>
                        <td className="p-4 text-sm font-medium">{exam.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Important Notes:</strong>
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
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
