import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sql } from "@/lib/db";
import { branchFilter } from "@/lib/network/branch-filter";
import type { BranchAccess } from "@/lib/network/branch-scope";

/**
 * Speed-test readings per branch-month, from `branch_traffic_monthly`.
 *
 * IMPORTANT — this is speed-test data, NOT link utilisation. A speed test
 * saturates the line on purpose and records what it achieved; utilisation is
 * how much of the pipe organic traffic actually consumed, and nothing here
 * measures that. The two invert each other: a low reading means the ISP is
 * underdelivering (chase them), where low utilisation would mean spare
 * headroom (consider downgrading).
 *
 * The UI nonetheless labels this "utilisasi", matching the approved mockup.
 * That is the dashboard owner's decision, taken 2026-08-04 with the above
 * understood — see MEMORY.md §2.3. Keep it in mind before reading any
 * conclusion off these numbers.
 */
export interface TrafficCell {
  /** Mbps, null where the month has no reading */
  ul: number | null;
  dl: number | null;
  /** share of the branch's rooms measured that month, 0-100 */
  progress: number | null;
  /** physically impossible reading — excluded from every average and total */
  isAnomaly: boolean;
  anomalyNote: string | null;
}

/** branch display name -> year -> 12 slots, null where no row exists */
export type TrafficData = Record<string, Record<number, (TrafficCell | null)[]>>;

export async function getTraffic(access: BranchAccess): Promise<TrafficData> {
  "use cache";
  cacheLife("hours");
  cacheTag("network-performance");

  const rows = await sql<
    {
      branch: string;
      year: number;
      month: number;
      ul: number | null;
      dl: number | null;
      progress: number | null;
      is_anomaly: boolean;
      anomaly_note: string | null;
    }[]
  >`
    SELECT b.display_name        AS branch,
           t.year,
           t.month,
           t.avg_ul_mbps::float8 AS ul,
           t.avg_dl_mbps::float8 AS dl,
           t.progress_pct::float8 AS progress,
           t.is_anomaly,
           t.anomaly_note
      FROM network_performance.branch_traffic_monthly t
      JOIN network_performance.branches b ON b.id = t.branch_id
     WHERE b.is_active AND ${branchFilter(access, "b.id")}
     ORDER BY b.display_name, t.year, t.month
  `;

  const data: TrafficData = {};
  for (const r of rows) {
    const byYear = (data[r.branch] ??= {});
    // month is 1-12 in Postgres; the UI indexes its month arrays from 0.
    (byYear[r.year] ??= new Array(12).fill(null))[r.month - 1] = {
      ul: r.ul,
      dl: r.dl,
      progress: r.progress,
      isAnomaly: r.is_anomaly,
      anomalyNote: r.anomaly_note,
    };
  }
  return data;
}
