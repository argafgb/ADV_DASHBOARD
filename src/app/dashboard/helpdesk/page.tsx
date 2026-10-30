export const instant = false;

import { getDashboardFilters } from "@/lib/helpdesk/dashboard-filters";
import { connection } from "next/server";
import { Suspense } from "react";
import { requirePagePermission } from "@/lib/access/session";
import { getCombinedSLAData } from "@/features/helpdesk/overview/services/breakdownSLAService";
import {
  getTotalTicketDistribution,
  getRatingDistribution,
} from "@/features/helpdesk/overview/services/distributionSLAService";
import { getOverallSLAData } from "@/features/helpdesk/overview/services/overallSLAService";
import { getDispatcherAndReopenStats } from "@/features/helpdesk/sla-performance/services/dispatcherTicketService";
import { OverviewDashboardClient } from "@/features/helpdesk/overview/components/OverviewDashboardClient";

import { HelpdeskOverviewSkeleton } from "@/components/dashboard-route-skeletons";

interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    dept?: string;
  }>;
}

async function OverviewContainer({ searchParams }: PageProps) {
  await connection();
  const access = await requirePagePermission("menu.helpdesk.overview.view");
  const params = await searchParams;
  const { year, month } = getDashboardFilters(params);

  const [
    combinedData,
    totalTicketDistribution,
    ratingDistribution,
    overallSLAData,
    dispatcherReopenData,
  ] = await Promise.all([
    getCombinedSLAData(year, month, access.scope),
    getTotalTicketDistribution(year, month, access.scope),
    getRatingDistribution(year, month, access.scope),
    getOverallSLAData(year, month, access.scope),
    getDispatcherAndReopenStats(
      {
        year,
        month,
        dept: "ALL",
      },
      access.scope,
    ),
  ]);

  return (
    <OverviewDashboardClient
      slaMetrics={combinedData}
      totalTicketDistribution={totalTicketDistribution}
      ratingDistribution={ratingDistribution}
      overallSLA={overallSLAData}
      dispatcherReopenData={dispatcherReopenData}
    />
  );
}

export default async function OverviewPage({ searchParams }: PageProps) {
  await connection();
  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Overview
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Ringkasan Pencapaian SLA departemen DCT dan IT berdasarkan data
          layanan terkini.
        </p>
      </header>

      <Suspense fallback={<HelpdeskOverviewSkeleton />}>
        <OverviewContainer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
