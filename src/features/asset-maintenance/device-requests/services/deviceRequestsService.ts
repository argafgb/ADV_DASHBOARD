"use server";

import { scopedCache as unstable_cache } from "@/lib/auth/scoped-cache";
import { sql } from "@/lib/db";
import { getRequestDataScope } from "@/lib/auth/request-scope";
import { scopedTable } from "@/lib/auth/scoped-table";
import { getRawSiteAliases } from "@/lib/site-utils";
import { parseCompanyFilter } from "@/lib/company-filter";
import type { AssetFilterInput, CompanyCode } from "@/types/asset-pm.types";
import type {
  DeviceRequestDbRow,
  DeviceRequestItem,
  DeviceRequestsData,
} from "../types";
import {
  cleanSiteName,
  normalizeDeviceType,
  resolveItemCompany,
  resolveRegion,
} from "../utils/deviceRequestsTransformer";

/* ============================================================================
 * 1. DEVICE REQUESTS / NETWORK ASSETS (pm_asset_it.network_assets)
 * ============================================================================ */

/**
 * Raw SQL Query: Fetches network device requests from PostgreSQL.
 */
export async function getDeviceRequestsRaw(
  input: AssetFilterInput,
): Promise<DeviceRequestsData> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);

    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];

    const siteClause =
      siteAliases.length > 0
        ? sql`AND UPPER(TRIM(REGEXP_REPLACE(REPLACE(intended, CHR(160), ' '), '^(ADV|WSS|WISESA)[[:space:]]+', '', 'i'))) = ANY(${siteAliases})`
        : sql``;

    const parsedComp = parseCompanyFilter(input.company);
    let companyClause = sql``;
    if (!parsedComp.isAll) {
      const condMap: Record<CompanyCode, ReturnType<typeof sql>> = {
        ADV: sql`(intended ILIKE 'ADV %' OR UPPER(barcode) LIKE 'ADV%')`,
        WSS: sql`(NOT (intended ILIKE 'ADV %') AND NOT (UPPER(barcode) LIKE 'ADV%'))`,
        ETR: sql`(intended ILIKE '%ETRAMA%' OR UPPER(barcode) LIKE 'ETR%')`,
      };
      if (parsedComp.codes.length === 1) {
        companyClause = sql`AND ${condMap[parsedComp.codes[0]]}`;
      } else if (parsedComp.codes.length === 2) {
        companyClause = sql`AND (${condMap[parsedComp.codes[0]]} OR ${condMap[parsedComp.codes[1]]})`;
      }
    }

    const rows = await sql<DeviceRequestDbRow[]>`
      SELECT 
        id::text as id,
        year::int as year,
        month::int as month,
        quarter::int as quarter,
        date::text as date,
        barcode,
        asset_name,
        intended,
        status,
        type
      FROM ${scopedTable("network_assets", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${siteClause}
        ${companyClause}
      ORDER BY date DESC, time_input DESC
    `;

    const items: DeviceRequestItem[] = rows.map((r) => {
      const site = cleanSiteName(r.intended);
      return {
        id: r.id,
        year: r.year,
        month: r.month,
        quarter: r.quarter,
        date: r.date,
        barcode: r.barcode,
        assetName: r.asset_name,
        intended: r.intended || site,
        site,
        company: resolveItemCompany(r.intended, r.barcode),
        region: resolveRegion(site),
        status: r.status || "Penambahan",
        type: normalizeDeviceType(r.type),
      };
    });

    return { items };
  } catch (error) {
    console.error("Error in getDeviceRequestsRaw:", error);
    return { items: [] };
  }
}

/**
 * Inline Cache Function: Public service wrapper for Device Requests data.
 */
export async function getDeviceRequestsData(
  input: AssetFilterInput,
): Promise<DeviceRequestsData> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";

  return unstable_cache(
    async () => getDeviceRequestsRaw(input),
    ["device-requests-data", input.year, siteKey, companyKey],
    { revalidate: 300, tags: ["device-requests"] },
  )();
}
