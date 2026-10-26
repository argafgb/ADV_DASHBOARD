import { Suspense } from "react";
import DistributionClient from "@/features/asset-maintenance/asset-distribution/components/DistributionClient";
import { DistributionDashboardSkeleton } from "@/features/asset-maintenance/asset-distribution/components/skeletons/DistributionSkeletons";
import type { DashboardSearchParams } from "@/lib/global-filters";
import { scopedAssetFilterInput } from "@/lib/auth/current-site-filter";
import {
  getDevicePerSiteUnitData,
  getBreakdownData,
  getPaginatedInventoryRowsData,
} from "@/features/asset-maintenance/asset-distribution/services/distributionService";

export const instant = false;

export default async function AssetDistributionPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const input = await scopedAssetFilterInput(await searchParams);

  const [
    devicePerSiteData,
    workstationData,
    infraData,
    peripheralData,
    inventoryData,
  ] = await Promise.all([
    getDevicePerSiteUnitData(input),
    getBreakdownData(input, "workstation"),
    getBreakdownData(input, "infrastructure"),
    getBreakdownData(input, "peripheral"),
    getPaginatedInventoryRowsData(input, 1, 10, "", "ALL"),
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
          Asset Distribution
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Distribusi perangkat per site &amp; tipe
        </p>
      </header>

      <Suspense fallback={<DistributionDashboardSkeleton />}>
        <DistributionClient
          initialDevicePerSiteData={devicePerSiteData}
          initialWorkstationData={workstationData}
          initialInfraData={infraData}
          initialPeripheralData={peripheralData}
          initialInventoryData={inventoryData}
        />
      </Suspense>
    </div>
  );
}
