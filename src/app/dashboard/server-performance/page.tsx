export const instant = false;

import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import OverviewDashboardClient from "@/features/server-performance/overview/components/OverviewDashboardClient";
import OverviewSkeleton from "@/features/server-performance/overview/skeletons/OverviewSkeleton";
import { getOverviewDashboardData } from "@/features/server-performance/overview/services/overviewService";
import { DEFAULT_YEAR } from "@/lib/dashboard-config";
import { normalizeMonthRange } from "@/features/server-performance/utils/month-filter";

interface OverviewPageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

async function OverviewContent({ searchParams }: OverviewPageProps) {
  const resolvedParams = await searchParams;
  const year = resolvedParams?.year || DEFAULT_YEAR;
  const month = normalizeMonthRange(resolvedParams?.month, Number(year)).value;
  const data = await getOverviewDashboardData(year, month);

  return <OverviewDashboardClient data={data} year={year} month={month} />;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  await connection();
  await requirePagePermission("menu.server-performance.overview.view");

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Server Performance Overview
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Ringkasan eksekutif ketersediaan sistem, tren SLA downtime, dan
          diagnosis insiden terkini.
        </p>
      </header>

      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
