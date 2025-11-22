import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Paperclip,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  BookOpen,
  FileText,
  GraduationCap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, StatCard, FilterBar, EmptyState } from "@/components/patterns";

const Assignments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleDownload = (fileName: string, fileUrl: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${fileName}...`,
    });
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Download Complete",
        description: `${fileName} has been downloaded successfully.`,
      });
    }, 1000);
  };

  const assignments = [
    {
      id: 1,
      title: "Physics Lab Report - Newton's Laws",
      subject: "Physics",
      deadline: "2025-10-15",
      status: "pending",
      description: "Complete lab report with calculations and analysis",
      hasAttachment: true,
      attachments: [
        { name: "Lab_Report_Template.pdf", size: "1.2 MB", url: "#" },
        { name: "Lab_Data_Sheet.xlsx", size: "245 KB", url: "#" },
      ],
    },
    {
      id: 2,
      title: "English Essay - Shakespeare Analysis",
      subject: "English",
      deadline: "2025-10-18",
      status: "pending",
      description: "Write a 1500-word essay analyzing themes in Hamlet",
      hasAttachment: false,
      attachments: [],
    },
    {
      id: 3,
      title: "Math Problem Set - Calculus",
      subject: "Mathematics",
      deadline: "2025-10-20",
      status: "submitted",
      grade: 92,
      description: "Complete problems 1-25 from chapter 8",
      hasAttachment: true,
      attachments: [
        { name: "Calculus_Problems.pdf", size: "3.1 MB", url: "#" },
      ],
    },
    {
      id: 4,
      title: "History Project - World War II",
      subject: "History",
      deadline: "2025-10-22",
      status: "graded",
      grade: 88,
      description: "Research presentation on WWII impact",
      hasAttachment: true,
      attachments: [
        { name: "WWII_Project_Guide.pdf", size: "2.8 MB", url: "#" },
        { name: "Research_Sources.doc", size: "1.5 MB", url: "#" },
      ],
    },
    {
      id: 5,
      title: "Chemistry Lab - Titration",
      subject: "Chemistry",
      deadline: "2025-10-12",
      status: "late",
      description: "Complete titration experiment and submit results",
      hasAttachment: true,
      attachments: [
        { name: "Titration_Lab_Manual.pdf", size: "4.2 MB", url: "#" },
      ],
    },
  ];

  const homework = [
    {
      id: 1,
      title: "Math Homework - Chapter 9",
      subject: "Mathematics",
      deadline: "2025-10-14",
      status: "pending",
      pages: "Pages 245-250, Problems 1-30",
      hasAttachment: true,
      attachments: [
        { name: "Chapter_9_Worksheet.pdf", size: "1.8 MB", url: "#" },
      ],
    },
    {
      id: 2,
      title: "Physics Problems",
      subject: "Physics",
      deadline: "2025-10-16",
      status: "submitted",
      pages: "Pages 180-185, All questions",
      hasAttachment: false,
      attachments: [],
    },
    {
      id: 3,
      title: "English Reading",
      subject: "English",
      deadline: "2025-10-17",
      status: "pending",
      pages: "Chapters 5-8 with notes",
      hasAttachment: true,
      attachments: [
        { name: "Reading_Assignment.pdf", size: "2.1 MB", url: "#" },
        { name: "Study_Guide.doc", size: "856 KB", url: "#" },
      ],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "graded":
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      case "late":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string, grade?: number) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      submitted: "secondary",
      pending: "outline",
      graded: "default",
      late: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status === "graded" && grade ? `Graded: ${grade}%` : status}
      </Badge>
    );
  };

  const filterItems = (items: any[]) => {
    return items.filter((item) => {
      const matchesSubject = filterSubject === "all" || item.subject === filterSubject;
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSubject && matchesStatus && matchesSearch;
    });
  };

  const filteredAssignments = filterItems(assignments);
  const filteredHomework = filterItems(homework);

  // Stats Calculation
  const pendingCount = assignments.filter(a => a.status === "pending").length + homework.filter(h => h.status === "pending").length;
  const submittedCount = assignments.filter(a => a.status === "submitted").length + homework.filter(h => h.status === "submitted").length;
  const gradedCount = assignments.filter(a => a.status === "graded").length;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Assignments"
        description="Track and manage your academic tasks and homework."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Assignments" }]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Pending Tasks"
          value={pendingCount}
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          description="Assignments & homework due soon"
        />
        <StatCard
          title="Submitted"
          value={submittedCount}
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          description="Waiting for grading"
        />
        <StatCard
          title="Graded"
          value={gradedCount}
          icon={<GraduationCap className="h-4 w-4 text-blue-500" />}
          description="Completed assignments"
        />
      </div>

      <Tabs defaultValue="assignments" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="assignments" className="gap-2">
              <FileText className="h-4 w-4" /> Assignments
            </TabsTrigger>
            <TabsTrigger value="homework" className="gap-2">
              <BookOpen className="h-4 w-4" /> Homework
            </TabsTrigger>
          </TabsList>
        </div>

        <FilterBar
          onSearch={setSearchQuery}
          filters={[
            {
              key: "subject",
              label: "Subject",
              options: [
                { label: "All Subjects", value: "all" },
                { label: "Mathematics", value: "Mathematics" },
                { label: "Physics", value: "Physics" },
                { label: "Chemistry", value: "Chemistry" },
                { label: "English", value: "English" },
                { label: "History", value: "History" },
              ],
              value: filterSubject,
              onChange: setFilterSubject,
            },
            {
              key: "status",
              label: "Status",
              options: [
                { label: "All Status", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Submitted", value: "submitted" },
                { label: "Graded", value: "graded" },
                { label: "Late", value: "late" },
              ],
              value: filterStatus,
              onChange: setFilterStatus,
            },
          ]}
        />

        <TabsContent value="assignments" className="space-y-6">
          {filteredAssignments.length > 0 ? (
            <div className="grid gap-4">
              {filteredAssignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(assignment.status)}
                          <CardTitle className="text-lg font-semibold">{assignment.title}</CardTitle>
                        </div>
                        <CardDescription className="line-clamp-1">{assignment.description}</CardDescription>
                      </div>
                      {getStatusBadge(assignment.status, assignment.grade)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="font-normal">
                        {assignment.subject}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                      </div>
                      {assignment.hasAttachment && (
                        <div className="flex items-center gap-1.5">
                          <Paperclip className="h-4 w-4" />
                          <span>{assignment.attachments.length} attachment{assignment.attachments.length !== 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 border-t bg-muted/20 flex justify-between items-center">
                    <div className="flex gap-2">
                      {assignment.attachments.map((attachment: any, index: number) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(attachment.name, attachment.url)}
                          className="h-8 px-2 text-xs gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {attachment.name.length > 20 ? attachment.name.substring(0, 20) + "..." : attachment.name}
                        </Button>
                      ))}
                    </div>
                    <Button size="sm" onClick={() => navigate(`/assignment/${assignment.id}`)} className="gap-2">
                      View Details <Eye className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No assignments found"
              description="Try adjusting your filters or search query."
              icon={FileText}
            />
          )}
        </TabsContent>

        <TabsContent value="homework" className="space-y-6">
          {filteredHomework.length > 0 ? (
            <div className="grid gap-4">
              {filteredHomework.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
                        </div>
                        <CardDescription className="line-clamp-1">{item.pages}</CardDescription>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="font-normal">
                        {item.subject}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {new Date(item.deadline).toLocaleDateString()}</span>
                      </div>
                      {item.hasAttachment && (
                        <div className="flex items-center gap-1.5">
                          <Paperclip className="h-4 w-4" />
                          <span>{item.attachments.length} attachment{item.attachments.length !== 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 border-t bg-muted/20 flex justify-end">
                    <div className="flex gap-2">
                      {item.attachments.map((attachment: any, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(attachment.name, attachment.url)}
                          className="h-8 gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No homework found"
              description="Try adjusting your filters or search query."
              icon={BookOpen}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Assignments;
