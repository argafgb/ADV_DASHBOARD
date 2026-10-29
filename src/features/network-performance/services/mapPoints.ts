import type { Branch, DowntimeIncident, Tone } from "../types/network.types";
import type { SlaService } from "./slaService";
import { fmtSla } from "./format";
import { windowLabel } from "./labels";
import type { TipData } from "../context/TooltipLayer";
import { monthInRange, type MonthRange } from "@/lib/network/month-range";

export interface MapPoint {
  district: string;
  tone: Tone;
  dim?: boolean;
  cause?: string;
  tip: TipData;
  /** Set only for downtime points — branch name + the incident ids grouped into this marker. */
  branchName?: string;
  incidentIds?: number[];
}

/**
 * Map point builders, bound to the dataset.
 *
 * Region dimming uses `branch.operationRegion` (R1–R6 / CID) straight from the
 * branch row, replacing the hardcoded islandOf() lookup.
 */
export function createMapPointsService(
  sla: SlaService,
  incidents: DowntimeIncident[],
) {
  const byName = new Map<string, Branch>(sla.branches.map((b) => [b.name, b]));

  /** Titik peta status SLA (overview & SLA by site) — port mapPoints() sumber. */
  function mapPointsAll(
    tahun: number,
    bulan: number | MonthRange | null,
    scope: string,
    mapRegion: string | null,
    bulanMonths?: number[] | null,
  ): MapPoint[] {
    const win = sla.activeMonths(tahun, bulan, bulanMonths);
    const monthsInYear = sla.periods.monthsByYear[tahun] ?? [];
    const partial = bulan == null && (!bulanMonths || bulanMonths.length === 0) && win.length > 0 && win.length < 12;
    const sb = new Set(sla.scopeBranches(scope).map((b) => b.name));

    return sla
      .mapped()
      .filter((b) => sb.has(b.name))
      .map((b) => {
        const v = sla.branchValW(b.name, tahun, win);
        const t = sla.tone(v);
        return {
          district: b.district as string,
          tone: t,
          dim: !!(mapRegion && b.operationRegion !== mapRegion),
          tip: {
            title: b.name,
            primary: "SLA " + (v != null ? v.toFixed(2) + "%" : "—"),
            secondary: partial
              ? "(rata-rata " + windowLabel(bulan, monthsInYear, bulanMonths) + " " + tahun + ")"
              : null,
            meta:
              t === "green"
                ? "capai target"
                : t === "amber"
                  ? "mendekati target"
                  : "di bawah SLA",
            tone: t,
          },
        };
      });
  }

  const sevRank: Record<string, number> = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 0,
  };
  const sevTone = (l: string): Tone =>
    l === "critical" || l === "high"
      ? "red"
      : l === "medium"
        ? "amber"
        : "gray";

  /**
   * Titik peta insiden downtime — satu marker per cabang (bukan per insiden),
   * karena `district` bukan kunci unik per cabang (mis. Jakarta Pusat dipakai
   * 4 cabang aktif sekaligus). Insiden yang tidak cocok filter `dtCause`
   * dikeluarkan dari grup, bukan sekadar diredupkan.
   */
  function mapPointsDowntime(
    dtCause: string | string[] | null,
    scope: string,
    tahun: number,
    bulan: number | MonthRange | null,
    bulanMonths?: number[] | null,
  ): MapPoint[] {
    const sb = new Set(sla.scopeBranches(scope).map((b) => b.name));
    const bySite = new Map<string, DowntimeIncident[]>();
    incidents.forEach((d) => {
      if (!sb.has(d.site)) return;
      // Same period window as the table — a marker for an incident outside the
      // selected month would contradict the rows next to it.
      if (d.year !== tahun) return;
      if (bulanMonths != null ? (d.month == null || !bulanMonths.includes(d.month)) : !monthInRange(d.month, bulan)) return;
      if (dtCause != null) {
        if (Array.isArray(dtCause)) {
          if (dtCause.length > 0 && !dtCause.includes(d.cause)) return;
        } else if (d.cause !== dtCause) {
          return;
        }
      }
      const b = byName.get(d.site);
      if (!b || !b.district) return;
      const list = bySite.get(d.site) || [];
      list.push(d);
      bySite.set(d.site, list);
    });

    return Array.from(bySite.entries()).map(([site, group]): MapPoint => {
      const b = byName.get(site)!;
      const worst = group
        .slice()
        .sort((a, c) => sevRank[c.level] - sevRank[a.level])[0];
      const t = sevTone(worst.level);
      const single = group.length === 1;
      return {
        district: b.district as string,
        branchName: site,
        incidentIds: group.map((d) => d.id),
        tone: t,
        cause: single ? worst.cause : undefined,
        tip: single
          ? {
              title: site,
              primary: "SLA " + fmtSla(worst.sla),
              secondary: "(" + worst.periode + ", durasi " + worst.durasi + ")",
              meta: worst.problem,
              tone: t,
            }
          : {
              title: site,
              primary: group.length + " insiden",
              secondary:
                "(terburuk: " + worst.level + ", " + worst.periode + ")",
              meta: "Klik untuk lihat daftar insiden cabang ini",
              tone: t,
            },
      };
    });
  }

  return { mapPointsAll, mapPointsDowntime };
}

export type MapPointsService = ReturnType<typeof createMapPointsService>;
