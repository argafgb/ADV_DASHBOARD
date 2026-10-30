"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { formatSyncTimestamp } from "@/lib/utils";
import {
  DEFAULT_GLOBAL_YEAR,
  DEFAULT_MONTH_FILTER,
  parseMonthRange,
  getMonthFilterLabel,
} from "../utils/month-filter";
import { parseSource, type SourceFilter } from "../types/kaldev.types";

export interface KaldevFilterContextType {
  year: string;
  setYear: (year: string) => void;
  yearOptions: string[];
  month: string;
  setMonth: (month: string) => void;
  from: SourceFilter;
  setFrom: (from: SourceFilter) => void;
  lastUpdated: string;
}

const KaldevFilterContext = createContext<KaldevFilterContextType | undefined>(undefined);

export function KaldevFilterProvider({
  children,
  syncedAt,
  availableYears = [],
}: {
  children: React.ReactNode;
  syncedAt: string | null;
  availableYears?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const yearOptions = availableYears.length > 0 ? availableYears : [DEFAULT_GLOBAL_YEAR, "2025"];
  const rawYear = searchParams?.get("year");
  const year = rawYear && /^\d{4}$/.test(rawYear) ? rawYear : yearOptions[0];

  const rawMonth = searchParams?.get("month");
  const month = rawMonth || DEFAULT_MONTH_FILTER;

  const rawFrom = searchParams?.get("from");
  const from = parseSource(rawFrom ?? undefined);

  const lastUpdated = formatSyncTimestamp(syncedAt);

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    for (const [key, val] of Object.entries(updates)) {
      if (
        val === null ||
        val === undefined ||
        val === "" ||
        val === "Semua" ||
        (key === "month" && val === "ALL")
      ) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const setYear = (y: string) => {
    updateUrl({ year: y, month: "ALL", page: null });
  };

  const setMonth = (m: string) => {
    updateUrl({ month: m, page: null });
  };

  const setFrom = (f: SourceFilter) => {
    updateUrl({ from: f === "Semua" ? null : f, page: null });
  };

  const value = useMemo(
    () => ({
      year,
      setYear,
      yearOptions,
      month,
      setMonth,
      from,
      setFrom,
      lastUpdated,
    }),
    [year, yearOptions, month, from, lastUpdated],
  );

  return (
    <KaldevFilterContext.Provider value={value}>
      {children}
    </KaldevFilterContext.Provider>
  );
}

export function useKaldevFilters() {
  const ctx = useContext(KaldevFilterContext);
  if (!ctx) {
    throw new Error("useKaldevFilters must be used within a KaldevFilterProvider");
  }
  return ctx;
}
