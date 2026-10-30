"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  Suspense,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DEFAULT_MONTH, DEFAULT_YEAR } from "@/lib/dashboard-config";
import { LoadingScreen } from "@/components/connection-state";
import {
  canonicalMonthValue,
  monthsForRange,
  parseMonthRange,
  type MonthRange,
} from "@/lib/network/month-range";
import {
  availableMonthsForYear,
  dashboardHref,
  resolveGlobalFilters,
} from "@/lib/network/global-filters";
import { formatSyncTimestamp } from "@/lib/utils";

export interface NetworkFilterContextType {
  year: string;
  setYear: (year: string) => void;
  month: string;
  setMonth: (month: string) => void;
  lastUpdated: string;
  dashboardHref: (pathname: string) => string;
  tahun: number;
  setTahun: (tahun: number) => void;
  /** 0-indexed start month, or null for "all months" */
  bulan: number | null;
  /** 0-indexed range { start, end }, or null for "all months" */
  bulanRange: MonthRange | null;
  /** 0-indexed array of selected months, or null for "all months" */
  bulanMonths: number[] | null;
  /** Current branch scope; e.g. "Semua cabang" or specific branches */
  scope: string;

  /** years that have data, ascending */
  availableYears: number[];
  /** 1-indexed months that have data for the selected year */
  availableMonths: number[];
}

export type FilterContextType = NetworkFilterContextType;

export interface NetworkFilterPeriods {
  years: number[];
  /** year -> 0-indexed months present */
  monthsByYear: Record<number, number[]>;
  /** ISO timestamp of the newest successful ETL run. */
  refreshedAt: string | null;
}

export type FilterPeriods = NetworkFilterPeriods;

const NetworkFilterContext = createContext<NetworkFilterContextType | undefined>(
  undefined,
);

function NetworkFilterProviderContent({
  children,
  periods,
  scope = "Semua cabang",
}: {
  children: React.ReactNode;
  periods: NetworkFilterPeriods;
  scope?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingUrlRef = useRef<string | null>(null);

  const defaultMonth = DEFAULT_MONTH;
  const filters = resolveGlobalFilters(
    new URLSearchParams(searchParams?.toString() || ""),
    periods,
    { year: DEFAULT_YEAR, month: defaultMonth },
  );
  const { year, month } = filters;
  const lastUpdated = formatSyncTimestamp(periods.refreshedAt);

  const tahunState = Number(year);
  const bulanRange = parseMonthRange(month);
  const bulanMonths = monthsForRange(bulanRange);

  useEffect(() => {
    const currentQuery = searchParams?.toString() || "";
    if (pendingUrlRef.current === currentQuery) pendingUrlRef.current = null;
    if (pendingUrlRef.current !== null) return;

    const canonicalUrl = dashboardHref(pathname, filters);
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    if (currentUrl === canonicalUrl) return;
    router.replace(canonicalUrl);
  }, [filters, pathname, router, searchParams]);

  const availableMonths = availableMonthsForYear(periods, tahunState).map(
    (m) => m + 1,
  );

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 300_000);
    return () => window.clearInterval(interval);
  }, [router]);

  const updateUrl = (key: string, val: string) => {
    const params = new URLSearchParams();
    params.set("year", year);
    params.set("month", month);
    params.set(key, val);
    const nextQuery = params.toString();
    pendingUrlRef.current = nextQuery;
    router.push(`${pathname}?${nextQuery}`);
  };

  const setTahun = (t: number) => setYear(String(t));

  const setYear = (y: string) => {
    const nextYear = Number(y);
    if (!Number.isInteger(nextYear) || !periods.years.includes(nextYear))
      return;
    const next = resolveGlobalFilters(
      new URLSearchParams(`year=${nextYear}&month=${month}`),
      periods,
      { year: String(nextYear), month: DEFAULT_MONTH },
    );
    const nextQuery = dashboardHref(pathname, next).split("?")[1];
    pendingUrlRef.current = nextQuery;
    router.push(`${pathname}?${nextQuery}`);
  };

  const setMonth = (m: string) =>
    updateUrl("month", canonicalMonthValue(m, defaultMonth));

  return (
    <NetworkFilterContext.Provider
      value={{
        year,
        setYear,
        month,
        setMonth,
        lastUpdated,
        dashboardHref: (targetPathname) =>
          dashboardHref(targetPathname, filters),
        tahun: tahunState,
        setTahun,
        bulan: bulanRange?.start ?? null,
        bulanRange,
        bulanMonths,
        scope,
        availableYears: periods.years,
        availableMonths,
      }}
    >
      {children}
    </NetworkFilterContext.Provider>
  );
}

export function NetworkFilterProvider({
  children,
  periods,
  scope,
}: {
  children: React.ReactNode;
  periods: NetworkFilterPeriods;
  scope?: string;
}) {
  return (
    <Suspense fallback={<LoadingScreen embedded />}>
      <NetworkFilterProviderContent periods={periods} scope={scope}>
        {children}
      </NetworkFilterProviderContent>
    </Suspense>
  );
}

export const FilterProvider = NetworkFilterProvider;

export function useNetworkFilters(): NetworkFilterContextType {
  const context = useContext(NetworkFilterContext);

  if (!context) {
    throw new Error(
      "useNetworkFilters must be used within a NetworkFilterProvider",
    );
  }

  return context;
}

export const useFilters = useNetworkFilters;
export { NetworkFilterContext, NetworkFilterContext as FilterContext };
