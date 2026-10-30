"use client";

import { Minus, TrendingDown, TrendingUp, TrendingUp as TrendingUpIcon } from "lucide-react";
import { MonthlyComparisonChart } from "../charts/monthly-comparison-chart";
import { AnimatedValue } from "../ui/animated-value";
import { Card } from "../Card";
import { EmptyState } from "@/components/shared/EmptyState";
import type { OverviewModel } from "../../utils/build-overview";

type Summary = OverviewModel["comparison"]["summary"];

/** Selisih tahun terpilih: arah, jumlah program, dan persennya. */
function DeltaChip({ summary }: { summary: Summary }) {
  if (summary.delta === null) return null;
  const { delta, deltaPercent } = summary;
  const tone =
    delta > 0
      ? { Icon: TrendingUp, className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" }
      : delta < 0
        ? { Icon: TrendingDown, className: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" }
        : { Icon: Minus, className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" };
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const text =
    delta === 0
      ? `Sama dengan ${summary.comparedTo}`
      : `${sign}${Math.abs(delta)} program${deltaPercent !== null ? ` (${sign}${Math.abs(deltaPercent)}%)` : ""}`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[11.5px] font-bold ${tone.className}`}
    >
      <tone.Icon size={13} strokeWidth={2.4} aria-hidden />
      {text}
    </span>
  );
}

/**
 * Monthly unique-program comparison: grouped columns per month plus same-period
 * totals. Legend sekaligus memuat total tiap tahun, jadi subtitle tidak perlu
 * menyebut tahun yang dibandingkan.
 */
export function ComparisonCard({ comparison }: { comparison: OverviewModel["comparison"] }) {
  const { summary } = comparison;

  return (
    <Card title="Monthly Program Comparison" subtitle="Jumlah program per bulan">
      {comparison.series.length === 0 ? (
        <EmptyState
          icon={TrendingUpIcon}
          title="Data Grafik Tidak Ditemukan"
          description="Tidak ada data perbandingan bulanan untuk ditampilkan."
          height={220}
        />
      ) : (
        <>
          {/* Rata kanan seperti legend chart lain; label tahun dan angkanya dipisah baris. */}
          <div className="mb-2 flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
            <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-2.5 py-[3px] text-[11px] font-bold text-blue-600 dark:text-blue-400">
              {summary.period}
            </span>
            {/* Tahun pembanding di kiri, sama dengan urutan kolom di chart. */}
            {[...summary.totals].reverse().map((item) => (
              <div key={item.label} className="flex flex-col gap-[5px]">
                <span className="inline-flex items-center gap-1.5 text-[11px] leading-none font-semibold text-zinc-500 dark:text-zinc-400">
                  <span
                    aria-hidden
                    className="h-[9px] w-[9px] rounded-[2px]"
                    style={{ background: item.color }}
                  />
                  {item.label}
                </span>
                <span className="text-[11px] leading-none text-zinc-500 dark:text-zinc-400">
                  <span className="text-[16px] font-extrabold text-zinc-900 dark:text-zinc-50">
                    <AnimatedValue value={item.total} />
                  </span>{" "}
                  program
                </span>
              </div>
            ))}
            <DeltaChip summary={summary} />
          </div>
          <MonthlyComparisonChart series={comparison.series} />
        </>
      )}
    </Card>
  );
}
