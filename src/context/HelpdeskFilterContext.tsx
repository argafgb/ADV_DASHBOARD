"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  Suspense,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getDashboardFilters, type DeptKey } from "@/lib/helpdesk/dashboard-filters";
import { LoadingScreen } from "@/components/connection-state";
import {
  buildFilterHref,
  isDepartmentFilterApplicable,
} from "@/lib/helpdesk/dashboard-navigation";
import { formatSyncTimestamp } from "@/lib/utils";

export type { DeptKey } from "@/lib/helpdesk/dashboard-filters";

interface HelpdeskFilterContextType {
  year: string;
  setYear: (year: string) => void;
  dept: DeptKey;
  setDept: (dept: DeptKey) => void;
  month: string;
  setMonth: (month: string) => void;
  lastUpdated: string;
}

const HelpdeskFilterContext = createContext<HelpdeskFilterContextType | undefined>(undefined);

function HelpdeskFilterProviderContent({
  children,
  syncedAt,
}: {
  children: React.ReactNode;
  syncedAt: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = getDashboardFilters({
    year: searchParams.get("year"),
    month: searchParams.get("month"),
    dept: searchParams.get("dept"),
  });
  const { year, month } = filters;
  const departmentFilterApplicable = isDepartmentFilterApplicable(pathname);
  const dept: DeptKey = departmentFilterApplicable ? filters.dept : "ALL";

  const lastUpdated = formatSyncTimestamp(syncedAt);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const rawYear = searchParams?.get("year");
    const rawMonth = searchParams?.get("month");
    let needsReplace = false;

    if (rawYear !== year) {
      params.set("year", year);
      needsReplace = true;
    }
    if (rawMonth !== null && rawMonth !== month) {
      params.set("month", month);
      needsReplace = true;
    }
    if (needsReplace) router.replace(`${pathname}?${params.toString()}`);
  }, [month, pathname, router, searchParams, year]);

  const triggerRefresh = useCallback(() => router.refresh(), [router]);

  useEffect(() => {
    const interval = setInterval(triggerRefresh, 300000);
    return () => clearInterval(interval);
  }, [triggerRefresh]);

  const updateUrl = (key: string, val: string) => {
    const nextFilters = getDashboardFilters({
      year: key === "year" ? val : year,
      month: key === "month" ? val : month,
      dept: key === "dept" ? val : dept,
    });
    const normalizedValue = nextFilters[key as "year" | "month" | "dept"];

    const updates = {
      [key]: normalizedValue,
      ...(key === "year" ? { month: nextFilters.month } : {}),
    };

    router.push(buildFilterHref(pathname, searchParams, updates));
  };

  const setYear = (y: string) => updateUrl("year", y);

  const setDept = (d: DeptKey) => {
    if (!departmentFilterApplicable) return;

    updateUrl("dept", d);
  };

  const setMonth = (m: string) => updateUrl("month", m);

  return (
    <HelpdeskFilterContext.Provider
      value={{
        year,
        setYear,
        dept,
        setDept,
        month,
        setMonth,
        lastUpdated,
      }}
    >
      {children}
    </HelpdeskFilterContext.Provider>
  );
}

export function HelpdeskFilterProvider({
  children,
  syncedAt,
}: {
  children: React.ReactNode;
  syncedAt: string | null;
}) {
  return (
    <Suspense fallback={<LoadingScreen embedded />}>
      <HelpdeskFilterProviderContent syncedAt={syncedAt}>
        {children}
      </HelpdeskFilterProviderContent>
    </Suspense>
  );
}

export function useHelpdeskFilters() {
  const context = useContext(HelpdeskFilterContext);

  if (!context) {
    throw new Error("useHelpdeskFilters must be used within a HelpdeskFilterProvider");
  }

  return context;
}

export { useHelpdeskFilters as useFilters };
