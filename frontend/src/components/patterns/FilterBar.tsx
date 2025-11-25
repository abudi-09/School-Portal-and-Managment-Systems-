import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FilterOption = { label: string; value: string };

type FilterDescriptor = {
  key: string;
  label: string;
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
};

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  // support both prop names used across the codebase
  onSearchChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  // filters can be React nodes (custom controls) or descriptor objects
  filters?: ReactNode | FilterDescriptor[];
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
  onSearch,
  filters,
  actions,
  className,
}: FilterBarProps) {
  const handleSearch = (v: string) => {
    (onSearchChange || onSearch)?.(v);
  };

  const renderFilters = () => {
    if (!filters) return null;
    // If filters is an array of descriptors, render Selects
    if (Array.isArray(filters)) {
      return (
        <div className="flex flex-wrap items-center gap-2 flex-1 w-full sm:w-auto">
          {filters.map((f: any) => (
            <div key={f.key} className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{f.label}</label>
              <Select
                value={f.value}
                onValueChange={(val) => f.onChange?.(val)}
              >
                <SelectTrigger id={`filter-${f.key}`} className="min-w-[160px]">
                  <SelectValue
                    placeholder={`Select ${f.label.toLowerCase()}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {f.options.map((opt: any) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      );
    }

    // Otherwise assume it's a React node
    return (
      <div className="flex flex-wrap items-center gap-2 flex-1 w-full sm:w-auto">
        {filters}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/30 rounded-lg border",
        className
      )}
      role="search"
    >
      {/* Search */}
      {(onSearchChange || onSearch) && (
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      {/* Filters */}
      {renderFilters()}

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
