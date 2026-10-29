import "server-only";
import { parseQuarter, comparisonPeriodLabel } from "../utils/comparisonPeriod";
import { comparisonApp, comparisonFeature, comparisonDataset } from "../utils/comparisonSql";
import { buildCategoryComparison } from "../utils/comparisonAggregates";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";
import type {
  TicketFrequency,
  TicketVolumeByDepartment,
  TicketMonthlyComparison,
  TicketVolumeByCategory,
  MonthlyCategoryComparison,
  MonthlyAppMenuComparison,
  AppMenuFieldIssueDetail,
  AppMenuIssueItem,
  AppMenuBranchItem,
  AppMenuTicketItem,
} from "../types/comparison.types";
import { parseMonthFilter } from "@/lib/filter-utils";
import { resolveDatasetAccess, DATASET_CAPS, scopeKey, type DataScope } from "@/lib/access/data-scope";
import { departmentCondition, branchCondition, type AllowedDatasetAccess } from "@/lib/access/scope-sql";

export interface ComparisonFilter {
  year?: string | number;
  month?: string;
  dept?: string;
  quarter?: string;
}




const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function monthQuarter(month: number): number {
  return Math.ceil(month / 3);
}

// ==========================================
// ROW INTERFACES FOR TYPED SQL QUERIES
// ==========================================

interface TicketFrequencyRow {
  year: number;
  ticket_count: number | null;
  ticket_diff: number | null;
  growth_percentage: number | null;
}

interface TicketMonthlySummaryRow {
  month: number;
  tickets_prev_year: number | null;
  tickets_selected_year: number | null;
  total_tickets: number | null;
  growth_percentage: number | null;
}

interface TicketVolumeByDepartmentRow {
  department_name: string | null;
  tickets_prev_year: number | null;
  tickets_selected_year: number | null;
  ticket_diff: number | null;
  growth_percentage: number | null;
}

interface SummaryPerProblemRow {
  month: number;
  category: string;
  tickets_prev_year: number | null;
  tickets_selected_year: number | null;
  total_tickets: number | null;
  growth_percentage: number | null;
}

interface SummaryPerAppMenuRow {
  month: number;
  app: string;
  feature: string;
  tickets_prev_year: number | null;
  tickets_selected_year: number | null;
  total_tickets: number | null;
  growth_percentage: number | null;
}

// ==========================================
// RAW DATABASE QUERY FUNCTIONS
// ==========================================

async function getTicketsFrequencyRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: ComparisonFilter,
  access: AllowedDatasetAccess,
): Promise<TicketFrequency[]> {
  const start = performance.now();

  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const quarterNum = parseQuarter(quarter);

  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;
  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  try {
    const rows = await sql<TicketFrequencyRow[]>`
      SELECT
          year::int as year,
          COUNT(*)::int as ticket_count,
          (COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY year))::int as ticket_diff,
          CASE
            WHEN LAG(COUNT(*)) OVER (ORDER BY year) IS NULL THEN NULL
            WHEN LAG(COUNT(*)) OVER (ORDER BY year) = 0 AND COUNT(*) = 0 THEN 0
            WHEN LAG(COUNT(*)) OVER (ORDER BY year) = 0 AND COUNT(*) > 0 THEN 100
            ELSE ROUND(
                (COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY year))::numeric
                / LAG(COUNT(*)) OVER (ORDER BY year) * 100,
                2
            )::float
          END as growth_percentage
      FROM ${comparisonDataset}
      WHERE year IN (${yearNum}::int, ${yearNum - 1}::int)
        AND ${monthCondition}
        AND ${deptCond}
            AND ${branchCond}
        AND ${quarterCondition}
      GROUP BY year
      ORDER BY year;
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getTicketsFrequency completed in ${duration.toFixed(2)}ms`,
    );

    return rows.map((row) => ({
      year: row.year,
      ticketCount: row.ticket_count ?? 0,
      ticketDiff: row.ticket_diff,
      growthPercentage: row.growth_percentage,
    }));
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch ticket frequency comparison:",
      err,
    );
    return [];
  }
}

async function getTicketsMonthlySummaryRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: ComparisonFilter,
  access: AllowedDatasetAccess,
): Promise<TicketMonthlyComparison[]> {
  const start = performance.now();

  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const quarterNum = parseQuarter(quarter);

  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;
  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  try {
    const rows = await sql<TicketMonthlySummaryRow[]>`
      SELECT
          COALESCE(t1.month, t2.month)::int as month,
          COALESCE(t1.ticket_count, 0)::int as tickets_prev_year,
          COALESCE(t2.ticket_count, 0)::int as tickets_selected_year,
          (COALESCE(t1.ticket_count, 0) + COALESCE(t2.ticket_count, 0))::int as total_tickets,
          CASE
            WHEN COALESCE(t1.ticket_count, 0) = 0 AND COALESCE(t2.ticket_count, 0) = 0 THEN 0
            WHEN COALESCE(t1.ticket_count, 0) = 0 AND COALESCE(t2.ticket_count, 0) > 0 THEN 100
            ELSE ROUND(
                (COALESCE(t2.ticket_count, 0) - COALESCE(t1.ticket_count, 0))::numeric
                / COALESCE(t1.ticket_count, 0) * 100,
                2
            )::float
          END as growth_percentage
      FROM (
          SELECT month, COUNT(*) as ticket_count
          FROM ${comparisonDataset}
          WHERE year = (${yearNum - 1})::int
            AND ${monthCondition}
            AND ${deptCond}
            AND ${branchCond}
            AND ${quarterCondition}
          GROUP BY month
      ) t1
      FULL OUTER JOIN (
          SELECT month, COUNT(*) as ticket_count
          FROM ${comparisonDataset}
          WHERE year = ${yearNum}::int
            AND ${monthCondition}
            AND ${deptCond}
            AND ${branchCond}
            AND ${quarterCondition}
          GROUP BY month
      ) t2 ON t1.month = t2.month
      ORDER BY month;
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getTicketsMonthlySummary completed in ${duration.toFixed(2)}ms`,
    );

    const byMonth = new Map<number, (typeof rows)[number]>(
      rows.map((row) => [Number(row.month), row]),
    );

    // Selalu render bulan penuh sesuai scope filter (Jan-Des saat All Months),
    // bulan tanpa data diisi 0 supaya chart tetap tergambar sampai akhir
    const scopeMonths = (isAll ? ALL_MONTHS : months).filter((m) =>
      quarterNum !== null ? monthQuarter(m) === quarterNum : true,
    );

    return scopeMonths.map((m) => {
      const row = byMonth.get(m);
      return {
        month: m,
        ticketsPrevYear: row?.tickets_prev_year ?? 0,
        ticketsSelectedYear: row?.tickets_selected_year ?? 0,
        totalTickets: row?.total_tickets ?? 0,
        growthPercentage: row?.growth_percentage ?? null,
      };
    });
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch monthly ticket comparison summary:",
      err,
    );
    return [];
  }
}

async function getTicketVolumeByDepartmentRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: ComparisonFilter,
  access: AllowedDatasetAccess,
): Promise<TicketVolumeByDepartment[]> {
  const start = performance.now();

  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const quarterNum = parseQuarter(quarter);

  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;
  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  try {
    const rows = await sql<TicketVolumeByDepartmentRow[]>`
      SELECT
          department_name,
          SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END)::int as tickets_prev_year,
          SUM(CASE WHEN year = ${yearNum}::int THEN 1 ELSE 0 END)::int as tickets_selected_year,
          (SUM(CASE WHEN year = ${yearNum}::int THEN 1 ELSE 0 END) - SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END))::int as ticket_diff,
          CASE
            WHEN SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END) = 0 
             AND SUM(CASE WHEN year = ${yearNum}::int THEN 1 ELSE 0 END) = 0 THEN 0
            WHEN SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END) = 0 
             AND SUM(CASE WHEN year = ${yearNum}::int THEN 1 ELSE 0 END) > 0 THEN 100
            ELSE ROUND(
                (SUM(CASE WHEN year = ${yearNum}::int THEN 1 ELSE 0 END) - SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END))::numeric
                / SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END) * 100,
                2
            )::float
          END as growth_percentage
      FROM ${comparisonDataset}
      WHERE year IN (${yearNum}::int, ${yearNum - 1}::int)
        AND ${monthCondition}
        AND ${deptCond}
            AND ${branchCond}
        AND ${quarterCondition}
      GROUP BY department_name
      ORDER BY tickets_selected_year DESC;
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getTicketVolumeByDepartment completed in ${duration.toFixed(2)}ms`,
    );

    return rows.map((row) => ({
      departmentName: row.department_name ?? "Unknown",
      ticketsPrevYear: row.tickets_prev_year ?? 0,
      ticketsSelectedYear: row.tickets_selected_year ?? 0,
      ticketDiff: row.ticket_diff ?? 0,
      growthPercentage: row.growth_percentage ?? 0,
    }));
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch ticket volume by department comparison:",
      err,
    );
    return [];
  }
}

