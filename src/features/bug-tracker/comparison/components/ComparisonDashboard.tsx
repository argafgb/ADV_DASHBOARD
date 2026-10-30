"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { IssueItem } from "@/features/bug-tracker/issues-data/types/issuesData";
import { fmt } from "@/lib/utils";
import { KpiYoY } from "@/features/bug-tracker/overview/types/overviewTypes";
import KpiYoYMini from "@/features/bug-tracker/overview/components/KpiYoYMini";

interface MetricDefinition {
  key: string;
  label: string;
  description: string;
  yoy: KpiYoY | null;
  lowerIsBetter: boolean;
}

interface ComparisonDashboardProps {
  metrics: MetricDefinition[];
  currentItems: IssueItem[];
  previousItems: IssueItem[];
  currentYear: number;
  previousYear: number | null;
}

const ICONS = {
  findings: Activity,
  bug: AlertTriangle,
  cr: RefreshCw,
  penalty: Scale,
} as const;

const YEAR_COLORS = {
  previous: "#F59E0B",
  current: "#2563EB",
  unknown: "#9CA3AF",
} as const;

function percentageChange(yoy: KpiYoY): number {
  if (yoy.prev === 0) return 0;
  return Math.round(((yoy.cur - yoy.prev) / yoy.prev) * 100);
}

function metricSummary(metric: MetricDefinition, yoy: KpiYoY): string {
  const difference = yoy.cur - yoy.prev;
  const signedDifference = `${difference > 0 ? "+" : ""}${fmt(difference)}`;

  if (metric.key === "findings") {
    return `Selisih ${signedDifference} temuan dibanding ${yoy.prevYear}`;
  }
  if (metric.key === "bug") {
    return `Selisih ${signedDifference} bug dibanding ${yoy.prevYear}`;
  }
  if (metric.key === "cr") {
    return `Selisih ${signedDifference} change request dibanding ${yoy.prevYear}`;
  }
  return `Selisih skor ${signedDifference} dibanding ${yoy.prevYear}`;
}

function countBy(
  items: IssueItem[],
  keyOf: (item: IssueItem) => string | null,
) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = keyOf(item)?.trim();
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

function comparisonRows(
  currentItems: IssueItem[],
  previousItems: IssueItem[],
  keyOf: (item: IssueItem) => string | null,
  limit?: number,
) {
  const current = countBy(currentItems, keyOf);
  const previous = countBy(previousItems, keyOf);
  const keys = new Set([...current.keys(), ...previous.keys()]);
  return [...keys]
    .map((name) => ({
      name,
      current: current.get(name) ?? 0,
      previous: previous.get(name) ?? 0,
    }))
    .sort(
      (a, b) =>
        Math.max(b.current, b.previous) - Math.max(a.current, a.previous),
    )
    .slice(0, limit);
}

