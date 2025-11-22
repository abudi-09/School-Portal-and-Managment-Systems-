import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * FilterBar - Reusable filter and search bar
 * 
 * Provides consistent search, filter, and action controls for list views.
 * Responsive layout adapts from horizontal to stacked on mobile.
 * 
 * @example
 * <FilterBar
 *   searchPlaceholder="Search assignments..."
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   filters={
 *     <>
 *       <Select>...</Select>
 *       <Select>...</Select>
 *     </>
 *   }
 *   actions={<Button>New Assignment</Button>}
 * />
 */
export function FilterBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div 
      className={cn(
        "flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/30 rounded-lg border",
        className
      )}
      role="search"
    >
      {/* Search */}
      {onSearchChange && (
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" 
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            aria-label={searchPlaceholder}
          />
        </div>
      )}
      
      {/* Filters */}
      {filters && (
        <div className="flex flex-wrap items-center gap-2 flex-1 w-full sm:w-auto">
          {filters}
        </div>
      )}
      
      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