async function getTicketsByProblemCategoryRaw(filters: ComparisonFilter, access: AllowedDatasetAccess): Promise<TicketVolumeByCategory[]> {
  return buildCategoryComparison(await getSummaryPerAppMenuRaw(filters, access));
}

async function getSummaryPerProblemRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: ComparisonFilter,
  access: AllowedDatasetAccess,
): Promise<MonthlyCategoryComparison[]> {
  const start = performance.now();

  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;
  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);
  const quarterNum = parseQuarter(quarter);
  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  try {
    const rows = await sql<SummaryPerProblemRow[]>`
      WITH normalized_data AS (
        SELECT year, ${comparisonApp} AS category
        FROM ${comparisonDataset}
        WHERE year IN (${yearNum - 1}::int, ${yearNum}::int)
          AND ${monthCondition}
          AND ${deptCond}
          AND ${branchCond}
          AND ${quarterCondition}
      ), totals AS (
        SELECT
          category,
          COUNT(*) FILTER (WHERE year = ${yearNum - 1}::int)::int AS tickets_prev_year,
          COUNT(*) FILTER (WHERE year = ${yearNum}::int)::int AS tickets_selected_year
        FROM normalized_data
        GROUP BY category
      )
      SELECT
        ${!isAll && months.length === 1 ? sql`${months[0]}::int` : sql`0::int`} AS month,
        category,
        tickets_prev_year,
        tickets_selected_year,
        (tickets_prev_year + tickets_selected_year)::int AS total_tickets,
        CASE
          WHEN tickets_prev_year = 0 AND tickets_selected_year > 0 THEN 100
          WHEN tickets_prev_year = 0 THEN 0
          ELSE ROUND((tickets_selected_year - tickets_prev_year)::numeric / tickets_prev_year * 100, 2)::float
        END AS growth_percentage
      FROM totals
      ORDER BY total_tickets DESC, category;
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getSummaryPerProblem completed in ${duration.toFixed(2)}ms`,
    );

    return rows.map((row) => ({
      month: row.month,
      category: row.category,
      ticketsPrevYear: row.tickets_prev_year ?? 0,
      ticketsSelectedYear: row.tickets_selected_year ?? 0,
      totalTickets: row.total_tickets ?? 0,
      growthPercentage: row.growth_percentage,
    }));
  } catch (err) {
    console.error("[Database Query] Failed to fetch summary per problem:", err);
    return [];
  }
}

async function getSummaryPerAppMenuRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: ComparisonFilter,
  access: AllowedDatasetAccess,
): Promise<MonthlyAppMenuComparison[]> {
  const start = performance.now();

  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;
  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);
  const quarterNum = parseQuarter(quarter);
  const quarterCondition =
    quarterNum !== null ? sql`quarter = ${quarterNum}::int` : sql`TRUE`;

  try {
    const rows = await sql<SummaryPerAppMenuRow[]>`
      WITH normalized_data AS (
        SELECT 
          year,
          month,
          ${comparisonApp} as app,
          ${comparisonFeature} as feature
        FROM ${comparisonDataset}
        WHERE year IN (${yearNum}::int, ${yearNum - 1}::int)
          AND ${monthCondition}
          AND ${deptCond}
            AND ${branchCond}
          AND ${quarterCondition}
      )
      SELECT 
        ${!isAll && months.length === 1 ? sql`${months[0]}::int` : sql`0::int`} as month,
        app,
        feature,
        SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END)::int as tickets_prev_year,
        SUM(CASE WHEN year = ${yearNum}::int THEN 1 ELSE 0 END)::int as tickets_selected_year,
        (SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END) + SUM(CASE WHEN year = ${yearNum}::int THEN 1 ELSE 0 END))::int as total_tickets,
        CASE
          WHEN SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END) = 0 
           AND SUM(CASE WHEN year = ${yearNum}::int THEN 1 ELSE 0 END) = 0 THEN 0
          WHEN SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END) = 0 
           AND SUM(CASE WHEN year = ${yearNum}::int THEN 1 ELSE 0 END) > 0 THEN 100
          ELSE ROUND(
            (SUM(CASE WHEN year = ${yearNum}::int THEN 1 ELSE 0 END) - SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END))::numeric
            / SUM(CASE WHEN year = (${yearNum - 1})::int THEN 1 ELSE 0 END) * 100,
            2
          )::float
        END as growth_percentage
      FROM normalized_data
      GROUP BY app, feature
      ORDER BY tickets_selected_year DESC, tickets_prev_year DESC, app, feature;
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getSummaryPerAppMenu completed in ${duration.toFixed(2)}ms`,
    );

    return rows.map((row) => ({
      month: row.month,
      app: row.app,
      feature: row.feature,
      ticketsPrevYear: row.tickets_prev_year ?? 0,
      ticketsSelectedYear: row.tickets_selected_year ?? 0,
      totalTickets: row.total_tickets ?? 0,
      growthPercentage: row.growth_percentage,
    }));
  } catch (err) {
    console.error("[Database Query] Failed to fetch summary per app menu:", err);
    return [];
  }
}

