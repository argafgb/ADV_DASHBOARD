"use client";

import React from "react";
import SeverityBadge from "./SeverityBadge";
import { useHoverTip } from "../context/TooltipLayer";
import type { Tone } from "../types/network.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export interface DtRow {
  id: number;
  site: string;
  region: string;
  periode: string;
  sla: string;
  slaNum: number | null;
  durasi: string;
  durMin: number;
  problem: string;
  impact: string | null;
  solution: string | null;
  downtimeStart: string | null;
  uptimeEnd: string | null;
  level: string;
  cause: string;
  verified: boolean;
  tone: Tone;
}

export interface DtHead {
  label: string;
  arrow: string;
  onClick: () => void;
}

interface DowntimeTableProps {
  rows: DtRow[];
  heads: Record<
    "sev" | "cabang" | "periode" | "sla" | "durasi" | "problem" | "cause",
    DtHead
  >;
  dtSearch: string;
  onDtSearch: (v: string) => void;
  dtSeverity: string;
  onDtSeverity: (v: string) => void;
  dtCauseVal: string;
  onDtCauseSel: (v: string) => void;
  causeOptions: { value: string; label: string }[];
  onProblemClick: (row: DtRow) => void;
}

const thStyle = (align: "left" | "right"): React.CSSProperties => ({
  padding: "9px 11px",
  textAlign: align,
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".04em",
  color: "var(--text-muted)",
  background: "var(--bg-card)",
  borderBottom: "1px solid var(--border-default)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  userSelect: "none",
  position: "sticky",
  top: 0,
  zIndex: 2,
});

const filterTh: React.CSSProperties = {
  padding: "6px 9px",
  background: "var(--bg-card)",
  borderBottom: "1px solid var(--border-default)",
  position: "sticky",
  top: "31px",
  zIndex: 2,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "28px",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-base)",
  padding: "0 8px",
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  color: "var(--text-secondary)",
  outline: "none",
  background: "var(--bg-card)",
};

const tdBase: React.CSSProperties = {
  padding: "14px 14px",
  borderBottom: "1px solid var(--border-subtle)",
  verticalAlign: "top",
};

function TableFilterDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const currentOption = options.find((o) => o.value === value);
  const label = currentOption ? currentOption.label : "Semua";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-7 w-full items-center justify-between gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 cursor-pointer outline-none"
        >
          <span className="truncate">{label}</span>
          <ChevronDown size={12} className="text-zinc-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-50 min-w-32 p-1">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full flex items-center px-2.5 py-1.5 text-xs rounded-md cursor-pointer ${
              opt.value === value
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Tabel insiden downtime — sortable + filter severity/penyebab + search. */
export default function DowntimeTable({
  rows,
  heads,
  dtSearch,
  onDtSearch,
  dtSeverity,
  onDtSeverity,
  dtCauseVal,
  onDtCauseSel,
  causeOptions,
  onProblemClick,
}: DowntimeTableProps) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();

  const th = (h: DtHead, align: "left" | "right" = "left") => (
    <th style={thStyle(align)} onClick={h.onClick}>
      {h.label} {h.arrow}
    </th>
  );

  return (
    <div
      className="nl-scroll"
      style={{
        flex: 1,
        maxHeight: "520px",
        overflow: "auto",
        border: "1px solid var(--border-subtle)",
        borderRadius: "10px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: "95px" }} />
          <col style={{ width: "170px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "80px" }} />
          <col style={{ width: "85px" }} />
          <col style={{ width: "auto" }} />
          <col style={{ width: "150px" }} />
        </colgroup>
        <thead>
          <tr>
            {th(heads.sev)}
            {th(heads.cabang)}
            {th(heads.periode)}
            {th(heads.sla, "right")}
            {th(heads.durasi, "right")}
            {th(heads.problem)}
            {th(heads.cause)}
          </tr>
          <tr>
            <th style={filterTh}>
              <TableFilterDropdown
                value={dtSeverity}
                onChange={onDtSeverity}
                options={[
                  { value: "all", label: "Semua" },
                  { value: "critical", label: "Critical" },
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" },
                ]}
              />
            </th>
            <th style={filterTh}>
              <input
                value={dtSearch}
                onChange={(e) => onDtSearch(e.target.value)}
                placeholder="Cari cabang…"
                style={inputStyle}
              />
            </th>
            <th style={filterTh} />
            <th style={filterTh} />
            <th style={filterTh} />
            <th style={filterTh}>
              <input
                value={dtSearch}
                onChange={(e) => onDtSearch(e.target.value)}
                placeholder="Cari problem…"
                style={inputStyle}
              />
            </th>
            <th style={filterTh}>
              <TableFilterDropdown
                value={dtCauseVal}
                onChange={onDtCauseSel}
                options={[{ value: "", label: "Semua" }, ...causeOptions]}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                style={{
                  textAlign: "center",
                  padding: "32px 16px",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  fontStyle: "italic",
                }}
              >
                Belum ada data insiden tercatat untuk periode ini.
              </td>
            </tr>
          ) : (
            rows.map((d) => (
              <tr
                key={d.id}
                onClick={() => onProblemClick(d)}
                title="Lihat detail insiden"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background =
                    "var(--bg-hover)";
                  tipEnter(
                    e,
                    {
                      title: d.site,
                      primary: "SLA " + d.sla,
                      secondary: "(" + d.periode + ", durasi " + d.durasi + ")",
                      meta: d.problem,
                      tone: d.tone,
                    },
                    "none",
                  );
                }}
                onMouseMove={(e) => tipMove(e)}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background =
                    "";
                  tipLeave();
                }}
              >
                <td style={tdBase}>
                  <SeverityBadge level={d.level} />
                </td>
                <td style={tdBase}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      letterSpacing: "-.01em",
                    }}
                  >
                    {d.site}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-placeholder)",
                      marginTop: "2px",
                    }}
                  >
                    {d.region}
                  </div>
                </td>
                <td
                  style={{
                    ...tdBase,
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "11.5px",
                    color: "var(--text-placeholder)",
                  }}
                >
                  {d.periode}
                </td>
                <td
                  style={{
                    ...tdBase,
                    textAlign: "right",
                    fontFamily: "var(--font-display)",
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "-.01em",
                  }}
                >
                  {d.sla}
                </td>
                <td
                  style={{
                    ...tdBase,
                    textAlign: "right",
                    fontFamily: "var(--font-display)",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                  }}
                >
                  {d.durasi}
                </td>
                <td
                  style={{
                    ...tdBase,
                    fontSize: "12.5px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.45,
                  }}
                >
                  {/* Clamped to two lines; the full text lives in the modal. */}
                  <span
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {d.problem}
                  </span>
                </td>
                <td style={tdBase}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--text-placeholder)",
                        flexShrink: 0,
                      }}
                    />
                    {d.cause}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
