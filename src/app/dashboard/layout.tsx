import React from "react";
import { connection } from "next/server";
import { formatSyncTimestamp } from "@/lib/utils";
import { getDashboardSyncedAt } from "@/services/dashboardSyncService";
import { getCurrentSiteFilterOptions } from "@/lib/auth/current-site-filter";
import DashboardClientWrapper from "./DashboardClientWrapper";

export default async function DashboardLayout({
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
    <DashboardClientWrapper
      initialSiteOptions={initialSiteOptions}
      lastUpdated={lastUpdated}
    >
      {children}
    </DashboardClientWrapper>
  );
}
