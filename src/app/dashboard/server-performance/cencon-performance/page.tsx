export const instant = false;

import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { getCenconPerformanceData } from "@/features/server-performance/cencon-performance/services/cenconPerformanceService";
import { CenconKpiCards } from "@/features/server-performance/cencon-performance/components/CenconKpiCards";
import { CenconSlaChartsGrid } from "@/features/server-performance/cencon-performance/components/CenconSlaChartsGrid";
import { CenconSlaChart } from "@/features/server-performance/cencon-performance/components/CenconSlaChart";
import { CenconIncidentTable } from "@/features/server-performance/cencon-performance/components/CenconIncidentTable";
import { PerformancePageSkeleton } from "@/features/server-performance/components/PerformancePageSkeleton";
import { DEFAULT_YEAR } from "@/lib/dashboard-config";
import { normalizeMonthRange } from "@/features/server-performance/utils/month-filter";

interface CenconPerformancePageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

async function CenconPerformanceContent({
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

  const data = await getCenconPerformanceData(year, month);

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
      <CenconKpiCards data={data} />

      {/* Row 2: Side-by-Side SLA Charts (Quarterly vs Monthly Range) */}
      <CenconSlaChartsGrid
        monthlyMetrics={data.monthlyMetrics}
        quarterlyMetrics={data.quarterlyMetrics}
        year={data.year}
        prevYear={data.prevYear}
        periodLabel={data.periodLabel}
      />

      {/* Row 3: Performance & Availability Trends (Issue Freq, Downtime, CPU, Memory) */}
      <CenconSlaChart
        metrics={data.monthlyMetrics}
        year={data.year}
        prevYear={data.prevYear}
        periodLabel={data.periodLabel}
      />

      {/* Row 4: Incident Outage Log & Root Cause Analysis */}
      <CenconIncidentTable incidents={data.incidents} year={data.year} />
    </div>
  );
}

export default async function CenconPerformancePage({
  searchParams,
}: CenconPerformancePageProps) {
  await connection();
  await requirePagePermission("menu.server-performance.cencon-performance.view");

  return (
    <Suspense fallback={<PerformancePageSkeleton />}>
      <CenconPerformanceContent searchParams={searchParams} />
    </Suspense>
  );
}
