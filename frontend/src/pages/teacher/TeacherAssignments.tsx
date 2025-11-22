import { useState, useEffect } from "react";
import { Plus, Upload, Calendar, FileText, Download, BookOpen, Clock, CheckCircle2, AlertCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/patterns";

const TeacherAssignments = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("assignments");

  const assignments = [
    {
      id: 1,
      title: "Quadratic Equations Problem Set",
      subject: "Mathematics",
      class: "11A",
      dueDate: "2024-11-20",
      submissions: 28,
      totalStudents: 30,
      status: "ongoing",
      description: "Complete exercises 1-20 from Chapter 4. Show all working out.",
    },
    {
      id: 2,
      title: "Trigonometry Assignment",
      subject: "Mathematics",
      class: "11B",
      dueDate: "2024-11-25",
      submissions: 15,
      totalStudents: 32,
      status: "ongoing",
      description: "Solve the trigonometric identities provided in the worksheet.",
    },
    {
      id: 3,
      title: "Calculus Practice Problems",
      subject: "Mathematics",
      class: "12A",
      dueDate: "2024-11-15",
      submissions: 25,
      totalStudents: 25,
      status: "closed",
      description: "Differentiation practice problems for the upcoming test.",
    },
  ];

  const homework = [
    {
      id: 1,
      title: "Chapter 5 Exercises",
      subject: "Mathematics",
      class: "10A",
      dueDate: "2024-11-18",
      status: "ongoing",
      description: "Read Chapter 5 and complete the review questions.",
    },
    {
      id: 2,
      title: "Practice Problems 3.1-3.5",
      subject: "Mathematics",
      class: "11A",
      dueDate: "2024-11-22",
      status: "ongoing",
      description: "Prepare for the quiz by solving these practice problems.",
    },
  ];

  const ROWS_PER_PAGE = 6;
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [homeworkPage, setHomeworkPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // filtered lists computed from queries
  const filterItems = (items: any[]) => {
    return items.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.class.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const filteredAssignments = filterItems(assignments);
  const filteredHomework = filterItems(homework);

  const assignmentsTotal = Math.max(1, Math.ceil(filteredAssignments.length / ROWS_PER_PAGE));
  const homeworkTotal = Math.max(1, Math.ceil(filteredHomework.length / ROWS_PER_PAGE));

  useEffect(() => {
    if (assignmentsPage > assignmentsTotal) setAssignmentsPage(assignmentsTotal);
  }, [assignmentsPage, assignmentsTotal]);

  useEffect(() => {
    if (homeworkPage > homeworkTotal) setHomeworkPage(homeworkTotal);
  }, [homeworkPage, homeworkTotal]);

  const pagedAssignments = filteredAssignments.slice(
    (assignmentsPage - 1) * ROWS_PER_PAGE,
    assignmentsPage * ROWS_PER_PAGE
  );
  const pagedHomework = filteredHomework.slice(
    (homeworkPage - 1) * ROWS_PER_PAGE,
    homeworkPage * ROWS_PER_PAGE
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing": return "default";
      case "closed": return "secondary";
      case "pending": return "warning";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ongoing": return Clock;
      case "closed": return CheckCircle2;
      case "pending": return AlertCircle;
      default: return FileText;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Assignments"
        description="Manage assignments and homework for your classes"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>Add a new assignment or homework for your class</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="homework">Homework</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10a">10A - Mathematics</SelectItem>
                        <SelectItem value="11a">11A - Mathematics</SelectItem>
                        <SelectItem value="11b">11B - Mathematics</SelectItem>
                        <SelectItem value="12a">12A - Mathematics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Enter assignment title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter assignment description and instructions" rows={4} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Attach Files</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="w-full gap-2">
                      <Upload className="h-4 w-4" /> Upload Files
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => setOpen(false)}>Create Assignment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Active Assignments" value={assignments.filter(a => a.status === 'ongoing').length} icon={BookOpen} variant="default" />
        <StatCard label="Pending Grading" value={12} icon={AlertCircle} variant="warning" />
        <StatCard label="Completed This Term" value={45} icon={CheckCircle2} variant="success" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="homework">Homework</TabsTrigger>
          </TabsList>
          <FilterBar
            searchPlaceholder="Search by title, subject..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        </div>

        <TabsContent value="assignments" className="space-y-6">
          {pagedAssignments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No assignments found"
              description="Try adjusting your filters or create a new assignment."
              action={<Button onClick={() => setOpen(true)}>Create Assignment</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagedAssignments.map((assignment) => (
                <Card key={assignment.id} className="flex flex-col hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <Badge variant="outline" className="mb-2">{assignment.class}</Badge>
                      <Badge variant={getStatusColor(assignment.status)} className="capitalize">
                        {assignment.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1" title={assignment.title}>
                      {assignment.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">{assignment.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {assignment.description}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" /> Due Date
                        </span>
                        <span className="font-medium">{assignment.dueDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Submissions
                        </span>
                        <span className="font-medium">{assignment.submissions}/{assignment.totalStudents}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 border-t bg-muted/5">
                    <Button variant="ghost" className="w-full text-xs h-8">View Details</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          {pagedAssignments.length > 0 && (
            <div className="mt-4">
              <TablePagination
                currentPage={assignmentsPage}
                totalPages={assignmentsTotal}
                onPageChange={setAssignmentsPage}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="homework" className="space-y-6">
          {pagedHomework.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No homework found"
              description="Try adjusting your filters or create new homework."
              action={<Button onClick={() => setOpen(true)}>Create Homework</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagedHomework.map((item) => (
                <Card key={item.id} className="flex flex-col hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <Badge variant="outline" className="mb-2">{item.class}</Badge>
                      <Badge variant={getStatusColor(item.status)} className="capitalize">
                        {item.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1" title={item.title}>
                      {item.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">{item.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Due Date
                      </span>
                      <span className="font-medium">{item.dueDate}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 border-t bg-muted/5">
                    <Button variant="ghost" className="w-full text-xs h-8">View Details</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          {pagedHomework.length > 0 && (
            <div className="mt-4">
              <TablePagination
                currentPage={homeworkPage}
                totalPages={homeworkTotal}
                onPageChange={setHomeworkPage}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherAssignments;
