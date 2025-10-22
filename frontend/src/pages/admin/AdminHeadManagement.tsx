import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  Users,
  UserCheck,
  UserX,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import TablePagination from "@/components/shared/TablePagination";
import {
  ListCardSkeleton,
  StatCardSkeleton,
  TableSkeletonRows,
} from "@/components/shared/LoadingSkeletons";

type HeadStatus = "pending" | "active" | "inactive";

type Head = {
  id: string;
  fullName: string;
  email: string;
  status: HeadStatus;
  createdAt: string;
  department?: string;
  phone?: string;
  notes?: string;
};

type ApiHeadUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  status: "pending" | "approved" | "deactivated";
  isActive: boolean;
  createdAt: string;
  employmentInfo?: {
    department?: string;
    responsibilities?: string;
  };
  profile?: {
    phone?: string;
  };
};

type ActionType = "approve" | "activate" | "deactivate";

type PendingAction = {
  head: Head;
  type: ActionType;
};

const INITIAL_HEADS: Head[] = [];

const STATUS_LABELS: Record<HeadStatus, string> = {
  pending: "Pending",
  active: "Approval",
  inactive: "Rejected",
};

const STATUS_STYLES: Record<HeadStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-rose-100 text-rose-700",
};

const ACTION_COPY: Record<
  ActionType,
  {
    title: string;
    description: string;
    confirmLabel: string;
    nextStatus: HeadStatus;
    successTitle: string;
    successDescription: (name: string) => string;
  }
> = {
  approve: {
    title: "Approve Head of School",
    description:
      "This will approve and activate the selected Head of School account.",
    confirmLabel: "Approve",
    nextStatus: "active",
    successTitle: "Head Approved",
    successDescription: (name) => `${name} has been approved and activated.`,
  },
  activate: {
    title: "Activate Head of School",
    description:
      "The Head of School will regain full access to the administrative portal.",
    confirmLabel: "Activate",
    nextStatus: "active",
    successTitle: "Head Activated",
    successDescription: (name) => `${name} is now active in the system.`,
  },
  deactivate: {
    title: "Deactivate Head of School",
    description:
      "Access will be revoked until the account is reactivated by an admin.",
    confirmLabel: "Deactivate",
    nextStatus: "inactive",
    successTitle: "Head Deactivated",
    successDescription: (name) => `${name} was deactivated successfully.`,
  },
};

