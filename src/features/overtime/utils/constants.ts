export const DASHBOARD_CONFIG = {
  logoInitial: "A",
  brandName: "Advantage SCM",
  hubUrl:
    process.env.NEXT_PUBLIC_DASHBOARD_HUB_URL || "http://103.76.204.104:5777/",
  version: "1.0.0",
  subtitle: "Overtime",
  pageTitleFallback: "Overtime Analytics Dashboard",
  catalogName: "Overtime Dashboard",
  years: ["2026", "2025"] as const,
  defaultMonth: "ALL",
} as const;

export const DEFAULT_YEAR = DASHBOARD_CONFIG.years[0];

export const FALLBACK_YEAR_OPTIONS = DASHBOARD_CONFIG.years.map((y) => ({
  v: y,
  t: y,
}));

export function toYearOptions(
  years: readonly string[],
): { v: string; t: string }[] {
  if (years.length === 0) return FALLBACK_YEAR_OPTIONS;
  return years.map((y) => ({ v: y, t: y }));
}

export const DEFAULT_MONTH = DASHBOARD_CONFIG.defaultMonth;
export const DEFAULT_MONTH_INDEX = 0;

export function comparisonYearOf(
  year: string,
  availableYears: readonly string[] = DASHBOARD_CONFIG.years,
): string | null {
  const years =
    availableYears.length > 0 ? availableYears : DASHBOARD_CONFIG.years;
  const index = years.indexOf(year as "2026" | "2025");
  return index < 0 ? null : (years[index + 1] ?? null);
}

export const COMPARISON_YEAR = comparisonYearOf(DEFAULT_YEAR);
