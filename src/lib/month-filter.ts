export const DEFAULT_MONTH_FILTER = "ALL";
export const DEFAULT_GLOBAL_YEAR = "2026";

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
  const defaultMonth = DEFAULT_MONTH_FILTER;
  if (!value) return defaultMonth;
  if (value.toUpperCase() === "ALL") return DEFAULT_MONTH_FILTER;

  const match = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(value);
  if (!match) return defaultMonth;

  const start = Number(match[1]);
  const end = match[2] === undefined ? start : Number(match[2]);
  const maxMonth = getMaxSelectableMonth(year, now);
  if (start < 1 || end > maxMonth || start > end) return defaultMonth;

  return start === end ? String(start) : `${start}-${end}`;
}

export function getNextMonthFilter(value: string, month: number): string {
  const { start, end } = parseMonthFilter(value);
  if (
    value === "ALL" ||
    start === null ||
    end === null ||
    start !== end ||
    month <= start
  ) {
    return String(month);
  }
  return `${start}-${month}`;
}

export function parseMonthFilter(value: string): {
  start: number | null;
  end: number | null;
} {
  if (value === DEFAULT_MONTH_FILTER) return { start: null, end: null };
  const [start, end = start] = value.split("-").map(Number);
  return { start, end };
}
