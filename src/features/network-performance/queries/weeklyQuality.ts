import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sql } from "@/lib/db";
import { branchFilter } from "@/lib/network/branch-filter";
import type { BranchAccess } from "@/lib/network/branch-scope";
import type { WeeklyQualityRecord } from "../types/network.types";

export async function getWeeklyQualityRecords(
  access: BranchAccess,
): Promise<WeeklyQualityRecord[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("network-performance");

  const rows = await sql<{
    id: number;
    branch_name: string;
    year: number;
    month: number;
    period_name: string | null;
    week_name: string | null;
    week_number: number | null;
    date_range_label: string | null;
    sla_uptime: number | null;
    sla_latency_ms: number | null;
    jitter: string | null;
    quality_good: number | null;
    quality_warning: number | null;
    quality_bad: number | null;
    quality_critical: number | null;
    notes: string | null;
    infra_check_result: string | null;
    pic_admin: string | null;
    pic_infra: string | null;
  }[]>`
    SELECT 
      w.id,
      COALESCE(b.display_name, b.name, w.branch_raw) AS branch_name,
      w.year,
      w.month,
      w.period_name,
      w.week_name,
      w.week_number,
      w.date_range_label,
      w.sla_uptime::float8 AS sla_uptime,
      w.sla_latency_ms::float8 AS sla_latency_ms,
      w.jitter,
      w.quality_good::float8 AS quality_good,
      w.quality_warning::float8 AS quality_warning,
      w.quality_bad::float8 AS quality_bad,
      w.quality_critical::float8 AS quality_critical,
      w.notes,
      w.infra_check_result,
      w.pic_admin,
      w.pic_infra
     FROM network_performance.branch_weekly_quality_sla w
     LEFT JOIN network_performance.branches b ON b.id = w.branch_id
    WHERE ${branchFilter(access, "w.branch_id")}
    ORDER BY w.year DESC, w.month DESC, w.week_number ASC, branch_name ASC
  `;

  return rows.map((r) => ({
    id: r.id,
    branchName: r.branch_name,
    year: r.year,
    month: r.month,
    periodName: r.period_name,
    weekName: r.week_name,
    weekNumber: r.week_number,
    dateRangeLabel: r.date_range_label,
    slaUptime: r.sla_uptime,
    slaLatencyMs: r.sla_latency_ms,
    jitter: r.jitter,
    qualityGood: r.quality_good,
    qualityWarning: r.quality_warning,
    qualityBad: r.quality_bad,
    qualityCritical: r.quality_critical,
    notes: r.notes,
    infraCheckResult: r.infra_check_result,
    picAdmin: r.pic_admin,
    picInfra: r.pic_infra,
  }));
}
