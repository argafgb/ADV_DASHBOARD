import { comparisonYearOf, DASHBOARD_CONFIG } from "./dashboard-config";
import type { DataYear, YearFilter } from "../types/dashboard.types";

/**
 * Years offered by the global filter, newest first. Mirrors dashboard-config
 * so the year list is edited in exactly one place, like every other dashboard.
 */
export const VALID_YEARS: readonly DataYear[] = DASHBOARD_CONFIG.years;

/** Applied when the URL carries no year, or one this dashboard cannot serve. */
export const DEFAULT_YEAR: DataYear = DASHBOARD_CONFIG.years[0];

/** Ready-made options for the navbar year chip. */
export const YEAR_OPTIONS: { v: DataYear; t: DataYear }[] = VALID_YEARS.map((year) => ({
  v: year,
  t: year,
}));

/**
 * Resolves whatever the URL carries into one supported year. Bookmarked links
 * from the previous multi-select filter ("compare", "2026-2025") collapse to
 * their newest supported year instead of breaking the page. "all" is preserved
 * for aggregations that intentionally span every year; the filter UI never
 * produces it.
 */
export function normalizeYearFilter(raw: string | null | undefined): YearFilter {
  if (raw === "all") return "all";
  const supported = (raw ?? "")
    .split("-")
    .find((part): part is DataYear => (VALID_YEARS as readonly string[]).includes(part));
  return supported ?? DEFAULT_YEAR;
}

/** Years the dashboards aggregate over - newest first, never empty. */
export function selectedYears(value: YearFilter): DataYear[] {
  return value === "all" ? [...VALID_YEARS] : [value];
}

/**
 * Years a chart should plot side by side: the selected year plus the one before
 * it, newest first. Falls back to a single entry when the earlier year has no
 * data, so nothing is ever drawn as a drop to zero.
 *
 * Deliberately separate from selectedYears: that one feeds every KPI selector,
 * so widening it would double the totals. This helper only ever reaches the
 * comparison charts.
 */
export function comparisonYears(value: YearFilter): DataYear[] {
  if (value === "all") return [...VALID_YEARS];
  const previous = comparisonYearOf(value);
  return previous ? [value, previous as DataYear] : [value];
}
