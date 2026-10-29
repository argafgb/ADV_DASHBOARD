import React from "react";
import { connection } from "next/server";
import { getPeriods } from "@/features/network-performance/queries/periods";
import { getRequestBranchAccess } from "@/lib/network/branch-access";
import { NetworkFilterProvider } from "@/features/network-performance/context/NetworkFilterContext";
import { NetworkTopbarFilters } from "@/features/network-performance/components/NetworkTopbarFilters";
import "@/features/network-performance/network-performance.css";

export default async function NetworkPerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const [periodsData, branchAccess] = await Promise.all([
    getPeriods(),
    getRequestBranchAccess(),
  ]);
  const { years, allMonthsByYear, updatedAt } = periodsData;

  const scopeLabel = branchAccess.all
    ? "Semua cabang"
    : branchAccess.keys && branchAccess.keys.length > 0
      ? branchAccess.keys.join(", ")
      : "Semua cabang";

  return (
    <NetworkFilterProvider
      periods={{
        years,
        monthsByYear: allMonthsByYear,
        refreshedAt: updatedAt,
      }}
      scope={scopeLabel}
    >
      <NetworkTopbarFilters />
      {children}
    </NetworkFilterProvider>
  );
}
