import { useMemo, useState } from "react";
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  UserPlus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Teacher = {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "pending" | "approved" | "deactivated" | "rejected";
  isApproved?: boolean;
  isActive?: boolean;
  academicInfo?: { subjects?: string[] };
  employmentInfo?: { position?: string };
  createdAt?: string;
};

type ApiPendingTeachersResponse = {
  success: boolean;
  data: { teachers: Teacher[] };
  message?: string;
};

type ApiTeachersListResponse = {
  success: boolean;
  data: { teachers: Teacher[]; pagination?: unknown };
  message?: string;
};

type ApiActionResponse = {
  success: boolean;
  message?: string;
  data?: { teacher: Teacher };
};

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:5000";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as HeadersInit;
};

const TeacherManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Data fetching
  const pendingQuery = useQuery({
    queryKey: ["head", "pending-teachers"],
    queryFn: async (): Promise<Teacher[]> => {
      const res = await fetch(`${apiBaseUrl}/api/head/pending-teachers`, {
        headers: authHeaders(),
      });
      const data = (await res.json()) as ApiPendingTeachersResponse;
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Failed to load pending teachers");
      }
      return data.data.teachers as Teacher[];
    },
  });

  const approvedQuery = useQuery({
    queryKey: ["head", "approved-teachers"],
    queryFn: async (): Promise<Teacher[]> => {
      const res = await fetch(
        `${apiBaseUrl}/api/head/teachers?status=approved`,
        {
          headers: authHeaders(),
        }
      );
      const data = (await res.json()) as ApiTeachersListResponse;
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Failed to load teachers");
      }
      // API returns { teachers, pagination }
      return (data.data.teachers as Teacher[]) ?? [];
    },
  });

  const pendingTeachers = useMemo(
    () => pendingQuery.data ?? [],
    [pendingQuery.data]
  );
  const activeTeachers = useMemo(
    () => approvedQuery.data ?? [],
    [approvedQuery.data]
  );

  const handleApprove = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDialogOpen(true);
  };

  const approveMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      const res = await fetch(
        `${apiBaseUrl}/api/head/teachers/${teacherId}/approve`,
        {
          method: "PATCH",
          headers: authHeaders(),
        }
      );
      const data = (await res.json()) as ApiActionResponse;
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Failed to approve teacher");
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Teacher approved",
        description: "The teacher can now log in.",
      });
      setDialogOpen(false);
      setSelectedTeacher(null);
      void queryClient.invalidateQueries({
        queryKey: ["head", "pending-teachers"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["head", "approved-teachers"],
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Approval failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      const res = await fetch(
        `${apiBaseUrl}/api/head/teachers/${teacherId}/reject`,
        {
          method: "PATCH",
          headers: authHeaders(),
        }
      );
      const data = (await res.json()) as ApiActionResponse;
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Failed to reject teacher");
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Teacher rejected",
        description: "The teacher cannot log in.",
      });
      void queryClient.invalidateQueries({
        queryKey: ["head", "pending-teachers"],
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Rejection failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const stats = [
    {
      title: "Total Active",
      value: activeTeachers.length,
      icon: Users,
      color: "text-success",
    },
    {
      title: "Pending Approval",
      value: pendingTeachers.length,
      icon: UserPlus,
      color: "text-warning",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Teacher Management
        </h1>
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
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
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
              <CardDescription>
                All approved and active teacher accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading teachers...
                </p>
              ) : approvedQuery.isError ? (
                <p className="text-sm text-destructive">
                  {(approvedQuery.error as Error).message}
                </p>
              ) : (
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
                    {activeTeachers.map((t) => {
                      const id = (t._id || t.id) as string;
                      const name = `${t.firstName} ${t.lastName}`;
                      const subjects =
                        t.academicInfo?.subjects ??
                        (t.employmentInfo?.position
                          ? [t.employmentInfo.position]
                          : []);
                      const dateJoined = t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString()
                        : "—";
                      return (
                        <TableRow key={id}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {subjects.length === 0 ? (
                                <span className="text-sm text-muted-foreground">
                                  —
                                </span>
                              ) : (
                                subjects.map((subject) => (
                                  <Badge key={subject} variant="secondary">
                                    {subject}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{t.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{dateJoined}</TableCell>
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
                      );
                    })}
                  </TableBody>
                </Table>
              )}
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
              {pendingQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading pending teachers...
                </p>
              ) : pendingQuery.isError ? (
                <p className="text-sm text-destructive">
                  {(pendingQuery.error as Error).message}
                </p>
              ) : (
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
                    {pendingTeachers.map((t) => {
                      const id = (t._id || t.id) as string;
                      const name = `${t.firstName} ${t.lastName}`;
                      const subjects =
                        t.academicInfo?.subjects ??
                        (t.employmentInfo?.position
                          ? [t.employmentInfo.position]
                          : []);
                      const dateApplied = t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString()
                        : "—";
                      return (
                        <TableRow key={id}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {subjects.length === 0 ? (
                                <span className="text-sm text-muted-foreground">
                                  —
                                </span>
                              ) : (
                                subjects.map((subject) => (
                                  <Badge key={subject} variant="secondary">
                                    {subject}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{t.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{dateApplied}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={rejectMutation.isPending}
                                onClick={() => rejectMutation.mutate(id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(t)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
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
              Confirm approval for{" "}
              {selectedTeacher
                ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Teacher Name</p>
              <p className="font-medium">
                {selectedTeacher
                  ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                  : ""}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Subject(s)</p>
              <div className="flex flex-wrap gap-1">
                {(
                  selectedTeacher?.academicInfo?.subjects ??
                  (selectedTeacher?.employmentInfo?.position
                    ? [selectedTeacher.employmentInfo.position]
                    : [])
                ).map((subject) => (
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
            <Button
              onClick={() => {
                if (selectedTeacher) {
                  const id = (selectedTeacher._id ||
                    selectedTeacher.id) as string;
                  approveMutation.mutate(id);
                }
              }}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherManagement;
