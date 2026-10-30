"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  Suspense,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DASHBOARD_CONFIG } from "@/lib/dashboard-config";
import {
  monthForTargetYear,
  normalizeMonthRange,
} from "../utils/month-filter";
import { formatSyncTimestamp } from "@/lib/utils";

export type DeptKey = "ALL" | "IT Support" | "DCT Support";

interface FilterContextType {
  year: string;
  setYear: (year: string) => void;
  dept: DeptKey;
  setDept: (dept: DeptKey) => void;
  month: string;
  setMonth: (month: string) => void;
  lastUpdated: string;
  refreshing: boolean;
  triggerRefresh: () => void;
}

const ServerPerformanceFilterContext = createContext<
  FilterContextType | undefined
>(undefined);

function normalizeDept(value: string | null): DeptKey {
  if (value === "IT Support") return "IT Support";
  if (value === "DCT Support") return "DCT Support";
  return "ALL";
}

const MONTH_SELECTION_STORAGE_KEY =
  "server-performance:month-explicitly-selected";

function FilterProviderContent({
  children,
  syncedAt,
}: {
  children: React.ReactNode;
  syncedAt: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const monthTouchedRef = useRef(false);

  useEffect(() => {
    monthTouchedRef.current =
      window.sessionStorage.getItem(MONTH_SELECTION_STORAGE_KEY) === "1";
  }, []);

  const availableYears: readonly string[] = DASHBOARD_CONFIG.years;
  const requestedYear = searchParams?.get("year");
  const year =
    requestedYear && availableYears.includes(requestedYear)
      ? requestedYear
      : availableYears[0];
  const month = normalizeMonthRange(
    searchParams?.get("month"),
    Number(year),
  ).value;
  const rawDept = normalizeDept(searchParams?.get("dept"));

  const isOverviewPage = pathname === "/dashboard/server-performance";
  const dept: DeptKey = isOverviewPage ? "ALL" : rawDept;

  const [refreshing, setRefreshing] = useState(false);
  const lastUpdated = formatSyncTimestamp(syncedAt);

  useEffect(() => {
    const sourceQuery = searchParams?.toString() || "";
    const params = new URLSearchParams(sourceQuery);
    if (params.get("year") !== year || params.get("month") !== month) {
      params.set("year", year);
      params.set("month", month);
      const canonicalQuery = params.toString();
      queueMicrotask(() => {
        if (window.location.search.slice(1) === sourceQuery) {
          router.replace(`${pathname}?${canonicalQuery}`, { scroll: false });
        }
      });
    }

    const interval = setInterval(() => {
      setRefreshing(true);
      router.refresh();
      setTimeout(() => setRefreshing(false), 600);
    }, 300000);

    return () => {
      clearInterval(interval);
    };
  }, [month, pathname, searchParams, router, year]);

  const updateUrl = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set(key, val);

    if (key === "month" && val !== "ALL") {
      params.delete("quarter");
    }

    if (isOverviewPage) {
      params.delete("dept");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const setYear = (y: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("year", y);
    params.set(
      "month",
      monthForTargetYear(month, Number(y), monthTouchedRef.current),
    );
    router.push(`${pathname}?${params.toString()}`);
  };

  const setDept = (d: DeptKey) => {
    if (isOverviewPage) return;
    updateUrl("dept", d);
  };

  const setMonth = (m: string) => {
    monthTouchedRef.current = true;
    window.sessionStorage.setItem(MONTH_SELECTION_STORAGE_KEY, "1");
    updateUrl("month", normalizeMonthRange(m, Number(year)).value);
  };

  const triggerRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <ServerPerformanceFilterContext.Provider
      value={{
        year,
        setYear,
        dept,
        setDept,
        month,
        setMonth,
        lastUpdated,
        refreshing,
        triggerRefresh,
      }}
    >
      {children}
    </ServerPerformanceFilterContext.Provider>
  );
}

export function ServerPerformanceFilterProvider({
  children,
  syncedAt,
}: {
  children: React.ReactNode;
  syncedAt: string | null;
}) {
  return (
    <Suspense fallback={null}>
      <FilterProviderContent syncedAt={syncedAt}>
        {children}
      </FilterProviderContent>
    </Suspense>
  );
}

export function useServerPerformanceFilters() {
  const context = useContext(ServerPerformanceFilterContext);
  if (!context) {
    throw new Error(
      "useServerPerformanceFilters must be used within a ServerPerformanceFilterProvider",
    );
  }
  return context;
}

export const useFilters = useServerPerformanceFilters;
export const FilterProvider = ServerPerformanceFilterProvider;
