import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sql } from "@/lib/db";
import { branchFilter } from "@/lib/network/branch-filter";
import type { BranchAccess } from "@/lib/network/branch-scope";
import type { Branch, RegionGroup } from "../types/network.types";

/**
 * Branch directory + the R1–R6 / CID operational grouping.
 *
 * `operation_region` supersedes the hardcoded ISLANDS map in data/regions.ts,
 * which was stale: it had 6 groups instead of 7, folded the Jakarta sites into
 * R3, and omitted Tanah Abang 5 entirely (so that branch silently vanished
 * from the region summary).
 *
 * Only active branches are returned. WIRACARITA and the retired AMPASIT-CIDENG
 * are inactive and stay out of every count, exactly as `mapped()` intended.
 */
export async function getBranches(access: BranchAccess): Promise<Branch[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("network-performance");

  const rows = await sql<
    {
      name: string;
      district: string | null;
      region: string | null;
      operation_region: string | null;
    }[]
  >`
    SELECT display_name AS name, district, region, operation_region
      FROM network_performance.branches
     WHERE is_active AND ${branchFilter(access, "id")}
     ORDER BY display_name
  `;

  return rows.map((r) => ({
    name: r.name,
    district: r.district,
    region: r.region ?? "—",
    operationRegion: r.operation_region ?? "Lainnya",
  }));
}

/**
 * Region rows for "Ringkasan per region", in display order.
 *
 * `area` is composed from the geographic regions the group actually contains
 * rather than a hand-written label, so it stays correct if a branch moves
 * group. R1 -> "Sumatera", R6 -> "Jawa Timur, Sulawesi", and so on.
 */
export async function getRegionGroups(
  access: BranchAccess,
): Promise<RegionGroup[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("network-performance");

  const rows = await sql<
    { operation_region: string; areas: string[]; branches: string[] }[]
  >`
    SELECT operation_region,
           array_agg(DISTINCT region)       FILTER (WHERE region IS NOT NULL) AS areas,
           array_agg(display_name ORDER BY display_name)                      AS branches
      FROM network_performance.branches
     WHERE is_active AND operation_region IS NOT NULL
       AND ${branchFilter(access, "id")}
     GROUP BY operation_region
     ORDER BY operation_region
  `;

  return rows.map((r) => ({
    name: r.operation_region,
    area: (r.areas ?? []).join(", "),
    branches: r.branches,
  }));
}
