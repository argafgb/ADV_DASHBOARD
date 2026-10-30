import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sql } from "@/lib/db";
import { branchNameFilter } from "@/lib/network/branch-filter";
import type { BranchAccess } from "@/lib/network/branch-scope";
import type { IspLink } from "../types/network.types";

/**
 * ISP links per branch, in the shape data/ispLinks.ts exported.
 *
 * Feeds the Overview "Redundancy exposure" card and the whole of page 4.
 *
 * Inactive branches are excluded, matching every other count on these pages.
 * That drops the retired AMPASIT-CIDENG, which is where the combined
 * "AMPASIT & Cideng" Notion row currently lands — so both live branches read
 * as having no ISP record. Deliberate: the source is ambiguous about whether
 * that row is one shared link or one each, and guessing would invent an
 * answer. See MEMORY.md §8.
 */
export async function getIspLinks(
  access: BranchAccess,
): Promise<Record<string, IspLink[]>> {
  "use cache";
  cacheLife("hours");
  cacheTag("network-performance");

  const rows = await sql<
    {
      branch_display_name: string;
      isp_name: string;
      bandwidth_mbps: number | null;
    }[]
  >`
    SELECT branch_display_name, isp_name, bandwidth_mbps
      FROM network_performance.v_branch_isp_links
     WHERE branch_is_active
       AND ${branchNameFilter(access, "branch_display_name")}
     ORDER BY branch_display_name,
              bandwidth_mbps DESC NULLS LAST,
              isp_name
  `;

  const links: Record<string, IspLink[]> = {};
  for (const r of rows) {
    (links[r.branch_display_name] ??= []).push({
      v: r.isp_name,
      mbps: r.bandwidth_mbps,
    });
  }
  return links;
}

/**
 * Vendor name -> donut colour, replacing the hardcoded data/colors.ts map.
 *
 * Seeded in `isp_vendors.color_hex`, so a new vendor gets a colour by being
 * added to the source table rather than by editing the app. Vendors absent
 * from the map fall back to grey in the service.
 */
export async function getIspVendorColors(): Promise<Record<string, string>> {
  "use cache";
  cacheLife("hours");
  cacheTag("network-performance");

  const rows = await sql<{ name: string; color_hex: string | null }[]>`
    SELECT name, color_hex
      FROM network_performance.isp_vendors
     ORDER BY name
  `;

  const colors: Record<string, string> = {};
  for (const r of rows) {
    if (r.color_hex) colors[r.name] = r.color_hex.trim();
  }
  return colors;
}
