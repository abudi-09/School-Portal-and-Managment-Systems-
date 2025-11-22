import { useState, useEffect, useContext } from "react";
import {
  getAnnouncements,
  type AnnouncementItem,
  createAnnouncement as apiCreate,
  updateAnnouncement as apiUpdate,
} from "@/lib/api/announcementsApi";
import { Plus, Bell, Paperclip, Edit2, Calendar, User, Tag } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { toast } from "sonner";
import TablePagination from "@/components/shared/TablePagination";
import { AuthContext } from "@/contexts/AuthContext";
import { PageHeader, FilterBar, EmptyState } from "@/components/patterns";
import { SkeletonGrid, SkeletonWrapper } from "@/components/skeleton";

interface Announcement {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  authorRole?: string;
  audience: string;
  date: string;
  category: string;
  content: string;
  hasAttachment: boolean;
}

const TeacherAnnouncements = () => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const auth = useContext(AuthContext);
  const currentUser = auth?.user;
  const [isEditing, setIsEditing] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    audience: "",
    category: "",
    content: "",
  });

  const PAGE_SIZE = 6;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewAnnouncement = () => {
    setIsEditing(false);
    setEditingAnnouncement(null);
    setFormData({ title: "", audience: "", category: "", content: "" });
    setOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setIsEditing(true);
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      audience: announcement.audience,
      category: announcement.category,
      content: announcement.content,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.audience || !formData.category || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      if (isEditing && editingAnnouncement) {
        await apiUpdate(editingAnnouncement.id, {
          title: formData.title,
          message: formData.content,
          audience: formData.audience
            ? {
                scope: formData.audience === "All My Classes" ? "all" : "class",
                classId: formData.audience === "All My Classes" ? undefined : formData.audience,
              }
            : undefined,
        });
        toast.success("Announcement updated successfully");
      } else {
        await apiCreate({
          title: formData.title,
          message: formData.content,
          type: "teacher",
          audience: formData.audience
            ? {
                scope: formData.audience === "All My Classes" ? "all" : "class",
                classId: formData.audience === "All My Classes" ? undefined : formData.audience,
              }
            : { scope: "all" },
        });
        toast.success("Announcement posted successfully");
      }
      setOpen(false);
      setFormData({ title: "", audience: "", category: "", content: "" });
      // Refresh list
      fetchAnnouncements();
      // Notify other tabs
      try {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const bc = new BroadcastChannel("announcements");
          bc.postMessage({ type: "announcements:updated" });
          bc.close();
        }
      } catch (e) { /* ignore */ }
    } catch (e) {
      toast.error("Failed to save announcement");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "exam": return "destructive";
      case "homework": return "secondary";
      case "assignment": return "default";
      case "event": return "outline";
      case "meeting": return "secondary";
      default: return "secondary";
    }
  };

  const filteredAnnouncements = filter === "all"
    ? announcements
    : filter === "head"
    ? announcements.filter((a) => a.authorRole === "head")
    : filter === "admin"
    ? announcements.filter((a) => a.authorRole === "admin")
    : filter === "others"
    ? announcements.filter((a) => a.authorRole === "teacher" && a.authorId !== currentUser?.id)
    : announcements.filter((a) => a.authorId === currentUser?.id);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnnouncements({ type: "teacher", page, pageSize: PAGE_SIZE });
      const items = res.items.map((i: AnnouncementItem) => ({
        id: i._id,
        title: i.title,
        author: i.postedBy?.name || "Unknown",
        authorId: i.postedBy?.user || undefined,
        authorRole: i.postedBy?.role || undefined,
        audience: "All Teachers",
        date: new Date(i.date).toISOString().split("T")[0],
        category: (i as unknown as { category?: string }).category || "general",
        content: i.message,
        hasAttachment: (i.attachments || []).length > 0,
      }));
      setAnnouncements(items);
      setTotal(res.total);
    } catch (err: unknown) {
      let message = "Failed to load announcements";
      if (err && typeof err === "object" && "response" in err) {
        const r = (err as { response?: { data?: { message?: string } } }).response;
        message = r?.data?.message || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    let cancelled = false;
    const bc = typeof window !== "undefined" && "BroadcastChannel" in window ? new BroadcastChannel("announcements") : null;

    const doFetch = async () => {
      if (!cancelled) await fetchAnnouncements();
    };

    void doFetch();

    const intervalId = window.setInterval(() => { void doFetch(); }, 15000);

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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Announcements"
        description="Manage announcements for your classes and view school updates"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={handleNewAnnouncement}>
                <Plus className="h-4 w-4" /> New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
                <DialogDescription>
                  {isEditing ? "Update your announcement details" : "Post a new announcement for your class or students"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="audience">Audience</Label>
                    <Select
                      value={formData.audience}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, audience: value }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Class 10A">Class 10A</SelectItem>
                        <SelectItem value="Class 11A">Class 11A</SelectItem>
                        <SelectItem value="Class 11B">Class 11B</SelectItem>
                        <SelectItem value="Class 12A">Class 12A</SelectItem>
                        <SelectItem value="All My Classes">All My Classes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homework">Homework</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="exam">Exam Info</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter announcement title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Message</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your announcement message"
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Attachment (optional)</Label>
                  <Button variant="outline" className="w-full gap-2">
                    <Paperclip className="h-4 w-4" /> Attach File
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>{isEditing ? "Update" : "Post"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <FilterBar
        filters={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
            <Button size="sm" variant={filter === "head" ? "default" : "outline"} onClick={() => setFilter("head")}>Head</Button>
            <Button size="sm" variant={filter === "admin" ? "default" : "outline"} onClick={() => setFilter("admin")}>Admin</Button>
            <Button size="sm" variant={filter === "others" ? "default" : "outline"} onClick={() => setFilter("others")}>Other Teachers</Button>
            <Button size="sm" variant={filter === "sent" ? "default" : "outline"} onClick={() => setFilter("sent")}>My Posts</Button>
          </div>
        }
      />

      <SkeletonWrapper isLoading={loading} skeleton={<SkeletonGrid columns={1} count={3} />}>
        {filteredAnnouncements.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No announcements found"
            description="There are no announcements matching your filter."
            action={<Button onClick={handleNewAnnouncement}>Create Announcement</Button>}
          />
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <Badge variant={getCategoryColor(announcement.category)} className="capitalize">
                          {announcement.category}
                        </Badge>
                        {announcement.hasAttachment && (
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                            <Paperclip className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {announcement.authorId === currentUser?.id ? "You" : announcement.author}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {announcement.date}</span>
                        <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {announcement.audience}</span>
                      </CardDescription>
                    </div>
                    {announcement.authorId === currentUser?.id && (
                      <Button variant="ghost" size="icon" onClick={() => handleEditAnnouncement(announcement)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {announcement.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </SkeletonWrapper>

      {filteredAnnouncements.length > 0 && (
        <div className="mt-6">
          <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default TeacherAnnouncements;
