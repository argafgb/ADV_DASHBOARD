import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import { resolveDatasetAccess, DATASET_CAPS, scopeKey, type DataScope } from "@/lib/access/data-scope";
import { departmentCondition, branchCondition, type AllowedDatasetAccess } from "@/lib/access/scope-sql";
import { TotalTicketDistribution } from "../types/totalTicket.types";
import { RatingsDistribution } from "../types/ratingDistribution.types";

type NumericValue = number | string | null | undefined;

interface TotalTicketDistributionRow {
  totalTickets: NumericValue;
  prevYearCount: NumericValue;
  currentYearCount: NumericValue;
  growthPercentage: NumericValue;
}

interface RatingDistributionRow {
  avgRating: NumericValue;
  totalTickets: NumericValue;
  stars5: NumericValue;
  stars4: NumericValue;
  stars3: NumericValue;
  stars2: NumericValue;
  stars1: NumericValue;
  stars0: NumericValue;
}

const parseNum = (val: NumericValue): number => {
  if (val === undefined || val === null) return 0;
  const n = typeof val === "number" ? val : parseFloat(val);
  return isNaN(n) ? 0 : n;
};

async function getTotalTicketDistributionRaw(
  yearFilter: string = "2026",
  monthFilter: string = "ALL",
  access: AllowedDatasetAccess,
): Promise<TotalTicketDistribution> {
  const start = performance.now();
  const yearNum = parseInt(yearFilter) || 2026;

  const { months, isAll, endMonth } = parseMonthFilter(monthFilter);

  try {
    const data = await sql<TotalTicketDistributionRow[]>`
      WITH current_info AS (
        SELECT
            EXTRACT(YEAR FROM CURRENT_DATE)::INT AS current_year,
            EXTRACT(MONTH FROM CURRENT_DATE)::INT AS current_month
      ),
      valid_month AS (
        SELECT
            CASE
                WHEN ${isAll}::boolean = TRUE THEN TRUE
                WHEN ${yearNum}::int = (SELECT current_year FROM current_info)
                    AND ${endMonth}::int > (SELECT current_month + 2 FROM current_info) THEN FALSE
                ELSE TRUE
            END AS is_valid
      ),
      tickets AS (
        SELECT
            B.ticket_no,
            B.year AS ticket_year
        FROM helpdesk.helpdesk_datachat B
        CROSS JOIN valid_month V
        WHERE V.is_valid = TRUE
          AND B.status_ticket IN ('2','3')
          AND ${departmentCondition(access, sql`B.department_name`)}
          AND ${branchCondition(access, sql`B.branch_name`)}
          AND (
              -- Current Year Filter
              (B.year = ${yearNum}::int AND (${isAll}::boolean = TRUE OR B.month IN ${sql(months)}))
              OR
              -- Previous Year Filter
              (B.year = (${yearNum}::int - 1) AND (${isAll}::boolean = TRUE OR B.month IN ${sql(months)}))
          )
      )
      SELECT
          COALESCE(SUM(CASE WHEN ticket_year = ${yearNum} THEN 1 ELSE 0 END), 0)::FLOAT AS "totalTickets",
          COALESCE(SUM(CASE WHEN ticket_year = (${yearNum}::int - 1) THEN 1 ELSE 0 END), 0)::FLOAT AS "prevYearCount",
          COALESCE(SUM(CASE WHEN ticket_year = ${yearNum}::int THEN 1 ELSE 0 END), 0)::FLOAT AS "currentYearCount",
          ROUND(
              CASE
                  WHEN COALESCE(SUM(CASE WHEN ticket_year = (${yearNum}::int - 1) THEN 1 ELSE 0 END), 0) = 0 THEN 100.0
                  ELSE ((COALESCE(SUM(CASE WHEN ticket_year = ${yearNum}::int THEN 1 ELSE 0 END), 0)
                        - COALESCE(SUM(CASE WHEN ticket_year = (${yearNum}::int - 1) THEN 1 ELSE 0 END), 0))
                        * 100.0 / COALESCE(SUM(CASE WHEN ticket_year = (${yearNum}::int - 1) THEN 1 ELSE 0 END), 0))
              END::NUMERIC,
          2) AS "growthPercentage"
      FROM tickets;
    `;

    if (data && data.length > 0) {
      return {
        totalTickets: parseNum(data[0].totalTickets),
        prevYearCount: parseNum(data[0].prevYearCount),
        currentYearCount: parseNum(data[0].currentYearCount),
        growthPercentage: parseNum(data[0].growthPercentage),
      };
    }

    const duration = performance.now() - start;
    console.log(
      `[Database Query] getOverallSLAData completed in ${duration.toFixed(2)}ms`,
    );
  } catch (err) {
    console.error(
      "[Database Query] Error occurred while fetching total ticket distribution data:",
      err,
    );
  }

  return {
    totalTickets: 0,
    prevYearCount: 0,
    currentYearCount: 0,
    growthPercentage: 0,
  };
}

