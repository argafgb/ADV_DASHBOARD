import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { resolveDatasetAccess, DATASET_CAPS, scopeKey, type DataScope } from "@/lib/access/data-scope";
import { departmentCondition, branchCondition, type AllowedDatasetAccess } from "@/lib/access/scope-sql";
import { parseMonthFilter as parseMonthFilterLib } from "@/lib/filter-utils";
import type {
  SlaMetricSummary,
  SlaPerformanceData,
  SlaPerformanceFilter,
  SlaTrendComparison,
} from "../types/slaPerformance.types";
import { getDispatcherAndReopenStats } from "./dispatcherTicketService";
import { getSlaTrendData } from "./slaTrendService";

const TARGET_SLA = 0.999;

const parseNum = (val: unknown): number => {
  if (val === undefined || val === null) return 0;
  const n = typeof val === "number" ? val : Number.parseFloat(String(val));
  return Number.isNaN(n) ? 0 : n;
};

const clampMonth = (month: number) => {
  if (month < 1) return 1;
  if (month > 12) return 12;
  return month;
};

const monthNameMap: Record<string, number> = {
  jan: 1,
  january: 1,
  januari: 1,
  feb: 2,
  february: 2,
  februari: 2,
  mar: 3,
  march: 3,
  maret: 3,
  apr: 4,
  april: 4,
  may: 5,
  mei: 5,
  jun: 6,
  june: 6,
  juni: 6,
  jul: 7,
  july: 7,
  juli: 7,
  aug: 8,
  agustus: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  okt: 10,
  october: 10,
  oktober: 10,
  nov: 11,
  november: 11,
  dec: 12,
  des: 12,
  december: 12,
  desember: 12,
};

function parseMonthToken(token: string): number | null {
  const clean = token.trim().toLowerCase();
  if (!clean) return null;

  const asNumber = Number.parseInt(clean, 10);
  if (!Number.isNaN(asNumber) && asNumber >= 1 && asNumber <= 12) {
    return asNumber;
  }

  return monthNameMap[clean] ?? null;
}

function parseMonthFilter(monthFilter = "ALL"): number[] | null {
  const clean = monthFilter.trim();
  if (!clean || clean.toUpperCase() === "ALL") return null;

  const normalized = clean.replace(/\s+/g, "").toLowerCase();

  const rangeParts = normalized.split(/[-–—]/);
  if (rangeParts.length === 2) {
    const start = parseMonthToken(rangeParts[0]);
    const end = parseMonthToken(rangeParts[1]);

    if (start && end) {
      const safeStart = clampMonth(Math.min(start, end));
      const safeEnd = clampMonth(Math.max(start, end));

      return Array.from(
        { length: safeEnd - safeStart + 1 },
        (_, index) => safeStart + index,
      );
    }
  }

  const commaParts = normalized.split(",");
  if (commaParts.length > 1) {
    const months = commaParts
      .map(parseMonthToken)
      .filter((month): month is number => Boolean(month));

    return months.length > 0 ? [...new Set(months)] : null;
  }

  const singleMonth = parseMonthToken(normalized);
  return singleMonth ? [singleMonth] : null;
}

function normalizeDept(deptFilter = "ALL") {
  const clean = deptFilter.trim().toLowerCase();

  if (
    clean === "it" ||
    clean === "it support" ||
    clean.includes("it support")
  ) {
    return "IT Support" as const;
  }

  if (
    clean === "dct" ||
    clean === "dct support" ||
    clean.includes("dct support")
  ) {
    return "DCT Support" as const;
  }

  return "ALL" as const;
}

function getDeptKey(dept: ReturnType<typeof normalizeDept>) {
  if (dept === "IT Support") return "IT";
  if (dept === "DCT Support") return "DCT";
  return "ALL";
}

function buildEmptyMetric(): SlaMetricSummary {
  return {
    percentage: 0,
    target: TARGET_SLA,
    achieved: 0,
    missed: 0,
  };
}

interface SlaPercentageRow {
  problem_resolve_percentage: number | string | null;
  response_time_percentage: number | string | null;
}

interface TicketStatsRow {
  resolve_achieved: number | string | null;
  resolve_missed: number | string | null;
  resolve_missed_tickets: string | null;
  response_achieved: number | string | null;
  response_missed: number | string | null;
  response_missed_tickets: string | null;
}

