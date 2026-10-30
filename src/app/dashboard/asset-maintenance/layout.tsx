import React from "react";
import { connection } from "next/server";
import { formatSyncTimestamp } from "@/lib/utils";
import { getDashboardSyncedAt } from "@/services/dashboardSyncService";
import { getCurrentSiteFilterOptions } from "@/lib/auth/current-site-filter";
import { FilterProvider } from "@/context/FilterContext";
import { AssetPmTopbarFilters } from "@/features/asset-maintenance/components/AssetPmTopbarFilters";

export default async function AssetMaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const [initialSiteOptions, syncedAt] = await Promise.all([
    getCurrentSiteFilterOptions(),
    getDashboardSyncedAt(),
  ]);
  const lastUpdated = formatSyncTimestamp(syncedAt);

  return (
    <FilterProvider
      initialSiteOptions={initialSiteOptions}
      lastUpdated={lastUpdated}
    >
      <AssetPmTopbarFilters />
      {children}
    </FilterProvider>
  );
}
