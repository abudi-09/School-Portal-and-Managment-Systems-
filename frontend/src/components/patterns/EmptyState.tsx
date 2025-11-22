import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  illustration?: string;
  className?: string;
}

/**
 * EmptyState - Consistent empty state component
 * 
 * Displays when there's no data to show, with optional illustration and action button.
 * Provides helpful guidance to users on what to do next.
 * 
 * @example
 * <EmptyState
 *   icon={ClipboardList}
 *   title="No assignments yet"
 *   description="New assignments will appear here when your teachers add them."
 *   action={<Button>View Past Assignments</Button>}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {illustration ? (
        <img 
          src={illustration} 
          alt="" 
          className="w-48 h-48 mb-6 opacity-50"
          aria-hidden="true"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
