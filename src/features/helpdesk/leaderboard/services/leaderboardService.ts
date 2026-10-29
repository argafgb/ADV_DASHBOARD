import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import { resolveDatasetAccess, DATASET_CAPS, scopeKey, type DataScope } from "@/lib/access/data-scope";
import { departmentCondition, branchCondition, type AllowedDatasetAccess } from "@/lib/access/scope-sql";
import { OverSlaDetailTicketsSchema } from "@/lib/access/schemas";
import { getLeaderboardMonthLabel } from "../utils/leaderboard-utils";

export interface LeaderboardData {
  employeeOfMonth: Record<
    string,
    { name: string; badge: string; code?: string }
  >;
  targetMonth?: number;
  monthLabel?: string;
  productivity: { name: string; departmentName: string; score: number }[];
  absences: {
    name: string;
    departmentName: string;
    totalHari: number;
    totalTelat: number;
    totalAbsenSebelah: number;
    totalTidakAbsen: number;
    nilai: number;
  }[];
  lowRatings: { ticketNo: string; name: string; rating: number }[];
  overSla: {
    type: "RESPONSE" | "RESOLVED";
    name: string;
    ticketCount: number;
    ticketList: string[];
  }[];
}

// ==========================================
// ROW INTERFACES FOR TYPED SQL QUERIES
// ==========================================

interface EmployeeOfMonthRow {
  department_name: string | null;
  name: string | null;
  code?: string | null;
  target_month: number;
}

interface ProductivityRow {
  name: string;
  departmentName: string;
  score: number;
}

interface OverSlaRow {
  type: string;
  name: string;
  ticket_count: number;
  ticket_list: string[];
}

// 1. Service: Fetch Employee of the Month using dynamic ranking & window partition
async function getEmployeeOfMonthRaw(
  year: number,
  month: string,
  access: AllowedDatasetAccess,
): Promise<{
  employees: Record<string, { name: string; badge: string; code?: string }>;
  targetMonth: number;
}> {
  const start = performance.now();
  const { isAll, months } = parseMonthFilter(month);
  const deptCondition = departmentCondition(access, sql`p.department_name`);

  try {
    const eomResult = await sql<EmployeeOfMonthRow[]>`
      WITH TargetPeriod AS (
        SELECT ${
          isAll
            ? sql`COALESCE((
                SELECT MAX(p_sub.month)
                FROM helpdesk.helpdesk_productivity p_sub
                WHERE p_sub.year = ${year}::int
                  AND p_sub.nilai > 75
              ), (
                SELECT MAX(p_sub.month)
                FROM helpdesk.helpdesk_productivity p_sub
                WHERE p_sub.year = ${year}::int
              ), 9)`
            : sql`${months[0] || 9}::int`
        }::int AS target_month
      ),
      RankedProductivity AS (
        SELECT
          p.department_name,
          p.dispatcher_name AS name,
          p.dispatcher_code AS code,
          tp.target_month,
          ROW_NUMBER() OVER (
            PARTITION BY p.department_name
            ORDER BY p.nilai DESC
          ) AS rk
        FROM TargetPeriod tp
        LEFT JOIN helpdesk.helpdesk_productivity p
          ON p.year = ${year}::int
          AND p.month = tp.target_month
          AND ${deptCondition}
          -- DashboardIT only considers productivity scores strictly above 75.
          -- Active-employee and criteria eligibility must be applied by the ADV sync.
          AND p.nilai > 75
      )
      SELECT department_name, name, code, target_month FROM RankedProductivity WHERE rk = 1;
    `;

    const employees: Record<
      string,
      { name: string; badge: string; code?: string }
    > = {};
    let targetMonth = 9;

    eomResult.forEach((row) => {
      if (row.target_month) {
        targetMonth = row.target_month;
      }
      if (row.department_name && row.name) {
        employees[row.department_name] = {
          name: row.name,
          code: row.code || undefined,
          badge: `Juara ${row.department_name}`,
        };
      }
    });

    console.log(
      `[Leaderboard Query] getEmployeeOfMonth completed in ${(performance.now() - start).toFixed(2)}ms for month ${targetMonth}. Found ${Object.keys(employees).length} champions.`,
    );
    return { employees, targetMonth };
  } catch (err) {
    console.error(`[Leaderboard Query Error] getEmployeeOfMonth failed:`, err);
    return { employees: {}, targetMonth: 9 };
  }
}

