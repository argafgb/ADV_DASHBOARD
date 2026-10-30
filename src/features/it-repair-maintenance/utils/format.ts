/** Format angka & tanggal mengikuti desain: id-ID, satu desimal dengan koma. */

export function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("id-ID");
}

/** "46,3" — satu desimal, koma sebagai pemisah (fmtPct/fmtDays di desain). */
export function p1(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function fmtPct(n: number): string {
  return `${p1(n)}%`;
}

export function fmtDays(n: number): string {
  return `${p1(n)} hari`;
}

/** Persentase a dari b; 0 bila pembagi kosong (pct di desain). */
export function pct(a: number, b: number): number {
  return b ? (a / b) * 100 : 0;
}

export const MONTHS_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

/** Label sumbu bulan pada chart desain ("Agu" untuk Agustus). */
export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
] as const;

/** "2026-09-22" -> "22 September 2026" (DateText.format withTime:false di desain). */
export function formatDateId(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const month = MONTHS_FULL[Number(m[2]) - 1];
  if (!month) return value;
  return `${Number(m[3])} ${month} ${m[1]}`;
}

/**
 * Tautan internal yang membawa filter global (year, month, location,
 * ownership) supaya pindah halaman tidak menghilangkan periode yang sedang
 * dilihat.
 */
export function hrefWith(
  pathname: string,
  base: { year?: string; month?: string; location?: string; ownership?: string },
  extra: Record<string, string | number | null | undefined> = {},
): string {
  const params = new URLSearchParams();
  if (base.year) params.set("year", base.year);
  if (base.month && base.month !== "ALL") params.set("month", base.month);
  if (base.location && base.location !== "Semua") params.set("location", base.location);
  if (base.ownership && base.ownership !== "Semua") params.set("ownership", base.ownership);
  for (const [k, v] of Object.entries(extra)) {
    if (v == null || v === "") continue;
    params.set(k, String(v));
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
