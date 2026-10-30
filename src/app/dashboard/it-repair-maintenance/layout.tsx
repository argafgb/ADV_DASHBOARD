import React, { Suspense } from "react";
import { connection } from "next/server";
import { getLastSyncedAt } from "@/features/it-repair-maintenance/services/syncStatusService";
import {
  getLocalFilterOptions,
  getOrgFilterOptions,
} from "@/features/it-repair-maintenance/services/filterOptionsService";
import { ItRepairFilterProvider } from "@/features/it-repair-maintenance/context/ItRepairFilterContext";
import { ItRepairTopbarFilters } from "@/features/it-repair-maintenance/components/ItRepairTopbarFilters";
import "@/features/it-repair-maintenance/it-repair.css";

export default async function ItRepairLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const [syncedAt, orgFilterOptions, localFilterOptions] = await Promise.all([
    getLastSyncedAt(),
    getOrgFilterOptions(),
    getLocalFilterOptions(),
  ]);

  return (
    <Suspense fallback={null}>
      <ItRepairFilterProvider
        syncedAt={syncedAt}
        orgFilterOptions={orgFilterOptions}
        localFilterOptions={localFilterOptions}
      >
        <ItRepairTopbarFilters />
        <div className="it-repair-scope w-full min-w-0">{children}</div>
      </ItRepairFilterProvider>
    </Suspense>
  );
}