async function getRatingDistributionRaw(
  yearFilter: string = "2026",
  monthFilter: string = "ALL",
  access: AllowedDatasetAccess,
): Promise<RatingsDistribution> {
  const start = performance.now();
  const yearNum = parseInt(yearFilter) || 2026;

  const { months, isAll } = parseMonthFilter(monthFilter);

  try {
    const data = await sql<RatingDistributionRow[]>`
      SELECT
          COALESCE(ROUND(AVG(rating)::numeric, 2), 0.00)::FLOAT AS "avgRating",
          COUNT(*)::INT AS "totalTickets",
          COALESCE(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0)::INT AS "stars5",
          COALESCE(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0)::INT AS "stars4",
          COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0)::INT AS "stars3",
          COALESCE(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0)::INT AS "stars2",
          COALESCE(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0)::INT AS "stars1",
          COALESCE(SUM(CASE WHEN rating IS NULL OR rating = 0 THEN 1 ELSE 0 END), 0)::INT AS "stars0"
      FROM helpdesk.helpdesk_datachat
      WHERE status_ticket IN ('2','3')
        AND ${departmentCondition(access, sql`department_name`)}
        AND ${branchCondition(access, sql`branch_name`)}
        AND year = ${yearNum}::int
        AND (${isAll}::boolean = TRUE OR month IN ${sql(months)})
    `;

    if (data && data.length > 0) {
      const avgRating = parseNum(data[0].avgRating);
      const totalTickets = parseNum(data[0].totalTickets);
      const stars5 = parseNum(data[0].stars5);
      const stars4 = parseNum(data[0].stars4);
      const stars3 = parseNum(data[0].stars3);
      const stars2 = parseNum(data[0].stars2);
      const stars1 = parseNum(data[0].stars1);
      const stars0 = parseNum(data[0].stars0);

      return {
        rating: avgRating,
        distTotal: totalTickets,
        dist: [
          { stars: 5, count: stars5 },
          { stars: 4, count: stars4 },
          { stars: 3, count: stars3 },
          { stars: 2, count: stars2 },
          { stars: 1, count: stars1 },
          { stars: 0, count: stars0 },
        ],
      };
    }

    const duration = performance.now() - start;
    console.log(
      `[Database Query] getOverallSLAData completed in ${duration.toFixed(2)}ms`,
    );
  } catch (err) {
    console.error(
      "[Database Query] Error occurred while fetching rating distribution data:",
      err,
    );
  }

  return {
    rating: 0,
    distTotal: 0,
    dist: [
      { stars: 5, count: 0 },
      { stars: 4, count: 0 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 },
      { stars: 0, count: 0 },
    ],
  };
}

export async function getTotalTicketDistribution(
  yearFilter: string = "2026",
  monthFilter: string = "ALL",
  scope: DataScope,
): Promise<TotalTicketDistribution> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat);
  if (access.kind === "deny") {
    return {
      totalTickets: 0,
      prevYearCount: 0,
      currentYearCount: 0,
      growthPercentage: 0,
    };
  }

  return unstable_cache(
    async () => getTotalTicketDistributionRaw(yearFilter, monthFilter, access),
    [
      "overview-total-ticket-dist-v3",
      yearFilter,
      monthFilter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["overview-sla-v2"] },
  )();
}

export async function getRatingDistribution(
  yearFilter: string = "2026",
  monthFilter: string = "ALL",
  scope: DataScope,
): Promise<RatingsDistribution> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat);
  if (access.kind === "deny") {
    return {
      rating: 0,
      distTotal: 0,
      dist: [
        { stars: 5, count: 0 },
        { stars: 4, count: 0 },
        { stars: 3, count: 0 },
        { stars: 2, count: 0 },
        { stars: 1, count: 0 },
        { stars: 0, count: 0 },
      ],
    };
  }

  return unstable_cache(
    async () => getRatingDistributionRaw(yearFilter, monthFilter, access),
    [
      "overview-rating-dist-v3",
      yearFilter,
      monthFilter,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["overview-sla-v2"] },
  )();
}
