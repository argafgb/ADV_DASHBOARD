import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import { resolveDatasetAccess, DATASET_CAPS, scopeKey, type DataScope } from "@/lib/access/data-scope";
import { departmentCondition, branchCondition, type AllowedDatasetAccess } from "@/lib/access/scope-sql";
interface RootCauseDivisionRow {
  division_name: string;
  ticket_count: number;
  percentage: number;
}

interface RootCauseTicketRow {
  ticketNo: string;
  date: string;
  branchName: string;
  divisi: string;
  judulTicket: string;
  inputter: string;
  actionIT: string;
  detailActionIT: string;
}

interface CountRow {
  total: number;
}

interface RootCauseHierarchyRow {
  root_cause: string;
  division: string;
  detail_name: string;
  ticket_count: number;
}

import type {
  ActionITQueryResultRow,
  RootCauseQueryFilter,
  RootCauseQueryResultRow,
} from "../types/rootCause.types";



function parseQuarter(quarter: string = "ALL"): number | null {
  const clean = quarter.trim().toUpperCase();
  if (clean === "ALL" || !clean) return null;
  const num = parseInt(clean.replace("Q", ""), 10);
  return isNaN(num) ? null : num;
}

// ==========================================
// RAW DATABASE QUERY FUNCTIONS
// ==========================================

async function getTopRootCausesRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: RootCauseQueryFilter,
  access: AllowedDatasetAccess,
): Promise<RootCauseQueryResultRow[]> {
  const start = performance.now();
  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;
  const prevYearNum = yearNum - 1;

  const { months, isAll } = parseMonthFilter(month);
  const monthCondition =
    !isAll && months.length > 0 ? sql`month IN ${sql(months)}` : sql`TRUE`;

  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  const quarterNum = parseQuarter(quarter);
  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  try {
    const rows = await sql<RootCauseQueryResultRow[]>`
      WITH root_cause_counts AS (
          SELECT
              type_temuan,
              year,
              COUNT(*)::int AS ticket_count
          FROM
              helpdesk.helpdesk_datachat
          WHERE status_ticket IN ('2', '3')
              AND type_temuan IS NOT NULL
              AND TRIM(type_temuan) != ''
              AND year IN (${yearNum}::int, ${prevYearNum}::int)
              AND ${monthCondition}
              AND ${deptCond}
        AND ${branchCond}
              AND ${quarterCondition}
              AND type_temuan NOT IN ('Pengecekan IT', 'Improvement', 'Data Modification')
          GROUP BY
              type_temuan,
              year
      ),
      comparison AS (
          SELECT
              type_temuan AS root_cause,
              COALESCE(SUM(CASE WHEN year = ${yearNum}::int THEN ticket_count ELSE 0 END), 0)::int AS current_tickets,
              COALESCE(SUM(CASE WHEN year = ${prevYearNum}::int THEN ticket_count ELSE 0 END), 0)::int AS prev_tickets
          FROM
              root_cause_counts
          GROUP BY
              type_temuan
      )
      SELECT
          root_cause,
          current_tickets,
          prev_tickets,
          CASE
              WHEN prev_tickets = 0 THEN NULL
              ELSE ROUND(((current_tickets - prev_tickets)::numeric / prev_tickets) * 100, 2)::float
          END AS growth_percentage,
          DENSE_RANK() OVER (ORDER BY current_tickets DESC)::int AS rank
      FROM
          comparison
      ORDER BY
          current_tickets DESC
      LIMIT 6;
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getTopRootCauses completed in ${duration.toFixed(2)}ms`,
    );

    return rows;
  } catch (err) {
    console.error("[Database Query] Failed to fetch top root causes:", err);
    return [];
  }
}

async function getRootCauseDivisionSummaryRaw(
  {
    type_temuan,
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: {
    type_temuan: string;
    year?: string | number;
    month?: string;
    dept?: string;
    quarter?: string;
  },
  access: AllowedDatasetAccess,
) {
  const start = performance.now();
  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;

  const { months, isAll } = parseMonthFilter(month);
  const monthCondition =
    !isAll && months.length > 0 ? sql`month IN ${sql(months)}` : sql`TRUE`;

  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  const quarterNum = parseQuarter(quarter);
  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  try {
    const rows = await sql<RootCauseDivisionRow[]>`
      SELECT
          COALESCE(group_problem, 'UNKNOWN') as division_name,
          COUNT(*)::int as ticket_count,
          ROUND(
              COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0),
              1
          )::float as percentage
      FROM helpdesk.helpdesk_datachat
      WHERE status_ticket IN ('2', '3')
        AND UPPER(type_temuan) = ${type_temuan}
        AND year = ${yearNum}::int
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND ${quarterCondition}
        AND type_temuan NOT IN ('Pengecekan IT', 'Improvement', 'Data Modification')
        AND COALESCE(UPPER(group_problem), '') NOT IN ('IT', 'REPORT WAREHOUSE')
      GROUP BY group_problem
      ORDER BY ticket_count DESC;
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getRootCauseDivisionSummary completed in ${duration.toFixed(2)}ms`,
    );
    return rows;
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch root cause division summary:",
      err,
    );
    return [];
  }
}

