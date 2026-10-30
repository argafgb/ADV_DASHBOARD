import type { MonthFilter, YearFilter } from "../types/dashboard.types";

/** Month indexes rendered by time-series charts under the selected period. */
export function visibleMonthIndexes(
  year: YearFilter,
  month: MonthFilter = "ALL",
  now = new Date(),
): number[] {
  const scope = parseMonthFilter(month);
  const selected = scope.isAll
    ? Array.from({ length: 12 }, (_, index) => index)
    : scope.months.map((value) => value - 1);
  return visibleSeriesMonthIndexes(year, selected, now);
}

/** Axis months that may contain points for a specific yearly series. */
export function visibleSeriesMonthIndexes(
  year: string,
  axisMonths: readonly number[],
  now = new Date(),
): number[] {
  return year === String(now.getFullYear())
    ? axisMonths.filter((index) => index <= now.getMonth())
    : [...axisMonths];
}

function parseMonthToken(raw: string): number | null {
  const parsed = parseInt(raw, 10);
  if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 12) {
    return parsed;
  }
  return null;
}

export function parseMonthFilter(monthFilter: string = "ALL"): {
  months: number[];
  isAll: boolean;
  startMonth: number;
  endMonth: number;
} {
  const clean = monthFilter.trim();
  if (!clean || clean.toUpperCase() === "ALL") {
    return {
      months: [],
      isAll: true,
      startMonth: 1,
      endMonth: 12,
    };
  }

  const normalized = clean.replace(/\s+/g, "").toLowerCase();

  // Try parsing range like "6-7"
  const rangeParts = normalized.split(/[-–—]/);
  if (rangeParts.length === 2) {
    const start = parseMonthToken(rangeParts[0]) || 1;
    const end = parseMonthToken(rangeParts[1]) || 12;
    const safeStart = Math.min(start, end);
    const safeEnd = Math.max(start, end);

    const months = Array.from({ length: safeEnd - safeStart + 1 }, (_, index) => safeStart + index);

    return {
      months,
      isAll: false,
      startMonth: safeStart,
      endMonth: safeEnd,
    };
  }

  // Try parsing comma-separated like "6,7"
  const commaParts = normalized.split(",");
  if (commaParts.length > 1) {
    const months = commaParts.map(parseMonthToken).filter((m): m is number => m !== null);

    if (months.length > 0) {
      const sorted = [...new Set(months)].sort((a, b) => a - b);
      return {
        months: sorted,
        isAll: false,
        startMonth: sorted[0]!,
        endMonth: sorted[sorted.length - 1]!,
      };
    }
  }

  const single = parseMonthToken(clean);
  if (single !== null) {
    return {
      months: [single],
      isAll: false,
      startMonth: single,
      endMonth: single,
    };
  }

  return {
    months: [],
    isAll: true,
    startMonth: 1,
    endMonth: 12,
  };
}
