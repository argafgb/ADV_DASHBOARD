import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import { resolveDatasetAccess, DATASET_CAPS, scopeKey, type DataScope } from "@/lib/access/data-scope";
import { departmentCondition, branchCondition, type AllowedDatasetAccess } from "@/lib/access/scope-sql";
import {
  SLAMetricsAllDepartment,
  SlaMetric,
  CombinedOverallSLAData,
} from "../types/slaMetric.types";

type NumericValue = number | string | null | undefined;

interface OverallSlaRow {
  pc_sla_resolved: NumericValue;
  pc_sla_response: NumericValue;
  target: NumericValue;
}

const parseNum = (val: NumericValue): number => {
  if (val === undefined || val === null) return 0;
  const n = typeof val === "number" ? val : parseFloat(val);
  return isNaN(n) ? 0 : n;
};

async function getOverallSLADataRaw(
  yearFilter: string = "2026",
  monthFilter: string = "ALL",
  access: AllowedDatasetAccess,
): Promise<CombinedOverallSLAData> {
  const start = performance.now();
  const yearNum = parseInt(yearFilter) || 2026;

  const { months, isAll, endMonth } = parseMonthFilter(monthFilter);

  let metrics: SLAMetricsAllDepartment;
  let slaError = false;

  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;

  try {
    const data = access.branches !== null ? [] : await sql<OverallSlaRow[]>`
      WITH src AS (
          SELECT
              year,
              month,
              pc_sla_resolved,
              pc_sla_response,
              0.999 AS target
          FROM helpdesk.helpdesk_sla
          WHERE year = ${yearNum}::int
            AND ${monthCondition}
      )
      SELECT
          ROUND((AVG(pc_sla_resolved) * 100)::numeric, 2) AS pc_sla_resolved,
          ROUND((AVG(pc_sla_response) * 100)::numeric, 2) AS pc_sla_response,
          ROUND((MAX(target) * 100)::numeric, 2) AS target
      FROM src;
    `;

    if (data && data.length > 0 && data[0].pc_sla_resolved !== null) {
      metrics = {
        year: yearNum,
        month: isAll ? 7 : endMonth,
        pc_sla_resolved: parseNum(data[0].pc_sla_resolved) / 100,
        pc_sla_response: parseNum(data[0].pc_sla_response) / 100,
        target: parseNum(data[0].target || 99.9) / 100,
      };
    } else {
      metrics = {
        year: yearNum,
        month: isAll ? 7 : endMonth,
        pc_sla_resolved: 0,
        pc_sla_response: 0,
        target: 0.999,
      };
    }
  } catch (err) {
    console.warn(
      "[Database Query] Failed to fetch helpdesk_sla overall percentages:",
      err,
    );
    slaError = true;
    metrics = {
      year: yearNum,
      month: isAll ? 7 : endMonth,
      pc_sla_resolved: 0,
      pc_sla_response: 0,
      target: 0.999,
    };
  }

  const targetVal = metrics.target || 0.999;

  const resolve: SlaMetric = {
    percentage: metrics.pc_sla_resolved,
    achieved: 0,
    missed: 0,
    ok: metrics.pc_sla_resolved >= targetVal,
    error: slaError,
  };
  const response: SlaMetric = {
    percentage: metrics.pc_sla_response,
    achieved: 0,
    missed: 0,
    ok: metrics.pc_sla_response >= targetVal,
    error: slaError,
  };

  let datachatError = false;
  try {
    const datachatDateFilter = isAll
      ? sql`B.year = ${yearNum}`
      : sql`B.year = ${yearNum} AND B.month IN ${sql(months)}`;

    interface TicketStatsRow {
      resolve_achieved: number;
      resolve_missed: number;
      resolve_missed_tickets: string | null;
      response_achieved: number;
      response_missed: number;
      response_missed_tickets: string | null;
    }

    const ticketStats = await sql<TicketStatsRow[]>`
      SELECT
        COUNT(*) FILTER (WHERE B.sla_resolve = 'Sesuai SLA')::int AS resolve_achieved,
        COUNT(*) FILTER (WHERE B.sla_resolve = 'Tidak Sesuai SLA')::int AS resolve_missed,
        STRING_AGG(B.ticket_no, ', ') FILTER (WHERE B.sla_resolve = 'Tidak Sesuai SLA') AS resolve_missed_tickets,

        COUNT(*) FILTER (WHERE B.sla_fetch = 'Sesuai SLA')::int AS response_achieved,
        COUNT(*) FILTER (WHERE B.sla_fetch = 'Tidak Sesuai SLA')::int AS response_missed,
        STRING_AGG(B.ticket_no, ', ') FILTER (WHERE B.sla_fetch = 'Tidak Sesuai SLA') AS response_missed_tickets
      FROM helpdesk.helpdesk_datachat B
      WHERE B.status_ticket IN ('2','3')
        AND ${departmentCondition(access, sql`B.department_name`)}
        AND ${branchCondition(access, sql`B.branch_name`)}
        AND ${datachatDateFilter}
    `;

    if (ticketStats && ticketStats.length > 0) {
      const row = ticketStats[0];
      resolve.achieved = row.resolve_achieved;
      resolve.missed = row.resolve_missed;
      resolve.missedTickets = row.resolve_missed_tickets || undefined;

      const totalResolve = resolve.achieved + resolve.missed;
      if (totalResolve > 0) {
        resolve.percentage = resolve.achieved / totalResolve;
        resolve.ok = resolve.percentage >= targetVal;
      }

      response.achieved = row.response_achieved;
      response.missed = row.response_missed;
      response.missedTickets = row.response_missed_tickets || undefined;

      const totalResponse = response.achieved + response.missed;
      if (totalResponse > 0) {
        response.percentage = response.achieved / totalResponse;
        response.ok = response.percentage >= targetVal;
      }
    }
  } catch (err) {
    console.warn(
      "[Database Query] Failed to fetch overall ticket statistics:",
      err,
    );
    datachatError = true;
  }

  if (slaError || datachatError) {
    resolve.error = true;
    response.error = true;
  }

  const duration = performance.now() - start;
  console.log(
    `[Database Query] getOverallSLAData completed in ${duration.toFixed(2)}ms`,
  );

  return {
    metrics,
    resolve,
    response,
  };
}

export async function getOverallSLAData(
  yearFilter: string = "2026",
  monthFilter: string = "ALL",
  scope: DataScope,
): Promise<CombinedOverallSLAData> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat);
  if (access.kind === "deny") {
    const emptyMetric = { percentage: 0, achieved: 0, missed: 0, ok: false };
    return {
      metrics: { year: parseInt(yearFilter) || 2026, month: 1, pc_sla_resolved: 0, pc_sla_response: 0, target: 0.999 },
      resolve: emptyMetric,
      response: emptyMetric,
    };
  }

  return unstable_cache(
    async () => getOverallSLADataRaw(yearFilter, monthFilter, access),
    ["overview-overall-sla-data-v3", yearFilter, monthFilter, scopeKey(scope), access.departments.join(",")],
    { revalidate: 300, tags: ["overview-sla-v2"] },
  )();
}
