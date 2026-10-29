import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";
import {
  STANDARD_REGIONS,
  ALL_STANDARD_SITES,
  type RegionMetadata,
} from "../types/access.types";
import { buildBranchOptions } from "@/lib/access/branch-options";

export type RegionMetadataItem = RegionMetadata;
export { STANDARD_REGIONS, ALL_STANDARD_SITES };

async function getBranchOptionsRaw(): Promise<string[]> {
  try {
    const rows = await sql<{ branch: string }[]>`
      SELECT DISTINCT UPPER(TRIM(branch_name)) AS branch
      FROM helpdesk.helpdesk_datachat
      WHERE NULLIF(TRIM(branch_name), '') IS NOT NULL
      ORDER BY 1;
    `;
    // Test tickets create site names with no data anywhere; never offer them.
    return buildBranchOptions(ALL_STANDARD_SITES, rows.map((r) => r.branch));
  } catch (err) {
    console.warn("[METADATA_BRANCH_OPTIONS_WARNING] Memakai fallback daftar cabang standar:", err);
    return [...ALL_STANDARD_SITES];
  }
}

export async function getBranchOptionsData(): Promise<string[]> {
  return unstable_cache(
    async () => getBranchOptionsRaw(),
    ["access-metadata-branches-v4"],
    { revalidate: 3600, tags: ["access-branch-options"] },
  )();
}

export async function getRegionsRaw(): Promise<RegionMetadataItem[]> {
  try {
    const rows = await sql<{
      code: string;
      name: string;
      is_active: boolean;
      branches: string[];
    }[]>`
      SELECT
        r.code,
        r.name,
        r.is_active,
        COALESCE(
          (SELECT array_agg(rb.branch_name ORDER BY rb.branch_name)
           FROM helpdesk.access_region_branch rb
           WHERE rb.region_code = r.code),
          '{}'
        ) AS branches
      FROM helpdesk.access_region r
      ORDER BY r.code;
    `;

    if (rows.length > 0) {
      return rows.map((r) => ({
        code: r.code,
        name: r.name,
        isActive: r.is_active,
        branches: r.branches.map((b) => b.toUpperCase()),
      }));
    }

    return [];
  } catch (err) {
    console.warn("[METADATA_REGIONS_WARNING] Gagal memuat mapping region:", err);
    return [];
  }
}
