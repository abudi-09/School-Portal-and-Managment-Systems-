import { useEffect, useState } from "react";
import { Search, Filter, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import UserTable from "@/components/UserTable";
import { useAuth } from "@/contexts/useAuth";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import TablePagination from "@/components/shared/TablePagination";
import {
  StatCardSkeleton,
  TableSkeletonRows,
} from "@/components/shared/LoadingSkeletons";

type APIUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
  isActive?: boolean;
};

const AdminUserManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("students");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ROWS_PER_PAGE = 6;

  // Per-tab pagination state
  const [studentsPage, setStudentsPage] = useState(1);
  const [teachersPage, setTeachersPage] = useState(1);
  const [headsPage, setHeadsPage] = useState(1);
  const [adminsPage, setAdminsPage] = useState(1);

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as HeadersInit;
  };

  // live data from API
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/api/users`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.message || "Failed to load users");
      return json.data.users as APIUser[];
    },
    enabled: !!user && user.role === "admin",
  });

  useEffect(() => {
    if (usersQuery.data) {
      // no-op, component reads from usersQuery.data directly
    }
  }, [usersQuery.data]);

  const handleToggleStatus = (userName: string, currentStatus: string) => {
    toast({
      title:
        currentStatus === "active"
          ? "Account Deactivated"
          : "Account Activated",
      description: `${userName}'s account has been ${
        currentStatus === "active" ? "deactivated" : "activated"
      }.`,
    });
  };

  // derive role-specific lists from live API data
  const allUsers = usersQuery.data ?? [];
  const students = allUsers.filter(
    (u) => (u.role ?? "").toLowerCase() === "student"
  );
  const teachers = allUsers.filter(
    (u) => (u.role ?? "").toLowerCase() === "teacher"
  );
  const heads = allUsers.filter((u) => (u.role ?? "").toLowerCase() === "head");
  // Separate query to fetch admins because GET /api/users (approved users) may exclude existing admins
  const adminsQuery = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: async () => {
      const res = await fetch(`${apiBaseUrl}/api/users/role/admin`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.message || "Failed to load admins");
      return json.data.users as APIUser[];
    },
    enabled: !!user && user.role === "admin",
  });

  const adminsFromAll = adminsQuery.data ?? [];
  const isUsersLoading = usersQuery.isLoading;
  const isAdminsLoading = adminsQuery.isLoading;

  // Search state (shared across tabs) with debounce
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const matchesQuery = (u: APIUser, q: string) => {
    if (!q) return true;
    const low = q.toLowerCase();
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return (
      fullName.includes(low) ||
      (u.email ?? "").toLowerCase().includes(low) ||
      (u._id ?? "").toLowerCase().includes(low)
    );
  };

  const filteredStudents = students.filter((s) =>
    matchesQuery(s, debouncedSearch)
  );
  const filteredTeachers = teachers.filter((t) =>
    matchesQuery(t, debouncedSearch)
  );
  const filteredHeads = heads.filter((h) => matchesQuery(h, debouncedSearch));
  const filteredAdmins = adminsFromAll.filter((a) =>
    matchesQuery(a, debouncedSearch)
  );

  // Reset pages on search change
  useEffect(() => {
    setStudentsPage(1);
    setTeachersPage(1);
    setHeadsPage(1);
    setAdminsPage(1);
  }, [debouncedSearch]);

  // Clamp current pages within range when filtered counts change
  const studentsTotalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / ROWS_PER_PAGE)
  );
  const teachersTotalPages = Math.max(
    1,
    Math.ceil(filteredTeachers.length / ROWS_PER_PAGE)
  );
  const headsTotalPages = Math.max(
    1,
    Math.ceil(filteredHeads.length / ROWS_PER_PAGE)
  );
  const adminsTotalPages = Math.max(
    1,
    Math.ceil(filteredAdmins.length / ROWS_PER_PAGE)
  );

  useEffect(() => {
    if (studentsPage > studentsTotalPages) setStudentsPage(studentsTotalPages);
  }, [studentsPage, studentsTotalPages]);
  useEffect(() => {
    if (teachersPage > teachersTotalPages) setTeachersPage(teachersTotalPages);
  }, [teachersPage, teachersTotalPages]);
  useEffect(() => {
    if (headsPage > headsTotalPages) setHeadsPage(headsTotalPages);
  }, [headsPage, headsTotalPages]);
  useEffect(() => {
    if (adminsPage > adminsTotalPages) setAdminsPage(adminsTotalPages);
  }, [adminsPage, adminsTotalPages]);

  // Compute paginated slices
  const pagedStudents = filteredStudents.slice(
    (studentsPage - 1) * ROWS_PER_PAGE,
    studentsPage * ROWS_PER_PAGE
  );
  const pagedTeachers = filteredTeachers.slice(
    (teachersPage - 1) * ROWS_PER_PAGE,
    teachersPage * ROWS_PER_PAGE
  );
  const pagedHeads = filteredHeads.slice(
    (headsPage - 1) * ROWS_PER_PAGE,
    headsPage * ROWS_PER_PAGE
  );
  const pagedAdmins = filteredAdmins.slice(
    (adminsPage - 1) * ROWS_PER_PAGE,
    adminsPage * ROWS_PER_PAGE
  );

  const stats = {
    students: {
      total: students.length,
      active: students.filter((s) => s.isActive === true).length,
      inactive: students.filter((s) => s.isActive !== true).length,
    },
    teachers: {
      total: teachers.length,
      active: teachers.filter((t) => t.isActive === true).length,
      inactive: teachers.filter((t) => t.isActive !== true).length,
    },
    heads: {
      total: heads.length,
      active: heads.filter((h) => h.isActive === true).length,
      inactive: heads.filter((h) => h.isActive !== true).length,
    },
  };

  type UserItem = {
    id?: number | string;
    name?: string;
    userId?: string;
    class?: string;
    subject?: string;
    department?: string;
    status?: string;
    joined?: string;
  };

  // Helper to render a table skeleton matching UserTable's columns
  const renderUserTableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Full Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableSkeletonRows rows={6} cols={6} />
      </TableBody>
    </Table>
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage all user accounts across the system
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full md:w-auto grid-cols-4">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="heads">Heads</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isUsersLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Total Students
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {stats.students.total}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Active
                        </p>
                        <p className="text-3xl font-bold text-success">
                          {stats.students.active}
                        </p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Inactive
                        </p>
                        <p className="text-3xl font-bold text-muted-foreground">
                          {stats.students.inactive}
                        </p>
                      </div>
                      <XCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
              {user && user.role === "admin" ? (
                <>
                  {isUsersLoading && pagedStudents.length === 0 ? (
                    renderUserTableSkeleton()
                  ) : (
                    <UserTable
                      users={pagedStudents.map((s) => ({
                        _id: s._id,
                        firstName: s.firstName,
                        lastName: s.lastName,
                        email: s.email,
                        role: s.role,
                        status:
                          s.status ?? (s.isActive ? "approved" : "inactive"),
                        createdAt: s.createdAt,
                      }))}
                      onUpgrade={async (id) => {
                        try {
                          const res = await fetch(
                            `${apiBaseUrl}/api/users/${id}/upgrade`,
                            {
                              method: "PATCH",
                              headers: authHeaders(),
                            }
                          );
                          const json = await res.json();
                          if (!res.ok || !json?.success)
                            throw new Error(
                              json?.message || "Failed to upgrade user"
                            );
                          toast({
                            title: "Success",
                            description: json.message,
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["admin", "users"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["admin", "admins"],
                          });
                        } catch (error: unknown) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : String(error);
                          toast({
                            title: "Upgrade failed",
                            description: message,
                            variant: "destructive",
                          });
                        }
                      }}
                      showUpgrade={user.role === "admin"}
                    />
                  )}
                  <TablePagination
                    currentPage={studentsPage}
                    totalPages={studentsTotalPages}
                    onPageChange={setStudentsPage}
                  />
                </>
              ) : (
                <p className="text-muted-foreground">
                  You must be an admin to view users.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isUsersLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Total Teachers
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {stats.teachers.total}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Active
                        </p>
                        <p className="text-3xl font-bold text-success">
                          {stats.teachers.active}
                        </p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Inactive
                        </p>
                        <p className="text-3xl font-bold text-muted-foreground">
                          {stats.teachers.inactive}
                        </p>
                      </div>
                      <XCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
              {user && user.role === "admin" ? (
                <>
                  {isUsersLoading && pagedTeachers.length === 0 ? (
                    renderUserTableSkeleton()
                  ) : (
                    <UserTable
                      users={pagedTeachers.map((t) => ({
                        _id: t._id,
                        firstName: t.firstName,
                        lastName: t.lastName,
                        email: t.email,
                        role: t.role,
                        status:
                          t.status ?? (t.isActive ? "approved" : "inactive"),
                        createdAt: t.createdAt,
                      }))}
                      onUpgrade={async (id) => {
                        try {
                          const res = await fetch(
                            `${apiBaseUrl}/api/users/${id}/upgrade`,
                            {
                              method: "PATCH",
                              headers: authHeaders(),
                            }
                          );
                          const json = await res.json();
                          if (!res.ok || !json?.success)
                            throw new Error(
                              json?.message || "Failed to upgrade user"
                            );
                          toast({
                            title: "Success",
                            description: json.message,
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["admin", "users"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["admin", "admins"],
                          });
                        } catch (error: unknown) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : String(error);
                          toast({
                            title: "Upgrade failed",
                            description: message,
                            variant: "destructive",
                          });
                        }
                      }}
                      showUpgrade={user.role === "admin"}
                    />
                  )}
                  <TablePagination
                    currentPage={teachersPage}
                    totalPages={teachersTotalPages}
                    onPageChange={setTeachersPage}
                  />
                </>
              ) : (
                <p className="text-muted-foreground">
                  You must be an admin to view users.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heads Tab */}
        <TabsContent value="heads" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isUsersLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Total Heads
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {stats.heads.total}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Active
                        </p>
                        <p className="text-3xl font-bold text-success">
                          {stats.heads.active}
                        </p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Inactive
                        </p>
                        <p className="text-3xl font-bold text-muted-foreground">
                          {stats.heads.inactive}
                        </p>
                      </div>
                      <XCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search heads..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
              {user && user.role === "admin" ? (
                <>
                  {isUsersLoading && pagedHeads.length === 0 ? (
                    renderUserTableSkeleton()
                  ) : (
                    <UserTable
                      users={pagedHeads.map((h) => ({
                        _id: h._id,
                        firstName: h.firstName,
                        lastName: h.lastName,
                        email: h.email,
                        role: h.role,
                        status:
                          h.status ?? (h.isActive ? "approved" : "inactive"),
                        createdAt: h.createdAt,
                      }))}
                      onUpgrade={async (id) => {
                        try {
                          const res = await fetch(
                            `${apiBaseUrl}/api/users/${id}/upgrade`,
                            {
                              method: "PATCH",
                              headers: authHeaders(),
                            }
                          );
                          const json = await res.json();
                          if (!res.ok || !json?.success)
                            throw new Error(
                              json?.message || "Failed to upgrade user"
                            );
                          toast({
                            title: "Success",
                            description: json.message,
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["admin", "users"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["admin", "admins"],
                          });
                        } catch (error: unknown) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : String(error);
                          toast({
                            title: "Upgrade failed",
                            description: message,
                            variant: "destructive",
                          });
                        }
                      }}
                      showUpgrade={user.role === "admin"}
                    />
                  )}
                  <TablePagination
                    currentPage={headsPage}
                    totalPages={headsTotalPages}
                    onPageChange={setHeadsPage}
                  />
                </>
              ) : (
                <p className="text-muted-foreground">
                  You must be an admin to view users.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-6">
          {/* Stats (derived from allUsers to include admins) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isAdminsLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Total Admins
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {adminsFromAll.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Active
                        </p>
                        <p className="text-3xl font-bold text-success">
                          {
                            adminsFromAll.filter((a) => a.isActive === true)
                              .length
                          }
                        </p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Inactive
                        </p>
                        <p className="text-3xl font-bold text-muted-foreground">
                          {
                            adminsFromAll.filter((a) => a.isActive !== true)
                              .length
                          }
                        </p>
                      </div>
                      <XCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admins..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
              <CardTitle>All Admins</CardTitle>
              <CardDescription>List of admin users</CardDescription>
            </CardHeader>
            <CardContent>
              {user && user.role === "admin" ? (
                <>
                  {isAdminsLoading && pagedAdmins.length === 0 ? (
                    renderUserTableSkeleton()
                  ) : (
                    <UserTable
                      users={pagedAdmins.map((a) => ({
                        _id: a._id,
                        firstName: a.firstName,
                        lastName: a.lastName,
                        email: a.email,
                        role: a.role,
                        status:
                          a.status ?? (a.isActive ? "approved" : "inactive"),
                        createdAt: a.createdAt,
                      }))}
                      onUpgrade={async (_id) => {
                        // no-op: admins cannot be upgraded further
                        toast({
                          title: "Info",
                          description: "User is already an admin",
                        });
                      }}
                      showUpgrade={false}
                    />
                  )}
                  <TablePagination
                    currentPage={adminsPage}
                    totalPages={adminsTotalPages}
                    onPageChange={setAdminsPage}
                  />
                </>
              ) : (
                <p className="text-muted-foreground">
                  You must be an admin to view users.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserManagement;