export async function getEmployeeOfMonth(
  year: number,
  month: string,
  dept: string,
  scope: DataScope,
): Promise<{
  employees: Record<string, { name: string; badge: string; code?: string }>;
  targetMonth: number;
}> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.productivity, dept);
  if (access.kind === "deny") return { employees: {}, targetMonth: 9 };

  return unstable_cache(
    async () => getEmployeeOfMonthRaw(year, month, access),
    ["leaderboard-employee-of-month-v4", String(year), month, dept, scopeKey(scope), access.departments.join(",")],
    { revalidate: 300, tags: ["leaderboard-employee-of-month-v2"] },
  )();
}

// 2. Service: Calculate Productivity Ranking (nilai > 75)
async function getProductivityRankingRaw(
  year: number,
  month: string,
  access: AllowedDatasetAccess,
): Promise<ProductivityRow[]> {
  const start = performance.now();

  const { isAll, months } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;
  const deptCondition = departmentCondition(access, sql`department_name`);

  try {
    const res = await sql<ProductivityRow[]>`
      SELECT
        dispatcher_name AS name,
        department_name AS "departmentName",
        nilai::float AS score
      FROM helpdesk.helpdesk_productivity
      WHERE year = ${year}::int
        AND ${monthCondition}
        AND ${deptCondition}
        AND nilai > 75.0
      ORDER BY score DESC;
    `;
    console.log(
      `[Leaderboard Query] getProductivityRanking completed in ${(performance.now() - start).toFixed(2)}ms. Found ${res.length} rows.`,
    );
    return res;
  } catch (err) {
    console.error(
      `[Leaderboard Query Error] getProductivityRanking failed:`,
      err,
    );
    return [];
  }
}

export async function getProductivityRanking(
  year: number,
  month: string,
  dept: string,
  scope: DataScope,
) {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.productivity, dept);
  if (access.kind === "deny") return [];

  return unstable_cache(
    async () => getProductivityRankingRaw(year, month, access),
    ["leaderboard-productivity-v3", String(year), month, dept, scopeKey(scope), access.departments.join(",")],
    { revalidate: 300, tags: ["leaderboard-productivity-v2"] },
  )();
}

// 3. Service: Fetch Absensi counts aggregated from daily helpdesk_attendance logs
async function getAbsencesRaw(
  year: number,
  month: string,
  access: AllowedDatasetAccess,
) {
  const start = performance.now();
  const { isAll, months } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`a.month IN ${sql(months)}`;
  const deptCondition = departmentCondition(access, sql`a.department_name`);

  try {
    const res = await sql<
      {
        name: string;
        departmentName: string;
        totalHari: number;
        totalTelat: number;
        totalAbsenSebelah: number;
        totalTidakAbsen: number;
        nilai: number;
      }[]
    >`
      SELECT
        employee_name AS name,
        department_name AS "departmentName",
        COUNT(*)::int AS "totalHari",
        SUM(CASE WHEN is_late = true THEN 1 ELSE 0 END)::int AS "totalTelat",
        SUM(CASE WHEN is_single_absent = true THEN 1 ELSE 0 END)::int AS "totalAbsenSebelah",
        SUM(CASE WHEN is_no_attendance = true THEN 1 ELSE 0 END)::int AS "totalTidakAbsen",
        ROUND(
          (
            (COUNT(*) - SUM(CASE WHEN is_late = true OR is_single_absent = true OR is_no_attendance = true THEN 1 ELSE 0 END))::numeric
            / COUNT(*)
          ) * 100,
          2
        )::float AS nilai
      FROM helpdesk.helpdesk_attendance
      WHERE year = ${year}::int
        AND ${monthCondition}
        AND ${deptCondition}
      GROUP BY employee_name, employee_code, department_name
      HAVING SUM(CASE WHEN is_late = true THEN 1 ELSE 0 END) > 0
          OR SUM(CASE WHEN is_single_absent = true THEN 1 ELSE 0 END) > 0
          OR SUM(CASE WHEN is_no_attendance = true THEN 1 ELSE 0 END) > 0
      ORDER BY name ASC;
    `;
    console.log(
      `[Leaderboard Query] getAbsences completed in ${(performance.now() - start).toFixed(2)}ms. Found ${res.length} rows.`,
    );
    return res;
  } catch (err) {
    console.warn(
      `[Leaderboard Query Warning] getAbsences failed. Table helpdesk_attendance might not exist:`,
      err,
    );
    return [];
  }
}

