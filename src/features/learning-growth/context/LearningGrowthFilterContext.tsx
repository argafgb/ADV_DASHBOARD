"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MonthFilter, YearFilter, DashboardData } from "../types/dashboard.types";
import { normalizeMonthFilter } from "../utils/month-filter";
import { DEFAULT_YEAR, normalizeYearFilter } from "../utils/year-filter";

export interface LearningGrowthContextValue {
  year: YearFilter;
  setYear: (next: YearFilter) => void;
  month: MonthFilter;
  setMonth: (next: MonthFilter) => void;
  data: DashboardData;
  dataError: string | null;
  updatedAt: string;
  refreshing: boolean;
  refreshData: () => Promise<void>;
  hrefWithFilters: (href: string) => string;
  dataReady: boolean;
}

const LearningGrowthContext = createContext<LearningGrowthContextValue | null>(null);

const EMPTY_DASHBOARD_DATA: DashboardData = {
  trainings: [],
  certifications: [],
  source: "database",
  updatedAt: "",
};

export function LearningGrowthProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: DashboardData;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const year = normalizeYearFilter(searchParams.get("year"));
  const month = normalizeMonthFilter(searchParams.get("month"), year);

  const [data, setData] = useState<DashboardData>(initialData ?? EMPTY_DASHBOARD_DATA);
  const [dataError, setDataError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const navigateWithParams = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const setYear = useCallback(
    (next: YearFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_YEAR) {
        params.delete("year");
      } else {
        params.set("year", next);
      }
      navigateWithParams(params);
    },
    [navigateWithParams, searchParams],
  );

  const setMonth = useCallback(
    (next: MonthFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "ALL") {
        params.delete("month");
      } else {
        params.set("month", next);
      }
      navigateWithParams(params);
    },
    [navigateWithParams, searchParams],
  );

  const hrefWithFilters = useCallback(
    (href: string) => {
      const query = searchParams.toString();
      return query ? `${href}?${query}` : href;
    },
    [searchParams],
  );

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      router.refresh();
      setDataError(null);
    } catch {
      setDataError("Gagal memperbarui data.");
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  const value = useMemo<LearningGrowthContextValue>(
    () => ({
      year,
      setYear,
      month,
      setMonth,
      data,
      dataError,
      updatedAt: data.updatedAt,
      refreshing,
      refreshData,
      hrefWithFilters,
      dataReady: true,
    }),
    [year, setYear, month, setMonth, data, dataError, refreshing, refreshData, hrefWithFilters],
  );

  return (
    <LearningGrowthContext.Provider value={value}>
      {children}
    </LearningGrowthContext.Provider>
  );
}

export function useLearningGrowth(): LearningGrowthContextValue {
  const context = useContext(LearningGrowthContext);
  if (!context) {
    throw new Error("useLearningGrowth must be used within a LearningGrowthProvider");
  }
  return context;
}

/** Alias to match legacy useDashboard */
export const useDashboard = useLearningGrowth;