async function checkHasProblemLvl2Column(): Promise<boolean> {
  try {
    const res = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'helpdesk' 
          AND table_name = 'helpdesk_datachat' 
          AND column_name = 'problem_lvl2'
      ) as exists;
    `;
    return Boolean(res[0]?.exists);
  } catch (err) {
    console.warn("[checkHasProblemLvl2Column] Failed to check column, falling back to false:", err);
    return false;
  }
}

export interface AppMenuFieldIssuesFilter {
  year: number | string;
  month: number | string;
  app: string;
  feature: string;
  dept?: string;
  quarter?: string;
}

export async function getAppMenuFieldIssuesRaw(
  input: AppMenuFieldIssuesFilter,
  access: AllowedDatasetAccess,
): Promise<AppMenuFieldIssueDetail> {
  const yearNum = Number(input.year) || 2026;
  const monthNum = Number(input.month) || 0;
  const app = input.app?.trim() || "";
  const feature = input.feature?.trim() || "";
  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  const monthFilter = String(input.month || "ALL");
  const { months, isAll } = parseMonthFilter(monthFilter === "0" ? "ALL" : monthFilter);
  const quarterNum = parseQuarter(input.quarter);
  const monthCondition = sql`
    (${isAll ? sql`TRUE` : sql`month IN ${sql(months)}`})
    AND (${quarterNum === null ? sql`TRUE` : sql`quarter = ${quarterNum}::int`})
  `;

  const matchCondition = sql`(
    UPPER(TRIM(${comparisonApp})) = UPPER(TRIM(${app}))
    AND UPPER(TRIM(${comparisonFeature})) = UPPER(TRIM(${feature}))
  )`;

  try {
    const start = performance.now();
    const hasLvl2 = await checkHasProblemLvl2Column();

    const issuesQuery = hasLvl2
      ? sql<{ problem_lvl2: string; count: number }[]>`
          SELECT
            CASE 
              WHEN UPPER(TRIM(problem_lvl2)) IN ('QUICK CHECK', 'ADVANCED CHECK', 'NO FEEDBACK', 'NO FEEEDBACK', 'FULL HANDLING', 'NO ACTION', '-', '')
                THEN COALESCE(NULLIF(UPPER(TRIM(problem_lvl1)), ''), 'BELUM DIISI (PROBLEM LEVEL 2)')
              ELSE COALESCE(NULLIF(UPPER(TRIM(problem_lvl2)), ''), NULLIF(UPPER(TRIM(problem_lvl1)), ''), 'BELUM DIISI (PROBLEM LEVEL 2)')
            END as problem_lvl2,
            COUNT(*)::int as count
          FROM ${comparisonDataset}
          WHERE year = ${yearNum}::int
            AND ${monthCondition}
            AND ${matchCondition}
            AND ${deptCond}
            AND ${branchCond}
          GROUP BY CASE 
            WHEN UPPER(TRIM(problem_lvl2)) IN ('QUICK CHECK', 'ADVANCED CHECK', 'NO FEEDBACK', 'NO FEEEDBACK', 'FULL HANDLING', 'NO ACTION', '-', '')
              THEN COALESCE(NULLIF(UPPER(TRIM(problem_lvl1)), ''), 'BELUM DIISI (PROBLEM LEVEL 2)')
            ELSE COALESCE(NULLIF(UPPER(TRIM(problem_lvl2)), ''), NULLIF(UPPER(TRIM(problem_lvl1)), ''), 'BELUM DIISI (PROBLEM LEVEL 2)')
          END
          ORDER BY count DESC, problem_lvl2
          LIMIT 6;
        `
      : sql<{ problem_lvl2: string; count: number }[]>`
          SELECT
            COALESCE(NULLIF(UPPER(TRIM(subject)), ''), 'Tanpa Subjek') as problem_lvl2,
            COUNT(*)::int as count
          FROM ${comparisonDataset}
          WHERE year = ${yearNum}::int
            AND ${monthCondition}
            AND ${matchCondition}
            AND ${deptCond}
            AND ${branchCond}
          GROUP BY COALESCE(NULLIF(UPPER(TRIM(subject)), ''), 'Tanpa Subjek')
          ORDER BY count DESC, problem_lvl2
          LIMIT 6;
        `;

    const ticketsQuery = hasLvl2
      ? sql<{
          ticket_no: string;
          branch_name: string;
          subject: string;
          problem_lvl2: string | null;
          resolve_reason: string | null;
          time_input: string | null;
          status_ticket_descs: string | null;
        }[]>`
          SELECT ticket_no,
            COALESCE(NULLIF(TRIM(branch_name), ''), '-') as branch_name,
            COALESCE(NULLIF(TRIM(subject), ''), '-') as subject,
            CASE
              WHEN UPPER(TRIM(problem_lvl2)) IN ('QUICK CHECK', 'ADVANCED CHECK', 'NO FEEDBACK', 'NO FEEEDBACK', 'FULL HANDLING', 'NO ACTION', '-', '')
                THEN COALESCE(NULLIF(TRIM(problem_lvl1), ''), '-')
              ELSE COALESCE(NULLIF(TRIM(problem_lvl2), ''), NULLIF(TRIM(problem_lvl1), ''), '-')
            END as problem_lvl2, resolve_reason,
            to_char(time_input, 'YYYY-MM-DD HH24:MI') as time_input,
            status_ticket_descs
          FROM ${comparisonDataset}
          WHERE year = ${yearNum}::int
            AND ${monthCondition}
            AND ${matchCondition}
            AND ${deptCond}
            AND ${branchCond}
          ORDER BY time_input DESC NULLS LAST, ticket_no
          LIMIT 200;
        `
      : sql<{
          ticket_no: string;
          branch_name: string;
          subject: string;
          problem_lvl2: string | null;
          resolve_reason: string | null;
          time_input: string | null;
          status_ticket_descs: string | null;
        }[]>`
          SELECT ticket_no,
            COALESCE(NULLIF(TRIM(branch_name), ''), '-') as branch_name,
            COALESCE(NULLIF(TRIM(subject), ''), '-') as subject,
            NULL::text as problem_lvl2, resolve_reason,
            to_char(time_input, 'YYYY-MM-DD HH24:MI') as time_input,
            status_ticket_descs
          FROM ${comparisonDataset}
          WHERE year = ${yearNum}::int
            AND ${monthCondition}
            AND ${matchCondition}
            AND ${deptCond}
            AND ${branchCond}
          ORDER BY time_input DESC NULLS LAST, ticket_no
          LIMIT 200;
        `;

    const [issuesResult, branchesResult, ticketsResult, totalCountResult] =
      await Promise.all([
        issuesQuery,
        sql<{ branch_name: string; count: number }[]>`
          SELECT
            COALESCE(NULLIF(UPPER(TRIM(branch_name)), ''), 'LAINNYA') as branch_name,
            COUNT(*)::int as count
          FROM ${comparisonDataset}
          WHERE year = ${yearNum}::int
            AND ${monthCondition}
            AND ${matchCondition}
            AND ${deptCond}
            AND ${branchCond}
          GROUP BY COALESCE(NULLIF(UPPER(TRIM(branch_name)), ''), 'LAINNYA')
          ORDER BY count DESC, branch_name
          LIMIT 5;
        `,
        ticketsQuery,
        sql<{ total: number }[]>`
          SELECT COUNT(*)::int as total
          FROM ${comparisonDataset}
          WHERE year = ${yearNum}::int
            AND ${monthCondition}
            AND ${matchCondition}
            AND ${deptCond}
            AND ${branchCond};
        `,
      ]);

    const totalTickets = totalCountResult[0]?.total ?? 0;
    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getAppMenuFieldIssues completed in ${duration.toFixed(2)}ms for ${app} - ${feature}`,
    );

    const topIssues: AppMenuIssueItem[] = issuesResult.map((r) => ({
      problemLevel2: r.problem_lvl2,
      count: r.count,
      percentage:
        totalTickets > 0 ? Math.round((r.count / totalTickets) * 100) : 0,
    }));

    const topBranches: AppMenuBranchItem[] = branchesResult.map((r) => ({
      branchName: r.branch_name,
      count: r.count,
    }));

    const tickets: AppMenuTicketItem[] = ticketsResult.map((r) => ({
      ticketNo: r.ticket_no,
      branchName: r.branch_name,
      subject: r.subject,
      problemLvl2: r.problem_lvl2 ? r.problem_lvl2.trim() : null,
      resolveReason: r.resolve_reason,
      timeInput: r.time_input,
      statusTicketDescs: r.status_ticket_descs,
    }));

    return {
      month: monthNum,
      periodLabel: comparisonPeriodLabel(String(input.month || "ALL"), input.quarter),
      year: yearNum,
      app,
      feature,
      totalTickets,
      topIssues,
      topBranches,
      tickets,
    };
  } catch (err) {
    console.error("[Database Query] Failed to fetch app menu field issues:", err);
    throw err;
  }
}

