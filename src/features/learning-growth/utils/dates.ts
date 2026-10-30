import { MONTHS_SHORT } from "./dashboard-config";

/** Today's date in local time as ISO "YYYY-MM-DD" - the reference for all status derivations. */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** "2025-01-24" -> "24 Jan 2025" (Indonesian short-month format). */
export function formatDateId(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS_SHORT[Number(m) - 1]} ${y}`;
}

/** "2028-09-29" -> "Sep 2028". */
export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS_SHORT[Number(m) - 1]} ${y}`;
}

export function yearOf(iso: string): string {
  return iso.slice(0, 4);
}

/** 0-based month index of an ISO date. */
export function monthIndexOf(iso: string): number {
  return Number(iso.slice(5, 7)) - 1;
}

/**
 * Whole months between two ISO dates, decremented when the end day-of-month
 * falls before the start day-of-month (exact port of the mockup logic).
 */
export function monthsBetween(fromIso: string, toIso: string): number {
  const [ay, am, ad] = fromIso.split("-").map(Number);
  const [by, bm, bd] = toIso.split("-").map(Number);
  let months = (by - ay) * 12 + (bm - am);
  if (bd < ad) months -= 1;
  return months;
}

function isoFromUtc(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

/**
 * Geser tanggal ISO sejumlah bulan. Tanggal yang tidak ada di bulan tujuan
 * jatuh ke hari terakhirnya: "2028-08-31" mundur 6 bulan -> "2028-02-29".
 */
export function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return isoFromUtc(new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))));
}

/** Geser tanggal ISO sejumlah hari. */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return isoFromUtc(new Date(Date.UTC(y, m - 1, d + days)));
}

/**
 * Parse a MonthFilter UI value into 1-based start/end, or null for "ALL".
 * "ALL" → both null. "7" → {start:7, end:7}. "3-6" → {start:3, end:6}.
 */
export function parseMonthFilter(val: string): { start: number | null; end: number | null } {
  if (val === "ALL") return { start: null, end: null };
  const parts = val.split("-");
  if (parts.length === 2) return { start: parseInt(parts[0]), end: parseInt(parts[1]) };
  const single = parseInt(val);
  return { start: single, end: single };
}

/**
 * True when an ISO date falls within the month range of a MonthFilter.
 * MonthFilter values are 1-indexed. monthIndexOf() returns 0-based, so +1.
 */
export function matchesMonth(isoDate: string, month: string): boolean {
  if (month === "ALL") return true;
  const { start, end } = parseMonthFilter(month);
  if (start === null || end === null) return true;
  const m = monthIndexOf(isoDate) + 1;
  return m >= start && m <= end;
}
