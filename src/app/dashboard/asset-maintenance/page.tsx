import { Suspense } from "react";
import OverviewClient from "@/features/asset-maintenance/overview/components/OverviewClient";
import { OverviewDashboardSkeleton } from "@/features/asset-maintenance/overview/components/skeletons/OverviewSkeletons";
import type { DashboardSearchParams } from "@/lib/global-filters";
import { scopedAssetFilterInput } from "@/lib/auth/current-site-filter";
import {
  getTotalAssetKpisData,
  getPmSummaryKpisData,
  getOverviewDonutChartsData,
  getOverviewDistributionChartsData,
  getPmScheduleData,
  getOverviewRatingData,
} from "@/features/asset-maintenance/overview/services/overviewService";

export const instant = false;

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const input = await scopedAssetFilterInput(await searchParams);

  const [
    section1Data,
    initialSection2Kpis,
    initialDonuts,
    initialBottomCharts,
    initialPmSchedule,
    initialRating,
  ] = await Promise.all([
    getTotalAssetKpisData(input, "ALL"),
    getPmSummaryKpisData(input, "ALL"),
    getOverviewDonutChartsData(input, "ALL"),
    getOverviewDistributionChartsData(input, "ALL"),
    getPmScheduleData(input, "ALL"),
    getOverviewRatingData(input),
  ]);

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Overview
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Ringkasan kondisi aset dan pelaksanaan preventive maintenance.
        </p>
      </header>

      <Suspense fallback={<OverviewDashboardSkeleton />}>
        <OverviewClient
          section1Data={section1Data}
          initialSection2Kpis={initialSection2Kpis}
          initialDonuts={initialDonuts}
          initialBottomCharts={initialBottomCharts}
          initialPmSchedule={initialPmSchedule}
          initialRating={initialRating}
        />
      </Suspense>
    </div>
  );
}
