"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  Suspense,
  useRef,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import type { FilterOption } from "../types/filter.types";
import { normalizeMonthFilter, normalizeYear } from "@/lib/month-filter";
import {
  getDashboardHref,
  updateDashboardFilterParams,
  type GlobalFilterKey,
} from "../utils/dashboard-navigation";
import { formatSyncTimestamp } from "@/lib/utils";

interface BugTrackerFilterContextType {
  year: string;
  setYear: (year: string) => void;
  month: string;
  setMonth: (month: string) => void;
  project: string;
  setProject: (project: string) => void;
  projectOptions: FilterOption[];
  role: string;
  setRole: (role: string) => void;
  roleOptions: FilterOption[];
  lastUpdated: string;
  getNavigationHref: (href: string) => string;
}

const DEFAULT_PROJECT_OPTIONS: FilterOption[] = [
  { value: "ALL", label: "All Projects" },
];

const DEFAULT_ROLE_OPTIONS: FilterOption[] = [
  { value: "ALL", label: "All Roles" },
];

const BugTrackerFilterContext = createContext<
  BugTrackerFilterContextType | undefined
>(undefined);

interface FilterProviderContentProps {
  children: React.ReactNode;
  initialProjectOptions?: FilterOption[];
  initialRoleOptions?: FilterOption[];
  refreshedAt: string | null;
}

function FilterProviderContent({
  children,
  initialProjectOptions = DEFAULT_PROJECT_OPTIONS,
  initialRoleOptions = DEFAULT_ROLE_OPTIONS,
  refreshedAt,
}: FilterProviderContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigationRevision = useRef(0);
  const monthTouchedRef = useRef(false);
  const monthTouchStateInitializedRef = useRef(false);

  const year = normalizeYear(searchParams?.get("year"));
  const month = normalizeMonthFilter(searchParams?.get("month"), year);
  const project = searchParams?.get("project") || "ALL";
  const role = searchParams?.get("role") || "ALL";
  const isOverviewPage = pathname === "/dashboard/bug-tracker";

  const lastUpdated = formatSyncTimestamp(refreshedAt);
  const getNavigationHref = (href: string) =>
    getDashboardHref(href, new URLSearchParams(searchParams?.toString() || ""));

  useEffect(() => {
    const storageKey = `bug-tracker:month-touched:${pathname}`;
    const storedState = window.sessionStorage.getItem(storageKey);

    if (storedState !== null) {
      monthTouchedRef.current = storedState === "true";
    } else if (!monthTouchStateInitializedRef.current) {
      window.sessionStorage.setItem(storageKey, "false");
    }
    monthTouchStateInitializedRef.current = true;
  }, [pathname, searchParams]);

  useEffect(() => {
    const revision = navigationRevision.current;
    const params = new URLSearchParams(searchParams?.toString() || "");
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
    if (!needsReplace) return;

    const canonicalize = window.setTimeout(() => {
      if (revision === navigationRevision.current) {
        router.replace(`${pathname}?${params.toString()}`);
      }
    }, 0);
    return () => window.clearTimeout(canonicalize);
  }, [month, pathname, router, searchParams, year]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 300000);

    return () => window.clearInterval(interval);
  }, [router]);

  const updateUrl = (key: GlobalFilterKey, val: string) => {
    navigationRevision.current += 1;
    let params = new URLSearchParams(searchParams?.toString() || "");

    const normalizedValue =
      key === "year"
        ? normalizeYear(val)
        : key === "month"
          ? normalizeMonthFilter(val, year)
          : val;

    params = updateDashboardFilterParams(params, key, normalizedValue);

    if (key === "year") {
      params.set(
        "month",
        normalizeMonthFilter(
          monthTouchedRef.current ? searchParams?.get("month") : null,
          normalizedValue,
        ),
      );
    }

    if (key === "month" && normalizedValue !== "ALL") {
      params.delete("quarter");
    }

    if (isOverviewPage) {
      params.delete("dept");
    }

    const nextQuery = params.toString();
    const nextMonthTouched = key === "month" ? true : monthTouchedRef.current;
    monthTouchedRef.current = nextMonthTouched;
    window.sessionStorage.setItem(
      `bug-tracker:month-touched:${pathname}`,
      String(nextMonthTouched),
    );
    router.push(`${pathname}?${nextQuery}`);
  };

  const setYear = (y: string) => updateUrl("year", y);
  const setMonth = (m: string) => updateUrl("month", m);
  const setProject = (p: string) => updateUrl("project", p);
  const setRole = (r: string) => updateUrl("role", r);

  return (
    <BugTrackerFilterContext.Provider
      value={{
        year,
        setYear,
        month,
        setMonth,
        project,
        setProject,
        projectOptions: initialProjectOptions,
        role,
        setRole,
        roleOptions: initialRoleOptions,
        lastUpdated,
        getNavigationHref,
      }}
    >
      {children}
    </BugTrackerFilterContext.Provider>
  );
}

interface BugTrackerFilterProviderProps {
  children: React.ReactNode;
  initialProjectOptions?: FilterOption[];
  initialRoleOptions?: FilterOption[];
  refreshedAt: string | null;
}

export function BugTrackerFilterProvider({
  children,
  initialProjectOptions,
  initialRoleOptions,
  refreshedAt,
}: BugTrackerFilterProviderProps) {
  return (
    <Suspense fallback={null}>
      <FilterProviderContent
        initialProjectOptions={initialProjectOptions}
        initialRoleOptions={initialRoleOptions}
        refreshedAt={refreshedAt}
      >
        {children}
      </FilterProviderContent>
    </Suspense>
  );
}

export function useBugTrackerFilters() {
  const context = useContext(BugTrackerFilterContext);
  if (!context) {
    throw new Error(
      "useBugTrackerFilters must be used within a BugTrackerFilterProvider",
    );
  }
  return context;
}

export const useFilters = useBugTrackerFilters;
