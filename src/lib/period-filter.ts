import { DEFAULT_YEAR, DASHBOARD_CONFIG } from "@/lib/dashboard-config";

export interface CanonicalPeriod {
  year: string;
  month: string;
}

export function maxMonthForYear(year: string, now = new Date()): number {
  const numericYear = Number(year);
  const currentYear = now.getFullYear();
  if (numericYear < currentYear) return 12;
  if (numericYear === currentYear) return now.getMonth() + 1;
  return 0;
}

export function normalizeYear(value: string | null, now = new Date()): string {
  const years: readonly string[] = DASHBOARD_CONFIG.years;
  const currentYear = String(now.getFullYear());
  if (value && years.includes(value)) return value;
  return years.includes(currentYear) ? currentYear : DEFAULT_YEAR;
}

export function normalizeMonth(
  value: string | null,
  year: string,
  now = new Date(),
): string {
  const maxMonth = maxMonthForYear(year, now);
  if (value === "ALL") return "ALL";

  const fallback = "ALL";
  const match = value?.match(/^(\d{1,2})(?:-(\d{1,2}))?$/);
  if (!match || maxMonth < 1) return fallback;

  const first = Number(match[1]);
  const second = Number(match[2] ?? match[1]);
  if (first < 1 || second < 1 || first > maxMonth || second > maxMonth) {
    return fallback;
  }

  const start = Math.min(first, second);
  const end = Math.max(first, second);
  return start === end ? String(start) : `${start}-${end}`;
}

export function canonicalPeriod(
  year: string | null,
  month: string | null,
  now = new Date(),
): CanonicalPeriod {
  const normalizedYear = normalizeYear(year, now);
  return {
    year: normalizedYear,
    month: normalizeMonth(month, normalizedYear, now),
  };
}