const mapUserStatus = (
  status: "pending" | "approved" | "deactivated",
  isActive: boolean
): HeadStatus => {
  if (status === "pending") {
    return "pending";
  }

  if (status === "approved" && isActive) {
    return "active";
  }

  return "inactive";
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

const AdminHeadManagement = () => {
  const [heads, setHeads] = useState<Head[]>(INITIAL_HEADS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<HeadStatus>("pending");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsHead, setDetailsHead] = useState<Head | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const { toast } = useToast();
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchHeads = useCallback(async () => {
    console.log("fetchHeads called, apiBaseUrl:", apiBaseUrl, "token:", token);
    if (!token) {
      setError("Authentication required. Please log in again.");
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // perform the fetch and capture any network-level errors
      const url = `${apiBaseUrl}/api/admin/users?role=head&limit=100`;
      console.log("fetching heads url:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // If the response is an HTTP error, try to read the body to log it
      if (!response.ok) {
        let bodyText = "";
        try {
          bodyText = await response.text();
        } catch (e) {
          console.error("Failed reading error body:", e);
        }
        console.error(
          "Head fetch failed",
          response.status,
          response.statusText,
          bodyText
        );

        if (response.status === 401) {
          console.log("401 received in fetchHeads, logging out");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }

        throw new Error(
          `Failed to load head accounts: ${response.status} ${response.statusText}`
        );
      }

      const payload = await response.json();
      const users = (payload?.data?.users ?? []) as ApiHeadUser[];

      const mapped: Head[] = users.map((user) => {
        const status = mapUserStatus(user.status, user.isActive);
        return {
          id: user._id,
          fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          email: user.email,
          status,
          createdAt: user.createdAt,
          department: user.employmentInfo?.department,
          phone: user.profile?.phone,
          notes: user.employmentInfo?.responsibilities,
        };
      });

      setHeads(mapped);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error loading heads";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, token]);

  useEffect(() => {
    fetchHeads().catch(() => {
      setError("Unable to fetch head accounts.");
      setIsLoading(false);
    });
  }, [fetchHeads]);

  const statusCounts = useMemo(
    () =>
      heads.reduce(
        (acc, head) => {
          acc[head.status] += 1;
          return acc;
        },
        { pending: 0, active: 0, inactive: 0 } as Record<HeadStatus, number>
      ),
    [heads]
  );

  const filteredHeads = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return heads.filter((head) => {
      const matchesSearch = normalizedSearch
        ? head.fullName.toLowerCase().includes(normalizedSearch) ||
          head.email.toLowerCase().includes(normalizedSearch)
        : true;

      const matchesStatus = head.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [heads, searchTerm, statusFilter]);

  // Pagination (6 rows per page)
  const ROWS_PER_PAGE = 6;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredHeads.length / ROWS_PER_PAGE)
  );
  const last = page * ROWS_PER_PAGE;
  const first = last - ROWS_PER_PAGE;
  const paginatedHeads = filteredHeads.slice(first, last);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const handleActionRequest = (head: Head, type: ActionType) => {
    setPendingAction({ head, type });
    setConfirmationOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in again to manage accounts.",
        variant: "destructive",
      });
      return;
    }

    const { head, type } = pendingAction;
    const config = ACTION_COPY[type];

    setIsProcessingAction(true);

    try {
      const statusPayload = type === "deactivate" ? "deactivated" : "approved";

      const response = await fetch(
        `${apiBaseUrl}/api/admin/users/${head.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: statusPayload }),
        }
      );

      if (response.status === 401) {
        console.log("401 received in approveHead, logging out");
        // Token invalid, logout
        localStorage.removeItem("currentUser");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => undefined);
        const message = payload?.message ?? "Failed to update account status";
        throw new Error(message);
      }

      await fetchHeads();

      toast({
        title: config.successTitle,
        description: config.successDescription(head.fullName),
      });

      setConfirmationOpen(false);
      setPendingAction(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to update account";
      toast({
        title: "Action failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCancelAction = () => {
    setConfirmationOpen(false);
    setPendingAction(null);
  };

  const handleViewDetails = (head: Head) => {
    setDetailsHead(head);
    setDetailsOpen(true);
  };

  const closeDetails = (open: boolean) => {
    setDetailsOpen(open);
    if (!open) {
      setDetailsHead(null);
    }
  };

  const renderActions = (head: Head) => {
    const actions: JSX.Element[] = [];

    if (head.status === "pending") {
      actions.push(
        <Button
          key="approve"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => handleActionRequest(head, "approve")}
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Approve
        </Button>
      );
    }
    if (head.status === "inactive") {
      // offer to activate an inactive account
      actions.push(
        <Button
          key="activate"
          variant="outline"
          className="border-slate-200 text-slate-700 hover:bg-slate-50"
          onClick={() => handleActionRequest(head, "activate")}
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Activate
        </Button>
      );
    }

    if (head.status === "active") {
      // allow deactivation of active accounts
      actions.push(
        <Button
          key="deactivate"
          variant="outline"
          className="border-rose-200 text-rose-600 hover:bg-rose-50"
          onClick={() => handleActionRequest(head, "deactivate")}
        >
          <UserX className="mr-2 h-4 w-4" />
          Deactivate
        </Button>
      );
    }

    actions.push(
      <Button
        key="view"
        variant="outline"
        className="border-gray-200 text-gray-700 hover:bg-gray-100"
        onClick={() => handleViewDetails(head)}
      >
        <Eye className="mr-2 h-4 w-4" />
        View Details
      </Button>
    );

    return actions;
  };

  const summaryCards = [
    {
      label: "Total Heads of School",
      value: heads.length,
      icon: Users,
      accent: "bg-slate-100 text-slate-600",
    },
    {
      label: "Pending",
      value: statusCounts.pending,
      icon: Clock3,
      accent: "bg-amber-100 text-amber-600",
    },
    {
      label: "Approval",
      value: statusCounts.active,
      icon: UserCheck,
      accent: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Rejected",
      value: statusCounts.inactive,
      icon: UserX,
      accent: "bg-rose-100 text-rose-600",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Head Management
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Review onboarding progress, activate accounts, and keep Head of
              School access aligned with current roles.
            </p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 px-4 py-2 text-sm font-medium">
            {statusCounts.pending} Pending
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading && heads.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            : summaryCards.map(({ label, value, icon: Icon, accent }) => (
                <Card key={label} className="border-none shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between pb-6">
                    <div>
                      <span className="text-3xl font-semibold text-gray-900">
                        {value}
                      </span>
                    </div>
                    <div className={`rounded-full p-3 ${accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </section>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && heads.length === 0 && (
        <Card className="border-dashed border-gray-300 bg-muted/40">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Loading head accounts...
          </CardContent>
        </Card>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or email"
              className="pl-10"
            />
          </div>
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as HeadStatus)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              Pending ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Approval ({statusCounts.active})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Rejected ({statusCounts.inactive})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100">
              <TableHead className="text-gray-500">Head of School</TableHead>
              <TableHead className="text-gray-500">Status</TableHead>
              <TableHead className="text-gray-500">Created</TableHead>
              <TableHead className="text-right text-gray-500">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && heads.length === 0 && (
              <TableSkeletonRows rows={6} cols={4} />
            )}
            {paginatedHeads.map((head) => (
              <TableRow key={head.id} className="border-gray-100">
                <TableCell className="align-top">
                  <div className="font-semibold text-gray-900">
                    {head.fullName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {head.email}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <span
                    className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                      STATUS_STYLES[head.status]
                    }`}
                  >
                    {STATUS_LABELS[head.status]}
                  </span>
                </TableCell>
                <TableCell className="align-top text-gray-600">
                  {formatDate(head.createdAt)}
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex justify-end gap-2">
                    {renderActions(head)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredHeads.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-gray-500"
                >
                  No Head of School records match your filters.
                </TableCell>
              </TableRow>
            )}
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-muted-foreground"
                >
                  Loading head accounts...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="border-t border-gray-100"
        />
      </div>

      <div className="grid gap-4 lg:hidden">
        {isLoading && heads.length === 0 && <ListCardSkeleton count={6} />}
        {paginatedHeads.map((head) => (
          <div
            key={head.id}
            className="bg-white shadow rounded-2xl border border-gray-200 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {head.fullName}
                </p>
                <p className="text-sm text-muted-foreground">{head.email}</p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  STATUS_STYLES[head.status]
                }`}
              >
                {STATUS_LABELS[head.status]}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Joined {formatDate(head.createdAt)}
            </div>
            <div className="flex flex-wrap gap-2">{renderActions(head)}</div>
          </div>
        ))}
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
        {filteredHeads.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
            No Head of School records match your filters.
          </div>
        )}
      </div>

      <AlertDialog
        open={confirmationOpen}
        onOpenChange={(open) => {
          setConfirmationOpen(open);
          if (!open) {
            setPendingAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction ? ACTION_COPY[pendingAction.type].title : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction ? ACTION_COPY[pendingAction.type].description : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            {pendingAction?.head.fullName}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelAction}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isProcessingAction}
              className={
                pendingAction?.type === "deactivate"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              {isProcessingAction
                ? "Processing..."
                : pendingAction?.type === "deactivate"
                ? ACTION_COPY.deactivate.confirmLabel
                : ACTION_COPY.approve.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={detailsOpen} onOpenChange={closeDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Head of School Details</DialogTitle>
            <DialogDescription>
              Review account information before taking further action.
            </DialogDescription>
          </DialogHeader>
          {detailsHead && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {detailsHead.fullName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {detailsHead.email}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    STATUS_STYLES[detailsHead.status]
                  }`}
                >
                  {STATUS_LABELS[detailsHead.status]}
                </span>
              </div>
              <div className="grid gap-3 text-sm text-gray-700">
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {detailsHead.department ?? "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">
                    {detailsHead.phone ?? "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {formatDate(detailsHead.createdAt)}
                  </p>
                </div>
              </div>
              {detailsHead.notes && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <p className="font-medium text-gray-900 mb-1">Notes</p>
                  <p>{detailsHead.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHeadManagement;
