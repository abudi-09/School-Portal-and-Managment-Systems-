import { Button } from "@/components/ui/button";

type TablePaginationProps = {
  currentPage: number; // 1-based
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

// Reusable pagination control for data tables: [ Prev ]  Page X of Y  [ Next ]
export default function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: TablePaginationProps) {
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div
      className={
        "flex items-center justify-center gap-4 py-3 " + (className ?? "")
      }
    >
      <Button
        variant="outline"
        onClick={() => canPrev && onPageChange(currentPage - 1)}
        disabled={!canPrev}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{currentPage}</span>{" "}
        of {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => canNext && onPageChange(currentPage + 1)}
        disabled={!canNext}
      >
        Next
      </Button>
    </div>
  );
}
