import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "info" | "destructive";
  className?: string;
}

const variantStyles = {
  default: "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800",
  success: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900",
  warning: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900",
  info: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900",
  destructive: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900",
};

const iconStyles = {
  default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
  info: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  destructive: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
};

/**
 * StatCard - KPI/Metric display card
 * 
 * Displays key statistics with optional trend indicators and semantic color variants.
 * Follows design system specifications for stat card patterns.
 * 
 * @example
 * <StatCard
 *   label="Current GPA"
 *   value="3.85"
 *   icon={Award}
 *   trend={{ value: "+0.15", positive: true }}
 *   variant="success"
 * />
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <Card 
      className={cn(
        "transition-shadow hover:shadow-md",
        variantStyles[variant],
        className
      )}
      role="region"
      aria-label={`${label}: ${value}${trend ? `, trending ${trend.positive ? 'up' : 'down'} by ${trend.value}` : ''}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>
            <p className="text-3xl font-bold text-foreground truncate">
              {value}
            </p>
            {trend && (
              <p 
                className={cn(
                  "text-xs flex items-center gap-1",
                  trend.positive ? "text-success" : "text-destructive"
                )}
                aria-label={`Trend: ${trend.positive ? 'positive' : 'negative'} ${trend.value}`}
              >
                <span aria-hidden="true">{trend.positive ? "↑" : "↓"}</span>
                <span>{trend.value}</span>
              </p>
            )}
            {subtitle && !trend && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <div 
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
              iconStyles[variant]
            )}
            aria-hidden="true"
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
