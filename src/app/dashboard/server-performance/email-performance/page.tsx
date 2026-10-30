export const instant = false;

import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { getEmailPerformanceData } from "@/features/server-performance/email-performance/services/emailPerformanceService";
import { EmailKpiCards } from "@/features/server-performance/email-performance/components/EmailKpiCards";
import { EmailSlaChartsGrid } from "@/features/server-performance/email-performance/components/EmailSlaChartsGrid";
import { EmailSlaChart } from "@/features/server-performance/email-performance/components/EmailSlaChart";
import { EmailIncidentTable } from "@/features/server-performance/email-performance/components/EmailIncidentTable";
import { PerformancePageSkeleton } from "@/features/server-performance/components/PerformancePageSkeleton";
import { DEFAULT_YEAR } from "@/lib/dashboard-config";
import { normalizeMonthRange } from "@/features/server-performance/utils/month-filter";

interface EmailPerformancePageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

async function EmailPerformanceContent({
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

  const data = await getEmailPerformanceData(year, month);

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
      <EmailKpiCards data={data} />

      {/* Row 2: Side-by-Side SLA Charts (Quarterly vs Monthly Range) */}
      <EmailSlaChartsGrid
        monthlyMetrics={data.monthlyMetrics}
        quarterlyMetrics={data.quarterlyMetrics}
        year={data.year}
        prevYear={data.prevYear}
        periodLabel={data.periodLabel}
      />

      {/* Row 3: Performance & Availability Trends (Issue Freq, Downtime, CPU, Memory) */}
      <EmailSlaChart
        metrics={data.monthlyMetrics}
        year={data.year}
        prevYear={data.prevYear}
        periodLabel={data.periodLabel}
      />

      {/* Row 4: Incident Outage Log & Root Cause Analysis */}
      <EmailIncidentTable incidents={data.incidents} year={data.year} />
    </div>
  );
}

export default async function EmailPerformancePage({
  searchParams,
}: EmailPerformancePageProps) {
  await connection();
  await requirePagePermission("menu.server-performance.email-performance.view");

  return (
    <Suspense fallback={<PerformancePageSkeleton />}>
      <EmailPerformanceContent searchParams={searchParams} />
    </Suspense>
  );
}
