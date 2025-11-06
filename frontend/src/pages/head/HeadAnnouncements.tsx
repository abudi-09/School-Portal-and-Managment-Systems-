import { useState, useEffect } from "react";
import { SkeletonGrid, SkeletonWrapper } from "@/components/skeleton";
import {
  getAnnouncements,
  type AnnouncementItem,
  deleteAnnouncement as apiDelete,
  createAnnouncement,
} from "@/lib/api/announcementsApi";
import { Plus, Bell, Paperclip, Filter, Eye, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TablePagination from "@/components/shared/TablePagination";

interface Announcement {
  id: string;
  title: string;
  author: string;
  audience: string;
  date: string;
  category: string;
  content: string;
  views: number;
  hasAttachment: boolean;
}
const HeadAnnouncements = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [filter, setFilter] = useState("all");
  // Create form state
  const [createTitle, setCreateTitle] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [createAudience, setCreateAudience] = useState<
    "all" | "teachers" | "students" | "class"
  >("all");
  const [createGrade, setCreateGrade] = useState<string | null>(null);
  const [createSection, setCreateSection] = useState<string | null>(null);
  const PAGE_SIZE = 6;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setEditOpen(true);
  };

  const handleCreateAnnouncement = (
    newAnnouncement: Omit<Announcement, "id" | "views">
  ) => {
    const announcement: Announcement = {
      ...newAnnouncement,
      id: Math.random().toString(36).slice(2, 9),
      views: 0,
    };
    setAnnouncements([announcement, ...announcements]);
    setOpen(false);
    // notify other tabs/pages
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("announcements");
        bc.postMessage({ type: "announcements:updated" });
        bc.close();
      }
    } catch (e) {
      // ignore
    }
  };

  const handleUpdateAnnouncement = (updatedAnnouncement: Announcement) => {
    setAnnouncements(
      announcements.map((announcement) =>
        announcement.id === updatedAnnouncement.id
          ? updatedAnnouncement
          : announcement
      )
    );
    setEditOpen(false);
    setSelectedAnnouncement(null);
    // notify other tabs/pages
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("announcements");
        bc.postMessage({ type: "announcements:updated" });
        bc.close();
      }
    } catch (e) {
      // ignore
    }
  };

  const handleArchiveAnnouncement = async (id: string) => {
    try {
      await apiDelete(id);
      // Refresh list from server
      const res = await getAnnouncements({
        type: "school",
        page,
        pageSize: ROWS_PER_PAGE,
      });
      const items = res.items.map((i: AnnouncementItem) => ({
        id: i._id,
        title: i.title,
        author: i.postedBy?.name || "You",
        audience: "All Users",
        date: new Date(i.date).toISOString().split("T")[0],
        category: (i as unknown as { category?: string }).category || "general",
        content: i.message,
        views: (i as unknown as { views?: number }).views || 0,
        hasAttachment: (i.attachments || []).length > 0,
      }));
      setAnnouncements(items);
      setTotal(res.total);
    } catch (e) {
      // fallback to client-side removal if server fails
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const filteredAnnouncements =
    filter === "all"
      ? announcements
      : announcements.filter((a) =>
          filter === "teachers"
            ? a.audience === "Teachers"
            : filter === "students"
            ? a.audience === "Students"
            : a.audience === "All Users"
        );

  // Pagination
  const ROWS_PER_PAGE = 6;
  useEffect(() => setPage(1), [filter, setPage]);

  useEffect(() => {
    let cancelled = false;
    let interval: number | undefined;
    const bc = typeof window !== "undefined" && "BroadcastChannel" in window
      ? new BroadcastChannel("announcements")
      : null;

    const doFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAnnouncements({
          type: "school",
          page,
          pageSize: ROWS_PER_PAGE,
        });
        if (cancelled) return;
        const items = res.items.map((i: AnnouncementItem) => ({
          id: i._id,
          title: i.title,
          author: i.postedBy?.name || "You",
          audience: "All Users",
          date: new Date(i.date).toISOString().split("T")[0],
          category:
            (i as unknown as { category?: string }).category || "general",
          content: i.message,
          views: (i as unknown as { views?: number }).views || 0,
          hasAttachment: (i.attachments || []).length > 0,
        }));
        setAnnouncements(items);
        setTotal(res.total);
      } catch (err: unknown) {
        let message = "Failed to fetch announcements";
        if (err && typeof err === "object" && "response" in err) {
          const r = (err as { response?: { data?: { message?: string } } })
            .response;
          message = r?.data?.message || message;
        }
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void doFetch();
    const intervalId = window.setInterval(() => {
      void doFetch();
    }, 15000);
    if (bc) {
      bc.addEventListener("message", (ev) => {
        if (ev.data && ev.data.type === "announcements:updated") {
          void doFetch();
        }
      });
    }

    return () => {
      cancelled = true;
  if (intervalId) clearInterval(intervalId);
      if (bc) bc.close();
    };
  }, [page, filter]);

  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);
  const pagedAnnouncements = announcements;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Announcements
          </h1>
          <p className="text-muted-foreground">
            Create and manage school-wide announcements
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground border-border">
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl border-border max-h-[80vh] overflow-y-auto">
            <DialogHeader className="bg-muted border-b border-border">
              <DialogTitle className="text-foreground">
                Create Announcement
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Post a new announcement for teachers, students, or all users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="audience"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Target Audience
                </Label>
                <Select
                  value={createAudience}
                  onValueChange={(v) => setCreateAudience(v as "all" | "teachers" | "students" | "class")}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Users (Teachers & Students)
                    </SelectItem>
                    <SelectItem value="teachers">Teachers Only</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="class">Specific Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Grade/Section when Specific Class is selected */}
              {createAudience === "class" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Grade
                    </Label>
                    <Select
                      value={createGrade ?? undefined}
                      onValueChange={(v) => setCreateGrade(v ?? null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="11">11</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Section
                    </Label>
                    <Select
                      value={createSection ?? undefined}
                      onValueChange={(v) => setCreateSection(v ?? null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Category
                </Label>
                <Select>
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="Enter announcement title"
                  className="border-border"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="content"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Message
                </Label>
                <Textarea
                  id="content"
                  placeholder="Write your announcement message"
                  rows={8}
                  className="border-border"
                  value={createMessage}
                  onChange={(e) => setCreateMessage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Attachment (optional)
                </Label>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-border text-muted-foreground hover:bg-muted/10"
                >
                  <Paperclip className="h-4 w-4" />
                  Attach File
                </Button>
              </div>
            </div>
            <DialogFooter className="bg-muted border-t border-border">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-border text-muted-foreground hover:bg-muted/10"
              >
                Save as Draft
              </Button>
              <Button
                onClick={async () => {
                  // Basic validation
                  if (!createTitle || !createMessage) return;
                  if (
                    createAudience === "class" &&
                    (!createGrade || !createSection)
                  )
                    return;
                  try {
                    const classId =
                      createAudience === "class"
                        ? `${createGrade}-${createSection}`
                        : undefined;
                    const audiencePayload: {
                      scope: "all" | "teachers" | "students" | "class";
                      classId?: string | undefined;
                    } = { scope: createAudience, classId };
                    const created = await createAnnouncement({
                      title: createTitle,
                      message: createMessage,
                      type: "school",
                      audience: audiencePayload,
                      attachments: [],
                    });
                    // Prepend to list
                    const item = created as AnnouncementItem;
                    const itemAny = item as unknown as {
                      audience?: { scope?: string; classId?: string };
                      category?: string;
                      attachments?: unknown[];
                      postedBy?: { name?: string; user?: string; role?: string };
                      _id: string;
                      title: string;
                      date: string;
                      message: string;
                    };
                    const mapped = {
                      id: item._id,
                      title: item.title,
                      author: item.postedBy?.name || "You",
                      audience:
                        itemAny.audience?.scope === "all"
                          ? "All Users"
                          : itemAny.audience?.scope === "teachers"
                          ? "Teachers"
                          : itemAny.audience?.scope === "students"
                          ? "Students"
                          : `Class ${itemAny.audience?.classId}`,
                      date: new Date(item.date).toISOString().split("T")[0],
                      category: itemAny.category || "general",
                      content: item.message,
                      views: 0,
                      hasAttachment: (item.attachments || []).length > 0,
                    };
                    setAnnouncements((prev) => [mapped, ...prev]);
                    setTotal((t) => t + 1);
                    setOpen(false);
                    // reset form
                    setCreateTitle("");
                    setCreateMessage("");
                    setCreateAudience("all");
                    setCreateGrade(null);
                    setCreateSection(null);
                  } catch (err) {
                    console.error("Failed to create announcement", err);
                  }
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Post Announcement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Announcement Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader className="bg-muted border-b border-border">
            <DialogTitle className="text-foreground">
              Edit Announcement
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Modify the announcement details
            </DialogDescription>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-audience"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Target Audience
                </Label>
                <Select
                  defaultValue={
                    selectedAnnouncement.audience.toLowerCase().includes("all")
                      ? "all"
                      : selectedAnnouncement.audience
                          .toLowerCase()
                          .includes("teacher")
                      ? "teachers"
                      : "students"
                  }
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Users (Teachers & Students)
                    </SelectItem>
                    <SelectItem value="teachers">Teachers Only</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="class">Specific Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-category"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Category
                </Label>
                <Select defaultValue={selectedAnnouncement.category}>
                  <SelectTrigger className="border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-title"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Title
                </Label>
                <Input
                  id="edit-title"
                  defaultValue={selectedAnnouncement.title}
                  className="border-border"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-content"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Message
                </Label>
                <Textarea
                  id="edit-content"
                  defaultValue={selectedAnnouncement.content}
                  rows={8}
                  className="border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Attachment (optional)
                </Label>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-border text-muted-foreground hover:bg-muted/10"
                >
                  <Paperclip className="h-4 w-4" />
                  {selectedAnnouncement.hasAttachment
                    ? "Change Attachment"
                    : "Attach File"}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="bg-muted border-t border-border">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="border-border text-muted-foreground hover:bg-muted/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setEditOpen(false)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Update Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Posted
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {announcements.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                <Bell className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Views
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {announcements.reduce((sum, a) => sum + a.views, 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                <Eye className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Avg. Engagement
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {Math.round(
                    announcements.reduce((sum, a) => sum + a.views, 0) /
                      announcements.length
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Announcements</SelectItem>
            <SelectItem value="everyone">Posted to Everyone</SelectItem>
            <SelectItem value="teachers">Posted to Teachers</SelectItem>
            <SelectItem value="students">Posted to Students</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {pagedAnnouncements.map((announcement) => (
          <Card
            key={announcement.id}
            className="border-border hover:bg-muted/5 transition-colors"
          >
            <CardHeader className="bg-muted border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg text-foreground">
                      {announcement.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    Posted by {announcement.author} • {announcement.date}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-muted text-foreground border-border"
                  >
                    {announcement.category}
                  </Badge>
                  {announcement.hasAttachment && (
                    <Badge
                      variant="outline"
                      className="border-border text-muted-foreground"
                    >
                      <Paperclip className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-foreground">{announcement.content}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="secondary"
                      className="bg-muted text-foreground border-border"
                    >
                      {announcement.audience}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {announcement.views} views
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                      className="border-border text-muted-foreground hover:bg-muted/10"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchiveAnnouncement(announcement.id)}
                      className="border-border text-muted-foreground hover:bg-muted/10"
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredAnnouncements.length > 0 && (
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};

export default HeadAnnouncements;
