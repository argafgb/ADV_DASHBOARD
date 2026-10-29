"use client";

import { useMemo } from "react";
import { TooltipLayerProvider } from "@/features/network-performance/context/TooltipLayer";
import type { AssetInfraItem } from "../types/asset.types";
import { useAssetFilters } from "../hooks/useAssetFilters";
import { calculateAllAssetMetrics } from "../utils/assetCalculations";
import { AssetKpiGrid } from "./AssetKpiGrid";
import { AssetFilterToolbar } from "./AssetFilterToolbar";
import { AssetMonthlyTrendChart } from "./AssetMonthlyTrendChart";
import { AssetCategoryDonutChart } from "./AssetCategoryDonutChart";
import { AssetTopBranchesList } from "./AssetTopBranchesList";
import { AssetTransactionTable } from "./AssetTransactionTable";

interface AssetInfrastructureClientProps {
  initialData: AssetInfraItem[];
}

export function AssetInfrastructureClient({
  initialData,
}: AssetInfrastructureClientProps) {
  const { category, status, query, setCategory, setStatus, setQuery } =
    useAssetFilters();

  const metrics = useMemo(() => {
    return calculateAllAssetMetrics(initialData, category, status, query);
  }, [initialData, category, status, query]);

  return (
    <TooltipLayerProvider>
      <div className="flex w-full min-w-0 max-w-full flex-col gap-4 overflow-x-hidden font-sans">
        {/* 4 KPI Cards */}
        <AssetKpiGrid kpis={metrics.kpis} />

        {/* Filter Toolbar */}
        <AssetFilterToolbar
          category={category}
          status={status}
          query={query}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
          onQueryChange={setQuery}
        />

        {/* 2-Column Analytics Grid (Monthly Trend + Donut Composition) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col h-full">
            <AssetMonthlyTrendChart monthlyTrends={metrics.monthlyTrends} />
          </div>
          <div className="lg:col-span-5 flex flex-col h-full">
            <AssetCategoryDonutChart
              categoryDonut={metrics.categoryDonut}
              total={metrics.kpis.total}
            />
          </div>
        </div>

        {/* Top 12 Active Branches List */}
        <AssetTopBranchesList
          topBranches={metrics.topBranches}
          total={metrics.kpis.total}
        />

        {/* Detailed Transactions Table */}
        <AssetTransactionTable rows={metrics.tableRows} />
      </div>
    </TooltipLayerProvider>
  );
}

export default AssetInfrastructureClient;
