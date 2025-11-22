import { CheckCircle, Clock, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface Student {
  id: number;
  name: string;
  rollNo: string;
  attendanceRate: number;
}

interface StudentAttendanceCardProps {
  student: Student;
  status: AttendanceStatus;
  onStatusChange: (id: number, status: AttendanceStatus) => void;
  onViewHistory: (id: number) => void;
  isSaved: boolean;
}

const statusMeta: Record<
  AttendanceStatus,
  { label: string; icon: typeof CheckCircle }
> = {
  present: { label: "Present", icon: CheckCircle },
  absent: { label: "Absent", icon: XCircle },
  late: { label: "Late", icon: Clock },
  excused: { label: "Excused", icon: Users },
};

const statusVisuals: Record<
  AttendanceStatus,
  {
    card: string;
    badge: string;
    button: string;
    buttonActive: string;
  }
> = {
  present: {
    card: "border-success/20 bg-success/5",
    badge: "bg-success/10 text-success hover:bg-success/20",
    button: "border-success/20 text-success hover:bg-success/10",
    buttonActive: "border-success bg-success/10 text-success",
  },
  absent: {
    card: "border-destructive/20 bg-destructive/5",
    badge: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    button: "border-destructive/20 text-destructive hover:bg-destructive/10",
    buttonActive: "border-destructive bg-destructive/10 text-destructive",
  },
  late: {
    card: "border-warning/20 bg-warning/5",
    badge: "bg-warning/10 text-warning hover:bg-warning/20",
    button: "border-warning/20 text-warning hover:bg-warning/10",
    buttonActive: "border-warning bg-warning/10 text-warning",
  },
  excused: {
    card: "border-info/20 bg-info/5",
    badge: "bg-info/10 text-info hover:bg-info/20",
    button: "border-info/20 text-info hover:bg-info/10",
    buttonActive: "border-info bg-info/10 text-info",
  },
};

const statusOrder: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export const StudentAttendanceCard = ({
  student,
  status,
  onStatusChange,
  onViewHistory,
  isSaved,
}: StudentAttendanceCardProps) => {
  const visuals = statusVisuals[status];

  return (
    <div className={cn("rounded-xl border p-4 transition-all duration-200", visuals.card)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {student.rollNo}
          </p>
          <p className="text-lg font-semibold text-foreground truncate max-w-[150px]">
            {student.name}
          </p>
        </div>
        <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold border-0", visuals.badge)}>
          {statusMeta[status].label}
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Attendance Rate</span>
        <span className={cn("font-medium", student.attendanceRate < 75 ? "text-destructive" : "text-foreground")}>
          {student.attendanceRate}%
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {statusOrder.map((option) => (
          <Button
            key={option}
            variant="outline"
            size="sm"
            onClick={() => onStatusChange(student.id, option)}
            className={cn(
              "justify-center text-xs font-medium h-8 transition-colors",
              statusVisuals[option].button,
              option === status && statusVisuals[option].buttonActive
            )}
          >
            {statusMeta[option].label}
          </Button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <div className={cn("w-1.5 h-1.5 rounded-full", isSaved ? "bg-success" : "bg-warning")} />
          {isSaved ? "Saved" : "Unsaved"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2"
          onClick={() => onViewHistory(student.id)}
        >
          History
        </Button>
      </div>
    </div>
  );
};
