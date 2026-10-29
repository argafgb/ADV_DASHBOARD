import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import {
  resolveDatasetAccess,
  DATASET_CAPS,
  scopeKey,
  type DataScope,
} from "@/lib/access/data-scope";
import {
  departmentCondition,
  branchCondition,
  type AllowedDatasetAccess,
} from "@/lib/access/scope-sql";
import type {
  TicketArrivalScheduleData,
  TicketArrivalScheduleFilters,
  TicketArrivalHourRow,
} from "../types/ticketSchedule.types";

function parseQuarter(quarter: string = "ALL"): number | null {
  const clean = quarter.trim().toUpperCase();
  if (clean === "ALL" || !clean) return null;
  const num = Number.parseInt(clean.replace("Q", ""), 10);
  return Number.isNaN(num) ? null : num;
}

async function getTicketArrivalScheduleRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: TicketArrivalScheduleFilters,
  access: AllowedDatasetAccess,
): Promise<TicketArrivalScheduleData> {
  const yearNum =
    typeof year === "number" ? year : Number.parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const quarterNum = parseQuarter(quarter);

  const monthCondition =
    !isAll && months.length > 0
      ? sql`month IN ${sql(months)}`
      : sql`TRUE`;
  const deptCond = departmentCondition(access);
  const branchCond = branchCondition(access);
  const quarterCondition =
    quarterNum !== null && quarterNum >= 1 && quarterNum <= 4
      ? sql`quarter = ${quarterNum}::int`
      : sql`TRUE`;

  try {
    const result = await sql<(TicketArrivalHourRow & { latest: string | null })[]>`
      SELECT
        TO_CHAR((time_input - INTERVAL '7 hours')::date, 'YYYY-MM-DD') AS date,
        EXTRACT(HOUR FROM (time_input - INTERVAL '7 hours'))::int AS hour,
        department_name AS department,
        COUNT(DISTINCT ticket_no)::int AS tickets,
        TO_CHAR(MAX(MAX(time_input - INTERVAL '7 hours')) OVER (), 'YYYY-MM-DD HH24:MI:SS') AS latest
      FROM helpdesk.helpdesk_datachat
      WHERE year = ${yearNum}::int
        AND time_input IS NOT NULL
        AND ticket_no IS NOT NULL
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND ${quarterCondition}
      GROUP BY (time_input - INTERVAL '7 hours')::date, EXTRACT(HOUR FROM (time_input - INTERVAL '7 hours')), department_name
      ORDER BY date, hour;
    `;

    return {
      rows: result.map(({ date, hour, department, tickets }) => ({
        date,
        hour,
        department,
        tickets,
      })),
      latestTimeInput: result[0]?.latest ?? null,
    };
  } catch (error) {
    console.error(
      "[Database Query] Failed to fetch ticket arrival schedule:",
      error,
    );
    throw error;
  }
}

export async function getTicketArrivalSchedule(
  filters: TicketArrivalScheduleFilters = {},
  scope: DataScope,
): Promise<TicketArrivalScheduleData> {
  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;

  const caps = DATASET_CAPS.datachat;
  const access = resolveDatasetAccess(scope, caps, dept);
  if (access.kind === "deny") {
    return { rows: [], latestTimeInput: null };
  }

  return unstable_cache(
    async () =>
      getTicketArrivalScheduleRaw({ year, month, dept, quarter }, access),
    [
      "ticket-arrival-schedule-v5",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 60, tags: ["ticket-arrival-schedule-v2"] },
  )();
}
