import { useState } from "react";
import { Users, Search, Filter, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TeacherManagement = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeTeachers = [
    {
      id: 1,
      name: "Ms. Jane Smith",
      subjects: ["Mathematics", "Calculus"],
      email: "jane.smith@school.edu",
      phone: "+1 (555) 123-4567",
      dateJoined: "2020-08-15",
      status: "active",
    },
    {
      id: 2,
      name: "Mr. David Johnson",
      subjects: ["Physics", "Chemistry"],
      email: "david.johnson@school.edu",
      phone: "+1 (555) 234-5678",
      dateJoined: "2019-09-01",
      status: "active",
    },
    {
      id: 3,
      name: "Dr. Sarah Williams",
      subjects: ["English Literature"],
      email: "sarah.williams@school.edu",
      phone: "+1 (555) 345-6789",
      dateJoined: "2021-01-10",
      status: "active",
    },
  ];

  const pendingTeachers = [
    {
      id: 4,
      name: "Dr. Michael Chen",
      subjects: ["Physics"],
      email: "michael.chen@school.edu",
      phone: "+1 (555) 456-7890",
      dateApplied: "2024-11-15",
      status: "pending",
    },
    {
      id: 5,
      name: "Ms. Emily Brown",
      subjects: ["History", "Geography"],
      email: "emily.brown@school.edu",
      phone: "+1 (555) 567-8901",
      dateApplied: "2024-11-14",
      status: "pending",
    },
  ];

  const handleApprove = (teacher: any) => {
    setSelectedTeacher(teacher);
    setDialogOpen(true);
  };

  const stats = [
    { title: "Total Active", value: activeTeachers.length, icon: Users, color: "text-success" },
    { title: "Pending Approval", value: pendingTeachers.length, icon: UserPlus, color: "text-warning" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Teacher Management</h1>
        <p className="text-muted-foreground">
          Manage teacher accounts, approvals, and assignments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search teachers..." className="pl-10" />
        </div>
        <Select>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            <SelectItem value="math">Mathematics</SelectItem>
            <SelectItem value="science">Science</SelectItem>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="history">History</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Teachers</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approval
            {pendingTeachers.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingTeachers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Teachers</CardTitle>
              <CardDescription>All approved and active teacher accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject(s)</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.map((subject) => (
                            <Badge key={subject} variant="secondary">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{teacher.email}</p>
                          <p className="text-muted-foreground">{teacher.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{teacher.dateJoined}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Deactivate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Teacher Approvals</CardTitle>
              <CardDescription>
                Review and approve new teacher registration requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject(s)</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.map((subject) => (
                            <Badge key={subject} variant="secondary">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{teacher.email}</p>
                          <p className="text-muted-foreground">{teacher.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{teacher.dateApplied}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button size="sm" onClick={() => handleApprove(teacher)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
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
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Teacher Registration</DialogTitle>
            <DialogDescription>
              Confirm approval for {selectedTeacher?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Teacher Name</p>
              <p className="font-medium">{selectedTeacher?.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Subject(s)</p>
              <div className="flex flex-wrap gap-1">
                {selectedTeacher?.subjects.map((subject: string) => (
                  <Badge key={subject} variant="secondary">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="text-sm">{selectedTeacher?.email}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialogOpen(false)}>
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherManagement;
