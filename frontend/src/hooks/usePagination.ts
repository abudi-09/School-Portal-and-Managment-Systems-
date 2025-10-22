import { useEffect, useMemo, useState } from "react";

export interface UsePaginationOptions<T> {
  items: T[];
  pageSize?: number; // default 6
  initialPage?: number; // default 1
}

export interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setPage: (p: number) => void;
  next: () => void;
  prev: () => void;
  currentItems: T[];
  indexOfFirst: number;
  indexOfLast: number;
}

// Client-side pagination helper hook with a fixed default of 6 rows per page
export function usePagination<T>(options: UsePaginationOptions<T>): UsePaginationResult<T> {
  const { items, pageSize = 6, initialPage = 1 } = options;
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  const totalPages = Math.max(1, Math.ceil((items?.length ?? 0) / pageSize));

  // Reset to page 1 when the dataset changes significantly (length), or when current page exceeds bounds
  useEffect(() => {
    setCurrentPage((prev) => {
      if (prev < 1) return 1;
      if (prev > totalPages) return 1;
      return prev;
    });
  }, [totalPages]);

  const indexOfLast = currentPage * pageSize;
  const indexOfFirst = indexOfLast - pageSize;

  const currentItems = useMemo(() => {
    if (!Array.isArray(items)) return [] as T[];
    return items.slice(indexOfFirst, indexOfLast);
  }, [items, indexOfFirst, indexOfLast]);

  const setPage = (p: number) => {
    const safe = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(safe);
  };

  const next = () => setPage(currentPage + 1);
  const prev = () => setPage(currentPage - 1);

  return {
    currentPage,
    totalPages,
    pageSize,
    setPage,
    next,
    prev,
    currentItems,
    indexOfFirst,
    indexOfLast,
  };
}

export default usePagination;
