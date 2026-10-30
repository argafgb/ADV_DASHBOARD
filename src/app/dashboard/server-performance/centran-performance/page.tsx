export const instant = false;

import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { getCentranPerformanceData } from "@/features/server-performance/centran-performance/services/centranPerformanceService";
import { CentranKpiCards } from "@/features/server-performance/centran-performance/components/CentranKpiCards";
import { CentranSlaChartsGrid } from "@/features/server-performance/centran-performance/components/CentranSlaChartsGrid";
import { CentranSlaChart } from "@/features/server-performance/centran-performance/components/CentranSlaChart";
import { CentranOpenCloseChart } from "@/features/server-performance/centran-performance/components/CentranOpenCloseChart";
import { CentranIncidentTable } from "@/features/server-performance/centran-performance/components/CentranIncidentTable";
import { PerformancePageSkeleton } from "@/features/server-performance/components/PerformancePageSkeleton";
import { DEFAULT_YEAR } from "@/lib/dashboard-config";
import { normalizeMonthRange } from "@/features/server-performance/utils/month-filter";

interface CentranPerformancePageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

async function CentranPerformanceContent({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const year = resolvedSearchParams?.year || DEFAULT_YEAR;
  const month = normalizeMonthRange(
    resolvedSearchParams?.month,
    Number(year),
  ).value;

  const data = await getCentranPerformanceData(year, month);

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
          {data.name}
        </h1>
        <p className="text-muted-foreground text-sm">{data.sub}</p>
      </div>

      {/* Row 1: KPI Stats Cards (Yearly SLA, Total Downtime YTD, Severity Breakdown) */}
      <CentranKpiCards data={data} />

      {/* Row 2: Total Open & Close Timeline Chart */}
      <CentranOpenCloseChart
        data={data.openCloseData}
        year={data.year}
        prevYear={data.prevYear}
        periodLabel={data.periodLabel}
      />

      {/* Row 3: Side-by-Side SLA Charts (Quarterly vs Monthly Range) */}
      <CentranSlaChartsGrid
        monthlyMetrics={data.monthlyMetrics}
        quarterlyMetrics={data.quarterlyMetrics}
        year={data.year}
        prevYear={data.prevYear}
        periodLabel={data.periodLabel}
      />

      {/* Row 4: Performance & Availability Trends (Issue Freq, Downtime, CPU, Memory) */}
      <CentranSlaChart
        metrics={data.monthlyMetrics}
        year={data.year}
        prevYear={data.prevYear}
        periodLabel={data.periodLabel}
      />

      {/* Row 5: Incident Outage Log & Root Cause Analysis */}
      <CentranIncidentTable incidents={data.incidents} year={data.year} />
    </div>
  );
}

export default async function CentranPerformancePage({
  searchParams,
}: CentranPerformancePageProps) {
  await connection();
  await requirePagePermission("menu.server-performance.centran-performance.view");

  return (
    <Suspense fallback={<PerformancePageSkeleton hasOpenCloseChart />}>
      <CentranPerformanceContent searchParams={searchParams} />
    </Suspense>
  );
}
