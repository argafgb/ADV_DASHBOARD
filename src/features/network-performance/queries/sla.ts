import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sql } from "@/lib/db";
import { branchFilter } from "@/lib/network/branch-filter";
import type { BranchAccess } from "@/lib/network/branch-scope";
import type { SlaMatrix } from "../types/network.types";

/**
 * Monthly SLA per branch, pivoted to [year][branch][monthIndex].
 *
 * Recompute rule: where the incidents logged for a branch-month add up to MORE
 * downtime than the month report claims, the reported figure is demonstrably
 * understated and is replaced by one computed from the incidents. Seven
 * branch-months are affected; the sharpest is Cideng 2026-07, which reports
 * 100% while carrying a 562-minute outage.
 *
 * The recomputed value is a lower bound — incident coverage may itself be
 * incomplete — but it is strictly closer to true than a known-false 100%. The
 * source value is carried alongside so the tooltip can show both.
 *
 * Months with no row stay null. They are NOT backfilled to 100.
 */
export async function getSlaMatrix(access: BranchAccess): Promise<SlaMatrix> {
  "use cache";
  cacheLife("hours");
  cacheTag("network-performance");

  const rows = await sql<
    {
      branch: string;
      year: number;
      month: number;
      source_sla: number;
      downtime_minutes: number;
      month_total_minutes: number;
      incident_minutes: number;
    }[]
  >`
    WITH inc AS (
        SELECT branch_id,
               EXTRACT(YEAR  FROM downtime_start)::int AS year,
               EXTRACT(MONTH FROM downtime_start)::int AS month,
               SUM(duration_minutes)::int              AS incident_minutes
          FROM network_performance.network_incidents
         WHERE downtime_start IS NOT NULL
           AND ${branchFilter(access, "branch_id")}
         GROUP BY 1, 2, 3
    )
    SELECT b.display_name                    AS branch,
           r.year,
           r.month,
           r.sla_percentage::float8          AS source_sla,
           r.downtime_minutes,
           r.month_total_minutes,
           COALESCE(i.incident_minutes, 0)   AS incident_minutes
      FROM network_performance.branch_monthly_reports r
      JOIN network_performance.branches b ON b.id = r.branch_id
      LEFT JOIN inc i
             ON i.branch_id = r.branch_id
            AND i.year      = r.year
            AND i.month     = r.month
     WHERE b.is_active AND ${branchFilter(access, "b.id")}
     ORDER BY b.display_name, r.year, r.month
  `;

  const matrix: SlaMatrix = {};

  for (const r of rows) {
    const year = (matrix[r.year] ??= {});
    const row = (year[r.branch] ??= new Array(12).fill(null));

    const understated =
      r.incident_minutes !== r.downtime_minutes && r.month_total_minutes > 0;
    const recomputedValue = understated
      ? ((r.month_total_minutes - r.incident_minutes) / r.month_total_minutes) *
        100
      : null;

    row[r.month - 1] = {
      value: recomputedValue ?? r.source_sla,
      sourceValue: r.source_sla,
      recomputed: understated,
    };
  }

  return matrix;
}
