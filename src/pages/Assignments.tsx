import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Paperclip,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Assignments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const handleDownload = (fileName: string, fileUrl: string) => {
    // In a real application, this would download the actual file from the server
    toast({
      title: "Download Started",
      description: `Downloading ${fileName}...`,
    });

    // Simulate download delay
    setTimeout(() => {
      // Create a mock download by creating a blob and triggering download
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
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />;
      case "graded":
        return <CheckCircle2 className="h-5 w-5 text-accent" />;
      case "late":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string, grade?: number) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      submitted: "default",
      pending: "secondary",
      graded: "default",
      late: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status === "graded" && grade ? `Graded: ${grade}%` : status}
      </Badge>
    );
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSubject =
      filterSubject === "all" || assignment.subject === filterSubject;
    const matchesStatus =
      filterStatus === "all" || assignment.status === filterStatus;
    return matchesSubject && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage your assignments and homework
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="homework">Homework</TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="History">History</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignments List */}
          <div className="grid gap-4">
            {filteredAssignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(assignment.status)}
                        <CardTitle className="text-lg">
                          {assignment.title}
                        </CardTitle>
                      </div>
                      <CardDescription>
                        {assignment.description}
                      </CardDescription>
                    </div>
                    {getStatusBadge(assignment.status, assignment.grade)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="outline">{assignment.subject}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Due:{" "}
                          {new Date(assignment.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      {assignment.hasAttachment && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Paperclip className="h-4 w-4" />
                          <span>
                            {assignment.attachments.length} attachment
                            {assignment.attachments.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {assignment.attachments.map((attachment, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownload(attachment.name, attachment.url)
                          }
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/assignment/${assignment.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Homework Tab */}
        <TabsContent value="homework" className="space-y-6">
          <div className="grid gap-4">
            {homework.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(item.status)}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.pages}</CardDescription>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <Badge variant="outline">{item.subject}</Badge>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Due: {new Date(item.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      {item.hasAttachment && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Paperclip className="h-4 w-4" />
                          <span>
                            {item.attachments.length} attachment
                            {item.attachments.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {item.attachments.map((attachment, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownload(attachment.name, attachment.url)
                          }
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Assignments;
