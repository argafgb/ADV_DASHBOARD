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
  type AllowedDatasetAccess,
} from "@/lib/access/scope-sql";

const parseNum = (val: unknown): number => {
  if (val === undefined || val === null) return 0;
  const n = typeof val === "number" ? val : Number.parseFloat(String(val));
  return Number.isNaN(n) ? 0 : n;
};

interface DispatcherReopenRow {
  avg_dispatch_seconds: number | string | null;
  reopened_count: number | string | null;
  total_tickets: number | string | null;
  reopen_percentage: number | string | null;
  avg_dispatch_formatted: string | null;
}

export interface DispatcherReopenStats {
  avgDispatcherSeconds: number;
  reopenedTickets: number;
  totalTickets: number;
  reopenPercentage: number;
  avgDispatchFormatted: string;
}

async function getDispatcherAndReopenStatsRaw(
  {
    year,
    month,
  }: {
    year: string;
    month: string;
  },
  access: AllowedDatasetAccess,
): Promise<DispatcherReopenStats> {
  const yearNum = Number.parseInt(year, 10) || 2026;
  const { isAll, endMonth, months } = parseMonthFilter(month);

  const deptCond = departmentCondition(access);
  const monthCondition = isAll ? sql`TRUE` : sql`month IN ${sql(months)}`;

  try {
    const data = await sql<DispatcherReopenRow[]>`
      WITH
      -- Informasi tanggal sekarang untuk validasi bulan
      current_info AS (
          SELECT
              EXTRACT(YEAR FROM CURRENT_DATE)::INT AS current_year,
              EXTRACT(MONTH FROM CURRENT_DATE)::INT AS current_month
      ),

      -- Validasi bulan (maksimal 2 bulan ke depan, hanya jika tahun = tahun sekarang dan bulan spesifik)
      valid_month AS (
          SELECT
              CASE
                  WHEN ${isAll}::boolean = TRUE THEN TRUE
                  WHEN ${yearNum}::int = (SELECT current_year FROM current_info)
                       AND ${endMonth}::int > (SELECT current_month + 2 FROM current_info) THEN FALSE
                  ELSE TRUE
              END AS is_valid
      ),

      -- Ambil tiket sesuai filter
      tickets AS (
          SELECT
              time_input,
              time_dispatch,
              reopen_count AS count_reopen
          FROM helpdesk.helpdesk_trx
          CROSS JOIN valid_month V
          WHERE V.is_valid = TRUE
            AND status IN (2, 3)   -- status selesai
            AND ${deptCond}
            AND year = ${yearNum}::int
            AND ${monthCondition}
      ),

      -- Agregasi metrik
      aggregated AS (
          SELECT
              COUNT(*)::int AS total_tickets,
              COUNT(CASE WHEN count_reopen = 1 THEN 1 END)::int AS reopened_count,
              ROUND(
                  COUNT(CASE WHEN count_reopen = 1 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0),
                  2
              )::float AS reopen_percentage,
              -- Rata-rata waktu dispatch (dalam detik) hanya untuk tiket yang sudah di-dispatch
              AVG(
                  EXTRACT(EPOCH FROM (time_dispatch - time_input))
              ) AS avg_dispatch_seconds
          FROM tickets
          WHERE time_dispatch IS NOT NULL   -- hanya yang sudah dipick
      )

      -- Output final
      SELECT
          total_tickets,
          reopened_count,
          reopen_percentage,
          COALESCE(avg_dispatch_seconds, 0)::float AS avg_dispatch_seconds,
          -- Format waktu dispatch menjadi menit dan detik
          CONCAT(
              FLOOR(COALESCE(avg_dispatch_seconds, 0) / 60)::TEXT, 'm ',
              ROUND(COALESCE(avg_dispatch_seconds, 0) % 60)::TEXT, 's'
          ) AS avg_dispatch_formatted
      FROM aggregated;
    `;

    if (data && data.length > 0) {
      const row = data[0];
      return {
        avgDispatcherSeconds: parseNum(row.avg_dispatch_seconds),
        reopenedTickets: parseNum(row.reopened_count),
        totalTickets: parseNum(row.total_tickets),
        reopenPercentage: parseNum(row.reopen_percentage),
        avgDispatchFormatted: row.avg_dispatch_formatted || "0m 0s",
      };
    }
  } catch (err) {
    console.warn(
      "[Database Query] Failed to fetch dispatcher reopened tickets stats from helpdesk_trx:",
      err,
    );
  }

  return {
    avgDispatcherSeconds: 0,
    reopenedTickets: 0,
    totalTickets: 0,
    reopenPercentage: 0,
    avgDispatchFormatted: "0m 0s",
  };
}

export async function getDispatcherAndReopenStats(
  {
    year,
    month,
    dept = "ALL",
  }: {
    year: string;
    month: string;
    dept?: string;
  },
  scope: DataScope,
): Promise<DispatcherReopenStats> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.trx, dept);
  if (access.kind === "deny") {
    return {
      avgDispatcherSeconds: 0,
      reopenedTickets: 0,
      totalTickets: 0,
      reopenPercentage: 0,
      avgDispatchFormatted: "0m 0s",
    };
  }

  return unstable_cache(
    async () => getDispatcherAndReopenStatsRaw({ year, month }, access),
    [
      "dispatcher-reopen-stats-v3",
      year,
      month,
      dept,
      scopeKey(scope),
      access.departments.join(","),
    ],
    { revalidate: 300, tags: ["sla-performance-dispatcher-v1"] },
  )();
}
