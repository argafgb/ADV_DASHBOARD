export const instant = false;

import { buildCategoryComparison } from "@/features/helpdesk/comparison/utils/comparisonAggregates";
import { getDashboardFilters } from "@/lib/helpdesk/dashboard-filters";
import { Suspense } from "react";
import { requirePagePermission } from "@/lib/access/session";
import ComparisonDashboardClient from "@/features/helpdesk/comparison/components/ComparisonDashboardClient";
import { HelpdeskComparisonSkeleton } from "@/components/dashboard-route-skeletons";
import {
  getTicketsFrequency,
  getTicketsMonthlySummary,
  getTicketVolumeByDepartment,
  getSummaryPerProblem,
  getSummaryPerAppMenu,
} from "@/features/helpdesk/comparison/services/comparisonService";

interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    dept?: string;
    quarter?: string;
  }>;
}

async function ComparisonContainer({ searchParams }: PageProps) {
  const access = await requirePagePermission("menu.helpdesk.comparison.view");
  const params = await searchParams;

  const { year, month, dept, quarter } = getDashboardFilters(params);

  const [
    ticketFrequency,
    monthlyTrend,
    departmentVolume,
    summaryPerProblem,
    summaryPerAppMenu,
  ] = await Promise.all([
    getTicketsFrequency({ year, month, dept, quarter }, access.scope),
    getTicketsMonthlySummary({ year, month, dept, quarter }, access.scope),
    getTicketVolumeByDepartment({ year, month, dept, quarter }, access.scope),
    getSummaryPerProblem({ year, month, dept, quarter }, access.scope),
    getSummaryPerAppMenu({ year, month, dept, quarter }, access.scope),
  ]);

  const categories = buildCategoryComparison(summaryPerAppMenu, dept);

  return (
    <ComparisonDashboardClient
      ticketFrequency={ticketFrequency}
      monthlyTrend={monthlyTrend}
      departmentVolume={departmentVolume}
      ticketsByCategory={categories}
      summaryPerProblem={summaryPerProblem}
      summaryPerAppMenu={summaryPerAppMenu}
    />
  );
}

export default function ComparisonPage({ searchParams }: PageProps) {
  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Comparison
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Analisis perbandingan tren tiket YoY (Year-over-Year) dan performa per
          departemen.
        </p>
      </header>

      <Suspense fallback={<HelpdeskComparisonSkeleton />}>
        <ComparisonContainer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