// ==========================================
// CACHED EXPORTED SERVICE FUNCTIONS
// ==========================================

export async function getTicketsFrequency(
  filters: ComparisonFilter = {},
  scope: DataScope,
): Promise<TicketFrequency[]> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;

  return unstable_cache(
    async () => getTicketsFrequencyRaw({ year, month, dept, quarter }, access),
    [
      "tickets-frequency-v6",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["comparison-frequency-v4"] },
  )();
}

export async function getTicketsMonthlySummary(
  filters: ComparisonFilter = {},
  scope: DataScope,
): Promise<TicketMonthlyComparison[]> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;

  return unstable_cache(
    async () => getTicketsMonthlySummaryRaw({ year, month, dept, quarter }, access),
    [
      "tickets-monthly-summary-v7",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["comparison-monthly-summary-v4"] },
  )();
}

export async function getTicketVolumeByDepartment(
  filters: ComparisonFilter = {},
  scope: DataScope,
): Promise<TicketVolumeByDepartment[]> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;

  return unstable_cache(
    async () => getTicketVolumeByDepartmentRaw({ year, month, dept, quarter }, access),
    [
      "ticket-volume-by-dept-v6",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["comparison-volume-by-dept-v4"] },
  )();
}

export async function getTicketsByProblemCategory(
  filters: ComparisonFilter = {},
  scope: DataScope,
): Promise<TicketVolumeByCategory[]> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;

  return unstable_cache(
    async () => getTicketsByProblemCategoryRaw({ year, month, dept, quarter }, access),
    [
      "tickets-by-problem-category-v7",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["comparison-category-v4"] },
  )();
}

