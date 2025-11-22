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
  ChevronUp,
} from "lucide-react";
import { PageHeader } from "@/components/patterns";
import { FilterBar } from "@/components/patterns";
import { EmptyState } from "@/components/patterns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TablePagination from "@/components/shared/TablePagination";
import { useToast } from "@/hooks/use-toast";
import { SkeletonGrid } from "@/components/skeleton";
import {
  getAnnouncements,
  getUnreadCount,
  markRead,
  type AnnouncementItem,
  type AnnouncementType,
} from "@/lib/api/announcementsApi";

type Announcement = AnnouncementItem & { id: string };

const Announcements = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<AnnouncementType | "all">("all");

  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
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

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const source = sourceFilter === "all" ? undefined : sourceFilter;
      const result = await getAnnouncements(page, PAGE_SIZE, source);
      
      const items = result.items.map((item) => ({
        ...item,
        id: item._id,
      }));

      setAnnouncements(items);
      setTotal(result.total);

      // Fetch unread count
      const unreadCount = await getUnreadCount();
      setUnreadTotal(unreadCount);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load announcements";
      setError(msg);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page, sourceFilter]);

  const handleMarkAsRead = async (announcementId: string) => {
    try {
      await markRead(announcementId);
      setAnnouncements((prev) =>
        prev.map((a) =>
          a._id === announcementId || a.id === announcementId
            ? { ...a, isRead: true }
            : a
        )
      );
      setUnreadTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleToggleExpand = async (announcement: Announcement) => {
    const isCurrentlyExpanded =
      expandedId === announcement._id || expandedId === announcement.id;
    const nextId = isCurrentlyExpanded
      ? null
      : announcement._id || announcement.id;
    
    setExpandedId(nextId);

    // Mark as read when expanding
    if (!announcement.isRead && nextId) {
      await handleMarkAsRead(announcement._id || announcement.id);
    }
  };

  // Filter announcements based on search and filters
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      search === "" ||
      announcement.title.toLowerCase().includes(search.toLowerCase()) ||
      announcement.message.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      typeFilter === "all" || announcement.type === typeFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unread" && !announcement.isRead) ||
      (statusFilter === "read" && announcement.isRead);

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Announcements"
        description="Stay updated with school news and important information"
        actions={
          unreadTotal > 0 && (
            <Badge variant="destructive" className="px-3 py-1">
              {unreadTotal} Unread
            </Badge>
          )
        }
      />

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search announcements..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as AnnouncementType | "all")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="class">Class</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {/* Announcements List */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : error ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={Bell}
              title="Failed to load announcements"
              description={error}
              action={
                <Button onClick={fetchAnnouncements} variant="outline">
                  Try Again
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={Bell}
              title="No announcements found"
              description={
                search || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "New announcements will appear here when posted."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => {
            const isExpanded =
              expandedId === announcement._id || expandedId === announcement.id;
            const truncatedMessage =
              announcement.message.length > 200 && !isExpanded
                ? announcement.message.substring(0, 200) + "..."
                : announcement.message;

            return (
              <Card
                key={announcement._id || announcement.id}
                className={`transition-all ${
                  !announcement.isRead
                    ? "border-l-4 border-l-primary bg-primary/5"
                    : "hover:shadow-md"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {announcement.title}
                          </CardTitle>
                          <CardDescription className="truncate">
                            Posted by{" "}
                            {"postedBy" in announcement
                              ? announcement.postedBy?.name || "Unknown"
                              : "Unknown"}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
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

                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {truncatedMessage}
                  </p>

                  {announcement.message.length > 200 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto flex items-center gap-1"
                      onClick={() => handleToggleExpand(announcement)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Read more
                        </>
                      )}
                    </Button>
                  )}

                  {announcement.attachments &&
                    announcement.attachments.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          Attachments ({announcement.attachments.length})
                        </p>
                        <div className="space-y-2">
                          {announcement.attachments.map((attachment, idx) => (
                            <a
                              key={idx}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm flex-1 truncate">
                                {attachment.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {(attachment.size / 1024).toFixed(1)} KB
                              </Badge>
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
      )}

      {/* Pagination */}
      {!loading && filteredAnnouncements.length > 0 && (
        <TablePagination
          currentPage={page}
          totalPages={Math.ceil(total / PAGE_SIZE)}
          onPageChange={setPage}
          totalItems={total}
          itemsPerPage={PAGE_SIZE}
        />
      )}
    </div>
  );
};

export default Announcements;
