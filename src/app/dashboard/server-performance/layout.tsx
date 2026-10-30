import React from "react";
import { connection } from "next/server";
import { getLastSyncedAt } from "@/features/server-performance/services/syncStatusService";
import { ServerPerformanceFilterProvider } from "@/features/server-performance/context/ServerPerformanceFilterContext";
import { ServerPerformanceTopbarFilters } from "@/features/server-performance/components/ServerPerformanceTopbarFilters";

export default async function ServerPerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const syncedAt = await getLastSyncedAt();

  return (
    <ServerPerformanceFilterProvider syncedAt={syncedAt}>
      <ServerPerformanceTopbarFilters />
      <div className="server-performance-scope w-full min-w-0">
        {children}
      </div>
    </ServerPerformanceFilterProvider>
  );
}
