import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import { resolveDatasetAccess, DATASET_CAPS, scopeKey, type DataScope } from "@/lib/access/data-scope";
import { departmentCondition, branchCondition, type AllowedDatasetAccess } from "@/lib/access/scope-sql";
import type { RootCauseQueryFilter } from "../types/rootCause.types";
import type { RatingFeedback } from "../types/ratingFeedback.types";

type NumericValue = number | string | null;

interface RatingFeedbackRow {
  avgRating: number;
  totalTickets: number;
  totalRated: number;
  totalNoRating: number;
  stars5: number;
  stars4: number;
  stars3: number;
  stars2: number;
  stars1: number;
  stars0: number;
}

interface RatingTicketRow {
  ticketNo: string;
  date: string;
  dispatcher: string;
  division: string;
  subject: string;
  comment: string;
}

interface CountRow {
  total: NumericValue;
}

function parseQuarter(quarter: string = "ALL"): number | null {
  const clean = quarter.trim().toUpperCase();
  if (clean === "ALL" || !clean) return null;
  const num = parseInt(clean.replace("Q", ""), 10);
  return isNaN(num) ? null : num;
}

async function getRatingFeedbackSummaryRaw(
  {
    year = "2026",
    month = "ALL",
    quarter = "ALL",
  }: RootCauseQueryFilter,
  access: AllowedDatasetAccess,
): Promise<RatingFeedback | null> {
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
    const data = await sql<RatingFeedbackRow[]>`
      SELECT
          COALESCE(ROUND(AVG(CASE WHEN rating > 0 THEN rating ELSE NULL END)::numeric, 2), 0.00)::FLOAT AS "avgRating",
          COUNT(*)::INT AS "totalTickets",
          COALESCE(SUM(CASE WHEN rating >= 1 AND rating <= 5 THEN 1 ELSE 0 END), 0)::INT AS "totalRated",
          COALESCE(SUM(CASE WHEN rating IS NULL OR rating = 0 THEN 1 ELSE 0 END), 0)::INT AS "totalNoRating",
          COALESCE(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0)::INT AS "stars5",
          COALESCE(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0)::INT AS "stars4",
          COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0)::INT AS "stars3",
          COALESCE(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0)::INT AS "stars2",
          COALESCE(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0)::INT AS "stars1",
          COALESCE(SUM(CASE WHEN rating IS NULL OR rating = 0 THEN 1 ELSE 0 END), 0)::INT AS "stars0"
      FROM helpdesk.helpdesk_datachat
      WHERE status_ticket IN ('2', '3')
        AND year = ${yearNum}::int
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND ${quarterCondition};
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getRatingFeedbackSummary completed in ${duration.toFixed(2)}ms`,
    );

    if (data && data.length > 0) {
      return {
        avgRating: data[0].avgRating,
        totalTickets: data[0].totalTickets,
        totalRated: data[0].totalRated,
        totalNoRating: data[0].totalNoRating,
        stars5: data[0].stars5,
        stars4: data[0].stars4,
        stars3: data[0].stars3,
        stars2: data[0].stars2,
        stars1: data[0].stars1,
        stars0: data[0].stars0,
      };
    }
    return null;
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch rating feedback summary:",
      err,
    );
    return null;
  }
}

export async function getRatingFeedbackSummary(
  filters: RootCauseQueryFilter = {},
  scope: DataScope,
): Promise<RatingFeedback | null> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return null;

  const {
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
  } = filters;

  return unstable_cache(
    async () =>
      getRatingFeedbackSummaryRaw(
        { year, month, dept, quarter },
        access,
      ),
    [
      "rating-feedback-summary-v3",
      String(year),
      month,
      dept,
      quarter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["rating-feedback-summary-v2"] },
  )();
}

async function getRatingDetailTicketsRaw(
  {
    rating = 5,
    year = "2026",
    month = "ALL",
    quarter = "ALL",
    limit = 50,
    offset = 0,
  }: {
    rating: number;
    year?: string | number;
    month?: string;
    dept?: string;
    quarter?: string;
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

  const ratingCondition =
    rating === 0
      ? sql`(rating IS NULL OR rating = 0)`
      : sql`rating = ${rating}::int`;

  try {
    const tickets = await sql<RatingTicketRow[]>`
      SELECT
          ticket_no as "ticketNo",
          TO_CHAR(time_input - INTERVAL '7 hours', 'YYYY-MM-DD') as date,
          COALESCE(dispatcher_name, 'No Dispatcher') as dispatcher,
          COALESCE(group_problem, '-') as division,
          COALESCE(subject, 'No Subject') as subject,
          COALESCE(resolve_reason, '-') as comment
      FROM helpdesk.helpdesk_datachat
      WHERE status_ticket IN ('2', '3')
        AND ${ratingCondition}
        AND year = ${yearNum}::int
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND ${quarterCondition}
        AND group_problem IS NOT NULL
      ORDER BY (time_input - INTERVAL '7 hours') DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const countResult = await sql<CountRow[]>`
      SELECT COUNT(*)::int as total
      FROM helpdesk.helpdesk_datachat
      WHERE status_ticket IN ('2', '3')
        AND ${ratingCondition}
        AND year = ${yearNum}::int
        AND ${monthCondition}
        AND ${deptCond}
        AND ${branchCond}
        AND ${quarterCondition};
    `;

    const duration = performance.now() - start;
    console.log(
      `[Database Query - RAW] getRatingDetailTickets completed in ${duration.toFixed(2)}ms`,
    );

    return {
      tickets,
      total: countResult[0]?.total ?? 0,
    };
  } catch (err) {
    console.error(
      "[Database Query] Failed to fetch rating detail tickets:",
      err,
    );
    return { tickets: [], total: 0 };
  }
}

export async function getRatingDetailTickets(
  filters: {
    rating: number;
    year?: string | number;
    month?: string;
    dept?: string;
    quarter?: string;
    limit?: number;
    offset?: number;
  },
  scope: DataScope,
) {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return { tickets: [], total: 0 };

  const {
    rating,
    year = "2026",
    month = "ALL",
    dept = "ALL",
    quarter = "ALL",
    limit = 50,
    offset = 0,
  } = filters;

  return unstable_cache(
    async () =>
      getRatingDetailTicketsRaw(
        {
          rating,
          year,
          month,
          dept,
          quarter,
          limit,
          offset,
        },
        access,
      ),
    [
      "rating-detail-tickets-v3",
      String(rating),
      String(year),
      month,
      dept,
      quarter,
      String(limit),
      String(offset),
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["rating-detail-tickets-v2"] },
  )();
}
