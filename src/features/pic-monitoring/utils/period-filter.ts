import { DEFAULT_YEAR, DASHBOARD_CONFIG } from "./dashboard-config";

export interface CanonicalPeriod {
  year: string;
  month: string;
}

export interface MonthRange {
  start: number;
  end: number;
}

export const MONTH_OPTIONS = [
  { value: 1, shortLabel: "Jan", label: "Januari" },
  { value: 2, shortLabel: "Feb", label: "Februari" },
  { value: 3, shortLabel: "Mar", label: "Maret" },
  { value: 4, shortLabel: "Apr", label: "April" },
  { value: 5, shortLabel: "Mei", label: "Mei" },
  { value: 6, shortLabel: "Jun", label: "Juni" },
  { value: 7, shortLabel: "Jul", label: "Juli" },
  { value: 8, shortLabel: "Agu", label: "Agustus" },
  { value: 9, shortLabel: "Sep", label: "September" },
  { value: 10, shortLabel: "Okt", label: "Oktober" },
  { value: 11, shortLabel: "Nov", label: "November" },
  { value: 12, shortLabel: "Des", label: "Desember" },
] as const;

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

export function nextMonthSelection(current: string, clicked: number): string {
  if (current === "ALL" || current.includes("-")) return String(clicked);
  const start = Number(current);
  return Number.isInteger(start) && clicked > start
    ? `${start}-${clicked}`
    : String(clicked);
}

export function parseMonthRange(month: string): MonthRange {
  if (month === "ALL") return { start: 0, end: 11 };

  const [first, second = first] = month.split("-").map(Number);
  if (
    !Number.isInteger(first) ||
    !Number.isInteger(second) ||
    first < 1 ||
    second < 1 ||
    first > 12 ||
    second > 12
  ) {
    return { start: 0, end: 11 };
  }

  return {
    start: Math.min(first, second) - 1,
    end: Math.max(first, second) - 1,
  };
}

export function formatMonthSelection(month: string): string {
  if (month === "ALL") return "Semua";

  const { start, end } = parseMonthRange(month);
  const startShort = MONTH_OPTIONS[start]?.shortLabel;
  const endShort = MONTH_OPTIONS[end]?.shortLabel;
  if (!startShort || !endShort) return month;
  return start === end ? startShort : `${startShort}–${endShort}`;
}

/** Rentang bulan kalender 1–12 (inklusif) dari pilihan chip Bulan. */
export interface MonthWindow {
  startMonth: number;
  endMonth: number;
}

/**
 * `null` berarti All Months: pemanggil tidak menambah syarat bulan apa pun,
 * sehingga angkanya identik dengan perhitungan tahunan.
 */
export function monthWindowOf(month: string): MonthWindow | null {
  if (month === "ALL") return null;
  const { start, end } = parseMonthRange(month);
  return { startMonth: start + 1, endMonth: end + 1 };
}

/**
 * Label periode card: tahun saja saat All Months, atau tahun diikuti rentang
 * bulan ("2026 · Mar", "2026 · Jan–Mar") saat bulan dipilih.
 */
export function formatPeriodLabel(
  year: string | number,
  window: MonthWindow | null,
): string {
  if (window === null) return String(year);

  const startMonthObj = MONTH_OPTIONS[window.startMonth - 1];
  const endMonthObj = MONTH_OPTIONS[window.endMonth - 1];
  if (!startMonthObj || !endMonthObj) return String(year);

  if (window.startMonth === window.endMonth) {
    return `${startMonthObj.label} ${year}`;
  }
  return `${startMonthObj.label} – ${endMonthObj.label} ${year}`;
}

/**
 * Menu yang mengelompokkan proyek per tahun "Project diajukan". Kolom itu hanya
 * mencatat kuartal, jadi chip Bulan dimatikan di menu ini saja.
 */
const MONTH_FILTER_UNAVAILABLE_ROUTES = [
  "/dashboard/pic-monitoring/pipelines",
  "/dashboard/pic-monitoring/projects",
  "/dashboard/pipelines",
  "/dashboard/projects",
] as const;

export const MONTH_FILTER_UNAVAILABLE_REASON =
  "Menu ini menampilkan data per tahun, jadi filter bulan tidak berlaku di sini";

export function isMonthFilterAvailable(pathname: string | null): boolean {
  return !MONTH_FILTER_UNAVAILABLE_ROUTES.some((route) =>
    pathname?.startsWith(route),
  );
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
