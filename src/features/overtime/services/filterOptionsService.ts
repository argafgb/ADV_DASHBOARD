import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";
import {
  EMPTY_ORG_FILTER_OPTIONS,
  type OrgFilterOptions,
  type OrgUnitOption,
} from "../utils/dashboard-filters";

interface YearRow {
  year: number;
}

interface UnitRow {
  area: string;
  level1_code: string;
  level1_name: string | null;
  level2_code: string | null;
  level2_name: string | null;
  periods: string[];
}

export async function getAvailableYearsRaw(): Promise<string[]> {
  const start = performance.now();

  try {
    const rows = await sql<YearRow[]>`
      SELECT DISTINCT year
      FROM overtime.overtime_transactions
      WHERE year IS NOT NULL
      ORDER BY year DESC;
    `;

    console.log(
      `[DB] getAvailableYears in ${(performance.now() - start).toFixed(2)}ms`,
    );

    return rows.map((r) => String(r.year));
  } catch (err) {
    console.error("[DB] Failed getAvailableYears:", err);
    return [];
  }
}

export async function getOrgFilterOptionsRaw(): Promise<OrgFilterOptions> {
  const start = performance.now();

  try {
    const [years, rows] = await Promise.all([
      getAvailableYearsRaw(),
      sql<UnitRow[]>`
        SELECT
          t.area,
          t.level1_code,
          MAX(t.level1_name) AS level1_name,
          t.level2_code,
          MAX(t.level2_name) AS level2_name,
          ARRAY_AGG(DISTINCT t.year || '-' || t.month) AS periods
        FROM overtime.overtime_transactions t
        WHERE t.status IN (2, 3)
          AND t.durasi_lembur > 0
          AND t.area IS NOT NULL
          AND t.level1_code IS NOT NULL
        GROUP BY t.area, t.level1_code, t.level2_code
        ORDER BY t.area, t.level1_code, t.level2_code;
      `,
    ]);

    console.log(
      `[DB] getOrgFilterOptions in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const units: OrgUnitOption[] = rows.map((r) => ({
      area: r.area,
      level1Code: r.level1_code,
      level1Name: r.level1_name ?? r.level1_code,
      level2Code: r.level2_code,
      level2Name: r.level2_name ?? r.level2_code,
      periods: r.periods,
    }));

    return { years, units };
  } catch (err) {
    console.error("[DB] Failed getOrgFilterOptions:", err);
    return EMPTY_ORG_FILTER_OPTIONS;
  }
}

export async function getAvailableYears(): Promise<string[]> {
  return unstable_cache(
    async () => getAvailableYearsRaw(),
    ["overtime-available-years"],
    {
      revalidate: 300,
      tags: ["overtime-org-filter-options"],
    },
  )();
}

export async function getOrgFilterOptions(): Promise<OrgFilterOptions> {
  return unstable_cache(
    async () => getOrgFilterOptionsRaw(),
    ["overtime-org-filter-options"],
    {
      revalidate: 300,
      tags: ["overtime-org-filter-options"],
    },
  )();
}
