import { useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type ActionType = "approve" | "activate" | "deactivate";

type PendingAction = {
  head: Head;
  type: ActionType;
};

const INITIAL_HEADS: Head[] = [
  {
    id: "1",
    fullName: "Amelia Martinez",
    email: "amelia.martinez@school.edu",
    status: "pending",
    createdAt: "2025-09-08T09:15:00.000Z",
    department: "STEM Programs",
    phone: "+1 (555) 010-2010",
    notes: "Experienced district leader transitioning into the role.",
  },
  {
    id: "2",
    fullName: "Jordan Blake",
    email: "jordan.blake@school.edu",
    status: "active",
    createdAt: "2025-07-22T13:30:00.000Z",
    department: "Academic Affairs",
    phone: "+1 (555) 010-2004",
    notes: "Focuses on curriculum modernization and teacher mentorship.",
  },
  {
    id: "3",
    fullName: "Priya Desai",
    email: "priya.desai@school.edu",
    status: "inactive",
    createdAt: "2025-04-11T16:45:00.000Z",
    department: "Community Partnerships",
    phone: "+1 (555) 010-1988",
    notes: "On extended leave through the end of the semester.",
  },
  {
    id: "4",
    fullName: "Marcus Lee",
    email: "marcus.lee@school.edu",
    status: "active",
    createdAt: "2025-06-01T10:10:00.000Z",
    department: "Operations",
    phone: "+1 (555) 010-1975",
    notes: "Leads campus-wide safety initiatives and facility upgrades.",
  },
];

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

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

const AdminHeadManagement = () => {
  const [heads, setHeads] = useState<Head[]>(INITIAL_HEADS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<HeadStatus>("pending");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsHead, setDetailsHead] = useState<Head | null>(null);
  const { toast } = useToast();

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

  const handleActionRequest = (head: Head, type: ActionType) => {
    setPendingAction({ head, type });
    setConfirmationOpen(true);
  };

  const handleConfirmAction = () => {
    if (!pendingAction) {
      return;
    }

    const { head, type } = pendingAction;
    const config = ACTION_COPY[type];

    setHeads((prev) =>
      prev.map((item) =>
        item.id === head.id ? { ...item, status: config.nextStatus } : item
      )
    );

    toast({
      title: config.successTitle,
      description: config.successDescription(head.fullName),
    });

    setConfirmationOpen(false);
    setPendingAction(null);
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
      actions.push(
        <Button
          key="activate"
          variant="outline"
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
          onClick={() => handleActionRequest(head, "activate")}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          Activate
        </Button>
      );
    }

    if (head.status === "active") {
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon, accent }) => (
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
            {filteredHeads.map((head) => (
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
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {filteredHeads.map((head) => (
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
              className={
                pendingAction?.type === "deactivate"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }
              onClick={handleConfirmAction}
            >
              {pendingAction
                ? ACTION_COPY[pendingAction.type].confirmLabel
                : "Confirm"}
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
