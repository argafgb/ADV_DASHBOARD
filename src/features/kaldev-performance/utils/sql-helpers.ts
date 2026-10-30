import "server-only";

/**
 * Konstanta & helper bersama untuk query SQL FASE 9.
 *
 * Semua data dibaca dari `kaldev_performance.kaldev_projects` di PostgreSQL.
 * Kolom yang tersedia sesuai `src/lib/ddl.sql`.
 */

export const TABLE = "kaldev_performance.kaldev_projects";
export const SLA_TARGET = 95;
export const PAGE_SIZE = 12;
export const LANE_SIZE = 12;
export const UNASSIGNED = "Belum ditugaskan";

/** Bulan panjang Indonesia (index 0 = Januari). */
export const MONTH_LONG = [
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

/** Bulan pendek Indonesia sesuai desain chip. */
export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
] as const;

/** Quarter month ranges (0-based month_index). */
export const QUARTER_MONTHS: Record<string, number[]> = {
  Q1: [0, 1, 2],
  Q2: [3, 4, 5],
  Q3: [6, 7, 8],
  Q4: [9, 10, 11],
};

/**
 * Parse filter `month` string ("ALL", "3", "1-6") into 0-based indices.
 * Returns empty array for "ALL" (= all months).
 */
export function parseMonthIndices(month: string): number[] {
  if (!month || month.toUpperCase() === "ALL") return [];
  const m = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(month);
  if (!m) return [];
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : start;
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i - 1); // 0-based
  return out.filter((i) => i >= 0 && i < 12);
}

/**
 * Format tanggal PostgreSQL timestamp → "17 September 2026 08.45".
 */
export function formatTimestamp(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  const day = dt.getDate();
  const mon = MONTH_LONG[dt.getMonth()];
  const year = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${day} ${mon} ${year} ${hh}.${mm}`;
}

/** "17 September 2026 08.45" → "17 September 2026" */
export function formatDateShort(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return `${dt.getDate()} ${MONTH_LONG[dt.getMonth()]} ${dt.getFullYear()}`;
}

/**
 * Build the "as of" label from the freshness timestamp.
 * Returns something like "17 September 2026 10.21".
 */
export function asOfLabel(d: Date | string | null): string {
  return formatTimestamp(d);
}

/**
 * Build period label for SLA card.
 */
export function periodLabel(
  year: string,
  monthIndices: number[],
  maxMonthIdx: number,
): string {
  if (monthIndices.length === 0) {
    return `${MONTH_SHORT[0]}–${MONTH_SHORT[maxMonthIdx]} ${year}`;
  }
  if (monthIndices.length === 1) {
    return MONTH_SHORT[monthIndices[0]];
  }
  const lo = monthIndices[0];
  const hi = monthIndices[monthIndices.length - 1];
  if (hi - lo + 1 === monthIndices.length) {
    return `${MONTH_SHORT[lo]} – ${MONTH_SHORT[hi]}`;
  }
  return `${monthIndices.length} bulan`;
}

/**
 * Compute the "bulan label" for the month chip display.
 */
export function bulanLabel(monthIndices: number[]): string {
  if (monthIndices.length === 0) return "All Months";
  if (monthIndices.length === 1) return MONTH_SHORT[monthIndices[0]];
  const lo = monthIndices[0];
  const hi = monthIndices[monthIndices.length - 1];
  if (hi - lo + 1 === monthIndices.length) {
    return `${MONTH_SHORT[lo]} – ${MONTH_SHORT[hi]}`;
  }
  return `${monthIndices.length} bulan`;
}
