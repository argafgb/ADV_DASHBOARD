"use client";

import { useState, useEffect, useRef } from "react";
import { useAssetFilters } from "@/hooks/useAssetFilters";
import ProporsiBiayaCard from "./ProporsiBiayaCard";
import RepairMaintenanceCard from "./RepairMaintenanceCard";
import CostBySiteTable from "./CostBySiteTable";
import MonthlyCostComparison from "./MonthlyCostComparison";
import {
  getMonthlyCostComparisonData,
  getProporsiBiayaCombinedData,
  getRepairMaintenanceSummaryData,
} from "../services/costService";
import {
  ProporsiBiayaSkeleton,
  RepairMaintenanceSkeleton,
} from "./skeletons/CostSkeletons";
import type { DonutSlice } from "@/types/asset-pm.types";
import type {
  MonthlyCostComparisonResult,
  PaginatedCostResult,
  RepairMaintenanceSummary,
} from "../types/cost.types";

interface CostClientProps {
  initialProporsiData?: { total: number; slices: DonutSlice[] };
  initialRepairSummary?: RepairMaintenanceSummary;
  initialMonthlyComparison?: MonthlyCostComparisonResult;
  initialCostRows?: PaginatedCostResult;
}

export default function CostClient({
  initialProporsiData,
  initialRepairSummary,
  initialMonthlyComparison,
  initialCostRows,
}: CostClientProps = {}) {
  const { input } = useAssetFilters();

  const [slices, setSlices] = useState<DonutSlice[]>(
    initialProporsiData?.slices || [],
  );
  const [total, setTotal] = useState<number>(initialProporsiData?.total || 0);
  const [repairSummary, setRepairSummary] = useState<
    RepairMaintenanceSummary | undefined
  >(initialRepairSummary);
  const [monthlyComparison, setMonthlyComparison] = useState<
    MonthlyCostComparisonResult | undefined
  >(initialMonthlyComparison);
  const [isLoading, setIsLoading] = useState<boolean>(!initialProporsiData);

  const hasInitialData = Boolean(
    initialProporsiData && initialRepairSummary && initialMonthlyComparison,
  );

  const filterKey = `${input.year}-${input.month}-${input.site}-${input.company}`;
  const lastFetchedFilterKey = useRef<string | null>(
    hasInitialData ? filterKey : null,
  );

  useEffect(() => {
    if (lastFetchedFilterKey.current === filterKey) {
      return;
    }
    lastFetchedFilterKey.current = filterKey;

    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      getProporsiBiayaCombinedData(input),
      getRepairMaintenanceSummaryData(input),
      getMonthlyCostComparisonData(input),
    ]).then(([resCombined, resRepair, resMonthly]) => {
      if (isMounted) {
        setSlices(resCombined?.slices || []);
        setTotal(resCombined?.total || 0);
        setRepairSummary(resRepair);
        setMonthlyComparison(resMonthly);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [input, filterKey]);

  return (
    <div className="space-y-4">
      {/* Row 1: Donut & Repair Maintenance Cards */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4 xl:col-span-3">
          {isLoading ? (
            <ProporsiBiayaSkeleton />
          ) : (
            <ProporsiBiayaCard
              slices={slices}
              total={total}
              className="flex flex-col min-h-0 h-full"
            />
          )}
        </div>
        <div className="lg:col-span-8 xl:col-span-9">
          {isLoading ? (
            <RepairMaintenanceSkeleton />
          ) : (
            <RepairMaintenanceCard
              summary={repairSummary}
              className="flex flex-col min-h-0 h-full"
            />
          )}
        </div>
      </div>

      {/* Row 2: Biaya per Site Table */}
      <CostBySiteTable input={input} initialData={initialCostRows} />

      {/* Row 3: Perbandingan biaya R&M per bulan */}
      {/* <MonthlyCostComparison data={monthlyComparison} /> */}
    </div>
  );
}
