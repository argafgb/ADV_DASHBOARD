"use client";

import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SearchX,
} from "lucide-react";
import ChartCard from "@/components/shared/ChartCard";
import EmptyState from "@/components/shared/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  headClassName?: string;
  cellClassName?: string;
  /** Cell renderer — lets each menu shape its own columns from its service. */
  cell: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  /** Text the built-in search box matches against. */
  getSearchText: (row: T) => string;
  searchPlaceholder?: string;
  /** Menu-specific local filter controls, rendered beside the search box. */
  filters?: ReactNode;
  /** Clears the parent's local filters (the search box clears itself). */
  onReset?: () => void;
  /** When provided, rows become expandable and render this detail panel. */
  renderDetail?: (row: T) => ReactNode;
  emptyMessage?: string;
  /** Caps the scrollable body height, e.g. "max-h-140". */
  maxHeightClassName?: string;

  /** Optional search control for server-side search. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  /** If true, expanding a row collapses any previously expanded row. */
  singleExpand?: boolean;
  /** If true, automatically expands the first row when rows are loaded or page changes. */
  defaultExpandFirst?: boolean;

  /** Optional loading state for row updates without unmounting table wrapper. */
  isLoading?: boolean;

  /** Optional pagination settings */
  pagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

const ALIGN: Record<string, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/**
 * Reusable dashboard table: local-filter + search toolbar, flexible
 * per-menu columns, optional click-to-expand row detail, and optional pagination.
 */
