import { MONTHS, FULL_MONTH_NAMES } from "./month-filter";
import { parseMonthFilter } from "@/lib/filter-utils";

export const SLA_TARGET = 99.6;

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function calculateSlaPct(
  downtimeMins: number,
  totalOpsMins: number,
): number {
  if (totalOpsMins <= 0) return 100;
  const pct = Math.max(0, 100 - (downtimeMins / totalOpsMins) * 100);
  return Math.round(pct * 100) / 100;
}

export function getOperationalMinutes(
  year: number,
  months: number[],
  serviceCount: number = 1,
): number {
  let totalDays = 0;
  for (const m of months) {
    totalDays += getDaysInMonth(year, m);
  }
  return totalDays * 24 * 60 * serviceCount;
}

export function getPeriodLabel(monthStr?: string, yearStr: string = "2026"): string {
  const filter = parseMonthFilter(monthStr);
  if (filter.isAll) {
    return `Setahun Penuh ${yearStr}`;
  }
  if (filter.startMonth === filter.endMonth) {
    return `${FULL_MONTH_NAMES[filter.startMonth - 1]} ${yearStr}`;
  }
  return `${FULL_MONTH_NAMES[filter.startMonth - 1]}–${FULL_MONTH_NAMES[filter.endMonth - 1]} ${yearStr}`;
}
