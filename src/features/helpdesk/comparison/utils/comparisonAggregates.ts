import type { MonthlyAppMenuComparison, TicketVolumeByCategory } from "../types/comparison.types";

export const COMPARISON_CHART_APPLICATIONS = [
  "SOFTWARE", "EMAIL", "DCT WEB", "HARDWARE", "INFRASTRUCTURE", "PRINTER & SCANNER", "DCT ANDROID",
] as const;

export const DCT_APPLICATIONS = ["DCT WEB", "DCT ANDROID"] as const;
export const IT_APPLICATIONS = [
  "SOFTWARE", "EMAIL", "HARDWARE", "INFRASTRUCTURE", "PRINTER & SCANNER",
] as const;

export function buildCategoryComparison(
  rows: MonthlyAppMenuComparison[],
  dept: string = "ALL",
): TicketVolumeByCategory[] {
  let targetApps: readonly string[] = COMPARISON_CHART_APPLICATIONS;
  if (dept === "DCT Support") {
    targetApps = DCT_APPLICATIONS;
  } else if (dept === "IT Support") {
    targetApps = IT_APPLICATIONS;
  }

  rows = rows.filter(row => targetApps.some(app => app === row.app));
  const groups = new Map<string, MonthlyAppMenuComparison[]>();
  for (const row of rows) groups.set(row.app, [...(groups.get(row.app) ?? []), row]);
  const summarize = (category: string, items: MonthlyAppMenuComparison[]): TicketVolumeByCategory => {
    const previous = items.reduce((sum, row) => sum + row.ticketsPrevYear, 0);
    const current = items.reduce((sum, row) => sum + row.ticketsSelectedYear, 0);
    return {
      category,
      ticketsPrevYear: previous,
      ticketsSelectedYear: current,
      ticketDiff: current - previous,
      growthPercentage: previous
        ? Number((((current - previous) / previous) * 100).toFixed(2))
        : (current > 0 ? 100 : 0),
      topFeatures: [...items].sort((a, b) => b.ticketsSelectedYear - a.ticketsSelectedYear || b.ticketsPrevYear - a.ticketsPrevYear || a.app.localeCompare(b.app) || a.feature.localeCompare(b.feature)).slice(0, 6).map(row => ({
        feature: category === "ALL" ? `${row.app} - ${row.feature}` : row.feature,
        ticketsPrevYear: row.ticketsPrevYear,
        ticketsSelectedYear: row.ticketsSelectedYear,
        ticketDiff: row.ticketsSelectedYear - row.ticketsPrevYear,
        growthPercentage: row.growthPercentage !== null
          ? row.growthPercentage
          : (row.ticketsPrevYear === 0 && row.ticketsSelectedYear > 0 ? 100 : (row.ticketsPrevYear === 0 && row.ticketsSelectedYear === 0 ? 0 : null)),
      })),
    };
  };
  if (!rows.length) return [];
  const categories = Array.from(groups, ([category, items]) => summarize(category, items))
    .sort((a, b) => targetApps.findIndex(app => app === a.category) - targetApps.findIndex(app => app === b.category));
  return [summarize("ALL", rows), ...categories];
}
