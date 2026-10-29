import "server-only";

import { unstable_cache } from "next/cache";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { DATASET_CAPS, resolveDatasetAccess, scopeKey, type DataScope } from "@/lib/access/data-scope";
import { departmentCondition, type AllowedDatasetAccess } from "@/lib/access/scope-sql";

export interface ReopenedTicketDetail {
  ticketNo: string;
  date: string;
  department: string;
}

const PAGE_SIZE = 10;

async function getReopenedTicketDetailsRaw(
  year: string,
  month: string,
  page: number,
  access: AllowedDatasetAccess,
): Promise<ReopenedTicketDetail[]> {
  const yearNum = Number.parseInt(year, 10) || 2026;
  const { isAll, endMonth, months } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;
  const deptCondition = departmentCondition(access);
  const offset = (page - 1) * PAGE_SIZE;

  return sql<ReopenedTicketDetail[]>`
    SELECT
      COALESCE(ticket_no, '-') AS "ticketNo",
      COALESCE(TO_CHAR(time_input - INTERVAL '7 hours', 'YYYY-MM-DD HH24:MI'), '-') AS date,
      COALESCE(department_name, '-') AS department
    FROM helpdesk.helpdesk_trx
    WHERE status IN (2, 3)
      AND ${deptCondition}
      AND year = ${yearNum}::int
      AND ${monthCondition}
      AND time_dispatch IS NOT NULL
      AND reopen_count = 1
      AND (
        ${isAll}::boolean
        OR ${yearNum}::int <> EXTRACT(YEAR FROM CURRENT_DATE)::int
        OR ${endMonth}::int <= EXTRACT(MONTH FROM CURRENT_DATE)::int + 2
      )
    ORDER BY time_input DESC NULLS LAST, ticket_no
    LIMIT ${PAGE_SIZE} OFFSET ${offset};
  `;
}

export async function getReopenedTicketDetails(
  filters: { year: string; month: string; dept: string; page: number },
  scope: DataScope,
): Promise<ReopenedTicketDetail[]> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.trx, filters.dept);
  if (access.kind === "deny") return [];

  return unstable_cache(
    async () => getReopenedTicketDetailsRaw(filters.year, filters.month, filters.page, access),
    ["reopened-ticket-details-v1", filters.year, filters.month, filters.dept, String(filters.page), scopeKey(scope), access.departments.join(",")],
    { revalidate: 300, tags: ["sla-performance-dispatcher-v1"] },
  )();
}
