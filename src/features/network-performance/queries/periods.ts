import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sql } from "@/lib/db";

/**
 * Which periods actually exist in the data.
 *
 * Everything that used to be hardcoded (`if (tahun === 2026) return [0..4]`,
 * "Jan–Mei", YTD_MONTHS) derives from this. Months come from the rows that
 * exist, NOT from the calendar clock — today can be 3 August while the latest
 * closed report is July, and the UI must never name a month with no data.
 */
export interface Periods {
  /** every year the global filter offers, ascending */
  years: number[];
  /** years with SLA rows — pages 1-3 have nothing to draw outside these */
  slaYears: number[];
  /** SLA year -> 0-indexed month numbers present, ascending */
  monthsByYear: Record<number, number[]>;
  /** traffic year -> 0-indexed month numbers present, ascending */
  trafficMonthsByYear: Record<number, number[]>;
  /** either source -> months present; drives the top-bar month picker */
  allMonthsByYear: Record<number, number[]>;
  /** year -> the network SLA target that applies to it */
  targetsByYear: Record<number, number>;
  /** target for the newest SLA year — the figure the UI reads today */
  target: number;
  /** newest successful ETL audit timestamp, or null when no run is recorded */
  updatedAt: string | null;
}

/** year -> ascending 0-indexed months, from rows of `{year, month}` (1-12). */
function groupMonths(rows: { year: number; month: number }[]) {
  const byYear: Record<number, number[]> = {};
  for (const r of rows) {
    // month is 1-12 in Postgres; the UI indexes MONTHS[] from 0.
    (byYear[r.year] ??= []).push(r.month - 1);
  }
  return byYear;
}

export async function getPeriods(): Promise<Periods> {
  "use cache";
  cacheLife("hours");
  cacheTag("network-performance");

  const [slaRows, trafficRows, reportedTargets, targetView, latestEtlRun] =
    await Promise.all([
      sql<{ year: number; month: number }[]>`
      SELECT DISTINCT year, month
        FROM network_performance.branch_monthly_reports
       ORDER BY year, month
    `,
      sql<{ year: number; month: number }[]>`
      SELECT DISTINCT year, month
        FROM network_performance.branch_traffic_monthly
       ORDER BY year, month
    `,
      // Fallback: the target copied onto each monthly report when it was written.
      sql<{ year: number; target: number }[]>`
      SELECT year, MAX(target_sla_percentage)::float8 AS target
        FROM network_performance.branch_monthly_reports
       GROUP BY year
    `,
      // Checked separately because Postgres resolves table names at parse time —
      // a to_regclass guard inside the query would still fail on a missing
      // relation, so the existence test has to come first.
      sql<{ present: boolean }[]>`
      SELECT to_regclass('network_performance.v_network_sla_target') IS NOT NULL
             AS present
    `,
      sql<{ updated_at: Date | string | null }[]>`
      SELECT MAX(finished_at) AS updated_at
        FROM network_performance.etl_runs
       WHERE status = 'success'
         AND finished_at IS NOT NULL
    `,
    ]);

  // The live target lives in sla_data (service 4, "Network Service") and is
  // loaded into sla_targets. It has to be read from there rather than from the
  // reports: target_sla_percentage is written into each report once and never
  // rewritten, so editing the target at source would never reach the dashboard
  // through that column. Absent the table, everything below degrades to the
  // previous behaviour instead of erroring.
  const liveTargets: Record<number, number> = {};
  if (targetView[0]?.present) {
    const rows = await sql<{ year: number; target_pct: number }[]>`
      SELECT year, target_pct::float8 AS target_pct
        FROM network_performance.v_network_sla_target
    `;
    for (const r of rows) liveTargets[r.year] = r.target_pct;
  }

  const targetsByYear: Record<number, number> = {};
  for (const r of reportedTargets) targetsByYear[r.year] = r.target ?? 99.5;
  // sla_data wins wherever it has an opinion, including for years the reports
  // do not cover.
  Object.assign(targetsByYear, liveTargets);

  const monthsByYear = groupMonths(slaRows);
  const trafficMonthsByYear = groupMonths(trafficRows);
  const slaYears = Object.keys(monthsByYear)
    .map(Number)
    .sort((a, b) => a - b);

  // Traffic reaches back to 2025 while SLA starts at 2026, so neither set
  // alone describes the dashboard. The filter offers the union; pages 1-3 read
  // `slaYears` to say a year is empty rather than rendering blank tiles.
  const allMonthsByYear: Record<number, number[]> = {};
  for (const src of [monthsByYear, trafficMonthsByYear]) {
    for (const [year, months] of Object.entries(src)) {
      const y = Number(year);
      allMonthsByYear[y] = [
        ...new Set([...(allMonthsByYear[y] ?? []), ...months]),
      ].sort((a, b) => a - b);
    }
  }

  return {
    years: Object.keys(allMonthsByYear)
      .map(Number)
      .sort((a, b) => a - b),
    slaYears,
    monthsByYear,
    trafficMonthsByYear,
    allMonthsByYear,
    targetsByYear,
    // The services read a single target. The newest SLA year is the one every
    // KPI is about, so that is the figure exposed — per-year targets are in
    // targetsByYear for when the comparison views need them.
    target: targetsByYear[slaYears[slaYears.length - 1]] ?? 99.5,
    updatedAt: latestEtlRun[0]?.updated_at
      ? new Date(latestEtlRun[0].updated_at).toISOString()
      : null,
  };
}
