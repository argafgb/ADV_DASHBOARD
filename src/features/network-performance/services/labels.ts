import { MONTHS } from "../data/constants";
import type { MonthRange } from "@/lib/network/month-range";

/**
 * Period labels derived from the months that exist, never from the calendar
 * clock and never hardcoded. Today can be 3 August while the newest closed
 * report is July — the label must say Jan–Jul, not Jan–Ags.
 */
export function monthRangeLabel(months: number[]): string {
  if (!months.length) return "—";
  const lo = Math.min(...months);
  const hi = Math.max(...months);
  return lo === hi ? MONTHS[lo] : MONTHS[lo] + "–" + MONTHS[hi];
}

/** Label jendela pembanding — port windowLabel() sumber. */
export function windowLabel(
  bulan: number | MonthRange | null,
  monthsInYear: number[],
  bulanMonths?: number[] | null,
): string {
  if (bulanMonths && bulanMonths.length > 1) {
    const lo = Math.min(...bulanMonths);
    const hi = Math.max(...bulanMonths);
    return lo === hi ? MONTHS[lo] : MONTHS[lo] + "–" + MONTHS[hi];
  }
  if (typeof bulan === "object" && bulan !== null) {
    const lo = bulan.start;
    const hi = bulan.end;
    return lo === hi ? MONTHS[lo] : MONTHS[lo] + "–" + MONTHS[hi];
  }
  return bulan != null
    ? MONTHS[bulan as number]
    : monthRangeLabel(monthsInYear);
}

/** Label periode aktif — port periodLabel() sumber. */
export function periodLabel(
  tahun: number,
  bulan: number | MonthRange | null,
  scope: string,
  monthsInYear: number[],
  bulanMonths?: number[] | null,
): string {
  const isMulti = bulanMonths && bulanMonths.length > 1;
  const monthText = isMulti
    ? (Math.min(...bulanMonths) === Math.max(...bulanMonths)
        ? MONTHS[Math.min(...bulanMonths)]
        : MONTHS[Math.min(...bulanMonths)] +
          "–" +
          MONTHS[Math.max(...bulanMonths)]) + " "
    : typeof bulan === "object" && bulan !== null
      ? (bulan.start === bulan.end
          ? MONTHS[bulan.start]
          : MONTHS[bulan.start] + "–" + MONTHS[bulan.end]) + " "
      : bulan != null
        ? MONTHS[bulan as number] + " "
        : "";
  const partial =
    bulan == null &&
    !isMulti &&
    monthsInYear.length > 0 &&
    monthsInYear.length < 12;
  const suffix = partial ? " YTD (" + monthRangeLabel(monthsInYear) + ")" : "";
  return (
    monthText + tahun + suffix + (scope !== "Semua cabang" ? " · " + scope : "")
  );
}

export type ViewKey = "overview" | "sla" | "down" | "isp";

/** Pemetaan pathname route → view key sumber. */
export function viewFromPathname(pathname: string): ViewKey {
  if (pathname === "/dashboard/sla-performance") return "sla";
  if (pathname === "/dashboard/downtime-incidents") return "down";
  if (pathname === "/dashboard/isp-bandwidth") return "isp";
  return "overview";
}
