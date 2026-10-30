"use client";

import { useState, type CSSProperties } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  SearchX,
  Users,
} from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import type { Employee } from "../../types/employee.types";

const PAGE_SIZE = 10;

const AREA_FILTERS = ["Semua", "HO", "OPS"] as const;
const STATUS_FILTERS = [
  "Semua",
  "Melebihi 40 jam",
  "Pola berulang",
  "Perlu dipantau",
] as const;

type AreaFilter = (typeof AREA_FILTERS)[number];
type StatusFilter = (typeof STATUS_FILTERS)[number];

const COLUMNS: {
  key: string;
  label: string;
  width: string;
  align?: "right";
}[] = [
  { key: "$index", label: "No", width: "48px" },
  { key: "name", label: "Karyawan", width: "minmax(0,1.5fr)" },
  { key: "area", label: "Area organisasi", width: "minmax(0,1.2fr)" },
  { key: "reason", label: "Alasan lembur", width: "minmax(0,1.9fr)" },
  { key: "freq", label: "Frekuensi", width: "96px", align: "right" },
  { key: "hours", label: "Total jam", width: "104px", align: "right" },
  { key: "level", label: "Status perhatian", width: "146px" },
  { key: "$chevron", label: "", width: "44px" },
];

const GRID_TEMPLATE = COLUMNS.map((c) => c.width).join(" ");
const TABLE_MIN_WIDTH = 1080;

