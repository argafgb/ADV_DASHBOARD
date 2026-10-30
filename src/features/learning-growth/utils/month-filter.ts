import { MONTHS_LONG, MONTHS_SHORT } from "./dashboard-config";

export type NormalizedMonth = "ALL" | `${number}` | `${number}-${number}`;

export const MONTH_OPTIONS = MONTHS_SHORT.map((label, index) => ({
  value: index + 1,
  label,
}));

function maxSelectableMonth(year: string, now = new Date()): number {
  const selectedYear = Number(year);
  const currentYear = now.getFullYear();
  if (selectedYear < currentYear) return 12;
  if (selectedYear > currentYear) return 0;
  return now.getMonth() + 1;
}

export function isMonthSelectable(month: number, year: string, now = new Date()): boolean {
  return Number.isInteger(month) && month >= 1 && month <= maxSelectableMonth(year, now);
}

export function normalizeMonthFilter(
  value: string | null | undefined,
  year: string,
  fallback?: string,
  now = new Date(),
): NormalizedMonth {
  const max = maxSelectableMonth(year, now);
  const normalize = (candidate: string | null | undefined): NormalizedMonth | null => {
    if (!candidate) return null;
    if (candidate.toUpperCase() === "ALL") return "ALL";
    const match = candidate.match(/^(\d{1,2})(?:-(\d{1,2}))?$/);
    if (!match) return null;
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end > 12 || start > end || end > max) return null;
    return start === end ? `${start}` : `${start}-${end}`;
  };

  return normalize(value) ?? normalize(fallback) ?? "ALL";
}

export function getNextMonthFilter(value: string, month: number): NormalizedMonth {
  const { start, end } = parseNormalizedMonth(value);
  if (value === "ALL" || start === null || end === null || start !== end || month <= start) {
    return `${month}`;
  }
  return `${start}-${month}`;
}

export function parseNormalizedMonth(value: string): { start: number | null; end: number | null } {
  if (value === "ALL") return { start: null, end: null };
  const [start, end = start] = value.split("-").map(Number);
  return { start, end };
}

export function formatMonthFilter(value: string): string {
  const { start, end } = parseNormalizedMonth(value);
  if (start === null || end === null) return "All Months";
  if (start === end) return MONTHS_LONG[start - 1] ?? value;
  return `${MONTHS_LONG[start - 1] ?? start} - ${MONTHS_LONG[end - 1] ?? end}`;
}
