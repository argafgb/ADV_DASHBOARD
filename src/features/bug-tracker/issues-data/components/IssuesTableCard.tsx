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
  Download,
} from "lucide-react";
import {
  IssueItem,
  IssueGroup,
  IssueTypeFilter,
  GroupByOption,
} from "../types/issuesData";
import {
  formatShortDate,
  inputClock,
  initialsOf,
  fmtId,
} from "../utils/issuesDataUtils";
import {
  SEV_PILL_CLASS,
  ROLE_PILL_CLASS,
  sevDisplayLabel,
  typeDisplayLabel,
} from "./pillStyles";
import { WRAP_PILL } from "@/components/shared/tableStyles";

// ----------------------------------------------------------------------
// Filter select chip
// ----------------------------------------------------------------------
interface FilterDef {
  label: string;
  value: string;
  opts: string[];
  active: boolean;
  onChange: (v: string) => void;
}

function FilterChip({ f }: { f: FilterDef }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border bg-white px-3 transition-colors dark:bg-zinc-900 ${
          f.active
            ? "border-blue-300 dark:border-blue-800"
            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
        }`}
      >
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
          {f.label}
        </span>
        <span
          className={`max-w-[120px] truncate whitespace-nowrap text-[13px] font-bold ${
            f.active
              ? "text-blue-600 dark:text-blue-400"
              : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {f.value}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
      </button>
      {open && (
        <div className="absolute left-0 top-[42px] z-50 max-h-[292px] min-w-[206px] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="px-2.5 pb-1.5 pt-1 text-[9.5px] font-bold uppercase tracking-wider text-zinc-300 dark:text-zinc-600">
            {f.label}
          </div>
          {f.opts.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                f.onChange(o);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                o === f.value
                  ? "font-bold text-blue-600 dark:text-blue-400"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-left">{o}</span>
              {o === f.value && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Row (flat + grouped variants share this)
// ----------------------------------------------------------------------
// Name and remarks flex and wrap to two lines; the rest are sized to their
// longest value, so the flat table fits 834px (grouped 754px) before it
// needs horizontal scroll.
const FLAT_COLS =
  "grid-cols-[2rem_5rem_minmax(8.75rem,1.2fr)_4.5rem_5rem_4.5rem_2.75rem_4.5rem_minmax(8.125rem,1.6fr)_1.5rem]";
const GROUP_COLS =
  "grid-cols-[2rem_5rem_minmax(8.75rem,1.2fr)_5rem_4.5rem_2.75rem_4.5rem_minmax(8.125rem,1.6fr)_1.5rem]";

function IssueRow({
  r,
  no,
  showPic,
  onOpen,
}: {
  r: IssueItem;
  no: number;
  showPic: boolean;
  onOpen: (id: string) => void;
}) {
  const clock = r.disc ? inputClock(r.timeInput) : null;
  return (
    <div
      onClick={() => onOpen(r.id)}
      className={`grid ${showPic ? FLAT_COLS : GROUP_COLS} cursor-pointer items-center gap-2 border-b border-zinc-100 p-2 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50`}
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
      {/* Project shows only when it differs from the record name */}
      <span className="min-w-0">
        <span className="line-clamp-2 wrap-break-word text-[12.5px] font-semibold leading-snug text-zinc-700 dark:text-zinc-300">
          {r.name || r.project}
        </span>
        {r.name && r.name !== r.project && (
          <span className="block truncate text-[10.5px] text-zinc-400 dark:text-zinc-500">
            {r.project}
          </span>
        )}
      </span>
      {showPic && (
        <span className="min-w-0">
          <span
            className={`${WRAP_PILL} text-[11px] ${
              ROLE_PILL_CLASS[r.section] || ROLE_PILL_CLASS["PIC Project"]
            }`}
          >
            {r.pic}
          </span>
        </span>
      )}
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

// ----------------------------------------------------------------------
// Table card
// ----------------------------------------------------------------------
interface IssuesTableCardProps {
  subLabel: string;
  q: string;
  onQChange: (v: string) => void;
  fType: IssueTypeFilter;
  onTypeChange: (v: IssueTypeFilter) => void;
  fSeverity: string;
  onSeverityChange: (v: string) => void;
  fStatus: string;
  onStatusChange: (v: string) => void;
  fStage: string;
  onStageChange: (v: string) => void;
  groupBy: GroupByOption;
  onGroupByChange: (v: GroupByOption) => void;
  onExport: () => void;
  isEmpty: boolean;
  grouped: boolean;
  flatRows: IssueItem[];
  flatStartIndex: number;
  groupRows: IssueGroup[];
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
  onOpenRow: (id: string) => void;
  footLabel: string;
  pageNumbers: number[];
  currentPage: number;
  onGotoPage: (n: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

const HEADS = [
  "#",
  "Tgl temuan",
  "Nama / project",
  "Penemu",
  "Developer",
  "PIC/Bizdev",
  "Tipe",
  "Severity",
  "Isi temuan",
  "",
];

export default function IssuesTableCard(props: IssuesTableCardProps) {
  const filters: FilterDef[] = [
    {
      label: "Tipe",
      value: props.fType,
      opts: ["All type", "Bug", "CR", "Unclassified"],
      active: props.fType !== "All type",
      onChange: (v) => props.onTypeChange(v as IssueTypeFilter),
    },
    {
      label: "Severity",
      value: props.fSeverity,
      opts: [
        "All",
        "Critical",
        "Recurring",
        "Major",
        "Minor",
        "Trivia",
        "Unclassified",
      ],
      active: props.fSeverity !== "All",
      onChange: props.onSeverityChange,
    },
    {
      label: "Status",
      value: props.fStatus,
      opts: ["All", "Done", "On Progress", "Open"],
      active: props.fStatus !== "All",
      onChange: props.onStatusChange,
    },
    {
      label: "Tahap",
      value: props.fStage,
      opts: [
        "All stage",
        "Testing PIC",
        "SIT",
        "Change Request",
        "Live on Monitoring",
      ],
      active: props.fStage !== "All stage",
      onChange: props.onStageChange,
    },
    {
      label: "Group by",
      value: props.groupBy,
      opts: [
        "Default",
        "PIC / Bizdev",
        "Developer",
        "Project",
        "Tahap testing",
      ],
      active: props.groupBy !== "Default",
      onChange: (v) => props.onGroupByChange(v as GroupByOption),
    },
  ];

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 font-sans">
      {/* Header */}
      <div className="mb-3.5">
        <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
          Issues data
          <SourceHint
            fields={[
              {
                label: "Tgl temuan",
                field: "Discovery Date",
                rule: 'Tanggal asli dari Notion. Bertanda "-" bila kolomnya kosong.',
              },
              {
                label: "Nama / project",
                field: "Name + Project",
                rule: "Judul record di Notion. Nama Project ditampilkan di baris bawah bila berbeda dari judul.",
              },
              {
                label: "Penemu / Developer / PIC-Bizdev",
                field: "PIC Name, Dev Name, Section",
                rule: "Penemu diambil dari PIC Name, Developer dari Dev Name, dan kolom PIC/Bizdev dari Section.",
              },
              {
                label: "Tipe & Severity",
                field: "Type (Bug/Change Request), Severity",
                rule: 'Tipe hanya mengikuti nilai kolom: "Bug" jadi Bug, "Change Request" jadi CR; nilai kosong/tidak dikenal ditampilkan belum diklasifikasi. Severity ditampilkan apa adanya.',
              },
              {
                label: "Isi temuan",
                field: "Remarks",
                rule: "Catatan temuan dari Notion; klik baris untuk melihat teks penuh dan tanggapan developer.",
              },
            ]}
            notes={[
              "Tabel ini menampilkan record mentah, jadi bisa dipakai mencocokkan angka pada grafik di atas.",
              "Tombol unduh mengekspor seluruh baris hasil filter beserta kolom yang tidak muat di layar.",
            ]}
          />
        </h3>
        <p className="mt-0.5 text-[13px] text-zinc-400 dark:text-zinc-500">
          {props.subLabel}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <label className="flex h-9 min-w-52 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 transition-colors focus-within:border-blue-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
          <Search className="h-3.75 w-3.75 shrink-0 text-zinc-400 dark:text-zinc-500" />
          <input
            value={props.q}
            onChange={(e) => props.onQChange(e.target.value)}
            placeholder="Cari nama temuan, PIC, developer, project, atau isi temuan"
            className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-300 dark:placeholder:text-zinc-500"
          />
        </label>
        {filters.map((f) => (
          <FilterChip key={f.label} f={f} />
        ))}
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
          Tidak ada record yang cocok dengan filter ini.
        </div>
      )}

      {/* Flat table */}
      {!props.grouped && !props.isEmpty && (
        <div className="overflow-x-auto">
          <div className="min-w-208.5">
            <div
              className={`grid ${FLAT_COLS} gap-2 border-b border-zinc-100 p-2 dark:border-zinc-800`}
            >
              {HEADS.map((h, i) => (
                <span
                  key={i}
                  className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
                >
                  {h}
                </span>
              ))}
            </div>
            {props.flatRows.map((r, i) => (
              <IssueRow
                key={r.id}
                r={r}
                no={props.flatStartIndex + i + 1}
                showPic
                onOpen={props.onOpenRow}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grouped accordion */}
      {props.grouped && !props.isEmpty && (
        <div className="flex flex-col gap-2">
          {props.groupRows.map((g) => {
            const ex = !!props.expandedGroups[g.key];
            return (
              <div
                key={g.key}
                className="rounded-lg border border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/30"
              >
                <div
                  onClick={() => props.onToggleGroup(g.key)}
                  className="grid cursor-pointer grid-cols-[2.125rem_1fr_9.375rem_4.75rem_4.75rem_6rem_1.5rem] items-center gap-x-3.5 rounded-lg px-3.5 py-2.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                >
                  <span
                    className={`inline-flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-[9px] text-[11px] font-bold font-display ${
                      ROLE_PILL_CLASS[g.section] ||
                      ROLE_PILL_CLASS["PIC Project"]
                    }`}
                  >
                    {initialsOf(g.name)}
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
                      <div className="min-w-188.5">
                        {g.rows.slice(0, 10).map((r, i) => (
                          <IssueRow
                            key={r.id}
                            r={r}
                            no={i + 1}
                            showPic={false}
                            onOpen={props.onOpenRow}
                          />
                        ))}
                      </div>
                    </div>
                    {g.rows.length > 10 && (
                      <div className="px-2 pt-2 text-[11.5px] text-zinc-400 dark:text-zinc-500">
                        + {fmtId(g.rows.length - 10)} record lainnya di grup ini
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
