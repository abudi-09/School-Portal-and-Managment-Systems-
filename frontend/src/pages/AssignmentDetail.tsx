import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Calendar, User, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/patterns";

const AssignmentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

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

  const handleDownloadAll = () => {
    toast({
      title: "Download Started",
      description: `Downloading all ${assignment.attachments.length} files...`,
    });
    assignment.attachments.forEach((file, index) => {
      setTimeout(() => {
        handleDownload(file.name, file.url);
      }, index * 500);
    });
  };

  // Mock assignment data
  const assignment = {
    id: id || "1",
    subject: "Mathematics",
    title: "Calculus Problem Set 5",
    description: "Complete problems 1-20 from Chapter 5 on Derivatives and Applications",
    detailedInstructions: `This assignment focuses on understanding derivatives and their real-world applications.

**Topics Covered:**
- Basic derivative rules
- Chain rule and product rule
- Applications of derivatives in motion
- Optimization problems

**Instructions:**
1. Show all your work clearly
2. Use proper mathematical notation
3. Explain your reasoning for word problems
4. Double-check your calculations

**Grading Rubric:**
- Correct answers: 60%
- Clear working and methodology: 30%
- Presentation and neatness: 10%

**Resources:**
- Textbook Chapter 5 (pages 120-145)
- Khan Academy videos on derivatives
- Practice problems available on the course website`,
    teacher: "Mrs. Johnson",
    dueDate: "2024-03-25",
    submittedDate: null,
    status: "pending",
    points: 100,
    attachments: [
      { name: "Problem_Set_5.pdf", size: "2.4 MB", url: "#" },
      { name: "Reference_Sheet.pdf", size: "1.1 MB", url: "#" },
    ],
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      submitted: "secondary",
      pending: "outline",
      graded: "default",
      late: "destructive",
    };
    return <Badge variant={variants[status] || "outline"} className="capitalize">{status}</Badge>;
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Assignment Details"
        description="View assignment instructions, resources, and submit your work."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assignments", href: "/assignments" },
          { label: assignment.title },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{assignment.subject}</Badge>
                    {getStatusBadge(assignment.status)}
                  </div>
                  <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Description
                </h3>
                <p className="text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-lg border border-border/50">
                  {assignment.description}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Detailed Instructions</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {assignment.detailedInstructions}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attachments</CardTitle>
              <CardDescription>Resources provided by your teacher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignment.attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDownload(file.name, file.url)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleDownloadAll}>
                <Download className="h-4 w-4" /> Download All
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Points</span>
                <span className="font-bold text-lg">{assignment.points}</span>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{assignment.teacher}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Status: <span className="capitalize">{assignment.status}</span></span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {assignment.status === "pending" ? (
                <Button className="w-full gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Submit Assignment
                </Button>
              ) : (
                <Button variant="secondary" className="w-full" disabled>
                  Submitted
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" /> Important
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Late submissions may be subject to a grade penalty. Please ensure you upload all required files before the deadline.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
