"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  Suspense,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  EMPTY_ORG_FILTER_OPTIONS,
  getDashboardFilters,
  getLevel1Options,
  getLevel2Options,
  ORG_UNIT_LABELS,
  type DeptKey,
  type OrgFilterOptions,
  type UnitOption,
} from "../utils/dashboard-filters";
import {
  buildFilterHref,
  isDepartmentFilterApplicable,
  isOrgUnitFilterApplicable,
} from "../utils/dashboard-navigation";
import { formatSyncTimestamp } from "@/lib/utils";

export type { DeptKey } from "../utils/dashboard-filters";

export const ALL_UNITS = "ALL";

interface FilterContextType {
  year: string;
  setYear: (year: string) => void;
  yearOptions: string[];
  dept: DeptKey;
  setDept: (dept: DeptKey) => void;
  month: string;
  setMonth: (month: string) => void;
  level1: string | null;
  setLevel1: (level1: string | null) => void;
  level1Options: UnitOption[];
  level1Label: string;
  level2: string | null;
  setLevel2: (level2: string | null) => void;
  level2Options: UnitOption[];
  level2Label: string;
  orgUnitFilterApplicable: boolean;
  departmentFilterApplicable: boolean;
  lastUpdated: string;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

function FilterProviderContent({
  children,
  syncedAt,
  orgFilterOptions,
}: {
  children: React.ReactNode;
  syncedAt: string | null;
  orgFilterOptions: OrgFilterOptions;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orgUnitFilterApplicable = isOrgUnitFilterApplicable(pathname);
  const departmentFilterApplicable = isDepartmentFilterApplicable(pathname);

  const filters = getDashboardFilters(
    {
      year: searchParams.get("year"),
      month: searchParams.get("month"),
      dept: searchParams.get("dept"),
      area: searchParams.get("area"),
      level1: searchParams.get("level1"),
      level2: searchParams.get("level2"),
    },
    { availableYears: orgFilterOptions.years, orgFilterOptions },
  );
  const { year, month } = filters;
  const dept: DeptKey = departmentFilterApplicable ? filters.dept : "ALL";
  const level1 = orgUnitFilterApplicable ? filters.level1 : null;
  const level2 = orgUnitFilterApplicable ? filters.level2 : null;

  const scope = useMemo(
    () => ({ year, month, area: dept, level1, level2 }),
    [year, month, dept, level1, level2],
  );

  const level1Options = useMemo(
    () => getLevel1Options(orgFilterOptions, scope),
    [orgFilterOptions, scope],
  );
  const level2Options = useMemo(
    () => getLevel2Options(orgFilterOptions, scope),
    [orgFilterOptions, scope],
  );

  const lastUpdated = formatSyncTimestamp(syncedAt);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const rawYear = searchParams?.get("year");
    const rawMonth = searchParams?.get("month");
    const rawLevel1 = searchParams?.get("level1");
    const rawLevel2 = searchParams?.get("level2");
    let needsReplace = false;

    if (rawYear !== year) {
      params.set("year", year);
      needsReplace = true;
    }
    if (rawMonth !== null && rawMonth !== month) {
      params.set("month", month);
      needsReplace = true;
    }
    if (rawLevel1 !== null && rawLevel1 !== (level1 ?? "")) {
      if (level1) params.set("level1", level1);
      else params.delete("level1");
      needsReplace = true;
    }
    if (rawLevel2 !== null && rawLevel2 !== (level2 ?? "")) {
      if (level2) params.set("level2", level2);
      else params.delete("level2");
      needsReplace = true;
    }
    if (needsReplace) router.replace(`${pathname}?${params.toString()}`);
  }, [level1, level2, month, pathname, router, searchParams, year]);

  const triggerRefresh = useCallback(() => router.refresh(), [router]);

  useEffect(() => {
    const interval = setInterval(triggerRefresh, 300000);
    return () => clearInterval(interval);
  }, [triggerRefresh]);

  const updateUrl = (key: string, val: string) => {
    const nextFilters = getDashboardFilters(
      {
        year: key === "year" ? val : year,
        month: key === "month" ? val : month,
        dept: key === "dept" ? (val as DeptKey) : dept,
        area: key === "dept" ? val : dept,
        level1: key === "level1" ? val : (level1 ?? ""),
        level2: key === "level2" ? val : (level2 ?? ""),
      },
      { availableYears: orgFilterOptions.years },
    );
    const normalizedValue =
      key === "year" || key === "month" || key === "dept"
        ? nextFilters[key as "year" | "month" | "dept"]
        : val;

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

  const setLevel1 = (code: string | null) => {
    if (!orgUnitFilterApplicable) return;
    updateUrl("level1", code && code !== ALL_UNITS ? code : "");
  };

  const setLevel2 = (code: string | null) => {
    if (!orgUnitFilterApplicable) return;
    updateUrl("level2", code && code !== ALL_UNITS ? code : "");
  };

  const labels = ORG_UNIT_LABELS[dept];

  return (
    <FilterContext.Provider
      value={{
        year,
        setYear,
        yearOptions: orgFilterOptions.years,
        dept,
        setDept,
        month,
        setMonth,
        level1,
        setLevel1,
        level1Options,
        level1Label: labels.level1,
        level2,
        setLevel2,
        level2Options,
        level2Label: labels.level2,
        orgUnitFilterApplicable,
        departmentFilterApplicable,
        lastUpdated,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function FilterProvider({
  children,
  syncedAt,
  orgFilterOptions = EMPTY_ORG_FILTER_OPTIONS,
}: {
  children: React.ReactNode;
  syncedAt: string | null;
  orgFilterOptions?: OrgFilterOptions;
}) {
  return (
    <Suspense fallback={null}>
      <FilterProviderContent
        syncedAt={syncedAt}
        orgFilterOptions={orgFilterOptions}
      >
        {children}
      </FilterProviderContent>
    </Suspense>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}