export default function DataTable<T>({
  title,
  subtitle,
  rows,
  columns,
  getRowId,
  getSearchText,
  searchPlaceholder = "Cari...",
  filters,
  onReset,
  renderDetail,
  emptyMessage = "Tidak ada data yang cocok",
  maxHeightClassName = "max-h-140",
  searchValue,
  onSearchChange,
  singleExpand = false,
  defaultExpandFirst = false,
  isLoading = false,
  pagination = false,
  currentPage,
  totalPages,
  pageSize = 10,
  totalCount,
  onPageChange,
}: DataTableProps<T>) {
  const isSearchControlled = searchValue !== undefined;
  const [uncontrolledQuery, setUncontrolledQuery] = useState("");
  const internalQuery = isSearchControlled ? searchValue : uncontrolledQuery;
  const debouncedQuery = useDebounce(internalQuery, 300);
  const initialExpandedId =
    defaultExpandFirst && rows.length > 0 ? getRowId(rows[0]) : undefined;
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initialExpandedId ? [initialExpandedId] : []),
  );
  const [internalPage, setInternalPage] = useState(1);

  const onSearchChangeRef = useRef(onSearchChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  });

  const hasFiredInitialSearch = useRef(false);
  useEffect(() => {
    if (!hasFiredInitialSearch.current) {
      hasFiredInitialSearch.current = true;
      // Skip firing if empty query on mount to prevent redundant parent page resets
      if (!debouncedQuery) return;
    }
    onSearchChangeRef.current?.(debouncedQuery);
  }, [debouncedQuery]);

  const hasSearchChange = Boolean(onSearchChange);
  const visibleRows = useMemo(() => {
    if (hasSearchChange) return rows;
    const q = internalQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => getSearchText(row).toLowerCase().includes(q));
  }, [rows, internalQuery, getSearchText, hasSearchChange]);

  // Determine pagination parameters
  const isServerPaginated = Boolean(onPageChange);
  const activePage = isServerPaginated ? currentPage || 1 : internalPage;

  const calculatedTotalCount = isServerPaginated
    ? (totalCount ?? rows.length)
    : visibleRows.length;

  const computedTotalPages = isServerPaginated
    ? totalPages || Math.max(1, Math.ceil(calculatedTotalCount / pageSize))
    : Math.max(1, Math.ceil(visibleRows.length / pageSize));

  const paginatedRows = useMemo(() => {
    if (!pagination) return visibleRows;
    if (isServerPaginated) return rows;
    const start = (internalPage - 1) * pageSize;
    return visibleRows.slice(start, start + pageSize);
  }, [
    pagination,
    isServerPaginated,
    rows,
    visibleRows,
    internalPage,
    pageSize,
  ]);

  const expandable = Boolean(renderDetail);
  const colSpan = columns.length + (expandable ? 1 : 0);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      if (singleExpand) {
        if (prev.has(id)) return new Set();
        return new Set([id]);
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleReset = () => {
    setUncontrolledQuery("");
    setInternalPage(1);
    setExpanded(new Set());
    onReset?.();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > computedTotalPages) return;
    const nextRows = isServerPaginated
      ? []
      : visibleRows.slice((newPage - 1) * pageSize, newPage * pageSize);
    const firstId =
      defaultExpandFirst && nextRows.length > 0
        ? getRowId(nextRows[0])
        : undefined;
    setExpanded(new Set(firstId ? [firstId] : []));
    if (isServerPaginated && onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const startEntry =
    calculatedTotalCount === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endEntry = Math.min(activePage * pageSize, calculatedTotalCount);

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      action={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {filters}
          {onReset && (
            <button
              type="button"
              onClick={handleReset}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
            >
              Reset
            </button>
          )}
          <div className="relative w-full sm:w-auto">
            <span className="pointer-events-none absolute left-3 top-1/2 inline-flex -translate-y-1/2 text-zinc-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={internalQuery}
              onChange={(e) => {
                const nextQuery = e.target.value;
                if (isSearchControlled) {
                  onSearchChange?.(nextQuery);
                } else {
                  setUncontrolledQuery(nextQuery);
                }
                setInternalPage(1);
                setExpanded(new Set());
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full rounded-lg border sm:w-44 border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
        </div>
      }
    >
      <div className={cn("min-w-0 overflow-y-auto", maxHeightClassName)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500",
                    ALIGN[col.align ?? "left"],
                    col.headClassName,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
              {expandable && (
                <TableHead className="w-32 text-right">Rincian</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize || 5 }).map((_, idx) => (
                <TableRow key={`skeleton-row-${idx}`}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className="py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    </TableCell>
                  ))}
                  {expandable && (
                    <TableCell className="py-3">
                      <div className="ml-auto h-4 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="py-4 text-center text-xs text-zinc-400"
                >
                  <EmptyState
                    icon={SearchX}
                    title="Data Tidak Ditemukan"
                    description={emptyMessage}
                    height={180}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, index) => {
                const id = getRowId(row);
                const isOpen = expanded.has(id);
                return (
                  <Fragment key={id}>
                    <TableRow
                      onClick={expandable ? () => toggle(id) : undefined}
                      aria-expanded={expandable ? isOpen : undefined}
                      className={cn(
                        "text-sm transition-colors",
                        expandable && "cursor-pointer",
                        isOpen && "bg-zinc-50/80 dark:bg-zinc-900/40",
                      )}
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            ALIGN[col.align ?? "left"],
                            col.cellClassName,
                          )}
                        >
                          {col.cell(row, index)}
                        </TableCell>
                      ))}
                      {expandable && (
                        <TableCell className="text-right text-zinc-400">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-all select-none",
                              isOpen
                                ? "bg-zinc-200/90 text-zinc-800 dark:bg-zinc-700/90 dark:text-zinc-100 shadow-xs"
                                : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/70 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700/70",
                            )}
                          >
                            <span>
                              {isOpen ? "Tutup Detail" : "Lihat Detail"}
                            </span>
                            <ChevronDown
                              size={14}
                              className={cn(
                                "transition-transform duration-200",
                                isOpen && "rotate-180",
                              )}
                            />
                          </span>
                        </TableCell>
                      )}
                    </TableRow>

                    {expandable && isOpen && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={colSpan}
                          className="bg-zinc-50 p-0 dark:bg-zinc-800/30"
                        >
                          {renderDetail?.(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Menampilkan{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {startEntry}
            </span>{" "}
            –{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {endEntry}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {calculatedTotalCount}
            </span>{" "}
            data
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={activePage <= 1}
              onClick={() => handlePageChange(activePage - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:disabled:hover:bg-zinc-900"
            >
              <ChevronLeft size={14} />
              Prev
            </button>

            <span className="px-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {activePage} / {computedTotalPages}
            </span>

            <button
              type="button"
              disabled={activePage >= computedTotalPages}
              onClick={() => handlePageChange(activePage + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:disabled:hover:bg-zinc-900"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