function MonthlyPaceCard({
  currentItems,
  previousItems,
  currentYear,
  previousYear,
}: {
  currentItems: IssueItem[];
  previousItems: IssueItem[];
  currentYear: number;
  previousYear: number;
}) {
  const labels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const countMonths = (items: IssueItem[]) =>
    labels.map(
      (_, index) => items.filter((item) => item.month === index + 1).length,
    );
  const current = countMonths(currentItems);
  const previous = countMonths(previousItems);
  const max = Math.max(1, ...current, ...previous);

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Monthly pace
          </h3>
          <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
            Total findings per bulan pada kedua tahun
          </p>
        </div>
        <div className="flex gap-4 text-[10.5px] font-semibold text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
            {previousYear} · {fmt(previousItems.length)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
            {currentYear} · {fmt(currentItems.length)}
          </span>
        </div>
      </div>
      <div className="mt-5 flex h-72 items-end gap-2 sm:gap-3">
        {labels.map((label, index) => (
          <div
            key={label}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
          >
            <div className="flex h-full w-full max-w-16 items-end justify-center gap-1">
              <span className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <small className="text-[9px] font-bold text-amber-600">
                  {previous[index] ? fmt(previous[index]) : ""}
                </small>
                <i
                  className="w-full rounded-t-sm bg-amber-500"
                  style={{
                    height: previous[index]
                      ? `${Math.max(4, (previous[index] / max) * 220)}px`
                      : 0,
                  }}
                />
              </span>
              <span className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <small className="text-[9px] font-bold text-blue-600">
                  {current[index] ? fmt(current[index]) : ""}
                </small>
                <i
                  className="w-full rounded-t-sm bg-blue-600"
                  style={{
                    height: current[index]
                      ? `${Math.max(4, (current[index] / max) * 220)}px`
                      : 0,
                  }}
                />
              </span>
            </div>
            <span className="text-[9.5px] text-zinc-400">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BreakdownCard({
  title,
  subtitle,
  rows,
  currentYear,
  previousYear,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ name: string; current: number; previous: number }>;
  currentYear: number;
  previousYear: number;
}) {
  const max = Math.max(
    1,
    ...rows.flatMap((row) => [row.current, row.previous]),
  );

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
          <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-amber-500" />
            {previousYear}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-blue-600" />
            {currentYear}
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.name}
            className="grid grid-cols-[6rem_1fr_auto] items-center gap-3"
          >
            <span className="truncate text-xs text-zinc-600 dark:text-zinc-300">
              {row.name}
            </span>
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${(row.previous / max) * 100}%` }}
                />
              </div>
              <div className="h-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(row.current / max) * 100}%`,
                    backgroundColor: YEAR_COLORS.current,
                  }}
                />
              </div>
            </div>
            <span className="inline-flex min-w-20 items-center justify-end gap-1 text-[11px] font-semibold text-zinc-500">
              {fmt(row.previous)}
              <ArrowRight aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span className="sr-only">menjadi</span>
              <strong className="text-zinc-900 dark:text-zinc-100">
                {fmt(row.current)}
              </strong>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RankingCard({
  title,
  subtitle,
  rows,
  currentYear,
  previousYear,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ name: string; current: number; previous: number }>;
  currentYear: number;
  previousYear: number;
}) {
  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
        {subtitle}
      </p>
      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800">
        <div className="grid grid-cols-[2rem_1fr_4.5rem_4.5rem_4.5rem] gap-2 bg-zinc-50 px-3 py-2 text-[9.5px] font-bold uppercase tracking-wide text-zinc-400 dark:bg-zinc-800/60">
          <span>#</span>
          <span>Nama</span>
          <span className="text-right text-amber-600">{previousYear}</span>
          <span className="text-right text-blue-600">{currentYear}</span>
          <span className="text-right">Selisih</span>
        </div>
        {rows.map((row, index) => {
          const delta = row.current - row.previous;
          return (
            <div
              key={row.name}
              className="grid grid-cols-[2rem_1fr_4.5rem_4.5rem_4.5rem] items-center gap-2 border-t border-zinc-100 px-3 py-2.5 text-xs dark:border-zinc-800"
            >
              <span className="font-bold text-zinc-400">{index + 1}</span>
              <span className="truncate font-medium text-zinc-700 dark:text-zinc-200">
                {row.name}
              </span>
              <span className="text-right tabular-nums font-semibold text-amber-600">
                {fmt(row.previous)}
              </span>
              <span className="text-right tabular-nums font-bold text-blue-600 dark:text-blue-400">
                {fmt(row.current)}
              </span>
              <span
                className={`text-right tabular-nums font-bold ${delta > 0 ? "text-blue-600" : delta < 0 ? "text-amber-600" : "text-zinc-400"}`}
              >
                {delta > 0 ? "+" : ""}
                {fmt(delta)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function ComparisonDashboard({
  metrics,
  currentItems,
  previousItems,
  currentYear,
  previousYear,
}: ComparisonDashboardProps) {
  const available = metrics.filter((metric) => metric.yoy !== null);

  if (available.length === 0 || previousYear === null) {
    return (
      <Card className="rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Data pembanding belum tersedia
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Pilih tahun yang memiliki data tahun sebelumnya untuk menampilkan
          perbandingan.
        </p>
      </Card>
    );
  }

  const severityRows = comparisonRows(
    currentItems,
    previousItems,
    (item) => item.sev,
  );
  const sourceRows = comparisonRows(
    currentItems,
    previousItems,
    (item) => item.section,
  );
  const fsdRows = comparisonRows(currentItems, previousItems, (item) =>
    item.fsd === "Ya"
      ? "Masuk FSD"
      : item.fsd === "Tidak"
        ? "Di luar FSD"
        : "Belum ditandai",
  );
  const developerRows = comparisonRows(
    currentItems,
    previousItems,
    (item) => (item.dev === "-" ? null : item.dev),
    10,
  );
  const projectRows = comparisonRows(
    currentItems,
    previousItems,
    (item) => (item.project === "-" ? null : item.project),
    10,
  );

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        {available.map((metric) => {
          const yoy = metric.yoy!;
          const change = percentageChange(yoy);
          const neutral = change === 0;
          const Icon = ICONS[metric.key as keyof typeof ICONS] ?? Activity;
          const DirectionIcon = change > 0 ? TrendingUp : TrendingDown;
          return (
            <Card
              key={metric.key}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-bold ${neutral ? "bg-zinc-100 text-zinc-600" : change > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                  title={`${change > 0 ? "+" : ""}${change}% vs comparison period`}
                >
                  {!neutral && <DirectionIcon className="h-3 w-3" />}
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {metric.label}
              </h3>
              <p className="mt-0.5 min-h-8 text-[11px] leading-4 text-zinc-400">
                {metric.description}
              </p>
              <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                <KpiYoYMini yoy={yoy} metric={metric.label} />
              </div>
              <p className="mt-2 border-t border-zinc-100 pt-2 text-[10.5px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                {metricSummary(metric, yoy)}
              </p>
            </Card>
          );
        })}
      </div>

      <MonthlyPaceCard
        currentItems={currentItems}
        previousItems={previousItems}
        currentYear={currentYear}
        previousYear={previousYear}
      />

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-3">
        <BreakdownCard
          title="Severity comparison"
          subtitle="Perubahan komposisi tingkat kesalahan"
          rows={severityRows}
          currentYear={currentYear}
          previousYear={previousYear}
        />
        <BreakdownCard
          title="Finding source"
          subtitle="PIC Project dibanding Bizdev"
          rows={sourceRows}
          currentYear={currentYear}
          previousYear={previousYear}
        />
        <BreakdownCard
          title="FSD coverage"
          subtitle="Perubahan status cakupan FSD"
          rows={fsdRows}
          currentYear={currentYear}
          previousYear={previousYear}
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
        <RankingCard
          title="Developer comparison"
          subtitle="Top 10 developer berdasarkan volume tertinggi di salah satu tahun"
          rows={developerRows}
          currentYear={currentYear}
          previousYear={previousYear}
        />
        <RankingCard
          title="Project comparison"
          subtitle="Top 10 project berdasarkan volume tertinggi di salah satu tahun"
          rows={projectRows}
          currentYear={currentYear}
          previousYear={previousYear}
        />
      </div>
    </div>
  );
}
