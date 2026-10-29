import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { resolveDatasetAccess, DATASET_CAPS, scopeKey, type DataScope } from "@/lib/access/data-scope";
import { departmentCondition, branchCondition, type AllowedDatasetAccess } from "@/lib/access/scope-sql";
import { buildRatingSummary } from "../utils/ratingSummary";
import type { LowRatingTicket, TicketRatingData, TicketRatingFilter } from "../types/ticketRating.types";
import { validateRatingPeriod } from "../utils/ratingPeriod";

async function getTicketRatingRaw(filters: TicketRatingFilter, access: AllowedDatasetAccess): Promise<TicketRatingData> {
  const { months, isAll } = parseMonthFilter(filters.month);
  const quarter = Number(String(filters.quarter ?? "ALL").replace("Q", ""));
  const period = filters.startDate && filters.endDate
    ? sql`(time_input - INTERVAL '7 hours') >= ${filters.startDate}::date AND (time_input - INTERVAL '7 hours') < (${filters.endDate}::date + INTERVAL '1 day')`
    : sql`year = ${Number(filters.year) || 2026}::int
      AND ${isAll ? sql`TRUE` : sql`month IN ${sql(months)}`}
      AND ${quarter >= 1 && quarter <= 4 ? sql`quarter = ${quarter}::int` : sql`TRUE`}
  `;
  const conditions = sql`${period} AND ${departmentCondition(access)} AND ${branchCondition(access)}`;
  const [rows, lowRatingTickets] = await Promise.all([
    sql<{ stars: number; count: number }[]>`
      SELECT CASE WHEN rating IN (1,2,3,4,5) THEN rating ELSE 0 END::int AS stars, COUNT(*)::int AS count
      FROM helpdesk.helpdesk_datachat WHERE ${conditions} GROUP BY 1
    `,
    sql<LowRatingTicket[]>`
      SELECT ticket_no AS "ticketNo", rating,
        COALESCE(NULLIF(TRIM(dispatcher_name), ''), 'Belum ditentukan') AS support,
        COALESCE(department_name, '-') AS department,
        COALESCE(branch_name, '-') AS branch,
        COALESCE(to_char(time_input - INTERVAL '7 hours', 'YYYY-MM-DD HH24:MI'), '-') AS date,
        COALESCE(NULLIF(TRIM(subject), ''), 'Tanpa subjek') AS subject,
        COALESCE(status_ticket_descs, '-') AS status,
        COALESCE(NULLIF(TRIM(remarks_status), ''), 'Tidak ada keterangan status') AS notes,
        COALESCE(NULLIF(TRIM(resolve_reason), ''), 'Belum ada keterangan penyelesaian') AS resolution
      FROM helpdesk.helpdesk_datachat
      WHERE ${conditions} AND rating IN (1, 2)
      ORDER BY rating, (time_input - INTERVAL '7 hours') DESC NULLS LAST, ticket_no, seqno
    `,
  ]);
  return { ...buildRatingSummary(rows), lowRatingTickets };
}

export async function getTicketRatingData(filters: TicketRatingFilter, scope: DataScope) {
  const periodError = validateRatingPeriod(filters.startDate, filters.endDate);
  if (periodError) throw new Error(periodError);
  const access = resolveDatasetAccess(scope, DATASET_CAPS.datachat, filters.dept);
  if (access.kind === "deny") return { ...buildRatingSummary([]), lowRatingTickets: [] };
  return unstable_cache(
    () => getTicketRatingRaw(filters, access),
    ["ticket-rating-v4", String(filters.year), filters.month ?? "ALL", filters.quarter ?? "ALL", filters.dept ?? "ALL", filters.startDate ?? "", filters.endDate ?? "", scopeKey(scope)],
    { revalidate: 300, tags: ["ticket-rating"] },
  )();
}
