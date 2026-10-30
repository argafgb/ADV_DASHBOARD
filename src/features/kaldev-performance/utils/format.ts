/** Format angka & tanggal mengikuti desain: id-ID, satu desimal dengan koma. */

export function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("id-ID");
}

/** "91,0" — satu desimal, koma sebagai pemisah. */
export function p1(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

export function pct1(n: number): string {
  return `${p1(n)}%`;
}

/** Bulan pendek pada chip periode (desain memakai "Ags" untuk Agustus di sini). */
export const SHORT_MONTHS_CHIP = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
] as const;

/** "17 September 2026 08.45" -> "17 September 2026". */
export function shortDate(value: string | null | undefined): string {
  if (!value) return "—";
  return value.split(" ").slice(0, 3).join(" ");
}

export function dash(value: string | number | null | undefined): string {
  return value == null || value === "" ? "—" : String(value);
}

/**
 * Tautan internal yang membawa filter global (year, month, from) supaya
 * pindah halaman tidak menghilangkan periode yang sedang dilihat.
 */
export function hrefWith(
  pathname: string,
  base: { year?: string; month?: string; from?: string },
  extra: Record<string, string | number | null | undefined> = {},
): string {
  const params = new URLSearchParams();
  if (base.year) params.set("year", base.year);
  if (base.month && base.month !== "ALL") params.set("month", base.month);
  if (base.from && base.from !== "Semua") params.set("from", base.from);
  for (const [k, v] of Object.entries(extra)) {
    if (v == null || v === "") continue;
    params.set(k, String(v));
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
