"use client";

import { Card } from "@/components/ui/card";
import SourceHint from "@/components/ui/SourceHint";
import { fmt } from "@/lib/utils";
import { KpiEntry, StageChip, DeltaInfo } from "../types/overviewTypes";
import {
  Inbox,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from "lucide-react";

interface OverviewMetricsGridProps {
  findings: KpiEntry;
  bug: KpiEntry;
  cr: KpiEntry;
  penalty: KpiEntry;
  stageChips: StageChip[];
  onDetailClick?: () => void;
}

const STAGE_COLORS = ["#2563EB", "#f59e0b", "#ef4444"];

/** Catatan yang berlaku untuk semua kartu KPI. */
const KPI_NOTES = [
  "Angka mengikuti tahun, bulan, project, dan role yang dipilih.",
  "Perbandingan antar tahun tersedia pada halaman Comparison.",
];

function DeltaChip({
  delta,
  onSolid = false,
}: {
  delta: DeltaInfo;
  onSolid?: boolean;
}) {
  if (!delta.show) return null;

  const DirIcon =
    delta.direction === "up"
      ? TrendingUp
      : delta.direction === "down"
        ? TrendingDown
        : null;

  const toneClass =
    delta.direction === "up"
      ? onSolid
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
      : delta.direction === "down"
        ? onSolid
          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
          : "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
        : onSolid
          ? "bg-white/20 text-white ring-1 ring-white/25"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${toneClass}`}
      title={`${delta.text} vs comparison period`}
    >
      {DirIcon && <DirIcon className="h-3 w-3" />}
      {delta.text}
    </span>
  );
}

export default function OverviewMetricsGrid({
  findings,
  bug,
  cr,
  penalty,
  stageChips,
  onDetailClick,
}: OverviewMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-3.5 font-sans select-none sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Findings — primary KPI */}
      <Card
        variant="featured"
        className="rounded-xl p-4 shadow-xs min-h-27.5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20">
            <Inbox size={16} />
          </div>
          <DeltaChip delta={findings.delta} onSolid />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            Total findings
            <SourceHint
              fields={[
                {
                  label: "Total findings",
                  field: "seluruh baris database",
                  rule: "Jumlah seluruh record pada periode terpilih, tanpa memandang Type maupun Severity.",
                },
              ]}
              notes={[
                ...KPI_NOTES,
                "Nilainya selalu sama dengan Total bug + Change request.",
              ]}
            />
          </div>
          <div className="mt-0.5 text-[10.5px] text-blue-100">
            Semua temuan bug &amp; change request tercatat
          </div>
          <div className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-white font-display">
            {fmt(findings.count ?? 0)}
          </div>
        </div>
      </Card>

      {/* 2. Total Bug Card (Clickable, stage chips) */}
      <Card
        onClick={onDetailClick}
        className="cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-rose-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-rose-900 min-h-27.5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertTriangle size={16} />
          </div>
          <DeltaChip delta={bug.delta} />
        </div>

        <div className="mt-2 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
              Total bug
              <SourceHint
                fields={[
                  {
                    label: "Total bug",
                    field: "Issue Type",
                    rule: 'Record yang issue_type dari PostgreSQL/Notion bernilai exact "Bug". Nilai kosong atau selain Bug/Change Request ditampilkan sebagai Unclassified dan tidak dihitung sebagai Bug.',
                  },
                  {
                    label: "Batang Testing PIC / SIT / Live on Monitoring",
                    field: "Testing Type",
                    rule: 'Jumlah bug per Testing Type. Nilai Notion "Temuan After Live" ditampilkan sebagai "Live on Monitoring".',
                  },
                ]}
                notes={[
                  ...KPI_NOTES,
                  "Persentase batang dihitung terhadap total bug, bukan total findings.",
                ]}
              />
            </div>
            <div className="text-[10.5px] text-zinc-400 dark:text-zinc-500 mt-0.5 mb-1.5">
              Cacat sistem per tahap pengujian
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 font-display leading-none">
              {fmt(bug.count ?? 0)}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDetailClick?.();
              }}
              className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[9.5px] font-bold text-blue-600 ring-1 ring-blue-100 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-900 cursor-pointer shrink-0"
            >
              Lihat detail <ChevronRight size={10} />
            </button>
          </div>

          {/* Stage chips */}
          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 border-t border-zinc-100 pt-1.5 dark:border-zinc-800">
            {stageChips.map((chip, idx) => (
              <div key={chip.label} className="space-y-0.5 min-w-0">
                <div className="flex justify-between items-center gap-1 text-[9.5px] font-medium text-zinc-500 dark:text-zinc-400">
                  <span className="truncate">{chip.label}</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums shrink-0">
                    {fmt(chip.count)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${chip.pct}%`,
                      backgroundColor: STAGE_COLORS[idx % STAGE_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 3. Change Request Card */}
      <Card className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 min-h-27.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <RefreshCw size={16} />
          </div>
          <DeltaChip delta={cr.delta} />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            Change request
            <SourceHint
              fields={[
                {
                  label: "Change request",
                  field: "Issue Type",
                  rule: 'Record yang issue_type dari PostgreSQL/Notion bernilai exact "Change Request". Nilai kosong tidak diinfer dari Testing Type.',
                },
              ]}
              notes={KPI_NOTES}
            />
          </div>
          <div className="text-[10.5px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            Permintaan perubahan di luar temuan
          </div>
          <div className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
            {fmt(cr.count ?? 0)}
          </div>
        </div>
      </Card>

      {/* 4. Penalty Score Card */}
      <Card className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 min-h-27.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <TrendingUp size={16} />
          </div>
          <DeltaChip delta={penalty.delta} />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            Penalty Score
            <SourceHint
              fields={[
                {
                  label: "Penalty Score",
                  field: "Severity",
                  rule: "Jumlah bobot seluruh record: Critical 10, Recurring 8, Major 5, Minor 2, Trivia 1, tanpa severity 0.",
                },
              ]}
              notes={[
                ...KPI_NOTES,
                "Skor ini hitungan dashboard, bukan kolom yang ada di Notion.",
              ]}
            />
          </div>
          <div className="text-[10.5px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            Total bobot risiko dari severity temuan
          </div>
          <div className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
            {fmt(penalty.count ?? 0)}
          </div>
        </div>
      </Card>
    </div>
  );
}
