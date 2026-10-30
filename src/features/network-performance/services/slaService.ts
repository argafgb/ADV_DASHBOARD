import type {
  Branch,
  DowntimeIncident,
  SlaCell,
  SlaMatrix,
  Tone,
} from "../types/network.types";
import type { Periods } from "../queries/periods";
import { MONTHS } from "../data/constants";
import { monthsInRange, type MonthRange } from "@/lib/network/month-range";

export interface SlaServiceInput {
  branches: Branch[];
  matrix: SlaMatrix;
  periods: Periods;
  incidents?: DowntimeIncident[];
}

export interface WeekSlaInfo {
  value: number | null;
  downtimeMinutes: number;
  incidentCount: number;
  startDay: number;
  endDay: number;
  totalMinutes: number;
  dateRangeLabel: string;
}

function parseWibDate(
  dateStr: string | null,
): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  // Offset UTC+7 for WIB
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return {
    year: wib.getUTCFullYear(),
    month: wib.getUTCMonth(),
    day: wib.getUTCDate(),
  };
}

/**
 * SLA derivations, bound to a dataset rather than a module-level import.
 */
export function createSlaService(data: SlaServiceInput) {
  const { branches, matrix, periods, incidents = [] } = data;
  const TARGET = periods.target;

  // Index incidents by key: `${year}_${month}_${weekIndex}_${siteKey}`
  const incidentMap: Record<
    string,
    { totalMinutes: number; count: number }
  > = {};

  for (const inc of incidents) {
    const wib = parseWibDate(inc.downtimeStart);
    if (!wib) continue;
    const weekIndex = Math.min(4, Math.floor((wib.day - 1) / 7));
    const siteKey = inc.site.trim().toLowerCase();
    const key = `${wib.year}_${wib.month}_${weekIndex}_${siteKey}`;
    const entry = (incidentMap[key] ??= { totalMinutes: 0, count: 0 });
    entry.totalMinutes += inc.durationMinutes || 0;
    entry.count += 1;
  }

  /** Cabang yang punya district — satu-satunya yang bisa diplot di peta. */
  function mapped(): Branch[] {
    return branches.filter((b) => b.district);
  }

  /** Jumlah minggu dalam sebulan: 4 minggu untuk Februari non-kabisat, 5 minggu untuk bulan lainnya. */
  function getWeeksInMonth(year: number, monthIndex: number): number {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    return daysInMonth > 28 ? 5 : 4;
  }

  /** Rincian tanggal dan durasi menit untuk suatu minggu dalam bulan */
  function getWeekDetails(
    year: number,
    monthIndex: number,
    weekIndex: number,
  ): {
    startDay: number;
    endDay: number;
    totalMinutes: number;
    dateRangeLabel: string;
  } {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const startDay = weekIndex * 7 + 1;
    const endDay =
      weekIndex === 4 ? daysInMonth : Math.min(daysInMonth, (weekIndex + 1) * 7);
    const dayCount = Math.max(0, endDay - startDay + 1);
    const totalMinutes = dayCount * 1440;
    const dateRangeLabel = `${startDay}–${endDay} tgl`;
    return { startDay, endDay, totalMinutes, dateRangeLabel };
  }

  /**
   * Menghitung SLA mingguan untuk cabang dan bulan tertentu berdasarkan insiden riil.
   * Jika cabang tidak memiliki laporan bulanan, seluruh minggu bernilai null (Tanpa data).
   */
  function weeksForBranchMonth(
    branchName: string,
    year: number,
    monthIndex: number,
  ): WeekSlaInfo[] {
    const numWeeks = getWeeksInMonth(year, monthIndex);
    const hasReport = matrix[year]?.[branchName]?.[monthIndex] != null;
    const siteKey = branchName.trim().toLowerCase();

    const result: WeekSlaInfo[] = [];
    for (let w = 0; w < numWeeks; w++) {
      const details = getWeekDetails(year, monthIndex, w);
      if (!hasReport) {
        result.push({
          value: null,
          downtimeMinutes: 0,
          incidentCount: 0,
          startDay: details.startDay,
          endDay: details.endDay,
          totalMinutes: details.totalMinutes,
          dateRangeLabel: details.dateRangeLabel,
        });
      } else {
        const key = `${year}_${monthIndex}_${w}_${siteKey}`;
        const agg = incidentMap[key];
        const downtime = agg ? agg.totalMinutes : 0;
        const count = agg ? agg.count : 0;
        const value =
          details.totalMinutes > 0
            ? Math.max(
                0,
                Math.min(
                  100,
                  ((details.totalMinutes - downtime) / details.totalMinutes) *
                    100,
                ),
              )
            : 100;
        result.push({
          value,
          downtimeMinutes: downtime,
          incidentCount: count,
          startDay: details.startDay,
          endDay: details.endDay,
          totalMinutes: details.totalMinutes,
          dateRangeLabel: details.dateRangeLabel,
        });
      }
    }
    return result;
  }

  /** Daftar cabang sesuai scope + query — port scopeBranches() sumber. */
  function scopeBranches(scope: string, query = ""): Branch[] {
    let list = branches;
    if (scope && scope !== "Semua cabang") {
      const scopeParts = scope
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const filtered = branches.filter(
        (b) =>
          b.region === scope ||
          scopeParts.includes(b.name.toLowerCase()) ||
          scopeParts.some((part) => b.name.toLowerCase().includes(part)),
      );
      if (filtered.length > 0) {
        list = filtered;
      }
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((b) => b.name.toLowerCase().includes(q));
    return list;
  }

  /**
   * Bulan aktif untuk jendela filter.
   */
  function activeMonths(
    tahun: number,
    bulan: number | MonthRange | null,
    bulanMonths?: number[] | null,
  ): number[] {
    const available = periods.monthsByYear[tahun] ?? [];
    if (bulanMonths && bulanMonths.length > 0) {
      return available.filter((m) => bulanMonths.includes(m));
    }
    if (typeof bulan === "object" && bulan !== null) {
      return monthsInRange(available, bulan);
    }
    if (bulan != null) return available.includes(bulan) ? [bulan] : [];
    return available;
  }

  function cellAt(name: string, year: number, month: number): SlaCell | null {
    return matrix[year]?.[name]?.[month] ?? null;
  }

  function branchValW(
    name: string,
    year: number,
    months: number[],
  ): number | null {
    const yr = matrix[year];
    if (!yr) return null;
    const row = yr[name];
    if (!row) return null;
    const vals = months
      .map((m) => row[m])
      .filter((c): c is SlaCell => c != null)
      .map((c) => c.value);
    return vals.length ? vals.reduce((a, c) => a + c, 0) / vals.length : null;
  }

  function avgSLA(
    year: number,
    months: number[],
    scoped: Branch[],
  ): number | null {
    const bs = scoped.filter((b) => b.district);
    const vals = bs
      .map((b) => branchValW(b.name, year, months))
      .filter((v): v is number => v != null);
    return vals.length ? vals.reduce((a, c) => a + c, 0) / vals.length : null;
  }

  function belowListFor(
    year: number,
    months: number[],
    scoped: Branch[],
  ): { b: Branch; v: number }[] {
    return scoped
      .map((b) => ({ b, v: branchValW(b.name, year, months) }))
      .filter((x): x is { b: Branch; v: number } => x.v != null && x.v < TARGET)
      .sort((a, c) => a.v - c.v);
  }

  function belowUniqueBranches(
    year: number,
    months: number[],
    scoped: Branch[],
  ): Branch[] {
    const yr = matrix[year];
    if (!yr) return [];
    return scoped.filter((b) => {
      const row = yr[b.name];
      if (!row) return false;
      return months.some((m) => {
        const c = row[m];
        return c != null && c.value != null && c.value < TARGET;
      });
    });
  }

  function belowMonthsGrouped(
    year: number,
    months: number[],
    scoped: Branch[],
  ): { month: number; monthName: string; branches: { b: Branch; v: number }[] }[] {
    const yr = matrix[year];
    if (!yr) return [];
    const res: { month: number; monthName: string; branches: { b: Branch; v: number }[] }[] = [];
    for (const m of months) {
      const bList: { b: Branch; v: number }[] = [];
      for (const b of scoped) {
        const c = yr[b.name]?.[m];
        if (c != null && c.value != null && c.value < TARGET) {
          bList.push({ b, v: c.value });
        }
      }
      if (bList.length > 0) {
        bList.sort((a, c) => a.v - c.v);
        res.push({
          month: m,
          monthName: MONTHS[m],
          branches: bList,
        });
      }
    }
    return res;
  }

  function tone(v: number | null): Tone {
    if (v == null) return "gray";
    if (v >= TARGET) return "green";
    if (v >= TARGET - 0.3) return "amber";
    return "red";
  }

  /** Exactly four tones — one per legend entry. No intermediate shades. */
  function cellTone(v: number | null): { bg: string; fg: string } {
    if (v == null) return { bg: "#F6F7F9", fg: "#9CA3AF" };
    if (v >= TARGET) return { bg: "#D1FAE5", fg: "#065F46" };
    if (v >= TARGET - 0.3) return { bg: "#FEF3C7", fg: "#B45309" };
    return { bg: "#FEE2E2", fg: "#B91C1C" };
  }

  return {
    TARGET,
    branches,
    matrix,
    periods,
    incidents,
    mapped,
    getWeeksInMonth,
    getWeekDetails,
    weeksForBranchMonth,
    scopeBranches,
    activeMonths,
    cellAt,
    branchValW,
    avgSLA,
    belowListFor,
    belowUniqueBranches,
    belowMonthsGrouped,
    tone,
    cellTone,
  };
}

export type SlaService = ReturnType<typeof createSlaService>;

export function toneColor(t: Tone): string {
  return {
    green: "#059669",
    amber: "#D97706",
    red: "#DC2626",
    gray: "#9CA3AF",
  }[t];
}
