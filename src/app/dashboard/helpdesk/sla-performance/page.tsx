export const instant = false;

import { getDashboardFilters } from "@/lib/helpdesk/dashboard-filters";
import { Suspense } from "react";
import { requirePagePermission } from "@/lib/access/session";
import {
  getSlaPerformanceData,
  getSlaProblemResolveTrend,
  getSlaResponseTimeTrend,
} from "@/features/helpdesk/sla-performance/services/slaPerformanceService";
import { SlaPerformanceDashboardClient } from "@/features/helpdesk/sla-performance/components/SlaPerformanceDashboardClient";

import { HelpdeskSlaPerformanceSkeleton } from "@/components/dashboard-route-skeletons";
import type {
  SlaPerformanceData,
  SlaTrendComparison,
} from "@/features/helpdesk/sla-performance/types/slaPerformance.types";

interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    dept?: string;
  }>;
}

async function SlaPerformanceContainer({ searchParams }: PageProps) {
  const access = await requirePagePermission(
    "menu.helpdesk.sla-performance.view",
  );
  const params = await searchParams;

  const { year, month, dept } = getDashboardFilters(params);

  let slaPerformanceData: SlaPerformanceData;
  let slaProblemTrend: SlaTrendComparison[] = [];
  let slaResponseTrend: SlaTrendComparison[] = [];

  try {
    [slaPerformanceData, slaProblemTrend, slaResponseTrend] =
      await Promise.all([
        getSlaPerformanceData({ year, month, dept }, access.scope),
        getSlaProblemResolveTrend({ year, month, dept }, access.scope),
        getSlaResponseTimeTrend({ year, month, dept }, access.scope),
      ]);
  } catch (err) {
    console.error("[SlaPerformanceContainer] Error loading SLA data:", err);
    slaPerformanceData = {
      problemResolve: { percentage: 0, target: 0.999, achieved: 0, missed: 0 },
      responseTime: { percentage: 0, target: 0.999, achieved: 0, missed: 0 },
      avgDispatcherSeconds: 0,
      reopenedTickets: 0,
      totalTickets: 0,
      trend: [],
      avgDispatchFormatted: "0m 0s",
      reopenPercentage: 0,
    };
  }

  return (
    <SlaPerformanceDashboardClient
      data={slaPerformanceData}
      slaProblemTrend={slaProblemTrend}
      slaResponseTrend={slaResponseTrend}
    />
  );
}

export default function SlaPerformancePage({ searchParams }: PageProps) {
  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          SLA Performance
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Pantau pencapaian SLA Problem Resolve dan Response Time berdasarkan
          tahun, bulan, dan departemen.
        </p>
      </header>

      <Suspense fallback={<HelpdeskSlaPerformanceSkeleton />}>
        <SlaPerformanceContainer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
