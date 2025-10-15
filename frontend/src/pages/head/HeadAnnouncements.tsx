import { useState } from "react";
import { Plus, Bell, Paperclip, Filter, Eye, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const HeadAnnouncements = () => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const announcements = [
    {
      id: 1,
      title: "Mid-Term Examination Schedule Released",
      author: "You",
      audience: "All Users",
      date: "2024-11-15",
      category: "exam",
      content: "The mid-term examination schedule for all classes has been released. Please check your respective portals.",
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
      content: "Parent-teacher conferences will be held on November 25-26. All teachers must be present.",
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
      content: "School will be closed for Thanksgiving break from November 27-29. Classes resume on December 2.",
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
      content: "Updated attendance policy takes effect from December 1. Please review the attached guidelines.",
      views: 43,
      hasAttachment: true,
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "exam":
        return "destructive";
      case "event":
        return "default";
      case "holiday":
        return "secondary";
      case "policy":
        return "outline";
      default:
        return "secondary";
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

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Announcements</h1>
          <p className="text-muted-foreground">
            Create and manage school-wide announcements
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>
                Post a new announcement for teachers, students, or all users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users (Teachers & Students)</SelectItem>
                    <SelectItem value="teachers">Teachers Only</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="class">Specific Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
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
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter announcement title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  placeholder="Write your announcement message"
                  rows={8}
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
                Save as Draft
              </Button>
              <Button onClick={() => setOpen(false)}>Post Announcement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Posted</p>
                <p className="text-3xl font-bold text-foreground">{announcements.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary text-primary">
                <Bell className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Views</p>
                <p className="text-3xl font-bold text-foreground">
                  {announcements.reduce((sum, a) => sum + a.views, 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary text-accent">
                <Eye className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg. Engagement</p>
                <p className="text-3xl font-bold text-foreground">
                  {Math.round(announcements.reduce((sum, a) => sum + a.views, 0) / announcements.length)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary text-success">
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
          <SelectTrigger className="w-48">
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
          <Card key={announcement.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
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
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">{announcement.audience}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {announcement.views} views
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
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
