import "server-only";
import { sql } from "@/lib/db";
import type { SlaTrendPoint } from "../types/slaPerformance.types";

interface SlaTrendRow {
  month: number | string | null;
  problem_resolve: number | string | null;
  response_time: number | string | null;
}

const parseNum = (val: unknown): number => {
  if (val === undefined || val === null) return 0;
  const n = typeof val === "number" ? val : Number.parseFloat(String(val));
  return Number.isNaN(n) ? 0 : n;
};

function monthLabel(month: number) {
  const labels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return labels[month - 1] ?? String(month);
}

export async function getSlaTrendData({
  yearNum,
  trendEndMonth,
  deptKey,
}: {
  yearNum: number;
  trendEndMonth: number;
  deptKey: string;
}): Promise<SlaTrendPoint[]> {
  try {
    const rows = await sql<SlaTrendRow[]>`
      SELECT
        month,
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
        ) AS problem_resolve,
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
        ) AS response_time
      FROM helpdesk.helpdesk_sla
      WHERE year = ${yearNum}::int
        AND month BETWEEN 1 AND ${trendEndMonth}::int
      GROUP BY month
      ORDER BY month ASC;
    `;

    return rows.map((row) => {
      const monthNumber = parseNum(row.month);
      return {
        month: monthNumber,
        label: monthLabel(monthNumber),
        problemResolve: parseNum(row.problem_resolve) / 100,
        responseTime: parseNum(row.response_time) / 100,
      };
    });
  } catch (err) {
    console.warn("[Database Query] Failed to fetch SLA trend data:", err);
    return [];
  }
}
