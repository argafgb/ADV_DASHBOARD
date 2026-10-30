import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";
import type { FilterOptions } from "../types/it-repair.types";

export interface OrgFilterOptions {
  years: string[];
}

export const EMPTY_ORG_FILTER_OPTIONS: OrgFilterOptions = {
  years: [],
};

interface YearRow {
  year: number;
}

/**
 * Daftar tahun yang benar-benar punya record, terbaru lebih dulu.
 */
async function getOrgFilterOptionsRaw(): Promise<OrgFilterOptions> {
  const start = performance.now();
  const rows = await sql<YearRow[]>`
    SELECT DISTINCT year
    FROM it_repair_maintenance.log_repair
    WHERE archived_at IS NULL AND year IS NOT NULL
    ORDER BY year DESC;
  `;
  console.log(`[DB] getAvailableYears in ${(performance.now() - start).toFixed(2)}ms`);
  return { years: rows.map((r) => String(r.year)) };
}

export async function getOrgFilterOptions(): Promise<OrgFilterOptions> {
  try {
    return await unstable_cache(() => getOrgFilterOptionsRaw(), ["itrm-org-filter-options"], {
      revalidate: 300,
      tags: ["itrm-org-filter-options"],
    })();
  } catch (err) {
    console.error("[DB] Failed getAvailableYears:", err);
    return EMPTY_ORG_FILTER_OPTIONS;
  }
}

interface OptionRow {
  kind: "location" | "ownership";
  value: string;
}

/**
 * Opsi chip Location dan Ownership di navbar, diturunkan dari nilai yang
 * benar-benar ada di data (urut terbanyak).
 */
async function getLocalFilterOptionsRaw(): Promise<FilterOptions> {
  const start = performance.now();
  const rows = await sql<OptionRow[]>`
    SELECT kind, value
    FROM (
      SELECT 'location' AS kind, location AS value, COUNT(*) AS n
      FROM it_repair_maintenance.log_repair
      WHERE archived_at IS NULL AND location IS NOT NULL
      GROUP BY location
      UNION ALL
      SELECT 'ownership' AS kind, ownership AS value, COUNT(*) AS n
      FROM it_repair_maintenance.log_repair
      WHERE archived_at IS NULL AND ownership IS NOT NULL
      GROUP BY ownership
    ) AS opsi
    ORDER BY kind, n DESC, value;
  `;
  console.log(`[DB] getLocalFilterOptions in ${(performance.now() - start).toFixed(2)}ms`);
  return {
    locations: rows.filter((r) => r.kind === "location").map((r) => r.value),
    ownerships: rows.filter((r) => r.kind === "ownership").map((r) => r.value),
  };
}

export async function getLocalFilterOptions(): Promise<FilterOptions> {
  try {
    return await unstable_cache(() => getLocalFilterOptionsRaw(), ["itrm-filter-options"], {
      revalidate: 300,
      tags: ["itrm-filter-options"],
    })();
  } catch (err) {
    console.error("[DB] Failed getLocalFilterOptions:", err);
    return { locations: [], ownerships: [] };
  }
}