export async function getAbsences(
  year: number,
  month: string,
  dept: string,
  scope: DataScope,
) {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.attendance, dept);
  if (access.kind === "deny") return [];

  return unstable_cache(
    async () => getAbsencesRaw(year, month, access),
    ["leaderboard-absences-v3", String(year), month, dept, scopeKey(scope), access.departments.join(",")],
    { revalidate: 300, tags: ["leaderboard-absences-v2"] },
  )();
}

// 4. Service: Fetch Low Ratings (1-2 Stars)
async function getLowRatingsRaw(
  year: number,
  month: string,
  access: AllowedDatasetAccess,
) {
  const start = performance.now();
  const { isAll, months } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;
  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  try {
    const res = await sql<{ ticketNo: string; name: string; rating: number }[]>`
      SELECT
        ticket_no AS "ticketNo",
        TRIM(split_part(dispatcher_name, ' (', 1)) AS name,
        rating
      FROM helpdesk.helpdesk_datachat
      WHERE year = ${year}::int
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND rating IN (1, 2)
      ORDER BY rating ASC, ticket_no ASC;
    `;
    console.log(
      `[Leaderboard Query] getLowRatings completed in ${(performance.now() - start).toFixed(2)}ms. Found ${res.length} rows.`,
    );
    return res;
  } catch (err) {
    console.error(`[Leaderboard Query Error] getLowRatings failed:`, err);
    return [];
  }
}

export async function getLowRatings(
  year: number,
  month: string,
  dept: string,
  scope: DataScope,
) {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, dept);
  if (access.kind === "deny") return [];

  return unstable_cache(
    async () => getLowRatingsRaw(year, month, access),
    ["leaderboard-low-ratings-v3", String(year), month, dept, scopeKey(scope), access.departments.join(",")],
    { revalidate: 300, tags: ["leaderboard-low-ratings-v2"] },
  )();
}

// 5. Service: Fetch OverSLA Tickets grouped by dispatcher and type with aggregated ticket_list
async function getOverSlaRaw(
  year: number,
  month: string,
  access: AllowedDatasetAccess,
): Promise<LeaderboardData["overSla"]> {
  const start = performance.now();

  const { isAll, months } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;
  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);

  try {
    const overSlaRaw = await sql<OverSlaRow[]>`
      SELECT
        'RESPONSE' AS type,
        TRIM(split_part(dispatcher_name, ' (', 1)) AS name,
        COUNT(*)::int AS ticket_count,
        ARRAY_AGG(ticket_no::text) AS ticket_list
      FROM helpdesk.helpdesk_datachat
      WHERE year = ${year}::int
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND sla_fetch = 'Tidak Sesuai SLA'
      GROUP BY TRIM(split_part(dispatcher_name, ' (', 1))

      UNION ALL

      SELECT
        'RESOLVED' AS type,
        TRIM(split_part(dispatcher_name, ' (', 1)) AS name,
        COUNT(*)::int AS ticket_count,
        ARRAY_AGG(ticket_no::text) AS ticket_list
      FROM helpdesk.helpdesk_datachat
      WHERE year = ${year}::int
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND sla_resolve = 'Tidak Sesuai SLA'
      GROUP BY TRIM(split_part(dispatcher_name, ' (', 1))

      ORDER BY type, ticket_count DESC, name;
    `;

    console.log(
      `[Leaderboard Query] getOverSla completed in ${(performance.now() - start).toFixed(2)}ms. Found ${overSlaRaw.length} rows.`,
    );
    return overSlaRaw.map((row) => ({
      type: row.type as "RESPONSE" | "RESOLVED",
      name: row.name,
      ticketCount: row.ticket_count,
      ticketList: row.ticket_list,
    }));
  } catch (err) {
    console.error(`[Leaderboard Query Error] getOverSla failed:`, err);
    return [];
  }
}

