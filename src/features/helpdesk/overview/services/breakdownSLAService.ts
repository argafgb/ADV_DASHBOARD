import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import { resolveDatasetAccess, DATASET_CAPS, scopeKey, type DataScope } from "@/lib/access/data-scope";
import { departmentCondition, branchCondition, type AllowedDatasetAccess } from "@/lib/access/scope-sql";
import {
  CombinedSLAMetricsData,
  SLAMetricsByDepartment,
  SlaMetric,
} from "../types/slaMetric.types";

type NumericValue = number | string | null | undefined;

interface DepartmentSlaRow {
  pc_sla_resolved_dct: NumericValue;
  pc_sla_response_dct: NumericValue;
  pc_sla_resolved_it: NumericValue;
  pc_sla_response_it: NumericValue;
  target: NumericValue;
}

const parseNum = (val: NumericValue): number => {
  if (val === undefined || val === null) return 0;
  const n = typeof val === "number" ? val : parseFloat(val);
  return isNaN(n) ? 0 : n;
};

async function getCombinedSLADataRaw(
  yearFilter: string = "2026",
  monthFilter: string = "ALL",
  access: AllowedDatasetAccess,
): Promise<CombinedSLAMetricsData> {
  const yearNum = parseInt(yearFilter) || 2026;

  const { months, isAll, endMonth } = parseMonthFilter(monthFilter);

  let metrics: SLAMetricsByDepartment;
  let slaError = false;

  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;

  try {
    // Jika branch dibatasi, data SLA bulanan dilewati (persentase dihitung dari hitungan tiket datachat)
    const data = access.branches !== null ? [] : await sql<DepartmentSlaRow[]>`
      WITH src AS (
          SELECT
              year,
              month,
              pc_sla_resolved_dct,
              pc_sla_response_dct,
              pc_sla_resolved_it,
              pc_sla_response_it,
              0.999 AS target
          FROM helpdesk.helpdesk_sla
          WHERE year = ${yearNum}::int
            AND ${monthCondition}
      )
      SELECT
          ROUND((AVG(pc_sla_resolved_dct) * 100)::numeric, 2) AS pc_sla_resolved_dct,
          ROUND((AVG(pc_sla_response_dct) * 100)::numeric, 2) AS pc_sla_response_dct,
          ROUND((AVG(pc_sla_resolved_it) * 100)::numeric, 2) AS pc_sla_resolved_it,
          ROUND((AVG(pc_sla_response_it) * 100)::numeric, 2) AS pc_sla_response_it,
          ROUND((MAX(target) * 100)::numeric, 2) AS target
      FROM src;
    `;

    if (data && data.length > 0 && data[0].pc_sla_resolved_dct !== null) {
      metrics = {
        year: yearNum,
        month: isAll ? 7 : endMonth,
        pc_sla_resolved_dct: parseNum(data[0].pc_sla_resolved_dct) / 100,
        pc_sla_response_dct: parseNum(data[0].pc_sla_response_dct) / 100,
        pc_sla_resolved_it: parseNum(data[0].pc_sla_resolved_it) / 100,
        pc_sla_response_it: parseNum(data[0].pc_sla_response_it) / 100,
        target: parseNum(data[0].target || 99.9) / 100,
      };
    } else {
      metrics = {
        year: yearNum,
        month: isAll ? 7 : endMonth,
        pc_sla_resolved_dct: 0,
        pc_sla_response_dct: 0,
        pc_sla_resolved_it: 0,
        pc_sla_response_it: 0,
        target: 0.999,
      };
    }
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch helpdesk_sla percentages:",
      err,
    );
    slaError = true;
    metrics = {
      year: yearNum,
      month: isAll ? 7 : endMonth,
      pc_sla_resolved_dct: 0,
      pc_sla_response_dct: 0,
      pc_sla_resolved_it: 0,
      pc_sla_response_it: 0,
      target: 0.999,
    };
  }

  const targetVal = metrics.target || 0.999;

  const dctResolve: SlaMetric = {
    percentage: metrics.pc_sla_resolved_dct,
    achieved: 0,
    missed: 0,
    ok: metrics.pc_sla_resolved_dct >= targetVal,
    error: slaError,
  };
  const dctResponse: SlaMetric = {
    percentage: metrics.pc_sla_response_dct,
    achieved: 0,
    missed: 0,
    ok: metrics.pc_sla_response_dct >= targetVal,
    error: slaError,
  };
  const itResolve: SlaMetric = {
    percentage: metrics.pc_sla_resolved_it,
    achieved: 0,
    missed: 0,
    ok: metrics.pc_sla_resolved_it >= targetVal,
    error: slaError,
  };
  const itResponse: SlaMetric = {
    percentage: metrics.pc_sla_response_it,
    achieved: 0,
    missed: 0,
    ok: metrics.pc_sla_response_it >= targetVal,
    error: slaError,
  };

  let datachatError = false;
  try {
    const datachatDateFilter = isAll
      ? sql`B.year = ${yearNum}`
      : sql`B.year = ${yearNum} AND B.month IN ${sql(months)}`;

    interface TicketStatsRow {
      department_name: string;
      resolve_achieved: number;
      resolve_missed: number;
      resolve_missed_tickets: string | null;
      response_achieved: number;
      response_missed: number;
      response_missed_tickets: string | null;
    }

    const ticketStats = await sql<TicketStatsRow[]>`
      SELECT
        B.department_name,
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
      GROUP BY B.department_name
    `;

    if (ticketStats && ticketStats.length > 0) {
      const dctRow = ticketStats.find(
        (r) => r.department_name === "DCT Support",
      );
      const itRow = ticketStats.find((r) => r.department_name === "IT Support");

      if (dctRow) {
        dctResolve.achieved = dctRow.resolve_achieved;
        dctResolve.missed = dctRow.resolve_missed;
        dctResolve.missedTickets = dctRow.resolve_missed_tickets || undefined;

        const totalDctResolve = dctResolve.achieved + dctResolve.missed;
        if (totalDctResolve > 0) {
          dctResolve.percentage = dctResolve.achieved / totalDctResolve;
          dctResolve.ok = dctResolve.percentage >= targetVal;
        }

        dctResponse.achieved = dctRow.response_achieved;
        dctResponse.missed = dctRow.response_missed;
        dctResponse.missedTickets = dctRow.response_missed_tickets || undefined;

        const totalDctResponse = dctResponse.achieved + dctResponse.missed;
        if (totalDctResponse > 0) {
          dctResponse.percentage = dctResponse.achieved / totalDctResponse;
          dctResponse.ok = dctResponse.percentage >= targetVal;
        }
      }

      if (itRow) {
        itResolve.achieved = itRow.resolve_achieved;
        itResolve.missed = itRow.resolve_missed;
        itResolve.missedTickets = itRow.resolve_missed_tickets || undefined;

        const totalItResolve = itResolve.achieved + itResolve.missed;
        if (totalItResolve > 0) {
          itResolve.percentage = itResolve.achieved / totalItResolve;
          itResolve.ok = itResolve.percentage >= targetVal;
        }

        itResponse.achieved = itRow.response_achieved;
        itResponse.missed = itRow.response_missed;
        itResponse.missedTickets = itRow.response_missed_tickets || undefined;

        const totalItResponse = itResponse.achieved + itResponse.missed;
        if (totalItResponse > 0) {
          itResponse.percentage = itResponse.achieved / totalItResponse;
          itResponse.ok = itResponse.percentage >= targetVal;
        }
      }
    }
  } catch (err) {
    console.warn(
      "[Database Query] Failed to fetch helpdesk_datachat ticket statistics:",
      err,
    );
    datachatError = true;
  }

  if (slaError || datachatError) {
    dctResolve.error = true;
    dctResponse.error = true;
    itResolve.error = true;
    itResponse.error = true;
  }

  const aggregateServerSide = (a: SlaMetric, b: SlaMetric): SlaMetric => {
    const totalTickets = a.achieved + a.missed + b.achieved + b.missed;
    const percentage =
      totalTickets > 0
        ? (a.achieved + b.achieved) / totalTickets
        : (Number(a.percentage) + Number(b.percentage)) / 2;

    return {
      percentage,
      achieved: a.achieved + b.achieved,
      missed: a.missed + b.missed,
      missedTickets:
        [a.missedTickets, b.missedTickets].filter(Boolean).join(", ") ||
        undefined,
      ok: percentage >= (metrics.target || 0.999),
      error: a.error || b.error,
    };
  };

  return {
    metrics,
    dctResolve,
    dctResponse,
    itResolve,
    itResponse,
    allResolve: aggregateServerSide(dctResolve, itResolve),
    allResponse: aggregateServerSide(dctResponse, itResponse),
  };
}

export async function getCombinedSLAData(
  yearFilter: string = "2026",
  monthFilter: string = "ALL",
  scope: DataScope,
): Promise<CombinedSLAMetricsData> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat);
  if (access.kind === "deny") {
    const emptyMetric = { percentage: 0, achieved: 0, missed: 0, ok: false };
    return {
      metrics: {
        year: parseInt(yearFilter) || 2026,
        month: 1,
        pc_sla_resolved_dct: 0,
        pc_sla_response_dct: 0,
        pc_sla_resolved_it: 0,
        pc_sla_response_it: 0,
        target: 0.999,
      },
      dctResolve: emptyMetric,
      dctResponse: emptyMetric,
      itResolve: emptyMetric,
      itResponse: emptyMetric,
      allResolve: emptyMetric,
      allResponse: emptyMetric,
    };
  }

  return unstable_cache(
    async () => getCombinedSLADataRaw(yearFilter, monthFilter, access),
    [
      "overview-combined-sla-data-v3",
      yearFilter,
      monthFilter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["overview-sla-v2"] },
  )();
}
