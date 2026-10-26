import { scopedCache as unstable_cache } from "@/lib/auth/scoped-cache";
import { sql } from "@/lib/db";
import { getRequestDataScope } from "@/lib/auth/request-scope";
import { scopedTable } from "@/lib/auth/scoped-table";
import { normalizeSiteName } from "@/lib/site-utils";
import type { SiteOption } from "@/types/asset-pm.types";

async function fetchSiteLookupOptionsFromDb(): Promise<SiteOption[]> {
  const dataScope = await getRequestDataScope();
  try {
    const rows = await sql<{ value: string }[]>`
      SELECT DISTINCT site AS value 
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
      ORDER BY value ASC;
    `;

    const normalizedSet = new Set<string>();
    for (const r of rows) {
      const norm = normalizeSiteName(r.value);
      if (norm) {
        normalizedSet.add(norm);
      }
    }

    const sortedSites = Array.from(normalizedSet).sort((a, b) =>
      a.localeCompare(b),
    );

    const options: SiteOption[] = sortedSites.map((site) => ({
      value: site,
      label: site,
    }));

    return options;
  } catch (error) {
    console.error("Failed to fetch site lookup options from database:", error);
    return [];
  }
}

/**
 * Fetches unique site names from the pm_asset_it_summary table for global filter lookup.
 * Uses Next.js unstable_cache with a 5-minute revalidation period (300 seconds).
 */
export const getSiteLookupOptions = unstable_cache(
  fetchSiteLookupOptionsFromDb,
  ["site-lookup-options-v6"],
  {
    revalidate: 300,
    tags: ["site-lookup-options-v6"],
  },
);
