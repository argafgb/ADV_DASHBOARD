import React from "react";
import { connection } from "next/server";
import {
  getProjectLookupOptions,
  getRoleLookupOptions,
} from "@/features/bug-tracker/services/filterLookupService";
import { getDashboardRefreshedAt } from "@/features/bug-tracker/services/dashboardRefreshService";
import { BugTrackerFilterProvider } from "@/features/bug-tracker/context/BugTrackerFilterContext";
import { BugTrackerTopbarFilters } from "@/features/bug-tracker/components/BugTrackerTopbarFilters";
import "@/features/bug-tracker/bug-tracker.css";

export default async function BugTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const [initialProjectOptions, initialRoleOptions, refreshedAt] =
    await Promise.all([
      getProjectLookupOptions(),
      getRoleLookupOptions(),
      getDashboardRefreshedAt(),
    ]);

  return (
    <BugTrackerFilterProvider
      initialProjectOptions={initialProjectOptions}
      initialRoleOptions={initialRoleOptions}
      refreshedAt={refreshedAt}
    >
      <BugTrackerTopbarFilters />
      <div className="bug-tracker-scope w-full min-w-0">{children}</div>
    </BugTrackerFilterProvider>
  );
}
