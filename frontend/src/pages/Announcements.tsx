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
import { SkeletonGrid, SkeletonWrapper } from "@/components/skeleton";
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
  const [sourceFilter, setSourceFilter] = useState<AnnouncementType | "all">(
    "all"
  );

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
      const source =
        sourceFilter === "all" ? undefined : (sourceFilter as AnnouncementType);
      const result = await getAnnouncements({
        type: source,
        page,
        pageSize: PAGE_SIZE,
      });

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
            <Select
              value={sourceFilter}
              onValueChange={(value) =>
                setSourceFilter(value as AnnouncementType | "all")
              }
            >
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
      <SkeletonWrapper
        isLoading={loading}
        skeleton={<SkeletonGrid columns={1} count={6} />}
      >
        {error ? (
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
        ) : filteredAnnouncements.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No announcements found"
            description={
              search || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters to see more results."
                : "New announcements will appear here when posted."
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => {
              const isExpanded =
                expandedId === announcement._id ||
                expandedId === announcement.id;

              return (
                <Card
                  key={announcement._id || announcement.id}
                  className={`transition-all border-border ${
                    !announcement.isRead
                      ? "border-l-4 border-l-primary bg-primary/5"
                      : "hover:bg-muted/5"
                  }`}
                >
                  <CardHeader className="bg-muted/50 border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <Bell
                            className={`h-4 w-4 ${
                              !announcement.isRead
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <CardTitle className="text-lg truncate text-foreground">
                            {announcement.title}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-muted-foreground ml-7">
                          Posted by{" "}
                          {"postedBy" in announcement
                            ? announcement.postedBy?.name || "Unknown"
                            : "Unknown"}{" "}
                          • {new Date(announcement.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={getTypeColor(announcement.type)}
                          className="capitalize"
                        >
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
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div
                        className={`text-foreground ${
                          !isExpanded && "line-clamp-3"
                        }`}
                      >
                        {announcement.message}
                      </div>

                      {announcement.message.length > 200 && (
                        <Button
                          variant="link"
                          className="p-0 h-auto font-semibold text-primary"
                          onClick={() => handleToggleExpand(announcement)}
                        >
                          {isExpanded ? (
                            <span className="flex items-center gap-1">
                              Show Less <ChevronUp className="h-3 w-3" />
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              Read More <ChevronDown className="h-3 w-3" />
                            </span>
                          )}
                        </Button>
                      )}

                      {/* Attachments if any */}
                      {announcement.attachments &&
                        announcement.attachments.length > 0 && (
                          <div className="pt-4 border-t border-border mt-4">
                            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                              <Paperclip className="h-3 w-3" /> Attachments
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {announcement.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 rounded-md border border-border bg-background hover:bg-muted transition-colors text-sm"
                                >
                                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[150px]">
                                    {att.name}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </SkeletonWrapper>

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
