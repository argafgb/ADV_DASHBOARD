import {
  canonicalMonthValue,
  selectableMonths,
  validatedMonthValue,
} from "./month-range";

export const GLOBAL_FILTER_KEYS = ["year", "month"] as const;
export type GlobalFilterKey = (typeof GLOBAL_FILTER_KEYS)[number];

export interface GlobalFilterPeriods {
  years: number[];
  monthsByYear: Record<number, number[]>;
}

export interface GlobalFilterState {
  year: string;
  month: string;
}

export function availableMonthsForYear(
  periods: GlobalFilterPeriods,
  year: number,
  now = new Date(),
): number[] {
  const months = periods.monthsByYear[year] ?? [];
  if (year !== now.getFullYear() || months.includes(now.getMonth()))
    return months;
  return [...months, now.getMonth()].sort((a, b) => a - b);
}

export function resolveGlobalFilters(
  params: URLSearchParams,
  periods: GlobalFilterPeriods,
  defaults: GlobalFilterState,
  now = new Date(),
): GlobalFilterState {
  const parsedYear = Number(params.get("year") ?? defaults.year);
  const year = periods.years.includes(parsedYear)
    ? parsedYear
    : Number(defaults.year);
  const selectable = selectableMonths(
    year,
    availableMonthsForYear(periods, year, now),
    now,
  );
  const rawMonth = params.get("month");

  return {
    year: String(year),
    month:
      rawMonth == null
        ? defaults.month
        : validatedMonthValue(rawMonth, selectable, defaults.month),
  };
}

export function globalFilterParams(
  filters: GlobalFilterState,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("year", filters.year);
  params.set("month", canonicalMonthValue(filters.month));
  return params;
}

export function dashboardHref(
  pathname: string,
  filters: GlobalFilterState,
): string {
  const safePathname = pathname.split(/[?#]/, 1)[0];
  if (
    safePathname.startsWith(
      "/dashboard/network-performance/asset-infrastructure",
    ) ||
    safePathname.startsWith("/dashboard/asset-infrastructure")
  ) {
    return safePathname;
  }
  return `${safePathname}?${globalFilterParams(filters).toString()}`;
}
