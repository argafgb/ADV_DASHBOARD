import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sql } from "@/lib/db";
import { branchFilter } from "@/lib/network/branch-filter";
import type { BranchAccess } from "@/lib/network/branch-scope";
import { MONTHS } from "../data/constants";
import { fmtDur } from "../services/format";
import type { DowntimeIncident } from "../types/network.types";

/**
 * Network incidents for the Downtime page.
 *
 * `sla` is the branch-month SLA the incident falls in — same figure the matrix
 * shows, including the recompute in queries/sla.ts — so the table and the
 * heatmap can never disagree. Incidents on branches with no monthly report
 * (Tanah Abang 5, the retired Ampasit-Cideng) have no SLA and render "—".
 *
 * `verified` marks incidents that are embedded in their branch's monthly
 * report, i.e. the SLA rollup already accounts for them. Incidents present
 * only in the records collection are not reflected in the reported SLA.
 */
export async function getIncidents(
  access: BranchAccess,
): Promise<DowntimeIncident[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("network-performance");

  const rows = await sql<
    {
      id: number;
      site: string;
      year: number | null;
      month: number | null;
      sla: number | null;
      duration_minutes: number;
      problem: string | null;
      impact: string | null;
      solution: string | null;
      downtime_start: Date | null;
      uptime_end: Date | null;
      level: string | null;
      cause: string | null;
      cause_code: string | null;
      verified: boolean;
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
    SELECT n.id,
           b.display_name                              AS site,
           EXTRACT(YEAR  FROM n.downtime_start)::int   AS year,
           EXTRACT(MONTH FROM n.downtime_start)::int   AS month,
           CASE
             WHEN r.id IS NULL THEN NULL
             WHEN i.incident_minutes != r.downtime_minutes AND r.month_total_minutes > 0
               THEN ((r.month_total_minutes - i.incident_minutes)::float8
                     / r.month_total_minutes) * 100
             ELSE r.sla_percentage::float8
           END                                         AS sla,
           n.duration_minutes,
           n.cause_clean                               AS problem,
           n.impact_clean                              AS impact,
           n.solution_clean                            AS solution,
           n.downtime_start,
           n.uptime_end,
           n.severity                                  AS level,
           c.name_id                                   AS cause,
           c.code                                      AS cause_code,
           (n.monthly_report_id IS NOT NULL)           AS verified
      FROM network_performance.network_incidents n
      JOIN network_performance.branches b ON b.id = n.branch_id
      LEFT JOIN network_performance.incident_categories c ON c.id = n.category_id
      LEFT JOIN network_performance.branch_monthly_reports r
             ON r.branch_id = n.branch_id
            AND r.year      = EXTRACT(YEAR  FROM n.downtime_start)::int
            AND r.month     = EXTRACT(MONTH FROM n.downtime_start)::int
      LEFT JOIN inc i
             ON i.branch_id = n.branch_id
            AND i.year      = EXTRACT(YEAR  FROM n.downtime_start)::int
            AND i.month     = EXTRACT(MONTH FROM n.downtime_start)::int
     WHERE ${branchFilter(access, "b.id")}
     ORDER BY n.downtime_start DESC NULLS LAST
  `;

  return rows.map((r) => ({
    id: r.id,
    site: r.site,
    year: r.year,
    // Postgres EXTRACT gives 1-12; every filter and MONTHS[] index in the UI is
    // 0-based, so convert once here rather than at each call site.
    month: r.month != null ? r.month - 1 : null,
    periode:
      r.month != null && r.year != null
        ? MONTHS[r.month - 1] + "-" + String(r.year).slice(2)
        : "—",
    sla: r.sla != null ? r.sla.toFixed(2) + "%" : "—",
    durasi: fmtDur(r.duration_minutes),
    durationMinutes: r.duration_minutes,
    problem: r.problem ?? "—",
    impact: r.impact,
    solution: r.solution,
    downtimeStart: r.downtime_start ? r.downtime_start.toISOString() : null,
    uptimeEnd: r.uptime_end ? r.uptime_end.toISOString() : null,
    level: (r.level ?? "low") as DowntimeIncident["level"],
    cause: r.cause ?? "Lainnya",
    causeCode: r.cause_code ?? "OTHER",
    verified: r.verified,
  }));
}