async function getSlaPerformanceDataRaw(
  {
    year = "2026",
    month = "ALL",
    dept = "ALL",
  }: SlaPerformanceFilter,
  access: AllowedDatasetAccess,
  scope: DataScope,
): Promise<SlaPerformanceData> {
  const start = performance.now();

  const yearNum = Number.parseInt(year, 10) || 2026;
  const selectedMonths = parseMonthFilter(month);
  const activeDept = normalizeDept(dept);
  const resolvedDeptKey =
    access.departments.length === 1
      ? access.departments[0] === "IT Support"
        ? "IT"
        : "DCT"
      : getDeptKey(activeDept);
  const deptKey = resolvedDeptKey;

  const problemResolve = buildEmptyMetric();
  const responseTime = buildEmptyMetric();

  const slaMonthCondition =
    selectedMonths && selectedMonths.length > 0
      ? sql`month IN ${sql(selectedMonths)}`
      : sql`TRUE`;

  const datachatMonthCondition =
    selectedMonths && selectedMonths.length > 0
      ? sql`B.month IN ${sql(selectedMonths)}`
      : sql`TRUE`;

  const trendEndMonth =
    selectedMonths && selectedMonths.length > 0
      ? Math.max(...selectedMonths)
      : 12;

  const datachatDeptCondition = departmentCondition(access, sql`B.department_name`);
  const datachatBranchCondition = branchCondition(access, sql`B.branch_name`);

  // 1. Fetch resolve & response percentage metrics from database
  try {
    const rows = access.branches !== null ? [] : await sql<SlaPercentageRow[]>`
      SELECT
        ROUND(
          (
            AVG(
              CASE
                WHEN ${deptKey} = 'IT' THEN pc_sla_resolved_it
                WHEN ${deptKey} = 'DCT' THEN pc_sla_resolved_dct
                ELSE pc_sla_resolved
              END
            ) * 100
          )::numeric,
          2
        ) AS problem_resolve_percentage,

        ROUND(
          (
            AVG(
              CASE
                WHEN ${deptKey} = 'IT' THEN pc_sla_response_it
                WHEN ${deptKey} = 'DCT' THEN pc_sla_response_dct
                ELSE pc_sla_response
              END
            ) * 100
          )::numeric,
          2
        ) AS response_time_percentage
      FROM helpdesk.helpdesk_sla
      WHERE year = ${yearNum}::int
        AND ${slaMonthCondition};
    `;

    const row = rows[0];
    problemResolve.percentage = parseNum(row?.problem_resolve_percentage) / 100;
    responseTime.percentage = parseNum(row?.response_time_percentage) / 100;
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch SLA performance percentage:",
      err,
    );
  }

  // 2. Fetch ticket counts for resolve & response
  try {
    const rows = await sql<TicketStatsRow[]>`
      SELECT
        COUNT(*) FILTER (
          WHERE sla_resolve = 'Sesuai SLA'
        )::int AS resolve_achieved,

        COUNT(*) FILTER (
          WHERE sla_resolve = 'Tidak Sesuai SLA'
        )::int AS resolve_missed,

        STRING_AGG(ticket_no, ', ') FILTER (
          WHERE sla_resolve = 'Tidak Sesuai SLA'
        ) AS resolve_missed_tickets,

        COUNT(*) FILTER (
          WHERE sla_fetch = 'Sesuai SLA'
        )::int AS response_achieved,

        COUNT(*) FILTER (
          WHERE sla_fetch = 'Tidak Sesuai SLA'
        )::int AS response_missed,

        STRING_AGG(ticket_no, ', ') FILTER (
          WHERE sla_fetch = 'Tidak Sesuai SLA'
        ) AS response_missed_tickets
      FROM helpdesk.helpdesk_datachat B
      WHERE B.status_ticket IN ('2', '3')
        AND B.year = ${yearNum}::int
        AND ${datachatMonthCondition}
        AND ${datachatDeptCondition}
        AND ${datachatBranchCondition};
    `;

    const row = rows[0];
    problemResolve.achieved = parseNum(row?.resolve_achieved);
    problemResolve.missed = parseNum(row?.resolve_missed);
    problemResolve.missedTickets = row?.resolve_missed_tickets ?? undefined;

    responseTime.achieved = parseNum(row?.response_achieved);
    responseTime.missed = parseNum(row?.response_missed);
    responseTime.missedTickets = row?.response_missed_tickets ?? undefined;
  } catch (err) {
    console.warn(
      "[Database Query] Failed to fetch SLA performance ticket stats:",
      err,
    );
  }

  // 3. Delegate Dispatcher & Reopened ticket counts to dispatcherTicketService
  const dispatcherReopenData = await getDispatcherAndReopenStats(
    {
      year,
      month,
      dept,
    },
    scope,
  );

  // 4. Delegate SLA Trend Monthly calculation to slaTrendService
  const trend = await getSlaTrendData({
    yearNum,
    trendEndMonth,
    deptKey,
  });

  const duration = performance.now() - start;
  console.log(
    `[Database Query] getSlaPerformanceData completed in ${duration.toFixed(2)}ms`,
  );

  return {
    problemResolve,
    responseTime,
    avgDispatcherSeconds: dispatcherReopenData.avgDispatcherSeconds,
    reopenedTickets: dispatcherReopenData.reopenedTickets,
    totalTickets: dispatcherReopenData.totalTickets,
    trend,
    avgDispatchFormatted: dispatcherReopenData.avgDispatchFormatted,
    reopenPercentage: dispatcherReopenData.reopenPercentage,
  };
}

