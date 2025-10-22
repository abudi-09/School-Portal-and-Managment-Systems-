import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { ReactNode } from "react";

export type ColumnDef<T> = {
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

type GenericTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  rowsPerPage?: number; // default 6
  className?: string;
};

// Example, reusable paginated table. Pass any dataset and column renderers.
export function GenericTable<T>({
  data,
  columns,
  rowsPerPage = 6,
  className,
}: GenericTableProps<T>) {
  const { currentItems, currentPage, totalPages, setPage } = usePagination<T>({
    items: data,
    pageSize: rowsPerPage,
  });

  return (
    <div className={className ?? ""}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c, idx) => (
              <TableHead key={idx} className={c.className}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map((row, ridx) => (
            <TableRow key={ridx}>
              {columns.map((c, cidx) => (
                <TableCell key={cidx} className={c.className}>
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-3"
      />
    </div>
  );
}

export default GenericTable;
