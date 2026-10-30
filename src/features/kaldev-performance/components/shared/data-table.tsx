"use client";

import { Fragment, useState, type CSSProperties, type ReactNode } from "react";

import { Count } from "./chips";
import { TableEmpty } from "./empty-state";
import { Pager } from "./pager";

export interface TableColumn {
  key: string;
  label: string;
  width: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  title: string;
  count: string;
  hint?: string;
  /** Slot kotak pencarian (`.dd-table__search`). */
  search?: ReactNode;
  /** Slot dropdown filter (`.dd-table__filters`). */
  filters?: ReactNode;
  columns: TableColumn[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  renderCell: (row: T, column: TableColumn, index: number) => ReactNode;
  /** Baris expand di bawah baris yang diklik (desain: progres + catatan terakhir). */
  expand?: (row: T) => ReactNode;
  minWidth: number;
  rangeText?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage: string;
  style?: CSSProperties;
  /** Nama kelas tambahan pada `.dd-table` (mis. tinggi maksimum kartu). */
  className?: string;
}

/**
 * `DataTable` design system: toolbar (judul, jumlah, hint, cari, filter),
 * header kolom, baris grid, dan footer dengan paginasi.
 */
export function DataTable<T>({
  title,
  count,
  hint,
  search,
  filters,
  columns,
  rows,
  rowKey,
  renderCell,
  expand,
  minWidth,
  rangeText,
  page,
  totalPages,
  onPageChange,
  emptyMessage,
  style,
  className,
}: DataTableProps<T>) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const gridTemplateColumns = columns.map((c) => c.width).join(" ");
  const hasFoot = rangeText || (page && totalPages && onPageChange);

  return (
    <section
      className={className ? `dd-table ${className}` : "dd-table"}
      style={style}
    >
      <div className="dd-table__toolbar">
        <div className="dd-table__titlewrap">
          <div className="dd-table__titlerow">
            <span className="dd-table__title">{title}</span>
            <Count>{count}</Count>
          </div>
          {hint && <div className="dd-table__hint">{hint}</div>}
        </div>
        {search && <div className="dd-table__search">{search}</div>}
        {filters && <div className="dd-table__filters">{filters}</div>}
      </div>

      <div className="dd-table__scroll">
        <div style={{ minWidth }}>
          <div className="dd-table__head" style={{ gridTemplateColumns }}>
            {columns.map((c) => (
              <div
                key={c.key}
                className="dd-table__th"
                style={
                  c.align === "right"
                    ? { justifyContent: "flex-end" }
                    : c.align === "center"
                      ? { justifyContent: "center" }
                      : undefined
                }
              >
                {c.label}
              </div>
            ))}
          </div>

          {rows.length === 0 ? (
            <TableEmpty message={emptyMessage} />
          ) : (
            rows.map((row, index) => {
              const key = rowKey(row, index);
              const open = expand ? openKey === key : false;
              return (
                <Fragment key={key}>
                  <div
                    className={`dd-table__row${open ? " dd-table__row--open" : ""}`}
                    style={{
                      gridTemplateColumns,
                      cursor: expand ? "pointer" : "default",
                    }}
                    onClick={
                      expand ? () => setOpenKey(open ? null : key) : undefined
                    }
                  >
                    {columns.map((c) => (
                      <div
                        key={c.key}
                        className="dd-table__td"
                        style={
                          c.align === "right"
                            ? { textAlign: "right" }
                            : c.align === "center"
                              ? { textAlign: "center" }
                              : undefined
                        }
                      >
                        {renderCell(row, c, index)}
                      </div>
                    ))}
                  </div>
                  {open && expand && (
                    <div className="dd-table__expand">{expand(row)}</div>
                  )}
                </Fragment>
              );
            })
          )}
        </div>
      </div>

      {hasFoot && (
        <div className="dd-table__foot">
          {rangeText && <span className="dd-table__count">{rangeText}</span>}
          {page && totalPages && onPageChange && (
            <Pager
              page={page}
              totalPages={totalPages}
              onChange={onPageChange}
            />
          )}
        </div>
      )}
    </section>
  );
}

/** Chevron pembuka baris expand (`.dd-table__chev`). */
export function RowChevron({ open }: { open?: boolean }) {
  return (
    <span className={`dd-table__chev${open ? " dd-table__chev--open" : ""}`}>
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M4.6 8.6c-.9-1.2 0-2.85 1.5-2.85h11.8c1.5 0 2.4 1.65 1.5 2.85L13.5 17.2a1.85 1.85 0 0 1-3 0Z" />
      </svg>
    </span>
  );
}
