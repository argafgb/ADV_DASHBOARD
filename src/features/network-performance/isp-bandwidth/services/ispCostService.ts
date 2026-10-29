import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sql } from "@/lib/db";
import { branchFilter } from "@/lib/network/branch-filter";
import type { BranchAccess } from "@/lib/network/branch-scope";
import type { RawInternetCostRow } from "../types/isp-cost.types";

/**
 * Direct raw query to network_performance.network_internet_cost
 * with canonical branch lookup, ISP vendor alias resolution,
 * and multi-tier bandwidth fallback (Notion ISP links + standard vendor rate).
 */
export async function getInternetCostRowsRaw(
  access: BranchAccess,
): Promise<RawInternetCostRow[]> {
  try {
    const rows = await sql<
      {
        year: number | string;
        month: number | string;
        quarter: number | string;
        raw_branch_name: string;
        branch_display_name: string | null;
        operation_region: string | null;
        raw_isp: string;
        isp_name: string | null;
        bandwidth_mbps: number | string | null;
        cost: number | string;
      }[]
    >`
      WITH alias_map AS (
        SELECT 'COS' AS raw_name, 'COS SEMARANG' AS canonical_name
        UNION ALL SELECT 'GA', 'SENEN GA'
        UNION ALL SELECT 'YOGYA', 'YOGYAKARTA'
        UNION ALL SELECT 'TANAH ABANG', 'TANAH ABANG 5'
        UNION ALL SELECT 'BATAM BARU', 'BATAM'
      )
      SELECT 
        nic.year,
        nic.month,
        nic.quarter,
        nic.branch_name AS raw_branch_name,
        COALESCE(b.display_name, nic.branch_name) AS branch_display_name,
        COALESCE(b.operation_region, 'Others') AS operation_region,
        nic.isp AS raw_isp,
        COALESCE(v.name, va.alias, nic.isp) AS isp_name,
        nic.bandwith AS bandwidth_mbps,
        nic.cost
      FROM network_performance.network_internet_cost nic
      LEFT JOIN alias_map am 
        ON UPPER(TRIM(nic.branch_name)) = am.raw_name
      LEFT JOIN network_performance.v_branch_lookup bl 
        ON bl.lookup_key = COALESCE(am.canonical_name, UPPER(TRIM(nic.branch_name)))
      LEFT JOIN network_performance.branches b 
        ON b.id = bl.branch_id
      LEFT JOIN network_performance.isp_vendors v 
        ON UPPER(TRIM(v.code)) = UPPER(TRIM(nic.isp)) 
        OR UPPER(TRIM(v.name)) = UPPER(TRIM(nic.isp))
      LEFT JOIN network_performance.isp_vendor_aliases va 
        ON UPPER(TRIM(va.alias)) = UPPER(TRIM(nic.isp))
      -- Rows whose branch name resolves to no branch have b.id NULL and are
      -- therefore only visible to unrestricted users.
      WHERE ${branchFilter(access, "b.id")}
      ORDER BY nic.year, nic.month, nic.branch_name, nic.isp
    `;

    return rows.map((r) => ({
      year: Number(r.year),
      month: Number(r.month),
      quarter: Number(r.quarter),
      raw_branch_name: r.raw_branch_name,
      branch_display_name: r.branch_display_name,
      operation_region: r.operation_region,
      raw_isp: r.raw_isp,
      isp_name: r.isp_name,
      bandwidth_mbps:
        r.bandwidth_mbps != null ? Number(r.bandwidth_mbps) : null,
      cost: Number(r.cost),
    }));
  } catch (err) {
    console.error("Failed to query network_internet_cost:", err);
    return [];
  }
}

/**
 * Public cached function exporting internet cost rows.
 */
export async function getInternetCostRowsData(
  access: BranchAccess,
): Promise<RawInternetCostRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("network-performance");

  return getInternetCostRowsRaw(access);
}
