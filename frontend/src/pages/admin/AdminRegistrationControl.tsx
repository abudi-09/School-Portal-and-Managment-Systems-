import { useState } from "react";
import { Power, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const AdminRegistrationControl = () => {
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const { toast } = useToast();

  const pendingRegistrations = [
    {
      id: 1,
      name: "Alex Thompson",
      grade: "10A",
      submittedDate: "2024-01-20",
      paymentProof: "receipt_001.pdf",
      type: "New",
    },
    {
      id: 2,
      name: "Sophie Martinez",
      grade: "11B",
      submittedDate: "2024-01-21",
      paymentProof: "receipt_002.pdf",
      type: "New",
    },
  ];

  const approvedRegistrations = [
    {
      id: 1,
      name: "John Smith",
      studentId: "STU-2024-001",
      grade: "11A",
      approvedDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Emma Wilson",
      studentId: "STU-2024-002",
      grade: "11A",
      approvedDate: "2024-01-15",
    },
  ];

  const returningStudents = [
    {
      id: 1,
      name: "Michael Brown",
      studentId: "STU-2023-055",
      previousGrade: "10B",
      newGrade: "11B",
      status: "pending",
    },
  ];

  const handleToggleRegistration = (enabled: boolean) => {
    setRegistrationEnabled(enabled);
    toast({
      title: enabled ? "Registration Enabled" : "Registration Disabled",
      description: enabled
        ? "Student registration is now open."
        : "Student registration has been closed.",
    });
  };

  const handleApprove = (name: string) => {
    toast({
      title: "Registration Approved",
      description: `${name}'s registration has been approved and student ID generated.`,
    });
  };

  const handleReject = (name: string) => {
    toast({
      title: "Registration Rejected",
      description: `${name}'s registration has been rejected.`,
      variant: "destructive",
    });
  };

  const handleUpdateReturning = (name: string) => {
    toast({
      title: "Student Updated",
      description: `${name}'s grade has been updated successfully.`,
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Registration Control</h1>
        <p className="text-muted-foreground">
          Manage student admissions and registration system
        </p>
      </div>

      {/* Registration Control Card */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>System Registration Control</CardTitle>
          <CardDescription>
            Enable or disable new student registrations system-wide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-6 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${registrationEnabled ? "bg-success text-success-foreground" : "bg-muted-foreground text-foreground"}`}>
                <Power className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">
                  Registration Status
                </p>
                <p className="text-sm text-muted-foreground">
                  Currently {registrationEnabled ? "accepting" : "not accepting"} new applications
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="flex items-center gap-3">
                  <Label htmlFor="registration-toggle" className="cursor-pointer">
                    {registrationEnabled ? "Enabled" : "Disabled"}
                  </Label>
                  <Switch
                    id="registration-toggle"
                    checked={registrationEnabled}
                    onCheckedChange={() => {}}
                  />
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {registrationEnabled ? "Disable Registration?" : "Enable Registration?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {registrationEnabled
                      ? "This will prevent new students from registering. Existing registrations will not be affected."
                      : "This will allow new students to register for admission."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleToggleRegistration(!registrationEnabled)}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold text-foreground">{pendingRegistrations.length}</p>
              </div>
              <Clock className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved</p>
                <p className="text-3xl font-bold text-success">{approvedRegistrations.length}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                <p className="text-3xl font-bold text-destructive">0</p>
              </div>
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Returning</p>
                <p className="text-3xl font-bold text-foreground">{returningStudents.length}</p>
              </div>
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="returning">Returning</TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Registrations</CardTitle>
              <CardDescription>
                Review and approve new student applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Payment Proof</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRegistrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">{reg.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{reg.grade}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{reg.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {reg.submittedDate}
                      </TableCell>
                      <TableCell>
                        <Button variant="link" size="sm" className="p-0 h-auto">
                          {reg.paymentProof}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(reg.name)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(reg.name)}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Registrations</CardTitle>
              <CardDescription>
                Students with approved registrations and generated IDs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Approved Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedRegistrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-mono text-sm">
                        {reg.studentId}
                      </TableCell>
                      <TableCell className="font-medium">{reg.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{reg.grade}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {reg.approvedDate}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Returning Tab */}
        <TabsContent value="returning">
          <Card>
            <CardHeader>
              <CardTitle>Returning Students</CardTitle>
              <CardDescription>
                Update grade levels for returning students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Previous Grade</TableHead>
                    <TableHead>New Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returningStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">
                        {student.studentId}
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.previousGrade}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{student.newGrade}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Update
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUpdateReturning(student.name)}
                        >
                          Confirm Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminRegistrationControl;
