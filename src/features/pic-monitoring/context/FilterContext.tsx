"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  Suspense,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  canonicalPeriod,
  normalizeMonth,
  normalizeYear,
} from "../utils/period-filter";
import { LoadingScreen } from "../components/connection-state";

interface FilterContextType {
  year: string;
  setYear: (year: string) => void;
  month: string;
  setMonth: (month: string) => void;
  /** Waktu sinkronisasi terakhir, sudah diformat oleh server. */
  lastUpdated: string;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);
const MONTH_SELECTION_STORAGE_KEY = "pic-monitoring:month-explicitly-selected";

function FilterProviderContent({
  children,
  lastUpdated,
}: {
  children: React.ReactNode;
  lastUpdated: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingQueryRef = useRef<string | null>(null);
  const monthTouchedRef = useRef(false);

  useEffect(() => {
    monthTouchedRef.current =
      window.sessionStorage.getItem(MONTH_SELECTION_STORAGE_KEY) === "1";
  }, []);

  const period = canonicalPeriod(
    searchParams?.get("year") ?? null,
    searchParams?.get("month") ?? null,
  );
  const year = period.year;
  const month = period.month;

  useEffect(() => {
    const currentQuery = searchParams?.toString() || "";
    if (pendingQueryRef.current) {
      if (pendingQueryRef.current !== currentQuery) return;
      pendingQueryRef.current = null;
    }

    const params = new URLSearchParams(currentQuery);
    if (
      params.get("year") !== year ||
      params.get("month") !== month ||
      params.has("monthTouched")
    ) {
      params.set("year", year);
      params.set("month", month);
      params.delete("monthTouched");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [month, pathname, router, searchParams, year]);

  const setYear = (y: string) => {
    const nextYear = normalizeYear(y);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("monthTouched");
    params.set("year", nextYear);
    params.set(
      "month",
      normalizeMonth(monthTouchedRef.current ? month : null, nextYear),
    );
    const query = params.toString();
    pendingQueryRef.current = query;
    router.push(`${pathname}?${query}`);
  };

  const setMonth = (m: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    monthTouchedRef.current = true;
    window.sessionStorage.setItem(MONTH_SELECTION_STORAGE_KEY, "1");
    params.delete("monthTouched");
    params.set("month", normalizeMonth(m, year));
    if (m !== "ALL") params.delete("quarter");
    const query = params.toString();
    pendingQueryRef.current = query;
    router.push(`${pathname}?${query}`);
  };

  return (
    <FilterContext.Provider
      value={{
        year,
        setYear,
        month,
        setMonth,
        lastUpdated,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function FilterProvider({
  children,
  lastUpdated,
}: {
  children: React.ReactNode;
  lastUpdated: string;
}) {
  return (
    <Suspense fallback={<LoadingScreen embedded />}>
      <FilterProviderContent lastUpdated={lastUpdated}>
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
