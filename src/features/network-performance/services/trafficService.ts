import type { TrafficData } from "../queries/traffic";
import type { Branch } from "../types/network.types";
import type { IspService } from "./ispService";
import { monthInRange, type MonthRange } from "@/lib/network/month-range";

export interface TrafficTableRow {
  no: number;
  branch: string;
  /** 12 slots; null where the source has no row for that month */
  prog: (number | null)[];
  avgProg: number | null;
  /** 12 slots; null = no period, [0,0] = period ran but nothing was measured */
  cells: ([number, number] | null)[];
  /** month index -> why that reading is impossible; empty when clean */
  anomalies: Record<number, string>;
  ul: number;
  dl: number;
  contract: number;
  utilPct: number | null;
  measured: boolean;
  warnA: boolean;
  warnB: boolean;
}

export interface TrafficService {
  tableRows(year: number, range?: number | MonthRange | null): TrafficTableRow[];
  /** any branch has a reading in this year */
  hasDataFor(year: number): boolean;
}

const MONTHS_IN_YEAR = 12;
const MIN_RELIABLE_PROGRESS = 20;
const LOW_RATIO_PCT = 20;

const mean = (xs: number[]) =>
  xs.length ? xs.reduce((a, c) => a + c, 0) / xs.length : 0;

/**
 * Traffic table rows, bound to the readings handed down from the server.
 *
 * Two distinctions the source makes that the table must preserve:
 *
 * - **No row vs a zero reading.** 2025 starts in May and 2026 ends in July, so
 *   the missing months never ran; they stay null and render as "·". A month
 *   that ran but measured nothing is [0,0] and renders as "–". Collapsing the
 *   two would claim a branch was measured at 0 Mbps in a month that had no
 *   measurement window at all.
 *
 * - **Impossible vs merely unusual.** Only `is_anomaly` rows are excluded from
 *   the averages — readings past a ceiling nothing is contracted to reach, such
 *   as Manado's 3,357 Mbps. An unusually high but physically possible reading
 *   stays in, because at a branch that normally reads 34 Mbps a one-off 285 may
 *   be its most accurate figure rather than its worst.
 */
export function createTrafficService(
  traffic: TrafficData,
  branches: Branch[],
  isp: IspService,
): TrafficService {
  const rowsFor = (
    year: number,
    range: number | MonthRange | null,
  ): Omit<TrafficTableRow, "no">[] =>
    branches.map((b) => {
      const months = traffic[b.name]?.[year];

      const prog: (number | null)[] = new Array(MONTHS_IN_YEAR).fill(null);
      const cells: ([number, number] | null)[] = new Array(MONTHS_IN_YEAR).fill(
        null,
      );
      const anomalies: Record<number, string> = {};
      const uls: number[] = [];
      const dls: number[] = [];
      const progs: number[] = [];

      months?.forEach((c, mi) => {
        if (!c || !monthInRange(mi, range)) return;
        prog[mi] = c.progress;
        cells[mi] = [c.ul ?? 0, c.dl ?? 0];
        if (c.progress != null) progs.push(c.progress);
        if (c.isAnomaly) {
          anomalies[mi] =
            c.anomalyNote ??
            "Angka ini melampaui batas wajar untuk kapasitas yang tersedia — dikecualikan dari rata-rata dan total.";
          return;
        }
        // Months with no measurement contribute nothing to the average rather
        // than dragging it toward zero.
        if (c.progress != null && c.progress > 0) {
          if (c.ul != null) uls.push(c.ul);
          if (c.dl != null) dls.push(c.dl);
        }
      });

      const avgProg = progs.length ? mean(progs) : null;
      const ul = mean(uls);
      const dl = mean(dls);
      const contract = isp.contractMbps(b.name);
      const utilPct = contract > 0 && dl > 0 ? (dl / contract) * 100 : null;
      const measured = avgProg != null && avgProg > 0;

      return {
        branch: b.name,
        prog,
        avgProg,
        cells,
        anomalies,
        ul,
        dl,
        contract,
        utilPct,
        measured,
        warnA: measured && avgProg < MIN_RELIABLE_PROGRESS,
        warnB: utilPct != null && utilPct < LOW_RATIO_PCT,
      };
    });

  return {
    tableRows: (year, range = null) =>
      rowsFor(year, range)
        // Best-measured first, exactly as the source table was ordered.
        .sort(
          (a, b) =>
            (b.avgProg ?? -1) - (a.avgProg ?? -1) ||
            a.branch.localeCompare(b.branch),
        )
        .map((r, i) => ({ ...r, no: i + 1 })),

    hasDataFor: (year) =>
      branches.some((b) =>
        traffic[b.name]?.[year]?.some(
          (c) => c != null && (c.progress ?? 0) > 0,
        ),
      ),
  };
}
