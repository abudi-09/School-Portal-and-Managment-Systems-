import { useState } from "react";
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

interface Announcement {
  id: number;
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: "Mid-Term Examination Schedule Released",
      author: "You",
      audience: "All Users",
      date: "2024-11-15",
      category: "exam",
      content:
        "The mid-term examination schedule for all classes has been released. Please check your respective portals.",
      views: 542,
      hasAttachment: true,
    },
    {
      id: 2,
      title: "Parent-Teacher Conference Notice",
      author: "You",
      audience: "Teachers",
      date: "2024-11-14",
      category: "event",
      content:
        "Parent-teacher conferences will be held on November 25-26. All teachers must be present.",
      views: 45,
      hasAttachment: false,
    },
    {
      id: 3,
      title: "Holiday Announcement - Thanksgiving Break",
      author: "You",
      audience: "All Users",
      date: "2024-11-13",
      category: "holiday",
      content:
        "School will be closed for Thanksgiving break from November 27-29. Classes resume on December 2.",
      views: 687,
      hasAttachment: false,
    },
    {
      id: 4,
      title: "New Attendance Policy Implementation",
      author: "You",
      audience: "Teachers",
      date: "2024-11-12",
      category: "policy",
      content:
        "Updated attendance policy takes effect from December 1. Please review the attached guidelines.",
      views: 43,
      hasAttachment: true,
    },
  ]);

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setEditOpen(true);
  };

  const handleCreateAnnouncement = (
    newAnnouncement: Omit<Announcement, "id" | "views">
  ) => {
    const announcement: Announcement = {
      ...newAnnouncement,
      id: announcements.length + 1,
      views: 0,
    };
    setAnnouncements([announcement, ...announcements]);
    setOpen(false);
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
  };

  const handleArchiveAnnouncement = (id: number) => {
    setAnnouncements(
      announcements.filter((announcement) => announcement.id !== id)
    );
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

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Announcements
          </h1>
          <p className="text-gray-600">
            Create and manage school-wide announcements
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gray-600 hover:bg-gray-700 text-white border-gray-600">
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl border-gray-200">
            <DialogHeader className="bg-gray-50 border-b border-gray-200">
              <DialogTitle className="text-gray-900">
                Create Announcement
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Post a new announcement for teachers, students, or all users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="audience"
                  className="text-sm font-semibold text-gray-700"
                >
                  Target Audience
                </Label>
                <Select>
                  <SelectTrigger className="border-gray-300">
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
              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-sm font-semibold text-gray-700"
                >
                  Category
                </Label>
                <Select>
                  <SelectTrigger className="border-gray-300">
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
                  className="text-sm font-semibold text-gray-700"
                >
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="Enter announcement title"
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="content"
                  className="text-sm font-semibold text-gray-700"
                >
                  Message
                </Label>
                <Textarea
                  id="content"
                  placeholder="Write your announcement message"
                  rows={8}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Attachment (optional)
                </Label>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Paperclip className="h-4 w-4" />
                  Attach File
                </Button>
              </div>
            </div>
            <DialogFooter className="bg-gray-50 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => setOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Post Announcement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Announcement Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl border-gray-200">
          <DialogHeader className="bg-gray-50 border-b border-gray-200">
            <DialogTitle className="text-gray-900">
              Edit Announcement
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Modify the announcement details
            </DialogDescription>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-audience"
                  className="text-sm font-semibold text-gray-700"
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
                  className="text-sm font-semibold text-gray-700"
                >
                  Category
                </Label>
                <Select defaultValue={selectedAnnouncement.category}>
                  <SelectTrigger className="border-gray-300">
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
                  className="text-sm font-semibold text-gray-700"
                >
                  Title
                </Label>
                <Input
                  id="edit-title"
                  defaultValue={selectedAnnouncement.title}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-content"
                  className="text-sm font-semibold text-gray-700"
                >
                  Message
                </Label>
                <Textarea
                  id="edit-content"
                  defaultValue={selectedAnnouncement.content}
                  rows={8}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Attachment (optional)
                </Label>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Paperclip className="h-4 w-4" />
                  {selectedAnnouncement.hasAttachment
                    ? "Change Attachment"
                    : "Attach File"}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="bg-gray-50 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setEditOpen(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Update Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Posted</p>
                <p className="text-3xl font-bold text-gray-900">
                  {announcements.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
                <Bell className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Views</p>
                <p className="text-3xl font-bold text-gray-900">
                  {announcements.reduce((sum, a) => sum + a.views, 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
                <Eye className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg. Engagement</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(
                    announcements.reduce((sum, a) => sum + a.views, 0) /
                      announcements.length
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-600" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 border-gray-300">
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
        {filteredAnnouncements.map((announcement) => (
          <Card
            key={announcement.id}
            className="border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-gray-600" />
                    <CardTitle className="text-lg text-gray-900">
                      {announcement.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">
                    Posted by {announcement.author} • {announcement.date}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-800 border-gray-300"
                  >
                    {announcement.category}
                  </Badge>
                  {announcement.hasAttachment && (
                    <Badge
                      variant="outline"
                      className="border-gray-300 text-gray-700"
                    >
                      <Paperclip className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-gray-900">{announcement.content}</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-800 border-gray-300"
                    >
                      {announcement.audience}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Eye className="h-4 w-4" />
                      {announcement.views} views
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchiveAnnouncement(announcement.id)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HeadAnnouncements;
