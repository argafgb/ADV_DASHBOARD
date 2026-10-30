import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { DASHBOARD_CONFIG } from "../utils/constants";

export interface OrgFilterOptions {
  years: string[];
  units: unknown[];
}

export const EMPTY_ORG_FILTER_OPTIONS: OrgFilterOptions = {
  years: [],
  units: [],
};

interface YearRow {
  year: number;
}

export async function getAvailableYearsRaw(): Promise<string[]> {
  try {
    const rows = await sql<YearRow[]>`
      SELECT DISTINCT EXTRACT(YEAR FROM created_at)::int AS year
      FROM kaldev_performance.kaldev_projects
      WHERE created_at IS NOT NULL
      ORDER BY year DESC;
    `;
    return rows.map((r) => String(r.year));
  } catch (err) {
    console.warn("[DB] Failed getAvailableYears:", err);
    return [...DASHBOARD_CONFIG.years];
  }
}

export async function getAvailableYears(): Promise<string[]> {
  return unstable_cache(
    async () => getAvailableYearsRaw(),
    ["kaldev-available-years"],
    { revalidate: 300, tags: ["kaldev-filter-options"] },
  )();
}

export async function getOrgFilterOptionsRaw(): Promise<OrgFilterOptions> {
  const years = await getAvailableYearsRaw();
  return { ...EMPTY_ORG_FILTER_OPTIONS, years };
}

export async function getOrgFilterOptions(): Promise<OrgFilterOptions> {
  return unstable_cache(
    () => getOrgFilterOptionsRaw(),
    ["kaldev-org-filter-options"],
    {
      revalidate: 300,
      tags: ["kaldev-filter-options"],
    },
  )();
}
