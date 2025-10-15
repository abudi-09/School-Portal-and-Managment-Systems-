import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const AssignmentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock assignment data - would come from API/context in production
  const assignment = {
    id: id || '1',
    subject: 'Mathematics',
    title: 'Calculus Problem Set 5',
    description: 'Complete problems 1-20 from Chapter 5 on Derivatives and Applications',
    detailedInstructions: `
      This assignment focuses on understanding derivatives and their real-world applications.
      
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
      - Practice problems available on the course website
    `,
    teacher: 'Mrs. Johnson',
    dueDate: '2024-03-25',
    submittedDate: null,
    status: 'pending',
    points: 100,
    attachments: [
      { name: 'Problem_Set_5.pdf', size: '2.4 MB', url: '#' },
      { name: 'Reference_Sheet.pdf', size: '1.1 MB', url: '#' },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'default';
      case 'graded':
        return 'secondary';
      case 'late':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/assignments')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </Button>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{assignment.subject}</Badge>
                <Badge variant={getStatusColor(assignment.status)}>
                  {assignment.status}
                </Badge>
              </div>
              <CardTitle className="text-3xl">{assignment.title}</CardTitle>
              <CardDescription>{assignment.description}</CardDescription>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Worth</p>
              <p className="text-2xl font-bold text-primary">{assignment.points} pts</p>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-6 pt-6">
          {/* Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <User className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teacher</p>
                <p className="font-medium">{assignment.teacher}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attachments</p>
                <p className="font-medium">{assignment.attachments.length} files</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Detailed Instructions */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Detailed Instructions</h3>
            <div className="prose prose-sm max-w-none bg-secondary/30 p-6 rounded-lg">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {assignment.detailedInstructions}
              </pre>
            </div>
          </div>

          <Separator />

          {/* Attachments */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Attachments</h3>
            <div className="space-y-2">
              {assignment.attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{file.size}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {assignment.status === 'pending' && (
              <Button className="gap-2">
                Submit Assignment
              </Button>
            )}
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download All Files
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentDetail;
