import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Paperclip, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Announcements = () => {
  const [filterType, setFilterType] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const announcements = [
    {
      id: 1,
      title: "Midterm Examination Schedule Released",
      postedBy: "Head of Academics",
      date: "2025-10-13",
      type: "exam",
      message: "The midterm examination schedule for all grades has been released. Please check the Timetable section for your personalized exam schedule. Make sure to arrive 15 minutes before your scheduled exam time.",
      attachments: ["midterm_schedule.pdf"],
      isRead: false,
    },
    {
      id: 2,
      title: "Science Fair Registration Open",
      postedBy: "Science Department",
      date: "2025-10-12",
      type: "event",
      message: "The annual Science Fair will be held on November 5th. Students interested in participating should register by October 25th. This is a great opportunity to showcase your scientific projects and innovations.",
      attachments: ["registration_form.pdf", "guidelines.pdf"],
      isRead: false,
    },
    {
      id: 3,
      title: "Library Extended Hours",
      postedBy: "School Administration",
      date: "2025-10-11",
      type: "info",
      message: "Due to the upcoming exam period, the library will extend its operating hours. The library will now be open from 7:00 AM to 9:00 PM on weekdays. Please take advantage of this extended time for your studies.",
      attachments: [],
      isRead: true,
    },
    {
      id: 4,
      title: "Parent-Teacher Conference",
      postedBy: "Principal Office",
      date: "2025-10-10",
      type: "event",
      message: "Our semester parent-teacher conference is scheduled for October 30th. Parents can schedule individual meetings with teachers through the online portal. We encourage all parents to attend.",
      attachments: ["conference_schedule.pdf"],
      isRead: true,
    },
    {
      id: 5,
      title: "Mathematics Olympiad Team Selection",
      postedBy: "Mathematics Department",
      date: "2025-10-09",
      type: "class",
      message: "Students interested in representing our school at the Regional Mathematics Olympiad should register for the selection test on October 20th. The test will cover topics from advanced algebra and geometry.",
      attachments: ["olympiad_topics.pdf"],
      isRead: true,
    },
    {
      id: 6,
      title: "School Campus Safety Drill",
      postedBy: "Safety Committee",
      date: "2025-10-08",
      type: "school",
      message: "A mandatory safety drill will be conducted on October 18th at 10:00 AM. All students and staff must participate. Please follow the instructions of your teachers during the drill.",
      attachments: [],
      isRead: true,
    },
  ];

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      exam: "destructive",
      event: "default",
      info: "secondary",
      class: "outline",
      school: "default",
    };
    return colors[type] || "secondary";
  };

  const filteredAnnouncements = announcements.filter((announcement) =>
    filterType === "all" ? true : announcement.type === filterType
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
            {announcements.filter((a) => !a.isRead).length}
          </Badge>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Announcements</SelectItem>
            <SelectItem value="exam">Exams</SelectItem>
            <SelectItem value="event">Events</SelectItem>
            <SelectItem value="class">Class</SelectItem>
            <SelectItem value="school">School</SelectItem>
            <SelectItem value="info">Information</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => {
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
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <CardDescription>
                          Posted by {announcement.postedBy}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getTypeColor(announcement.type) as any}>
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

                <p className="text-foreground leading-relaxed">{truncatedMessage}</p>

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
    </div>
  );
};

export default Announcements;
