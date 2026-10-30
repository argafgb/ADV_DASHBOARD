"use client";

import { Fragment, useState, type ReactNode } from "react";

import { CountPill } from "./chips";
import { IconChevronDown } from "./icons";
import { Pager } from "./pager";

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "right";
}

interface DataTableProps<T> {
  title: string;
  count?: string | null;
  hint?: string | null;
  /** Slot kanan toolbar (`.dd-table__tools`): pencarian + filter. */
  tools?: ReactNode;
  columns: TableColumn[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  renderCell: (row: T, column: TableColumn, index: number) => ReactNode;
  /** Baris expand di bawah baris yang diklik. */
  renderExpanded?: (row: T) => ReactNode;
  minWidth?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  rangeLabel?: string | null;
  emptyState?: ReactNode;
  className?: string;
}

/**
 * `DataTable` design system: toolbar (judul + pill jumlah + hint di kiri,
 * pencarian/filter di kanan), header kolom kapital kecil, baris grid 58px,
 * area detail yang bisa dibuka, dan footer paginasi. Kolom khusus:
 * `$index` (nomor urut) dan `$chevron` (pembuka expand).
 */
export function DataTable<T>({
  title,
  count,
  hint,
  tools,
  columns,
  rows,
  rowKey,
  renderCell,
  renderExpanded,
  minWidth,
  page = 1,
  totalPages = 1,
  onPageChange,
  rangeLabel,
  emptyState,
  className,
}: DataTableProps<T>) {
  const [open, setOpen] = useState<string | number | null>(null);
  const template = columns.map((c) => c.width || "minmax(0,1fr)").join(" ");

  return (
    <section className={className ? `dd-table ${className}` : "dd-table"}>
      <div className="dd-table__toolbar">
        <div className="dd-table__titlewrap">
          <div className="dd-table__titlerow">
            <span className="dd-table__title">{title}</span>
            {count != null && <CountPill>{count}</CountPill>}
          </div>
          {hint && <div className="dd-table__hint">{hint}</div>}
        </div>
        {tools && <div className="dd-table__tools">{tools}</div>}
      </div>

      <div className="dd-table__scroll">
        <div style={minWidth ? { minWidth } : undefined}>
          <div className="dd-table__head" style={{ gridTemplateColumns: template }}>
            {columns.map((c) => (
              <div key={c.key} className="dd-table__th" style={c.align === "right" ? { justifyContent: "flex-end" } : undefined}>
                {c.label}
              </div>
            ))}
          </div>
          {rows.length === 0 && emptyState}
          {rows.map((row, i) => {
            const key = rowKey(row, i);
            const isOpen = open === key;
            return (
              <Fragment key={key}>
                <div
                  className={`dd-table__row${isOpen ? " dd-table__row--open" : ""}`}
                  style={{ gridTemplateColumns: template }}
                  onClick={renderExpanded ? () => setOpen(isOpen ? null : key) : undefined}
                >
                  {columns.map((c) => (
                    <div key={c.key} className="dd-table__td" style={c.align === "right" ? { textAlign: "right" } : undefined}>
                      {c.key === "$chevron" ? (
                        <span className={`dd-table__chev${isOpen ? " dd-table__chev--open" : ""}`}>
                          <IconChevronDown />
                        </span>
                      ) : c.key === "$index" ? (
                        <span className="dd-table__idx">{i + 1}</span>
                      ) : (
                        renderCell(row, c, i)
                      )}
                    </div>
                  ))}
                </div>
                {isOpen && renderExpanded && <div className="dd-table__expand">{renderExpanded(row)}</div>}
              </Fragment>
            );
          })}
        </div>
      </div>

      {(rangeLabel || totalPages > 1) && (
        <div className="dd-table__foot">
          {rangeLabel && <span className="dd-table__count">{rangeLabel}</span>}
          <Pager page={page} totalPages={totalPages} onChange={(p) => onPageChange?.(p)} />
        </div>
      )}
    </section>
  );
}