async function getRootCauseDetailTicketsRaw(
  {
    type_temuan,
    year = "2026",
    month = "ALL",
    quarter = "ALL",
    group_problem = "ALL",
    limit = 10,
    offset = 0,
  }: {
    type_temuan: string;
    year?: string | number;
    month?: string;
    dept?: string;
    quarter?: string;
    group_problem?: string;
    limit?: number;
    offset?: number;
  },
  access: AllowedDatasetAccess,
) {
  const start = performance.now();
  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;

  const { months, isAll } = parseMonthFilter(month);
  const monthCondition =
    !isAll && months.length > 0 ? sql`month IN ${sql(months)}` : sql`TRUE`;

  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  const quarterNum = parseQuarter(quarter);
  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  const divisionCondition =
    group_problem && group_problem !== "ALL"
      ? sql`AND group_problem = ${group_problem}`
      : sql``;

  try {
    const tickets = await sql<RootCauseTicketRow[]>`
      SELECT
          ticket_no as "ticketNo",
          TO_CHAR(time_input - INTERVAL '7 hours', 'DD Mon YYYY HH24:MI') as date,
          COALESCE(branch_name, '-') as "branchName",
          COALESCE(group_problem, '-') as divisi,
          COALESCE(subject, 'No Subject') as "judulTicket",
          COALESCE(inputter, '-') as inputter,
          COALESCE(action_it, 'No Action Needed') as "actionIT",
          COALESCE(result_bizdev_check, 'No Detail Yet') as "detailActionIT"
      FROM helpdesk.helpdesk_datachat
      WHERE status_ticket IN ('2', '3')
        AND UPPER(type_temuan) = ${type_temuan}
        AND year = ${yearNum}::int
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND ${quarterCondition}
        AND type_temuan NOT IN ('Pengecekan IT', 'Improvement', 'Data Modification')
        AND COALESCE(UPPER(group_problem), '') NOT IN ('IT', 'REPORT WAREHOUSE')
        ${divisionCondition}
      ORDER BY (time_input - INTERVAL '7 hours') DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const countResult = await sql<CountRow[]>`
      SELECT COUNT(*)::int as total
      FROM helpdesk.helpdesk_datachat
      WHERE status_ticket IN ('2', '3')
        AND UPPER(type_temuan) = ${type_temuan}
        AND year = ${yearNum}::int
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND ${quarterCondition}
        AND type_temuan NOT IN ('Pengecekan IT', 'Improvement', 'Data Modification')
        AND COALESCE(UPPER(group_problem), '') NOT IN ('IT', 'REPORT WAREHOUSE')
        ${divisionCondition};
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getRootCauseDetailTickets completed in ${duration.toFixed(2)}ms`,
    );

    return {
      tickets,
      total: countResult[0]?.total ?? 0,
    };
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch root cause detail tickets:",
      err,
    );
    return { tickets: [], total: 0 };
  }
}

async function getActionITDistributionRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: RootCauseQueryFilter,
  access: AllowedDatasetAccess,
): Promise<ActionITQueryResultRow[]> {
  const start = performance.now();
  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;

  const { months, isAll } = parseMonthFilter(month);
  const monthCondition =
    !isAll && months.length > 0 ? sql`month IN ${sql(months)}` : sql`TRUE`;

  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  const quarterNum = parseQuarter(quarter);
  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  try {
    const rows = await sql<ActionITQueryResultRow[]>`
      SELECT
        COALESCE(
          CASE
            WHEN action_it IS NULL OR TRIM(action_it) = '' OR TRIM(action_it) = '-' OR LOWER(TRIM(action_it)) = 'no action yet' THEN 'No Action Needed'
            ELSE action_it
          END, 'No Action Needed'
        ) as name,
        COUNT(*)::int as count
      FROM helpdesk.helpdesk_datachat
      WHERE status_ticket IN ('2', '3')
        AND year = ${yearNum}::int
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND ${quarterCondition}
        AND type_temuan NOT IN ('Pengecekan IT', 'Improvement', 'Data Modification')
        AND COALESCE(UPPER(group_problem), '') NOT IN ('IT', 'REPORT WAREHOUSE')
      GROUP BY 1
      ORDER BY count DESC;
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getActionITDistribution completed in ${duration.toFixed(2)}ms`,
    );

    return rows;
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch Action IT distribution:",
      err,
    );
    return [];
  }
}

async function getRootCauseHierarchyRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: RootCauseQueryFilter,
  access: AllowedDatasetAccess,
) {
  const start = performance.now();
  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;

  const { months, isAll } = parseMonthFilter(month);
  const monthCondition =
    !isAll && months.length > 0 ? sql`month IN ${sql(months)}` : sql`TRUE`;

  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  const quarterNum = parseQuarter(quarter);
  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  try {
    const rows = await sql<RootCauseHierarchyRow[]>`
      SELECT
          type_temuan AS root_cause,
          COALESCE(group_problem, 'UNKNOWN') AS division,
          COALESCE(problem_lvl1, 'UNKNOWN') AS detail_name,
          COUNT(*)::int AS ticket_count
      FROM helpdesk.helpdesk_datachat
      WHERE status_ticket IN ('2', '3')
        AND year = ${yearNum}::int
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND ${quarterCondition}
        AND type_temuan IS NOT NULL
        AND type_temuan NOT IN ('Pengecekan IT', 'Improvement', 'Data Modification')
        AND COALESCE(UPPER(group_problem), '') NOT IN ('IT', 'REPORT WAREHOUSE')
      GROUP BY
          type_temuan,
          group_problem,
          problem_lvl1
      ORDER BY
          root_cause,
          division,
          ticket_count DESC;
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getRootCauseHierarchy completed in ${duration.toFixed(2)}ms`,
    );

    return rows;
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch root cause hierarchy:",
      err,
    );
    return [];
  }
}

// ==========================================
// CACHED EXPORTED SERVICE FUNCTIONS
// ==========================================

export async function getTopRootCauses(
  filters: RootCauseQueryFilter = {},
  scope: DataScope,
): Promise<RootCauseQueryResultRow[]> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;
  return unstable_cache(
    async () => getTopRootCausesRaw({ year, month, dept, quarter }, access),
    [
      "top-root-causes-v3",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["rating-root-cause-v2"] },
  )();
}

export async function getRootCauseDivisionSummary(
  filters: {
    type_temuan: string;
    year?: string | number;
    month?: string;
    dept?: string;
    quarter?: string;
  },
  scope: DataScope,
) {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    type_temuan,
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;
  return unstable_cache(
    async () =>
      getRootCauseDivisionSummaryRaw(
        {
          type_temuan,
          year,
          month,
          dept,
          quarter,
        },
        access,
      ),
    [
      "root-cause-division-summary-v3",
      type_temuan,
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["rating-root-cause-detail-v2"] },
  )();
}

export async function getRootCauseDetailTickets(
  filters: {
    type_temuan: string;
    year?: string | number;
    month?: string;
    dept?: string;
    quarter?: string;
    group_problem?: string;
    limit?: number;
    offset?: number;
  },
  scope: DataScope,
) {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return { tickets: [], total: 0 };

  const {
    type_temuan,
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
    group_problem = "ALL",
    limit = 50,
    offset = 0,
  } = filters;
  return unstable_cache(
    async () =>
      getRootCauseDetailTicketsRaw(
        {
          type_temuan,
          year,
          month,
          dept,
          quarter,
          group_problem,
          limit,
          offset,
        },
        access,
      ),
    [
      "root-cause-detail-tickets-v4",
      type_temuan,
      String(year),
      month,
      dept,
      quarter,
      group_problem,
      String(limit),
      String(offset),
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["rating-root-cause-detail-v3"] },
  )();
}

export async function getActionITDistribution(
  filters: RootCauseQueryFilter = {},
  scope: DataScope,
) {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;
  return unstable_cache(
    async () => getActionITDistributionRaw({ year, month, dept, quarter }, access),
    [
      "action-it-distribution-v2",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["rating-root-cause-action-it-v1"] },
  )();
}

export async function getRootCauseHierarchy(
  filters: RootCauseQueryFilter = {},
  scope: DataScope,
) {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;
  return unstable_cache(
    async () => getRootCauseHierarchyRaw({ year, month, dept, quarter }, access),
    [
      "root-cause-hierarchy-v3",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["rating-root-cause-hierarchy-v2"] },
  )();
}
