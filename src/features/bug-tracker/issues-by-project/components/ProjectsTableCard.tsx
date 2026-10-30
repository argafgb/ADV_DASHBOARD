"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import SourceHint from "@/components/ui/SourceHint";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Folder,
  Download,
} from "lucide-react";
import { IssueItem } from "@/features/bug-tracker/issues-data/types/issuesData";
import {
  formatShortDate,
  inputClock,
  fmtId,
} from "@/features/bug-tracker/issues-data/utils/issuesDataUtils";
import {
  SEV_PILL_CLASS,
  ROLE_PILL_CLASS,
  sevDisplayLabel,
  typeDisplayLabel,
} from "@/features/bug-tracker/issues-data/components/pillStyles";
import { WRAP_PILL } from "@/components/shared/tableStyles";
import {
  ProjectGroup,
  ProjectSortOption,
  PROJECT_SORT_OPTIONS,
} from "../types/issuesByProject";

// Same sizing as the Issues data rows: remarks flex and wrap to two lines,
// the rest are sized to their longest value (fits 686px before scrolling).
const ROW_COLS =
  "grid-cols-[2rem_5rem_4.5rem_5rem_4.5rem_2.75rem_4.5rem_minmax(8.125rem,1fr)_1.5rem]";

function SortChip({
  value,
  onChange,
}: {
  value: ProjectSortOption;
  onChange: (v: ProjectSortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 transition-colors hover:border-blue-400 dark:border-blue-800 dark:bg-zinc-900"
      >
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
          Urutkan
        </span>
        <span className="max-w-[140px] truncate whitespace-nowrap text-[13px] font-bold text-blue-600 dark:text-blue-400">
          {value}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
      </button>
      {open && (
        <div className="absolute left-0 top-[42px] z-50 max-h-[292px] min-w-[220px] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="px-2.5 pb-1.5 pt-1 text-[9.5px] font-bold uppercase tracking-wider text-zinc-300 dark:text-zinc-600">
            Urutkan project
          </div>
          {PROJECT_SORT_OPTIONS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                o === value
                  ? "font-bold text-blue-600 dark:text-blue-400"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-left">{o}</span>
              {o === value && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectIssueRow({
  r,
  no,
  onOpen,
}: {
  r: IssueItem;
  no: number;
  onOpen: (id: string) => void;
}) {
  const clock = r.disc ? inputClock(r.timeInput) : null;
  return (
    <div
      onClick={() => onOpen(r.id)}
      className={`grid ${ROW_COLS} cursor-pointer items-center gap-2 border-b border-zinc-100 p-2 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50`}
    >
      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
        {no}
      </span>
      {/* Date with the input clock underneath */}
      <span className="whitespace-nowrap text-[11.5px] leading-snug text-zinc-500 dark:text-zinc-400 tabular-nums">
        {formatShortDate(r.disc)}
        {clock && (
          <span className="block text-[10.5px] text-zinc-400 dark:text-zinc-500">
            {clock}
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span
          className={`${WRAP_PILL} text-[11px] ${
            ROLE_PILL_CLASS[r.section] || ROLE_PILL_CLASS["PIC Project"]
          }`}
        >
          {r.pic}
        </span>
      </span>
      <span className="min-w-0">
        <span
          className={`${WRAP_PILL} text-[11px] ${ROLE_PILL_CLASS.Developer}`}
        >
          {r.dev}
        </span>
      </span>
      <span className="line-clamp-2 min-w-0 wrap-break-word text-xs leading-snug text-zinc-500 dark:text-zinc-400">
        {r.section}
      </span>
      <span className="whitespace-nowrap text-xs text-zinc-700 dark:text-zinc-300">
        {typeDisplayLabel(r.type)}
      </span>
      <span className="min-w-0">
        <span className={`${WRAP_PILL} text-[10.5px] ${SEV_PILL_CLASS[r.sev]}`}>
          {sevDisplayLabel(r.sev)}
        </span>
      </span>
      <span className="line-clamp-2 min-w-0 wrap-break-word text-xs leading-snug text-zinc-500 dark:text-zinc-400">
        {r.remarks}
      </span>
      <span className="flex gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen(r.id);
          }}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-blue-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
          aria-label="Lihat detail"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  );
}

interface ProjectsTableCardProps {
  subLabel: string;
  chartsOn: boolean;
  onToggleCharts: () => void;
  qProj: string;
  onQProjChange: (v: string) => void;
  sortProj: ProjectSortOption;
  onSortProjChange: (v: ProjectSortOption) => void;
  onExport: () => void;
  isEmpty: boolean;
  groups: ProjectGroup[];
  expanded: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
  onOpenRow: (id: string) => void;
  onSeeAll: (projectName: string) => void;
  footLabel: string;
  pageNumbers: number[];
  currentPage: number;
  onGotoPage: (n: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function ProjectsTableCard(props: ProjectsTableCardProps) {
  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 font-sans">
      {/* Header */}
      <div className="mb-3.5 flex items-start gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
            Issues by project
            <SourceHint
              fields={[
                {
                  label: "Baris project",
                  field: "Project",
                  rule: "Record dikelompokkan menurut nilai Project apa adanya; klik baris untuk membuka daftar recordnya.",
                },
                {
                  label: "Rentang tanggal",
                  field: "Discovery Date",
                  rule: "Tanggal temuan paling awal sampai paling akhir di project tersebut.",
                },
                {
                  label: "bug / CR",
                  field: "Type (Bug/Change Request)",
                  rule: 'Jumlah record hanya untuk nilai eksplisit "Bug" atau "Change Request"; nilai kosong tidak dimasukkan ke salah satu tipe.',
                },
                {
                  label: "FSD",
                  field: "Include in FSD",
                  rule: "Jumlah record yang ditandai masuk FSD dibanding yang di luar FSD.",
                },
                {
                  label: "avg hari",
                  field: "Discovery Date + Finish Date",
                  rule: "Rata-rata selisih hari kedua tanggal; record tanpa salah satu tanggal tidak dihitung.",
                },
              ]}
              notes={[
                "Semua angka mengikuti filter periode dan pencarian yang aktif.",
              ]}
            />
          </h3>
          <p className="mt-0.5 text-[13px] text-zinc-400 dark:text-zinc-500">
            {props.subLabel}
          </p>
        </div>
        <button
          onClick={props.onToggleCharts}
          className="ml-auto h-8 shrink-0 rounded-full border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-500 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700"
        >
          {props.chartsOn ? "Sembunyikan chart" : "Tampilkan chart"}
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <label className="flex h-9 min-w-52 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 transition-colors focus-within:border-blue-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
          <Search className="h-3.75 w-3.75 shrink-0 text-zinc-400 dark:text-zinc-500" />
          <input
            value={props.qProj}
            onChange={(e) => props.onQProjChange(e.target.value)}
            placeholder="Cari nama project"
            className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-300 dark:placeholder:text-zinc-500"
          />
        </label>
        <SortChip value={props.sortProj} onChange={props.onSortProjChange} />
        <button
          title="Export CSV"
          onClick={props.onExport}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* Empty */}
      {props.isEmpty && (
        <div className="py-14 text-center text-[13.5px] text-zinc-400 dark:text-zinc-500">
          Tidak ada project yang cocok dengan filter ini.
        </div>
      )}

      {/* Accordion */}
      <div className="flex flex-col gap-2">
        {props.groups.map((g) => {
          const ex = !!props.expanded[g.key];
          return (
            <div
              key={g.key}
              className="rounded-lg border border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/30"
            >
              <div
                onClick={() => props.onToggleGroup(g.key)}
                className="grid cursor-pointer grid-cols-[2.125rem_1fr_10.75rem_4.75rem_4.75rem_6.5rem_6rem_1.5rem] items-center gap-x-3.5 rounded-lg px-3.5 py-2.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              >
                <span className="inline-flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-[9px] bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Folder className="h-3.75 w-3.75" />
                </span>
                <span className="line-clamp-2 min-w-0 wrap-break-word text-[13.5px] font-bold leading-snug text-zinc-700 dark:text-zinc-200">
                  {g.name}
                </span>
                <span className="inline-flex h-5.75 w-full items-center justify-center whitespace-nowrap rounded-full bg-zinc-100 text-[10.5px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 tabular-nums">
                  {g.rangeLabel}
                </span>
                <span className="inline-flex h-5.75 w-full items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700 dark:bg-rose-950/70 dark:text-rose-400">
                  {fmtId(g.bugCount)} bug
                </span>
                <span className="inline-flex h-5.75 w-full items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-400">
                  {fmtId(g.crCount)} CR
                </span>
                <span
                  className={`inline-flex h-5.75 w-full items-center justify-center whitespace-nowrap rounded-full text-[10.5px] font-semibold ${
                    g.fsdOk
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400"
                  }`}
                >
                  {fmtId(g.fsdYa)} FSD · {fmtId(g.fsdNo)} non
                </span>
                <span className="inline-flex h-5.75 w-full items-center justify-center whitespace-nowrap rounded-full bg-zinc-100 text-[10.5px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {g.avgDays !== null ? `avg ${g.avgDays} hr` : "avg -"}
                </span>
                <ChevronDown
                  className={`h-3.75 w-3.75 justify-self-center text-zinc-400 transition-transform dark:text-zinc-500 ${
                    ex ? "rotate-180" : ""
                  }`}
                />
              </div>
              {ex && (
                <div className="px-3.5 pb-3 pt-0.5">
                  <div className="overflow-x-auto">
                    <div className="min-w-171.5">
                      {g.rows.slice(0, 10).map((r, i) => (
                        <ProjectIssueRow
                          key={r.id}
                          r={r}
                          no={i + 1}
                          onOpen={props.onOpenRow}
                        />
                      ))}
                    </div>
                  </div>
                  {g.rows.length > 10 && (
                    <div className="px-2 pt-2 text-[11.5px] text-zinc-400 dark:text-zinc-500">
                      + {fmtId(g.rows.length - 10)} record lainnya ·{" "}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onSeeAll(g.name);
                        }}
                        className="cursor-pointer font-semibold text-blue-600 underline underline-offset-2 dark:text-blue-400"
                      >
                        lihat di Issues data
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2 pt-3.5">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {props.footLabel}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={props.onPrevPage}
            className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {props.pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => props.onGotoPage(n)}
              className={`h-6.5 min-w-6.5 rounded-md border px-1.5 text-xs font-semibold transition-colors ${
                n === props.currentPage
                  ? "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-400"
                  : "border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={props.onNextPage}
            className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
