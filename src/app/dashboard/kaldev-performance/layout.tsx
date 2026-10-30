import React from "react";
import { connection } from "next/server";
import { getLastSyncedAt } from "@/features/kaldev-performance/services/syncStatusService";
import { getAvailableYears } from "@/features/kaldev-performance/services/filterOptionsService";
import { KaldevFilterProvider } from "@/features/kaldev-performance/context/KaldevFilterContext";
import { KaldevTopbarFilters } from "@/features/kaldev-performance/components/KaldevTopbarFilters";
import "@/features/kaldev-performance/kaldev.css";

export default async function KaldevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const [syncedAt, availableYears] = await Promise.all([
    getLastSyncedAt(),
    getAvailableYears(),
  ]);

  return (
    <KaldevFilterProvider syncedAt={syncedAt} availableYears={availableYears}>
      <KaldevTopbarFilters />
      <div className="kaldev-scope w-full min-w-0">{children}</div>
    </KaldevFilterProvider>
  );
}