export async function getSlaPerformanceData(
  filters: SlaPerformanceFilter = {},
  scope: DataScope,
): Promise<SlaPerformanceData> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") {
    const empty = buildEmptyMetric();
    return {
      problemResolve: empty,
      responseTime: empty,
      avgDispatcherSeconds: 0,
      reopenedTickets: 0,
      totalTickets: 0,
      trend: [],
      avgDispatchFormatted: "0m 0s",
      reopenPercentage: 0,
    };
  }

  const { year = "2026", month = "ALL", dept = "ALL" } = filters;
  return unstable_cache(
    async () => getSlaPerformanceDataRaw({ year, month, dept }, access, scope),
    [
      "sla-performance-data-v3",
      String(year),
      month,
      dept,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["sla-performance-main-v2"] },
  )();
}

function parseQuarter(quarter: string = "ALL"): number | null {
  const clean = quarter.trim().toUpperCase();
  if (clean === "ALL" || !clean) return null;
  const num = parseInt(clean.replace("Q", ""), 10);
  return isNaN(num) ? null : num;
}

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Render bulan penuh sesuai scope filter (Jan-Des saat All Months);
// bulan tanpa data diisi 0 supaya chart tergambar sampai akhir
interface SlaTrendComparisonRow {
  month: number | string;
  prev_year_percentage: number | null;
  selected_year_percentage: number | null;
  percentage_gap: number | null;
}

function fillMonthScope(
  rows: SlaTrendComparisonRow[],
  months: number[],
  isAll: boolean,
  quarterNum: number | null,
): SlaTrendComparison[] {
  const byMonth = new Map<number, SlaTrendComparisonRow>(
    rows.map((row) => [Number(row.month), row]),
  );

  const scopeMonths = (isAll ? ALL_MONTHS : months).filter((m) =>
    quarterNum !== null ? Math.ceil(m / 3) === quarterNum : true,
  );

  return scopeMonths.map((m) => {
    const row = byMonth.get(m);
    return {
      month: m,
      prevYearPercentage: row?.prev_year_percentage ?? 0,
      selectedYearPercentage: row?.selected_year_percentage ?? 0,
      percentageGap: row?.percentage_gap ?? null,
    };
  });
}

export interface SlaComparisonFilter {
  year?: string | number;
  month?: string;
  dept?: string;
  quarter?: string;
}

async function getSlaProblemResolveTrendRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: SlaComparisonFilter,
  access: AllowedDatasetAccess,
): Promise<SlaTrendComparison[]> {
  const start = performance.now();

  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilterLib(month);
  const quarterNum = parseQuarter(quarter);

  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;
  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  try {
    const rows = await sql<SlaTrendComparisonRow[]>`
      SELECT
          COALESCE(t1.month, t2.month)::int as month,
          ROUND(
              SUM(CASE WHEN t1.sla_resolve = 'Sesuai SLA' THEN 1 ELSE 0 END) * 100.0
              / NULLIF(COUNT(t1.id), 0),
              2
          )::float as prev_year_percentage,
          ROUND(
              SUM(CASE WHEN t2.sla_resolve = 'Sesuai SLA' THEN 1 ELSE 0 END) * 100.0
              / NULLIF(COUNT(t2.id), 0),
              2
          )::float as selected_year_percentage,
          ROUND(
              (
                  SUM(CASE WHEN t2.sla_resolve = 'Sesuai SLA' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(t2.id), 0) -
                  SUM(CASE WHEN t1.sla_resolve = 'Sesuai SLA' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(t1.id), 0)
              )::numeric,
              2
          )::float as percentage_gap
      FROM (
          SELECT id, month, sla_resolve
          FROM helpdesk.helpdesk_datachat
          WHERE year = (${yearNum - 1})::int
            AND ${monthCondition}
            AND ${deptCond}
            AND ${branchCond}
            AND ${quarterCondition}
      ) t1
      FULL OUTER JOIN (
          SELECT id, month, sla_resolve
          FROM helpdesk.helpdesk_datachat
          WHERE year = ${yearNum}::int
            AND ${monthCondition}
            AND ${deptCond}
            AND ${branchCond}
            AND ${quarterCondition}
      ) t2 ON t1.month = t2.month
      GROUP BY COALESCE(t1.month, t2.month)
      ORDER BY month;
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getSlaProblemResolveTrend completed in ${duration.toFixed(2)}ms`,
    );

    return fillMonthScope(rows, months, isAll, quarterNum);
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch SLA problem resolve trend comparison:",
      err,
    );
    return [];
  }
}

async function getSlaResponseTimeTrendRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: SlaComparisonFilter,
  access: AllowedDatasetAccess,
): Promise<SlaTrendComparison[]> {
  const start = performance.now();

  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilterLib(month);
  const quarterNum = parseQuarter(quarter);

  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;
  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  try {
    const rows = await sql<SlaTrendComparisonRow[]>`
      SELECT
          COALESCE(t1.month, t2.month)::int as month,
          ROUND(
              SUM(CASE WHEN t1.sla_fetch = 'Sesuai SLA' THEN 1 ELSE 0 END) * 100.0
              / NULLIF(COUNT(t1.id), 0),
              2
          )::float as prev_year_percentage,
          ROUND(
              SUM(CASE WHEN t2.sla_fetch = 'Sesuai SLA' THEN 1 ELSE 0 END) * 100.0
              / NULLIF(COUNT(t2.id), 0),
              2
          )::float as selected_year_percentage,
          ROUND(
              (
                  SUM(CASE WHEN t2.sla_fetch = 'Sesuai SLA' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(t2.id), 0) -
                  SUM(CASE WHEN t1.sla_fetch = 'Sesuai SLA' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(t1.id), 0)
              )::numeric,
              2
          )::float as percentage_gap
      FROM (
          SELECT id, month, sla_fetch
          FROM helpdesk.helpdesk_datachat
          WHERE year = (${yearNum - 1})::int
            AND ${monthCondition}
            AND ${deptCond}
            AND ${branchCond}
            AND ${quarterCondition}
      ) t1
      FULL OUTER JOIN (
          SELECT id, month, sla_fetch
          FROM helpdesk.helpdesk_datachat
          WHERE year = ${yearNum}::int
            AND ${monthCondition}
            AND ${deptCond}
            AND ${branchCond}
            AND ${quarterCondition}
      ) t2 ON t1.month = t2.month
      GROUP BY COALESCE(t1.month, t2.month)
      ORDER BY month;
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getSlaResponseTimeTrend completed in ${duration.toFixed(2)}ms`,
    );

    return fillMonthScope(rows, months, isAll, quarterNum);
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch SLA response time trend comparison:",
      err,
    );
    return [];
  }
}

export async function getSlaProblemResolveTrend(
  filters: SlaComparisonFilter = {},
  scope: DataScope,
): Promise<SlaTrendComparison[]> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;
  return unstable_cache(
    async () =>
      getSlaProblemResolveTrendRaw({ year, month, dept, quarter }, access),
    [
      "sla-problem-resolve-trend-v3",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["sla-performance-problem-v2"] },
  )();
}

export async function getSlaResponseTimeTrend(
  filters: SlaComparisonFilter = {},
  scope: DataScope,
): Promise<SlaTrendComparison[]> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;
  return unstable_cache(
    async () =>
      getSlaResponseTimeTrendRaw({ year, month, dept, quarter }, access),
    [
      "sla-response-time-trend-v3",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["sla-performance-response-v2"] },
  )();
}
