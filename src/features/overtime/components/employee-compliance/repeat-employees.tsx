"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, UserX } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { useGridColumns } from "../ds/chart-utils";
import type { RepeatEmployee } from "../../types/employee.types";

const VISIBLE_ROWS = 3;

export function RepeatEmployees({
  repeating,
  onSelect,
}: {
  repeating: RepeatEmployee[];
  onSelect: (employeeId: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [gridRef, columns] = useGridColumns<HTMLDivElement>(1);

  const pageSize = columns * VISIBLE_ROWS;
  const totalPages = Math.max(1, Math.ceil(repeating.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * pageSize;
  const visible = repeating.slice(from, from + pageSize);

  const rangeLabel =
    repeating.length === 0
      ? "Tidak ada karyawan"
      : `Menampilkan ${from + 1}–${Math.min(
          from + pageSize,
          repeating.length,
        )} dari ${repeating.length} karyawan`;

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        paddingTop: 16,
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            font: "var(--fw-semibold) 13px/1.3 var(--dd-font-sans)",
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
          }}
        >
          Karyawan dengan lembur berulang
        </span>
        <span
          style={{
            font: "var(--fw-regular) 11.5px/1.3 var(--dd-font-sans)",
            color: "var(--text-placeholder)",
          }}
        >
          Diurutkan dari pola paling sering. Klik karyawan untuk membuka
          rinciannya.
        </span>
      </div>

      {repeating.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="Belum Ada Pola Lembur Berulang"
          description="Tidak ada karyawan dengan pola lembur berulang pada periode ini. Coba ubah filter tahun, bulan, atau area."
          height={220}
        />
      ) : (
        <div
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 330px), 1fr))",
            gap: 10,
          }}
        >
          {visible.map((emp) => (
            <RepeatCard
              key={emp.id}
              employee={emp}
              onOpen={() => onSelect(emp.id)}
            />
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          paddingTop: 12,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <span
          className="dd-num"
          style={{
            font: "var(--fw-regular) 12px/1 var(--dd-font-sans)",
            color: "var(--text-muted)",
          }}
        >
          {rangeLabel}
        </span>
        {totalPages > 1 && (
          <Pager page={safePage} totalPages={totalPages} onChange={setPage} />
        )}
      </div>
    </div>
  );
}

function RepeatCard({
  employee,
  onOpen,
}: {
  employee: RepeatEmployee;
  onOpen: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "11px 13px",
        border: `1px solid ${hover ? "var(--border-kpi-hover)" : "var(--border-default)"}`,
        borderRadius: 10,
        background: hover ? "var(--bg-hover)" : "var(--bg-row-item)",
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
      }}
    >
      <span style={{ minWidth: 0, flex: 1 }} title={employee.name}>
        <span
          style={{
            display: "block",
            font: "var(--fw-semibold) 12.5px/1.3 var(--dd-font-sans)",
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {employee.name}
        </span>
        <span
          style={{
            display: "block",
            marginTop: 3,
            font: "var(--fw-regular) 11.5px/1.3 var(--dd-font-sans)",
            color: "var(--text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {employee.area.split(" / ").join(" · ")}
        </span>
      </span>

      <span style={{ textAlign: "right", flex: "none" }}>
        <span
          className="dd-num"
          style={{
            display: "block",
            font: "var(--fw-num) 12.5px/1.3 var(--dd-font-sans)",
            color: "var(--text-primary)",
          }}
        >
          {employee.hours}
        </span>
        <span
          style={{
            display: "block",
            marginTop: 3,
            font: "var(--fw-semibold) 11px/1.3 var(--dd-font-sans)",
            color: "var(--status-red-fg)",
            whiteSpace: "nowrap",
          }}
        >
          {employee.pattern}
        </span>
      </span>
    </button>
  );
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="dd-pager">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Halaman sebelumnya"
        className="dd-pager__btn"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {pagerItems(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="dd-pager__gap">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={
              item === page
                ? "dd-pager__btn dd-pager__btn--active"
                : "dd-pager__btn"
            }
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Halaman berikutnya"
        className="dd-pager__btn"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function pagerItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("gap");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("gap");
  items.push(total);

  return items;
}