export function EmployeeTable({
  employees,
  onSelect,
}: {
  employees: Employee[];
  onSelect: (emp: Employee) => void;
}) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("Semua");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");

  const filtered = employees
    .filter((e) => {
      if (areaFilter === "HO") return e.area.startsWith("HO");
      if (areaFilter === "OPS") return e.area.startsWith("OPS");
      return true;
    })
    .filter((e) => {
      if (statusFilter === "Semua") return true;
      return e.level === statusFilter;
    });

  const sorted = [...filtered].sort((a, b) => {
    const ha = parseFloat(a.hours.replace(",", "."));
    const hb = parseFloat(b.hours.replace(",", "."));
    return hb - ha;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function handleToggle(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  const rangeLabel =
    sorted.length === 0
      ? "Tidak ada karyawan"
      : `Menampilkan ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
          safePage * PAGE_SIZE,
          sorted.length,
        )} dari ${sorted.length} karyawan`;

  return (
    <article className="dd-table">
      <div className="dd-table__toolbar">
        <div className="dd-table__titlewrap">
          <div className="dd-table__titlerow">
            <span className="dd-table__title">Karyawan lembur tertinggi</span>
            <span className="dd-count">{employees.length} karyawan</span>
          </div>
          <div className="dd-table__hint">
            Klik baris untuk melihat rincian, lalu buka detail karyawan.
          </div>
        </div>

        <div className="dd-table__tools">
          <TableFilter
            label="Area"
            value={areaFilter}
            options={AREA_FILTERS}
            onChange={(v) => {
              setAreaFilter(v);
              setPage(1);
            }}
          />
          <TableFilter
            label="Status perhatian"
            value={statusFilter}
            options={STATUS_FILTERS}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          />
        </div>
      </div>

      {employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum Ada Data Karyawan"
          description="Data akan muncul setelah sinkronisasi dari HRIS selesai."
          height={260}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Tidak Ditemukan"
          description={`Tidak ada karyawan dengan area "${areaFilter}" dan status perhatian "${statusFilter}". Coba ubah filter di atas.`}
          height={260}
        />
      ) : (
        <div className="dd-table__scroll">
          <div style={{ minWidth: TABLE_MIN_WIDTH }}>
            <div
              className="dd-table__head"
              style={{ gridTemplateColumns: GRID_TEMPLATE }}
            >
              {COLUMNS.map((col) => (
                <div
                  key={col.key}
                  className={`dd-table__th${
                    col.align === "right" ? " justify-end" : ""
                  }`}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {visible.map((emp, idx) => (
              <ExpandableRow
                key={emp.id}
                emp={emp}
                rowNum={(safePage - 1) * PAGE_SIZE + idx + 1}
                isExpanded={expandedId === emp.id}
                onToggle={() => handleToggle(emp.id)}
                onDetail={() => onSelect(emp)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="dd-table__foot">
        <span className="dd-table__count">{rangeLabel}</span>
        {totalPages > 1 && (
          <div className="dd-pager">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              aria-label="Halaman sebelumnya"
              className="dd-pager__btn disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {pagerItems(safePage, totalPages).map((item, i) =>
              item === "gap" ? (
                <span key={`gap-${i}`} className="dd-pager__gap">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  aria-current={item === safePage ? "page" : undefined}
                  className={
                    item === safePage
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
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              aria-label="Halaman berikutnya"
              className="dd-pager__btn disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </article>
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

function TableFilter<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  const isActive = value !== "Semua";

  return (
    <label
      className={`dd-tfilter relative hover:border-(--border-divider)! ${
        isActive ? "dd-tfilter--active" : ""
      }`}
    >
      <span className="dd-tfilter__icon">
        <ListFilter />
      </span>
      <span className="dd-tfilter__label">{label}</span>
      <span className="dd-tfilter__value">{value}</span>
      <ChevronDown className="dd-tfilter__chev" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function ExpandableRow({
  emp,
  rowNum,
  isExpanded,
  onToggle,
  onDetail,
}: {
  emp: Employee;
  rowNum: number;
  isExpanded: boolean;
  onToggle: () => void;
  onDetail: () => void;
}) {
  const areaPath = emp.area.split(" / ").join(" · ");
  const tone = emp.tag === "risk" ? "dd-pill--red" : "dd-pill--amber";

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`dd-table__row hover:bg-(--bg-subtle) ${
          isExpanded ? "dd-table__row--open" : ""
        }`}
        style={{ gridTemplateColumns: GRID_TEMPLATE }}
      >
        <div className="dd-table__td">
          <span className="dd-table__idx">{rowNum}</span>
        </div>

        <div className="dd-table__td">
          <div className="dd-table__primary">{emp.name}</div>
          <div className="dd-table__secondary">
            {emp.id} · {emp.role}
          </div>
        </div>

        <div className="dd-table__td">
          <span className="dd-chip dd-chip--entity max-w-full" title={areaPath}>
            <span className="truncate">{areaPath}</span>
          </span>
        </div>

        <div className="dd-table__td">
          <div
            title={emp.reason}
            className="line-clamp-2"
            style={{
              font: "var(--fw-regular) var(--fs-cell-sub)/1.45 var(--font-sans)",
              color: "var(--text-secondary)",
            }}
          >
            {emp.reason}
          </div>
        </div>

        <div className="dd-table__td text-right">
          <span
            className="dd-num"
            style={{
              font: "var(--fw-medium) var(--fs-cell)/1 var(--font-sans)",
              color: "var(--text-secondary)",
            }}
          >
            {emp.freq} kali
          </span>
        </div>

        <div className="dd-table__td text-right">
          <strong
            className="dd-num"
            style={{
              font: "var(--fw-semibold) var(--fs-cell)/1 var(--font-sans)",
              color: "var(--text-primary)",
            }}
          >
            {emp.hours}
          </strong>
        </div>

        <div className="dd-table__td">
          <span className={`dd-pill ${tone}`}>
            <span className="dd-pill__dot" />
            {emp.level}
          </span>
        </div>

        <div className="dd-table__td flex items-center justify-center">
          <ChevronRight
            className={`dd-table__chev ${
              isExpanded ? "dd-table__chev--open" : ""
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="dd-table__expand">
          <div
            className="dd-table__meta"
            style={{ "--meta-cols": 3 } as CSSProperties}
          >
            {[
              { label: "Nomor karyawan", value: emp.id },
              { label: "Jabatan", value: emp.role },
              { label: "Area organisasi", value: areaPath },
              { label: "Frekuensi", value: `${emp.freq} kali` },
              { label: "Total jam", value: emp.hours },
              { label: "Biaya approved", value: emp.cost },
            ].map((m) => (
              <div key={m.label}>
                <div className="dd-table__metalabel">{m.label}</div>
                <div className="dd-table__metaval">{m.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="dd-table__longpanel">
                <div className="dd-table__metalabel">Alasan lembur</div>
                <div className="dd-table__longbody">{emp.reason}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDetail();
              }}
              className="dd-btn dd-btn--secondary dd-btn--sm"
            >
              Buka detail
            </button>
          </div>
        </div>
      )}
    </>
  );
}
