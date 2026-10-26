import { Suspense } from "react";
import CostClient from "@/features/asset-maintenance/cost-maintenance-budget/components/CostClient";
import { CostDashboardSkeleton } from "@/features/asset-maintenance/cost-maintenance-budget/components/skeletons/CostSkeletons";
import type { DashboardSearchParams } from "@/lib/global-filters";
import { scopedAssetFilterInput } from "@/lib/auth/current-site-filter";
import {
  getProporsiBiayaCombinedData,
  getRepairMaintenanceSummaryData,
  getMonthlyCostComparisonData,
  getPaginatedCostRowsData,
} from "@/features/asset-maintenance/cost-maintenance-budget/services/costService";

export const instant = false;

export default async function CostMaintenanceBudgetPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const input = await scopedAssetFilterInput(await searchParams);

  const [
    proporsiCombined,
    repairSummary,
    monthlyComparison,
    paginatedCostRows,
  ] = await Promise.all([
    getProporsiBiayaCombinedData(input),
    getRepairMaintenanceSummaryData(input),
    getMonthlyCostComparisonData(input),
    getPaginatedCostRowsData(input, 1, 20, "", "ALL"),
  ]);

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            Modul: Asset Maintenance
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Cost &amp; Maintenance Budget
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Biaya PM &amp; efisiensi per perangkat
        </p>
      </header>

      <Suspense fallback={<CostDashboardSkeleton />}>
        <CostClient
          initialProporsiData={proporsiCombined}
          initialRepairSummary={repairSummary}
          initialMonthlyComparison={monthlyComparison}
          initialCostRows={paginatedCostRows}
        />
      </Suspense>
    </div>
  );
}
