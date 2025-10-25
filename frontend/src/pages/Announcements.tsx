import { useState, useEffect, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { SkeletonGrid, SkeletonWrapper } from "@/components/skeleton";
import {
  getAnnouncements,
  getUnreadCount,
  markRead,
  type AnnouncementItem,
  type AnnouncementType,
} from "@/lib/api/announcementsApi";

// Local, UI-friendly type mapped from API
type Announcement = AnnouncementItem & { id: string };

const Announcements = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  // Server-driven lists and meta
  const PAGE_SIZE = 6;
  const [activeTab, setActiveTab] = useState<AnnouncementType>("school");
  const [schoolPage, setSchoolPage] = useState(1);
  const [teacherPage, setTeacherPage] = useState(1);

  const [schoolAnnouncements, setSchoolAnnouncements] = useState<
    Announcement[]
  >([]);
  const [teacherAnnouncements, setTeacherAnnouncements] = useState<
    Announcement[]
  >([]);
  const [schoolTotal, setSchoolTotal] = useState(0);
  const [teacherTotal, setTeacherTotal] = useState(0);
  const [unreadTotal, setUnreadTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          const isExpanded =
            expandedId === announcement._id || expandedId === announcement.id;
          const truncatedMessage =
            announcement.message.length > 150 && !isExpanded
              ? announcement.message.substring(0, 150) + "..."
              : announcement.message;

          return (
            <Card
              key={announcement._id || announcement.id}
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
                          Posted by{" "}
                          {"postedBy" in announcement
                            ? announcement.postedBy?.name || "Unknown"
                            : "Unknown"}
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
                    aria-expanded={isExpanded}
                    onClick={async () => {
                      const next = isExpanded
                        ? null
                        : announcement._id || announcement.id;
                      setExpandedId(next);
                      // Optimistically mark as read
                      if (!announcement.isRead && next) {
                        try {
                          announcement.isRead = true;
                          // Persist to server
                          await markRead(announcement._id || announcement.id);
                          // Refresh unread counter lazily
                          try {
                            const count = await getUnreadCount();
                            setUnreadTotal(count);
                          } catch {
                            /* ignore */
                          }
                        } catch (err) {
                          // Revert on failure
                          announcement.isRead = false;
                          toast({
                            title: "Failed to mark as read",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                  >
                    {isExpanded ? "Show less" : "Read more"}
                    <ChevronDown
                      className={`ml-1 h-4 w-4 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                )}

                {announcement.attachments &&
                  announcement.attachments.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Attachments:
                      </p>
                      <div className="space-y-2">
                        {announcement.attachments.map((att, index) => (
                          <a
                            key={index}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm underline underline-offset-4"
                          >
                            <Paperclip className="h-4 w-4" />
                            {att.filename}
                          </a>
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

  // Fetch lists when page/tab changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [schoolRes, teacherRes, unread] = await Promise.all([
          getAnnouncements({
            type: "school",
            page: schoolPage,
            pageSize: PAGE_SIZE,
          }),
          getAnnouncements({
            type: "teacher",
            page: teacherPage,
            pageSize: PAGE_SIZE,
          }),
          getUnreadCount().catch(() => 0),
        ]);
        if (cancelled) return;
        setSchoolAnnouncements(
          schoolRes.items.map((i) => ({ ...i, id: i._id }))
        );
        setTeacherAnnouncements(
          teacherRes.items.map((i) => ({ ...i, id: i._id }))
        );
        setSchoolTotal(schoolRes.total);
        setTeacherTotal(teacherRes.total);
        setUnreadTotal(typeof unread === "number" ? unread : 0);
      } catch (e: unknown) {
        let message = "Failed to load announcements";
        if (e && typeof e === "object" && "response" in e) {
          const r = (e as { response?: { data?: { message?: string } } })
            .response;
          message = r?.data?.message || message;
        }
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [schoolPage, teacherPage]);

  const schoolTotalPages = useMemo(
    () => Math.max(1, Math.ceil(schoolTotal / PAGE_SIZE)),
    [schoolTotal]
  );
  const teacherTotalPages = useMemo(
    () => Math.max(1, Math.ceil(teacherTotal / PAGE_SIZE)),
    [teacherTotal]
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
            {unreadTotal}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AnnouncementType)}
        className="space-y-6"
      >
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

        <TabsContent value="school" className="space-y-4" aria-busy={loading}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              General School Announcements
            </h2>
            <Badge variant="secondary">{schoolTotal} announcements</Badge>
          </div>
          {error && (
            <div className="text-sm text-destructive flex items-center justify-between p-3 border rounded-md">
              <span>{error}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSchoolPage(1)}
              >
                Retry
              </Button>
            </div>
          )}
          <SkeletonWrapper
            isLoading={loading}
            skeleton={<SkeletonGrid count={6} columns={2} cardLines={4} />}
          >
            {renderAnnouncements(schoolAnnouncements)}
          </SkeletonWrapper>
          <TablePagination
            currentPage={schoolPage}
            totalPages={schoolTotalPages}
            onPageChange={setSchoolPage}
          />
        </TabsContent>

        <TabsContent value="teacher" className="space-y-4" aria-busy={loading}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Teacher-Specific Announcements
            </h2>
            <Badge variant="secondary">{teacherTotal} announcements</Badge>
          </div>
          {error && (
            <div className="text-sm text-destructive flex items-center justify-between p-3 border rounded-md">
              <span>{error}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTeacherPage(1)}
              >
                Retry
              </Button>
            </div>
          )}
          <SkeletonWrapper
            isLoading={loading}
            skeleton={<SkeletonGrid count={6} columns={2} cardLines={4} />}
          >
            {renderAnnouncements(teacherAnnouncements)}
          </SkeletonWrapper>
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
