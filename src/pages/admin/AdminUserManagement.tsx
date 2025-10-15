import { useState } from "react";
import { Search, Filter, CheckCircle, XCircle } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const AdminUserManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("students");

  const students = [
    { id: 1, name: "John Smith", userId: "STU-2024-001", class: "11A", status: "active", joined: "2024-01-15" },
    { id: 2, name: "Emma Wilson", userId: "STU-2024-002", class: "11A", status: "active", joined: "2024-01-15" },
    { id: 3, name: "Michael Brown", userId: "STU-2024-003", class: "11B", status: "inactive", joined: "2024-01-16" },
  ];

  const teachers = [
    { id: 1, name: "Dr. Sarah Johnson", userId: "TCH-2024-001", subject: "Mathematics", status: "active", joined: "2024-01-10" },
    { id: 2, name: "Prof. James Wilson", userId: "TCH-2024-002", subject: "Physics", status: "active", joined: "2024-01-10" },
    { id: 3, name: "Ms. Emily Davis", userId: "TCH-2024-003", subject: "English", status: "inactive", joined: "2024-01-11" },
  ];

  const heads = [
    { id: 1, name: "Mr. Robert Anderson", userId: "HEAD-2024-001", department: "Science", status: "active", joined: "2024-01-05" },
    { id: 2, name: "Mrs. Linda Martinez", userId: "HEAD-2024-002", department: "Arts", status: "active", joined: "2024-01-05" },
  ];

  const handleToggleStatus = (userName: string, currentStatus: string) => {
    toast({
      title: currentStatus === "active" ? "Account Deactivated" : "Account Activated",
      description: `${userName}'s account has been ${currentStatus === "active" ? "deactivated" : "activated"}.`,
    });
  };

  const stats = {
    students: {
      total: students.length,
      active: students.filter(s => s.status === "active").length,
      inactive: students.filter(s => s.status === "inactive").length,
    },
    teachers: {
      total: teachers.length,
      active: teachers.filter(t => t.status === "active").length,
      inactive: teachers.filter(t => t.status === "inactive").length,
    },
    heads: {
      total: heads.length,
      active: heads.filter(h => h.status === "active").length,
      inactive: heads.filter(h => h.status === "inactive").length,
    },
  };

  const renderTable = (data: any[], type: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>{type === "students" ? "Class" : type === "teachers" ? "Subject" : "Department"}</TableHead>
          <TableHead>Date Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-mono text-sm">{item.userId}</TableCell>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {type === "students" ? item.class : type === "teachers" ? item.subject : item.department}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{item.joined}</TableCell>
            <TableCell>
              <Badge variant={item.status === "active" ? "default" : "outline"}>
                {item.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(item.name, item.status)}
              >
                {item.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage all user accounts across the system
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="heads">Heads</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                    <p className="text-3xl font-bold text-foreground">{stats.students.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active</p>
                    <p className="text-3xl font-bold text-success">{stats.students.active}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Inactive</p>
                    <p className="text-3xl font-bold text-muted-foreground">{stats.students.inactive}</p>
                  </div>
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search students..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
              <CardDescription>Manage student account status</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(students, "students")}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Teachers</p>
                    <p className="text-3xl font-bold text-foreground">{stats.teachers.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active</p>
                    <p className="text-3xl font-bold text-success">{stats.teachers.active}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Inactive</p>
                    <p className="text-3xl font-bold text-muted-foreground">{stats.teachers.inactive}</p>
                  </div>
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Teachers</CardTitle>
              <CardDescription>Manage teacher account status</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(teachers, "teachers")}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heads Tab */}
        <TabsContent value="heads" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Heads</p>
                    <p className="text-3xl font-bold text-foreground">{stats.heads.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active</p>
                    <p className="text-3xl font-bold text-success">{stats.heads.active}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Inactive</p>
                    <p className="text-3xl font-bold text-muted-foreground">{stats.heads.inactive}</p>
                  </div>
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search heads..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Heads</CardTitle>
              <CardDescription>Manage head account status</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(heads, "heads")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserManagement;