export async function getOverSla(
  year: number,
  month: string,
  dept: string,
  scope: DataScope,
) {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, dept);
  if (access.kind === "deny") return [];

  return unstable_cache(
    async () => getOverSlaRaw(year, month, access),
    ["leaderboard-over-sla-v3", String(year), month, dept, scopeKey(scope), access.departments.join(",")],
    { revalidate: 300, tags: ["leaderboard-over-sla-v2"] },
  )();
}

// Main Orchestrator running queries concurrently using Promise.all
export async function getLeaderboardData(
  year: number,
  month: string,
  dept: string,
  scope: DataScope,
): Promise<LeaderboardData> {
  const start = performance.now();

  try {
    const [eomData, productivity, absences, lowRatings, overSla] =
      await Promise.all([
        getEmployeeOfMonth(year, month, dept, scope),
        getProductivityRanking(year, month, dept, scope),
        getAbsences(year, month, dept, scope),
        getLowRatings(year, month, dept, scope),
        getOverSla(year, month, dept, scope),
      ]);

    const targetMonth = eomData.targetMonth || 9;
    const monthLabel = getLeaderboardMonthLabel(month, targetMonth);

    console.log(
      `[Leaderboard Service] getLeaderboardData orchestrated completed successfully in ${(performance.now() - start).toFixed(2)}ms.`,
    );
    return {
      employeeOfMonth: eomData.employees,
      targetMonth,
      monthLabel,
      productivity,
      absences,
      lowRatings,
      overSla,
    };
  } catch (err) {
    console.error(
      `[Leaderboard Service Error] Parallel orchestration failed:`,
      err,
    );
    return {
      employeeOfMonth: {},
      targetMonth: 9,
      monthLabel: getLeaderboardMonthLabel(month, 9),
      productivity: [],
      absences: [],
      lowRatings: [],
      overSla: [],
    };
  }
}

export interface OverSlaTicketDetail {
  ticketNo: string;
  date: string;
  dispatcher: string;
  division: string;
  subject: string;
  status: string;
}

async function getOverSlaDetailTicketsRaw(
  ticketNos: string[],
  access: AllowedDatasetAccess,
) {
  if (ticketNos.length === 0) return [];
  try {
    const res = await sql<OverSlaTicketDetail[]>`
      SELECT
        ticket_no as "ticketNo",
        TO_CHAR(time_input - INTERVAL '7 hours', 'YYYY-MM-DD') as date,
        COALESCE(dispatcher_name, 'No Dispatcher') as dispatcher,
        COALESCE(group_problem, '-') as division,
        COALESCE(subject, 'No Subject') as subject,
        COALESCE(status_ticket_descs, '-') as status
      FROM helpdesk.helpdesk_datachat
      WHERE ticket_no IN ${sql(ticketNos)}
        AND ${departmentCondition(access)}
        AND ${branchCondition(access)}
      ORDER BY (time_input - INTERVAL '7 hours') DESC;
    `;
    return res;
  } catch (err) {
    console.error(
      `[Leaderboard Query Error] getOverSlaDetailTickets failed:`,
      err,
    );
    return [];
  }
}

export async function getOverSlaDetailTickets(
  ticketNos: string[],
  scope: DataScope,
) {
  const validated = OverSlaDetailTicketsSchema.parse(ticketNos);
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat);
  if (access.kind === "deny") return [];

  return unstable_cache(
    async () => getOverSlaDetailTicketsRaw(validated, access),
    ["leaderboard-oversla-detail-v3", validated.sort().join(","), scopeKey(scope), access.departments.join(",")],
    { revalidate: 1800, tags: ["leaderboard-oversla-detail-v2"] },
  )();
}
