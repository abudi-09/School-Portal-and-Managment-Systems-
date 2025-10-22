import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Calendar,
  Paperclip,
  ChevronDown,
  School,
  UserCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TablePagination from "@/components/shared/TablePagination";

interface Announcement {
  id: number;
  title: string;
  postedBy: string;
  date: string;
  type: string;
  message: string;
  attachments: string[];
  isRead: boolean;
}

const Announcements = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const schoolAnnouncements = [
    {
      id: 1,
      title: "Midterm Examination Schedule Released",
      postedBy: "Head of Academics",
      date: "2025-10-13",
      type: "exam",
      message:
        "The midterm examination schedule for all grades has been released. Please check the Timetable section for your personalized exam schedule. Make sure to arrive 15 minutes before your scheduled exam time.",
      attachments: ["midterm_schedule.pdf"],
      isRead: false,
    },
    {
      id: 2,
      title: "Science Fair Registration Open",
      postedBy: "Science Department",
      date: "2025-10-12",
      type: "event",
      message:
        "The annual Science Fair will be held on November 5th. Students interested in participating should register by October 25th. This is a great opportunity to showcase your scientific projects and innovations.",
      attachments: ["registration_form.pdf", "guidelines.pdf"],
      isRead: false,
    },
    {
      id: 3,
      title: "Library Extended Hours",
      postedBy: "School Administration",
      date: "2025-10-11",
      type: "info",
      message:
        "Due to the upcoming exam period, the library will extend its operating hours. The library will now be open from 7:00 AM to 9:00 PM on weekdays. Please take advantage of this extended time for your studies.",
      attachments: [],
      isRead: true,
    },
    {
      id: 4,
      title: "Parent-Teacher Conference",
      postedBy: "Principal Office",
      date: "2025-10-10",
      type: "event",
      message:
        "Our semester parent-teacher conference is scheduled for October 30th. Parents can schedule individual meetings with teachers through the online portal. We encourage all parents to attend.",
      attachments: ["conference_schedule.pdf"],
      isRead: true,
    },
    {
      id: 6,
      title: "School Campus Safety Drill",
      postedBy: "Safety Committee",
      date: "2025-10-08",
      type: "school",
      message:
        "A mandatory safety drill will be conducted on October 18th at 10:00 AM. All students and staff must participate. Please follow the instructions of your teachers during the drill.",
      attachments: [],
      isRead: true,
    },
  ];

  const teacherAnnouncements = [
    {
      id: 5,
      title: "Mathematics Olympiad Team Selection",
      postedBy: "Mr. Johnson (Mathematics Teacher)",
      date: "2025-10-09",
      type: "class",
      message:
        "Students interested in representing our school at the Regional Mathematics Olympiad should register for the selection test on October 20th. The test will cover topics from advanced algebra and geometry.",
      attachments: ["olympiad_topics.pdf"],
      isRead: true,
    },
    {
      id: 7,
      title: "Physics Lab Safety Guidelines",
      postedBy: "Ms. Davis (Physics Teacher)",
      date: "2025-10-07",
      type: "class",
      message:
        "Important safety guidelines for the upcoming physics laboratory sessions. All students must review these guidelines before participating in any lab activities.",
      attachments: ["lab_safety_guidelines.pdf"],
      isRead: false,
    },
    {
      id: 8,
      title: "English Literature Assignment Extension",
      postedBy: "Mrs. Wilson (English Teacher)",
      date: "2025-10-06",
      type: "class",
      message:
        "Due to the midterm examination schedule, the English literature essay deadline has been extended to November 10th. Please use this extra time to improve your work.",
      attachments: ["assignment_rubric.pdf"],
      isRead: true,
    },
    {
      id: 9,
      title: "Chemistry Lab Report Guidelines",
      postedBy: "Dr. Brown (Chemistry Teacher)",
      date: "2025-10-05",
      type: "class",
      message:
        "Detailed guidelines for writing chemistry lab reports have been updated. Please review the new format requirements before submitting your next lab report.",
      attachments: ["lab_report_format.pdf", "grading_criteria.pdf"],
      isRead: false,
    },
    {
      id: 10,
      title: "History Project Presentation Schedule",
      postedBy: "Mr. Anderson (History Teacher)",
      date: "2025-10-04",
      type: "class",
      message:
        "The presentation schedule for the World War II history project has been finalized. Check your assigned time slot and prepare accordingly.",
      attachments: ["presentation_schedule.pdf"],
      isRead: true,
    },
  ];

  const getTypeColor = (
    type: string
  ): "destructive" | "default" | "secondary" | "outline" => {
    const colors: {
      [key: string]: "destructive" | "default" | "secondary" | "outline";
    } = {
      exam: "destructive",
      event: "default",
      info: "secondary",
      class: "outline",
      school: "default",
    };
    return colors[type] || "secondary";
  };

  const renderAnnouncements = (announcements: Announcement[]) => {
    return (
      <div className="space-y-4">
        {announcements.map((announcement) => {
          const isExpanded = expandedId === announcement.id;
          const truncatedMessage =
            announcement.message.length > 150 && !isExpanded
              ? announcement.message.substring(0, 150) + "..."
              : announcement.message;

          return (
            <Card
              key={announcement.id}
              className={`hover:shadow-md transition-shadow ${
                !announcement.isRead ? "border-accent/50 bg-accent/5" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Bell className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {announcement.title}
                        </CardTitle>
                        <CardDescription>
                          Posted by {announcement.postedBy}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getTypeColor(announcement.type)}>
                      {announcement.type}
                    </Badge>
                    {!announcement.isRead && (
                      <Badge variant="destructive" className="px-2">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(announcement.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <p className="text-foreground leading-relaxed">
                  {truncatedMessage}
                </p>

                {announcement.message.length > 150 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : announcement.id)
                    }
                  >
                    {isExpanded ? "Show less" : "Read more"}
                    <ChevronDown
                      className={`ml-1 h-4 w-4 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                )}

                {announcement.attachments.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Attachments:
                    </p>
                    <div className="space-y-2">
                      {announcement.attachments.map((file, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Paperclip className="h-4 w-4" />
                          {file}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Pagination for the two announcement lists
  const ROWS_PER_PAGE = 6;
  const [schoolPage, setSchoolPage] = useState(1);
  const [teacherPage, setTeacherPage] = useState(1);

  const schoolTotalPages = Math.max(
    1,
    Math.ceil(schoolAnnouncements.length / ROWS_PER_PAGE)
  );
  const teacherTotalPages = Math.max(
    1,
    Math.ceil(teacherAnnouncements.length / ROWS_PER_PAGE)
  );

  useEffect(() => {
    if (schoolPage > schoolTotalPages) setSchoolPage(schoolTotalPages);
  }, [schoolPage, schoolTotalPages]);
  useEffect(() => {
    if (teacherPage > teacherTotalPages) setTeacherPage(teacherTotalPages);
  }, [teacherPage, teacherTotalPages]);

  const pagedSchoolAnnouncements = schoolAnnouncements.slice(
    (schoolPage - 1) * ROWS_PER_PAGE,
    schoolPage * ROWS_PER_PAGE
  );
  const pagedTeacherAnnouncements = teacherAnnouncements.slice(
    (teacherPage - 1) * ROWS_PER_PAGE,
    teacherPage * ROWS_PER_PAGE
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with school news and events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent" />
          <Badge variant="destructive" className="rounded-full">
            {
              [...schoolAnnouncements, ...teacherAnnouncements].filter(
                (a) => !a.isRead
              ).length
            }
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="school" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="school" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            School Announcements
          </TabsTrigger>
          <TabsTrigger value="teacher" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Teacher Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              General School Announcements
            </h2>
            <Badge variant="secondary">
              {schoolAnnouncements.length} announcements
            </Badge>
          </div>
          {renderAnnouncements(pagedSchoolAnnouncements)}
          <TablePagination
            currentPage={schoolPage}
            totalPages={schoolTotalPages}
            onPageChange={setSchoolPage}
          />
        </TabsContent>

        <TabsContent value="teacher" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Teacher-Specific Announcements
            </h2>
            <Badge variant="secondary">
              {teacherAnnouncements.length} announcements
            </Badge>
          </div>
          {renderAnnouncements(pagedTeacherAnnouncements)}
          <TablePagination
            currentPage={teacherPage}
            totalPages={teacherTotalPages}
            onPageChange={setTeacherPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Announcements;
