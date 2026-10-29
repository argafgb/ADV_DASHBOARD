import type { RegionGroup } from "../types/network.types";
import type { SlaService } from "./slaService";
import type { MonthRange } from "@/lib/network/month-range";

export interface RegionRow {
  name: string;
  area: string;
  count: number;
  avg: string;
  below: number;
  branches: string[];
}

/**
 * Ringkasan per region — port regionBreakdown di renderVals() sumber.
 *
 * Groups come from branches.operation_region (R1–R6 + CID) instead of the
 * hardcoded ISLANDS map, which was stale and silently dropped any branch it
 * did not list.
 */
export function createRegionService(sla: SlaService, groups: RegionGroup[]) {
  function regionBreakdown(
    tahun: number,
    bulan: number | MonthRange | null,
    bulanMonths?: number[] | null,
  ): RegionRow[] {
    const win = sla.activeMonths(tahun, bulan, bulanMonths);
    return groups.map((g) => {
      const vals = g.branches
        .map((n) => sla.branchValW(n, tahun, win))
        .filter((v): v is number => v != null);
      const avg = vals.length
        ? vals.reduce((a, c) => a + c, 0) / vals.length
        : null;
      const below = g.branches.filter((n) => {
        const row = sla.matrix[tahun]?.[n];
        if (!row) return false;
        return win.some((m) => {
          const c = row[m];
          return c != null && c.value != null && c.value < sla.TARGET;
        });

      }).length;
      return {
        name: g.name,
        area: g.area,
        count: g.branches.length,
        avg: avg != null ? avg.toFixed(2) + "%" : "—",
        below,
        branches: g.branches,
      };
    });
  }

  return { regionBreakdown };
}

export type RegionService = ReturnType<typeof createRegionService>;
