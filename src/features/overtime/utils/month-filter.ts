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

export function parseMonthRange(value: string): {
  start: number | null;
  end: number | null;
} {
  if (value === DEFAULT_MONTH_FILTER) return { start: null, end: null };
  const match = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(value);
  if (!match) return { start: null, end: null };
  const start = Number(match[1]);
  const end = match[2] === undefined ? start : Number(match[2]);
  return { start, end };
}

export function getMonthFilterLabel(value: string): string {
  if (value === DEFAULT_MONTH_FILTER) return "All Months";

  const { start, end } = parseMonthRange(value);
  if (start === null || end === null) return value;
  if (start === end) return getMonthName(start);

  return `${getMonthName(start)} - ${getMonthName(end)}`;
}

export function defaultMonthFilter(year: string, now = new Date()): string {
  void year;
  void now;
  return DEFAULT_MONTH_FILTER;
}

export function normalizeYear(
  value: string | null | undefined,
  now = new Date(),
): string {
  void now;
  if (!value || !/^\d{4}$/.test(value)) return DEFAULT_GLOBAL_YEAR;
  return value;
}

export function getMaxSelectableMonth(year: string, now = new Date()): number {
  const selectedYear = Number(year);
  const currentYear = now.getFullYear();
  if (selectedYear < currentYear) return 12;
  if (selectedYear > currentYear) return 0;
  return now.getMonth() + 1;
}

export function normalizeMonthFilter(
  value: string | null | undefined,
  year: string,
  now = new Date(),
): string {
  const fallback = defaultMonthFilter(year, now);
  if (!value) return fallback;
  if (value.toUpperCase() === "ALL") return DEFAULT_MONTH_FILTER;

  const match = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(value);
  if (!match) return fallback;

  const start = Number(match[1]);
  const end = match[2] === undefined ? start : Number(match[2]);
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
    : `${clickedMonth}-${start}`;
}
