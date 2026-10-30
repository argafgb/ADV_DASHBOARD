export interface MonthRange {
  /** Inclusive, zero-indexed month. */
  start: number;
  /** Inclusive, zero-indexed month. */
  end: number;
}

export const ALL_MONTHS = "ALL";

const MONTH_VALUE = /^(?:[1-9]|1[0-2])$/;
const MONTH_RANGE_VALUE = /^(?:[1-9]|1[0-2])-(?:[1-9]|1[0-2])$/;

export function parseMonthRange(
  value: string | null | undefined,
): MonthRange | null {
  if (!value || value === ALL_MONTHS) return null;

  if (MONTH_VALUE.test(value)) {
    const month = Number(value) - 1;
    return { start: month, end: month };
  }

  if (!MONTH_RANGE_VALUE.test(value)) return null;

  const [start, end] = value.split("-").map(Number);
  if (start > end) return null;
  return { start: start - 1, end: end - 1 };
}

export function serializeMonthRange(range: MonthRange | null): string {
  if (!range) return ALL_MONTHS;
  const start = range.start + 1;
  const end = range.end + 1;
  return start === end ? String(start) : `${start}-${end}`;
}

export function monthsForRange(range: MonthRange | null): number[] | null {
  if (!range) return null;
  return Array.from(
    { length: range.end - range.start + 1 },
    (_, index) => range.start + index,
  );
}

export function defaultMonthValue(
  year: number,
  availableMonths: number[],
  now = new Date(),
): string {
  if (year === now.getFullYear()) return String(now.getMonth() + 1);
  if (year < now.getFullYear()) {
    const latest = Math.max(
      ...availableMonths.filter((month) => month >= 0 && month <= 11),
    );
    return String((Number.isFinite(latest) ? latest : 11) + 1);
  }
  return String(now.getMonth() + 1);
}

export function nextMonthValue(value: string, clickedMonth: number): string {
  const range = parseMonthRange(value);
  if (!range || range.start !== range.end) return String(clickedMonth);
  const start = range.start + 1;
  return clickedMonth > start
    ? `${start}-${clickedMonth}`
    : String(clickedMonth);
}

export function canonicalMonthValue(
  value: string | null | undefined,
  fallback = ALL_MONTHS,
): string {
  if (value === ALL_MONTHS) return ALL_MONTHS;
  const parsed = parseMonthRange(value);
  return parsed ? serializeMonthRange(parsed) : fallback;
}

export function validatedMonthValue(
  value: string | null | undefined,
  selectable: number[],
  fallback = ALL_MONTHS,
): string {
  if (value === ALL_MONTHS) return ALL_MONTHS;
  const range = parseMonthRange(value);
  if (!range) return fallback;
  return selectable.includes(range.start) && selectable.includes(range.end)
    ? serializeMonthRange(range)
    : fallback;
}

export function monthValueForYearChange(
  currentValue: string | null | undefined,
  isExplicit: boolean,
  selectable: number[],
  targetDefault: string,
): string {
  if (!isExplicit) return targetDefault;
  return validatedMonthValue(currentValue, selectable, targetDefault);
}

export function monthInRange(
  month: number | null,
  range: number | MonthRange | null,
): boolean {
  if (month == null) return false;
  if (range == null) return true;
  if (typeof range === "number") return month === range;
  return month >= range.start && month <= range.end;
}

export function monthsInRange(
  months: number[],
  range: number | MonthRange | null,
): number[] {
  return range == null
    ? months
    : months.filter((month) => monthInRange(month, range));
}

export function isFutureMonth(
  year: number,
  month: number,
  now = new Date(),
): boolean {
  return (
    year > now.getFullYear() ||
    (year === now.getFullYear() && month > now.getMonth())
  );
}

export function selectableMonths(
  year: number,
  availableMonths: number[],
  now = new Date(),
): number[] {
  return availableMonths.filter((month) => !isFutureMonth(year, month, now));
}
