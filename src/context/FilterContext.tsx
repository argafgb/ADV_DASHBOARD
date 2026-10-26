"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  canonicalPeriod,
  normalizeMonth,
  normalizeYear,
} from "@/lib/period-filter";
import type { CompanyCode, CompanyFilterValue, SiteOption } from "@/types/asset-pm.types";
import { LoadingScreen } from "@/components/connection-state";

import { normalizeSiteName } from "@/lib/site-utils";
import { NO_SITE_VALUE, normalizeSiteSelection } from "@/lib/site-filter-policy";
import { normalizeCompany, toggleCompanyFilter } from "@/lib/company-filter";

export type SiteFilterValue = string;

interface FilterContextType {
  year: string;
  setYear: (year: string) => void;
  site: SiteFilterValue;
  setSite: (site: SiteFilterValue) => void;
  siteOptions: SiteOption[];
  company: CompanyFilterValue;
  setCompany: (company: CompanyFilterValue) => void;
  toggleCompany: (code: CompanyCode) => void;
  month: string;
  setMonth: (month: string) => void;
  lastUpdated: string;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);
const MONTH_SELECTION_STORAGE_KEY = "pm-asset-it:month-explicitly-selected";

const DEFAULT_SITE_OPTIONS: SiteOption[] = [];

function sanitizeOptions(opts: SiteOption[]): SiteOption[] {
  if (opts.length === 1 && opts[0].value === NO_SITE_VALUE) return opts;
  const normSet = new Set<string>();
  const hasAll = opts.some((opt) => opt.value === "ALL");
  for (const opt of opts) {
    if (opt.value === "ALL") continue;
    const norm = normalizeSiteName(opt.value);
    if (norm) {
      normSet.add(norm);
    }
  }
  const sorted = Array.from(normSet).sort((a, b) => a.localeCompare(b));
  const mapped = sorted.map((s) => ({ value: s, label: s }));
  if (hasAll) {
    return [{ value: "ALL", label: "All Sites" }, ...mapped];
  }
  return mapped;
}

function FilterProviderContent({
  children,
  initialSiteOptions = DEFAULT_SITE_OPTIONS,
  lastUpdated,
}: {
  children: React.ReactNode;
  initialSiteOptions?: SiteOption[];
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

  const siteOptions = useMemo(
    () => sanitizeOptions(initialSiteOptions),
    [initialSiteOptions],
  );

  const period = canonicalPeriod(
    searchParams?.get("year") ?? null,
    searchParams?.get("month") ?? null,
  );
  const year = period.year;
  const month = period.month;
  const site = normalizeSiteSelection(searchParams?.get("site"), siteOptions);
  const company = normalizeCompany(searchParams?.get("company"));

  useEffect(() => {
    const currentQuery = searchParams?.toString() || "";
    if (pendingQueryRef.current) {
      if (pendingQueryRef.current !== currentQuery) return;
      pendingQueryRef.current = null;
    }

    const params = new URLSearchParams(currentQuery);
    const canonicalSite = normalizeSiteSelection(params.get("site"), siteOptions);
    const canonicalCompany = normalizeCompany(params.get("company"));
    const needsReplace =
      params.get("year") !== year ||
      params.get("month") !== month ||
      params.has("monthTouched") ||
      (params.has("site") && params.get("site") !== canonicalSite) ||
      (params.has("company") &&
        (canonicalCompany === "ALL" || params.get("company") !== canonicalCompany));

    if (needsReplace) {
      params.set("year", year);
      params.set("month", month);
      params.delete("monthTouched");
      if (params.has("site")) params.set("site", canonicalSite);
      if (canonicalCompany === "ALL") {
        params.delete("company");
      } else {
        params.set("company", canonicalCompany);
      }
      const nextQuery = params.toString();
      if (nextQuery !== currentQuery) {
        pendingQueryRef.current = nextQuery;
        router.replace(`${pathname}?${nextQuery}`);
      }
    }
  }, [company, month, pathname, router, searchParams, siteOptions, year]);

  const updateUrl = useCallback(
    (key: string, val: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "");

      if (key === "company" && (val === "ALL" || !val)) {
        params.delete("company");
      } else {
        params.set(key, val);
      }

      if (key === "month" && val !== "ALL") {
        params.delete("quarter");
      }

      const query = params.toString();
      pendingQueryRef.current = query;
      router.push(`${pathname}?${query}`);
    },
    [pathname, router, searchParams],
  );

  const setYear = useCallback(
    (y: string) => {
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
    },
    [month, pathname, router, searchParams],
  );

  const setSite = useCallback(
    (s: SiteFilterValue) => updateUrl("site", s),
    [updateUrl],
  );

  const setCompany = useCallback(
    (c: CompanyFilterValue) => updateUrl("company", normalizeCompany(c)),
    [updateUrl],
  );

  const toggleCompany = useCallback(
    (code: CompanyCode) => {
      const nextVal = toggleCompanyFilter(company, code);
      updateUrl("company", nextVal);
    },
    [company, updateUrl],
  );

  const setMonth = useCallback(
    (m: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      monthTouchedRef.current = true;
      window.sessionStorage.setItem(MONTH_SELECTION_STORAGE_KEY, "1");
      params.delete("monthTouched");
      params.set("month", normalizeMonth(m, year));
      if (m !== "ALL") params.delete("quarter");
      const query = params.toString();
      pendingQueryRef.current = query;
      router.push(`${pathname}?${query}`);
    },
    [pathname, router, searchParams, year],
  );

  const contextValue = useMemo(
    () => ({
      year,
      setYear,
      site,
      setSite,
      siteOptions,
      company,
      setCompany,
      toggleCompany,
      month,
      setMonth,
      lastUpdated,
    }),
    [
      year,
      setYear,
      site,
      setSite,
      siteOptions,
      company,
      setCompany,
      toggleCompany,
      month,
      setMonth,
      lastUpdated,
    ],
  );

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
}

export function FilterProvider({
  children,
  initialSiteOptions,
  lastUpdated,
}: {
  children: React.ReactNode;
  initialSiteOptions?: SiteOption[];
  lastUpdated: string;
}) {
  return (
    <Suspense fallback={<LoadingScreen embedded />}>
      <FilterProviderContent
        initialSiteOptions={initialSiteOptions}
        lastUpdated={lastUpdated}
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
