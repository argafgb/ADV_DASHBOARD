"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import SourceHint from "@/components/ui/SourceHint";
import { fmt } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  MatrixRole,
  MatrixType,
  PersonBarItem,
  DonutSeg,
  SevScaleItem,
} from "../types/overviewTypes";

const ROLE_DOT: Record<MatrixRole, string> = {
  Developer: "#10b981",
  "PIC Project": "#2563EB",
  Bizdev: "#f59e0b",
};

const SEV_PILL_CLASS: Record<string, string> = {
  Critical: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
  Recurring:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  Major: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  Minor: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  Trivia: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

const ROLE_OPTIONS: MatrixRole[] = ["Developer", "PIC Project", "Bizdev"];
const TYPE_OPTIONS: { value: MatrixType; label: string }[] = [
  { value: "Bug", label: "Bug" },
  { value: "CR", label: "Change request" },
];

interface PersonnelSeverityMatrixCardProps {
  mtRole: MatrixRole;
  mtType: MatrixType;
  personBars: PersonBarItem[];
  donutTotal: number;
  donutSegs: DonutSeg[];
  sevScale: SevScaleItem[];
  onRoleChange?: (role: MatrixRole) => void;
  onTypeChange?: (type: MatrixType) => void;
  onPersonClick?: (name: string) => void;
}

function ChipButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-8 shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs transition ${
        active
          ? "bg-blue-600 font-bold text-white"
          : "border border-zinc-200 font-semibold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );
}

export default function PersonnelSeverityMatrixCard({
  mtRole,
  mtType,
  personBars,
  donutTotal,
  donutSegs,
  sevScale,
  onRoleChange,
  onTypeChange,
  onPersonClick,
}: PersonnelSeverityMatrixCardProps) {
  const [showSevTip, setShowSevTip] = useState(false);

  const dotColor = ROLE_DOT[mtRole] || ROLE_DOT.Developer;

  const barsTitle =
    mtRole === "Developer"
      ? "Volume temuan per developer"
      : mtRole === "PIC Project"
        ? "Volume temuan per PIC project"
        : "Volume temuan per bizdev";

  const donutGradient =
    donutTotal > 0
      ? `conic-gradient(${donutSegs
          .reduce<{ stops: string[]; acc: number }>(
            (state, seg) => {
              const from = state.acc;
              const to = from + (seg.count / Math.max(1, donutTotal)) * 100;
              return {
                stops: [...state.stops, `${seg.color} ${from}% ${to}%`],
                acc: to,
              };
            },
            { stops: [], acc: 0 },
          )
          .stops.join(", ")})`
      : undefined;

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 font-sans select-none">
      {/* Header + role/type chips */}
      <div className="flex flex-col gap-3 min-[1180px]:flex-row min-[1180px]:items-start">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
            Personnel &amp; severity matrix
            <SourceHint
              fields={[
                {
                  label: "Nama orang",
                  field: "Dev Name / PIC Name",
                  rule: 'Chip "Developer" mengelompokkan record menurut Dev Name; chip "PIC Project" dan "Bizdev" menurut PIC Name.',
                },
                {
                  label: "Chip PIC Project / Bizdev",
                  field: "Section",
                  rule: "Kedua chip ini juga menyaring record menurut Section terlebih dahulu.",
                },
                {
                  label: "Chip Bug / Change request",
                  field: "Issue Type",
                  rule: 'Menyaring record berdasarkan issue_type exact dari PostgreSQL/Notion: "Bug" untuk Bug dan "Change Request" untuk CR. Nilai kosong/selain itu tidak diinfer.',
                },
                {
                  label: "Donut severity",
                  field: "Severity",
                  rule: "Sebaran Severity dari record yang lolos kedua chip di atas; persentase dihitung terhadap total record tersebut.",
                },
              ]}
              notes={[
                'Nama kosong atau "-" tidak ditampilkan.',
                "Hanya 6 nama teratas yang tampil; klik nama untuk rincian per individu.",
              ]}
            />
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
            Sebaran temuan per orang &middot; klik nama untuk melihat detail
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 min-[1180px]:ml-auto min-[1180px]:flex-nowrap min-[1180px]:justify-end">
          {ROLE_OPTIONS.map((r) => (
            <ChipButton
              key={r}
              label={r}
              active={mtRole === r}
              onClick={() => onRoleChange?.(r)}
            />
          ))}
          <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
          {TYPE_OPTIONS.map((t) => (
            <ChipButton
              key={t.value}
              label={t.label}
              active={mtType === t.value}
              onClick={() => onTypeChange?.(t.value)}
            />
          ))}
        </div>
      </div>

      {/* Two columns */}
      <div className="mt-5 grid grid-cols-1 gap-7 lg:grid-cols-2 lg:gap-8">
        {/* Left: person bars */}
        <div className="min-w-0">
          <div className="mb-2 flex items-center">
            <span className="text-[13px] font-bold text-zinc-600 dark:text-zinc-300">
              {barsTitle}
            </span>
            <span className="ml-auto text-[11px] text-zinc-400 dark:text-zinc-500">
              Top 6 · klik untuk detail
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {personBars.length > 0 ? (
              personBars.map((d) => (
                <button
                  key={d.name}
                  onClick={() => onPersonClick?.(d.name)}
                  className="grid grid-cols-[minmax(0,8.25rem)_1fr_2.5rem] items-center gap-3 rounded-md px-1 py-0.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="truncate text-xs text-zinc-700 dark:text-zinc-300">
                      {d.name}
                    </span>
                  </span>
                  <span className="block h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${d.pct}%`,
                        backgroundColor: dotColor,
                      }}
                    />
                  </span>
                  <span className="text-right text-xs font-bold text-zinc-900 dark:text-zinc-50 font-display">
                    {fmt(d.count)}
                  </span>
                </button>
              ))
            ) : (
              <div className="py-6 text-center text-xs italic text-zinc-400 dark:text-zinc-500">
                Tidak ada data pada filter aktif
              </div>
            )}
          </div>
        </div>

        {/* Right: donut + severity weights tooltip */}
        <div className="min-w-0">
          <div className="relative mb-3 flex items-center">
            <span className="text-[13px] font-bold text-zinc-600 dark:text-zinc-300">
              Tingkat kesalahan
            </span>
            <span
              onMouseEnter={() => setShowSevTip(true)}
              onMouseLeave={() => setShowSevTip(false)}
              className="ml-2 inline-flex cursor-help items-center text-blue-600 dark:text-blue-400"
            >
              <Info size={15} strokeWidth={1.9} />
            </span>
            <span className="ml-auto hidden text-[11px] font-medium text-zinc-400 dark:text-zinc-500 sm:inline">
              5 kategori severity
            </span>

            {showSevTip && (
              <div className="absolute left-0 top-7 z-40 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                  Bobot poin severity
                </div>
                <div className="mb-2.5 mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                  Penalty Score = jumlah poin seluruh temuan pada filter aktif
                </div>
                <div className="flex flex-col gap-1.5">
                  {sevScale.map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span
                        className={`min-w-18 rounded-full px-2 py-0.5 text-center text-[10.5px] font-bold ${
                          SEV_PILL_CLASS[s.label] || SEV_PILL_CLASS.Trivia
                        }`}
                      >
                        {s.label}
                      </span>
                      <span className="flex-1 text-[11.5px] text-zinc-500 dark:text-zinc-400">
                        {s.desc}
                      </span>
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50 font-display">
                        {fmt(s.weight)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-36 flex-wrap items-center gap-6">
            {/* Donut */}
            <div
              className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
              style={donutGradient ? { background: donutGradient } : undefined}
            >
              <div className="flex h-21 w-21 flex-col items-center justify-center rounded-full bg-white shadow-[0_0_0_1px_rgba(228,228,231,0.7)] dark:bg-zinc-900 dark:shadow-[0_0_0_1px_rgba(63,63,70,0.8)]">
                <span className="text-[22px] font-extrabold leading-none text-zinc-900 dark:text-zinc-50 font-display">
                  {fmt(donutTotal)}
                </span>
                <span className="mt-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                  temuan
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="grid min-w-48 flex-1 grid-cols-[12px_minmax(5rem,1fr)_auto_2.5rem] items-center gap-x-2.5 gap-y-2">
              {donutSegs.map((s) => (
                <React.Fragment key={s.label}>
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="truncate text-[13px] font-medium text-zinc-600 dark:text-zinc-300">
                    {s.label}
                  </span>
                  <span className="text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-display">
                    {fmt(s.count)}
                  </span>
                  <span className="text-right text-[13px] font-extrabold text-zinc-800 dark:text-zinc-200 font-display">
                    {s.pct}%
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
