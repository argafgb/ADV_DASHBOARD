import { parseMonthFilter as parseMonthFilterUtils } from "@/lib/filter-utils";

export const DEFAULT_MONTH_FILTER = "ALL";
export const DEFAULT_GLOBAL_YEAR = "2026";

export const INDONESIAN_MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export function getMonthName(monthNum: number, isShort = false): string {
  const idx = monthNum - 1;
  if (idx >= 0 && idx < 12) {
    return isShort ? SHORT_MONTH_NAMES[idx] : INDONESIAN_MONTH_NAMES[idx];
  }
  return String(monthNum);
}

export function getMonthFilterLabel(value: string): string {
  if (value === DEFAULT_MONTH_FILTER) return "All Months";

  const { start, end } = parseMonthRange(value);
  if (start === null || end === null) return value;
  if (start === end) return getMonthName(start);

  return `${getMonthName(start)} - ${getMonthName(end)}`;
}

export function defaultMonthFilter(year: string, now?: Date): string {
  void year;
  void now;
  return DEFAULT_MONTH_FILTER;
}

export function normalizeYear(
  value: string | null | undefined,
  now?: Date,
): string {
  void now;
  if (!value || !/^\d{4}$/.test(value)) return DEFAULT_GLOBAL_YEAR;
  return value;
}

export function getMaxSelectableMonth(year: string, now?: Date): number {
  const selectedYear = Number(year);
  const currentYear = now ? now.getFullYear() : 2026;
  if (selectedYear < currentYear) return 12;
  if (selectedYear > currentYear) return 0;
  return now ? now.getMonth() + 1 : 12;
}

export function normalizeMonthFilter(
  value: string | null | undefined,
  year: string,
  now?: Date,
): string {
  const fallback = defaultMonthFilter(year, now);
  if (!value) return fallback;
  if (value.toUpperCase() === "ALL") return DEFAULT_MONTH_FILTER;

  let start: number;
  let end: number;

  const match = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(value);
  if (match) {
    start = Number(match[1]);
    end = match[2] === undefined ? start : Number(match[2]);
  } else {
    const parsed = parseMonthFilterUtils(value);
    if (parsed.isAll || parsed.months.length === 0) return fallback;
    start = parsed.startMonth;
    end = parsed.endMonth;
  }

  const maxMonth = getMaxSelectableMonth(year, now);
  if (start < 1 || end > maxMonth || start > end) return fallback;

  return start === end ? String(start) : `${start}-${end}`;
}

export function nextMonthFilter(value: string, clickedMonth: number): string {
  const { start, end } = parseMonthRange(value);
  if (start === null || end === null || start !== end)
    return String(clickedMonth);
  return clickedMonth > start
    ? `${start}-${clickedMonth}`
    : String(clickedMonth);
}

export function parseMonthRange(value: string): {
  start: number | null;
  end: number | null;
} {
  if (!value || value === DEFAULT_MONTH_FILTER) return { start: null, end: null };
  const match = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(value);
  if (match) {
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    return { start, end };
  }
  const parsed = parseMonthFilterUtils(value);
  if (parsed.isAll || parsed.months.length === 0) return { start: null, end: null };
  return { start: parsed.startMonth, end: parsed.endMonth };
}

export function parseMonthFilter(value: string): {
  start: number | null;
  end: number | null;
} {
  return parseMonthRange(value);
}
