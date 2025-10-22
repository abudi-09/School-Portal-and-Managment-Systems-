import { useState, useEffect } from "react";
import { Plus, Bell, Paperclip, Filter, Edit2 } from "lucide-react";
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
import { toast } from "sonner";
import TablePagination from "@/components/shared/TablePagination";

interface Announcement {
  id: number;
  title: string;
  author: string;
  audience: string;
  date: string;
  category: string;
  content: string;
  hasAttachment: boolean;
}

const TeacherAnnouncements = () => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [isEditing, setIsEditing] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    audience: "",
    category: "",
    content: "",
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: "Homework Reminder - Chapter 5",
      author: "You",
      audience: "Class 11A",
      date: "2024-11-15",
      category: "homework",
      content: "Don't forget to complete exercises 5.1 to 5.5 by Friday.",
      hasAttachment: false,
    },
    {
      id: 2,
      title: "Mid-Term Exam Schedule",
      author: "Head of School",
      audience: "All Teachers",
      date: "2024-11-14",
      category: "exam",
      content:
        "Mid-term examinations will begin on November 20th. Please ensure all grades are updated.",
      hasAttachment: true,
    },
    {
      id: 3,
      title: "Parent-Teacher Conference",
      author: "Admin",
      audience: "All Teachers",
      date: "2024-11-13",
      category: "event",
      content:
        "Parent-teacher conferences scheduled for November 25-26. Please review your schedule.",
      hasAttachment: false,
    },
    {
      id: 4,
      title: "Mathematics Department Meeting",
      author: "Department Head",
      audience: "Mathematics Dept",
      date: "2024-11-12",
      category: "meeting",
      content:
        "Department meeting on Friday at 2 PM to discuss curriculum updates.",
      hasAttachment: false,
    },
    {
      id: 5,
      title: "Assignment Extension Notice",
      author: "You",
      audience: "Class 12A",
      date: "2024-11-11",
      category: "assignment",
      content:
        "Due to technical issues, the calculus assignment deadline has been extended to Monday.",
      hasAttachment: false,
    },
  ]);

  const handleNewAnnouncement = () => {
    setIsEditing(false);
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      audience: "",
      category: "",
      content: "",
    });
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

  const handleSubmit = () => {
    if (
      !formData.title ||
      !formData.audience ||
      !formData.category ||
      !formData.content
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (isEditing && editingAnnouncement) {
      // Update existing announcement
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann.id === editingAnnouncement.id
            ? {
                ...ann,
                title: formData.title,
                audience: formData.audience,
                category: formData.category,
                content: formData.content,
                date: new Date().toISOString().split("T")[0], // Update date
              }
            : ann
        )
      );
      toast.success("Announcement updated successfully");
    } else {
      // Create new announcement
      const newAnnouncement: Announcement = {
        id: Math.max(...announcements.map((a) => a.id)) + 1,
        title: formData.title,
        author: "You",
        audience: formData.audience,
        date: new Date().toISOString().split("T")[0],
        category: formData.category,
        content: formData.content,
        hasAttachment: false, // For now, no attachment handling
      };
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      toast.success("Announcement posted successfully");
    }

    setOpen(false);
    setFormData({
      title: "",
      audience: "",
      category: "",
      content: "",
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "exam":
        return "destructive";
      case "homework":
        return "secondary";
      case "assignment":
        return "default";
      case "event":
        return "outline";
      case "meeting":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const filteredAnnouncements =
    filter === "all"
      ? announcements
      : filter === "sent"
      ? announcements.filter((a) => a.author === "You")
      : announcements.filter((a) => a.author !== "You");

  const ROWS_PER_PAGE = 6;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [filter]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAnnouncements.length / ROWS_PER_PAGE)
  );
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const pagedAnnouncements = filteredAnnouncements.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Announcements
          </h1>
          <p className="text-muted-foreground">
            Manage announcements for your classes and view school updates
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleNewAnnouncement}>
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Announcement" : "Create Announcement"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update your announcement details"
                  : "Post a new announcement for your class or students"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <Select
                  value={formData.audience}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, audience: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Class 10A">Class 10A</SelectItem>
                    <SelectItem value="Class 11A">Class 11A</SelectItem>
                    <SelectItem value="Class 11B">Class 11B</SelectItem>
                    <SelectItem value="Class 12A">Class 12A</SelectItem>
                    <SelectItem value="All My Classes">
                      All My Classes
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="exam">Exam Info</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter announcement title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  placeholder="Write your announcement message"
                  rows={6}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Attachment (optional)</Label>
                <Button variant="outline" className="w-full gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attach File
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isEditing ? "Update Announcement" : "Post Announcement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Announcements</SelectItem>
            <SelectItem value="sent">Sent by Me</SelectItem>
            <SelectItem value="received">Received</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {pagedAnnouncements.map((announcement) => (
          <Card
            key={announcement.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg">
                      {announcement.title}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Posted by {announcement.author} • {announcement.date}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getCategoryColor(announcement.category)}>
                    {announcement.category}
                  </Badge>
                  {announcement.hasAttachment && (
                    <Badge variant="outline">
                      <Paperclip className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-foreground">{announcement.content}</p>
                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant="secondary">{announcement.audience}</Badge>
                  {announcement.author === "You" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAnnouncement(announcement)}
                    >
                      Edit
                    </Button>
                  )}
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

export default TeacherAnnouncements;