export async function getSummaryPerProblem(
  filters: ComparisonFilter = {},
  scope: DataScope,
): Promise<MonthlyCategoryComparison[]> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;

  return unstable_cache(
    async () => getSummaryPerProblemRaw({ year, month, dept, quarter }, access),
    [
      "summary-per-problem-v8",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["comparison-summary-problem-v4"] },
  )();
}

export async function getSummaryPerAppMenu(
  filters: ComparisonFilter = {},
  scope: DataScope,
): Promise<MonthlyAppMenuComparison[]> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return [];

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;

  return unstable_cache(
    async () => getSummaryPerAppMenuRaw({ year, month, dept, quarter }, access),
    [
      "summary-per-app-menu-v7",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["comparison-app-menu-v4"] },
  )();
}

export async function getAppMenuFieldIssuesData(
  input: AppMenuFieldIssuesFilter,
  scope: DataScope,
): Promise<AppMenuFieldIssueDetail> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, input.dept);
  if (access.kind === "deny") {
    return {
      month: Number(input.month) || 0,
      year: Number(input.year) || 2026,
      app: input.app ?? "",
      feature: input.feature ?? "",
      totalTickets: 0,
      topIssues: [],
      topBranches: [],
      tickets: [],
    };
  }

  const year = Number(input.year) || 2026;
  const month = String(input.month || "ALL");
  const quarter = input.quarter ?? "ALL";
  const app = input.app ?? "";
  const feature = input.feature ?? "";
  const dept = input.dept ?? "ALL";

  return unstable_cache(
    async () => getAppMenuFieldIssuesRaw({ year, month, app, feature, dept, quarter }, access),
    [
      "app-menu-field-issues-v11",
      quarter,
      String(year),
      String(month),
      app,
      feature,
      dept,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["comparison-app-menu-issues-v9"] },
  )();
}
