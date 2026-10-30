export interface MonthRange {
  value: string;
  months: number[];
  start: number | null;
  end: number | null;
  isAll: boolean;
}

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const FULL_MONTH_NAMES = [
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

export function latestSelectableMonth(
  year: number,
  today = new Date(),
): number {
  if (year < today.getFullYear()) return 12;
  if (year > today.getFullYear()) return 0;
  return today.getMonth() + 1;
}

export function isMonthSelectable(
  year: number,
  month: number,
  today = new Date(),
): boolean {
  return (
    Number.isInteger(month) &&
    month >= 1 &&
    month <= latestSelectableMonth(year, today)
  );
}

function singleMonth(month: number): MonthRange {
  return {
    value: String(month),
    months: [month],
    start: month,
    end: month,
    isAll: false,
  };
}

export function monthForTargetYear(
  value: string,
  targetYear: number,
  wasExplicitlySelected: boolean,
  today = new Date(),
): string {
  return normalizeMonthRange(
    wasExplicitlySelected ? value : null,
    targetYear,
    today,
  ).value;
}

export function normalizeMonthRange(
  value: string | null | undefined,
  year: number,
  today = new Date(),
): MonthRange {
  const raw = value?.trim().toUpperCase();
  if (raw === "ALL" || !raw) {
    return { value: "ALL", months: [], start: null, end: null, isAll: true };
  }

  const fallback = latestSelectableMonth(year, today);
  const match = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(raw);
  if (!match) return singleMonth(fallback || 1);

  const first = Number(match[1]);
  const second = Number(match[2] ?? match[1]);
  const limit = latestSelectableMonth(year, today);
  if (limit === 0 || first < 1 || first > 12 || second < 1 || second > 12) {
    return singleMonth(fallback || 1);
  }

  const start = Math.min(first, second);
  const end = Math.min(Math.max(first, second), limit);
  if (start > limit) return singleMonth(limit);
  const months = Array.from(
    { length: end - start + 1 },
    (_, index) => start + index,
  );
  return {
    value: start === end ? String(start) : `${start}-${end}`,
    months,
    start,
    end,
    isAll: false,
  };
}

export function nextMonthSelection(
  current: MonthRange,
  selected: number,
): string {
  if (
    current.isAll ||
    current.start === null ||
    (current.start !== null && current.end !== null && current.start !== current.end)
  ) {
    return String(selected);
  }

  const first = current.start;
  const start = Math.min(first, selected);
  const end = Math.max(first, selected);
  return `${start}-${end}`;
}
