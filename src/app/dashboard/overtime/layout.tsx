import React from "react";
import { connection } from "next/server";
import { getLastSyncedAt } from "@/features/overtime/services/syncStatusService";
import { getOrgFilterOptions } from "@/features/overtime/services/filterOptionsService";
import { FilterProvider } from "@/features/overtime/context/FilterContext";
import { OvertimeTopbarFilters } from "@/features/overtime/components/OvertimeTopbarFilters";
import "@/features/overtime/overtime.css";

export default async function OvertimeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const [syncedAt, orgFilterOptions] = await Promise.all([
    getLastSyncedAt(),
    getOrgFilterOptions(),
  ]);

  return (
    <FilterProvider syncedAt={syncedAt} orgFilterOptions={orgFilterOptions}>
      <OvertimeTopbarFilters />
      <div className="overtime-scope w-full min-w-0">{children}</div>
    </FilterProvider>
  );
}
