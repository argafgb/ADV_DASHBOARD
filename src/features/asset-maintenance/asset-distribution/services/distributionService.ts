"use server";

import { scopedCache as unstable_cache } from "@/lib/auth/scoped-cache";
import { sql } from "@/lib/db";
import { getRequestDataScope } from "@/lib/auth/request-scope";
import { scopedTable } from "@/lib/auth/scoped-table";
import { parseMonthFilter } from "@/lib/filter-utils";
import {
  getRawSiteAliases,
  normalizeSiteName,
  isUnitSite,
} from "@/lib/site-utils";
import { formatDeviceLabel } from "@/lib/device-utils";
import { getSummaryCompanyClause } from "@/lib/company-utils";
import { C } from "@/lib/utils";
import type { AssetFilterInput, BarDatum } from "@/types/asset-pm.types";
import type {
  InventoryDetailItem,
  InventoryDetailGroup,
  InventorySiteRow,
  PaginatedInventoryResult,
} from "../types/distribution.types";

export type BreakdownGroup = "workstation" | "infrastructure" | "peripheral";
export type SiteUnitFilter = "ALL" | "site" | "unit";

/* ============================================================================
 * 1. DEVICE PER SITE & UNIT (Total Perangkat per Site & Unit)
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates total device count per site & unit from pm_asset_it.pm_asset_it_summary.
 */
export async function getDevicePerSiteUnitRaw(
  input: AssetFilterInput,
  filter: SiteUnitFilter = "ALL",
  search: string = "",
): Promise<BarDatum[]> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter =
      !parsedMonth.isAll && parsedMonth.cumulativeMonths.length > 0;
    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const companyClause = getSummaryCompanyClause(input.company);
    const searchVal = search.trim();
    const hasSearch = searchVal.length > 0;

    const rows = await sql<{ site: string; total: string }[]>`
      SELECT
        UPPER(site) as site,
        COUNT(*)::int as total
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
        ${hasSearch ? sql`AND UPPER(site) ILIKE ${"%" + searchVal.toUpperCase() + "%"}` : sql``}
      GROUP BY UPPER(site)
      ORDER BY total DESC
    `;

    const mappedMap = new Map<string, BarDatum & { isUnit: boolean }>();
    for (const r of rows) {
      const canonicalSite = normalizeSiteName(r.site);
      if (!canonicalSite) continue;

      const isUnit = isUnitSite(canonicalSite);
      const val = Number(r.total || 0);
      const existing = mappedMap.get(canonicalSite);
      if (existing) {
        existing.value += val;
      } else {
        mappedMap.set(canonicalSite, {
          label: canonicalSite,
          value: val,
          color: isUnit ? C.amber : C.accent,
          isUnit,
        });
      }
    }

    const mapped = Array.from(mappedMap.values());

    let result = mapped;
    if (filter === "site") {
      result = mapped.filter((item) => !item.isUnit);
    } else if (filter === "unit") {
      result = mapped.filter((item) => item.isUnit);
    }

    return result
      .map((item) => ({
        label: item.label,
        value: item.value,
        color: item.color,
      }))
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error("Error in getDevicePerSiteUnitRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for Device per Site & Unit data.
 */
export async function getDevicePerSiteUnitData(
  input: AssetFilterInput,
  filter: SiteUnitFilter = "ALL",
  search: string = "",
): Promise<BarDatum[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getDevicePerSiteUnitRaw(input, filter, search),
    [
      "distribution-device-per-site-unit-data",
      input.year,
      input.month,
      siteKey,
      filter,
      search,
      companyKey,
    ],
    { revalidate: 300, tags: ["distribution-device-per-site-unit"] },
  )();
}

/* ============================================================================
 * 2. DEVICE TYPE BREAKDOWN (Breakdown Tipe Perangkat)
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates breakdown count per device group from pm_asset_it.pm_asset_it_summary.
 */
export async function getBreakdownRaw(
  input: AssetFilterInput,
  group: BreakdownGroup,
): Promise<BarDatum[]> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter =
      !parsedMonth.isAll && parsedMonth.cumulativeMonths.length > 0;
    const siteVal =
      input.site && input.site !== "ALL" ? input.site.trim() : null;
    const companyClause = getSummaryCompanyClause(input.company);

    const rows = await sql<{ device: string; total: string }[]>`
      SELECT
        device,
        COUNT(*)::int as total
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE LOWER(device_type) = LOWER(${group})
        AND site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})` : sql``}
        ${siteVal ? sql`AND UPPER(site) = UPPER(${siteVal})` : sql``}
        ${companyClause}
      GROUP BY device
      ORDER BY total DESC
    `;

    const colors = [C.accent, C.green, C.amber, C.blue2];
    return rows.map((r, i) => ({
      label: formatDeviceLabel(r.device),
      value: Number(r.total || 0),
      color: colors[i % colors.length],
    }));
  } catch (error) {
    console.error("Error in getBreakdownRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for Breakdown Device data.
 */
export async function getBreakdownData(
  input: AssetFilterInput,
  group: BreakdownGroup,
): Promise<BarDatum[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getBreakdownRaw(input, group),
    [
      "distribution-breakdown-data",
      input.year,
      input.month,
      siteKey,
      group,
      companyKey,
    ],
    { revalidate: 300, tags: ["distribution-breakdown"] },
  )();
}

/* ============================================================================
 * 3. INVENTORY DETAIL ROWS (Rincian Perangkat & Biaya per Site)
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates inventory detail rows per site from pm_asset_it.pm_asset_it_summary.
 */
export async function getInventoryRowsRaw(
  input: AssetFilterInput,
): Promise<InventorySiteRow[]> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter =
      !parsedMonth.isAll && parsedMonth.cumulativeMonths.length > 0;
    const siteVal =
      input.site && input.site !== "ALL" ? input.site.trim() : null;
    const companyClause = getSummaryCompanyClause(input.company);

    const targetMonthClause = hasMonthFilter
      ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})`
      : sql``;

    const summaryRows = await sql<
      {
        site: string;
        workstation: string;
        infrastructure: string;
        peripheral: string;
        total: string;
        biaya: string;
      }[]
    >`
      SELECT
        UPPER(site) as site,
        COUNT(CASE WHEN LOWER(device_type) = 'workstation' THEN 1 END)::int as workstation,
        COUNT(CASE WHEN LOWER(device_type) = 'infrastructure' THEN 1 END)::int as infrastructure,
        COUNT(CASE WHEN LOWER(device_type) = 'peripheral' THEN 1 END)::int as peripheral,
        COUNT(*)::int as total,
        SUM(COALESCE(total_cost, 0))::numeric as biaya
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${targetMonthClause}
        ${siteVal ? sql`AND UPPER(site) = UPPER(${siteVal})` : sql``}
        ${companyClause}
      GROUP BY UPPER(site)
      ORDER BY total DESC
    `;

    const detailRows = await sql<
      {
        site: string;
        device_type: string;
        device: string;
        total: string;
      }[]
    >`
      SELECT
        UPPER(site) as site,
        LOWER(device_type) as device_type,
        device,
        COUNT(*)::int as total
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${targetMonthClause}
        ${siteVal ? sql`AND UPPER(site) = UPPER(${siteVal})` : sql``}
        ${companyClause}
      GROUP BY UPPER(site), LOWER(device_type), device
      ORDER BY total DESC
    `;

    const detailMap = new Map<string, Map<string, InventoryDetailItem[]>>();

    for (const d of detailRows) {
      const siteKey = d.site;
      const typeKey = d.device_type;
      if (!detailMap.has(siteKey)) {
        detailMap.set(siteKey, new Map());
      }
      const siteGroupMap = detailMap.get(siteKey)!;
      if (!siteGroupMap.has(typeKey)) {
        siteGroupMap.set(typeKey, []);
      }
      siteGroupMap.get(typeKey)!.push({
        label: formatDeviceLabel(d.device),
        value: Number(d.total || 0),
      });
    }

    return summaryRows.map((r, i) => {
      const siteName = r.site;
      const siteType = isUnitSite(siteName) ? "Unit" : "Operational";
      const siteDetails = detailMap.get(siteName);

      const workstationItems = siteDetails?.get("workstation") || [];
      const infrastructureItems = siteDetails?.get("infrastructure") || [];
      const peripheralItems = siteDetails?.get("peripheral") || [];

      const detailGroups: InventoryDetailGroup[] = [
        { label: "Workstation", items: workstationItems },
        { label: "Infrastructure", items: infrastructureItems },
        { label: "Peripheral", items: peripheralItems },
      ];

      return {
        no: i + 1,
        site: siteName,
        type: siteType,
        workstation: Number(r.workstation || 0),
        infrastructure: Number(r.infrastructure || 0),
        peripheral: Number(r.peripheral || 0),
        total: Number(r.total || 0),
        biaya: Number(r.biaya || 0),
        detail: detailGroups,
      };
    });
  } catch (error) {
    console.error("Error in getInventoryRowsRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for Inventory Rows data.
 */
export async function getInventoryRowsData(
  input: AssetFilterInput,
): Promise<InventorySiteRow[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getInventoryRowsRaw(input),
    [
      "distribution-inventory-rows-data",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["distribution-inventory-rows"] },
  )();
}

/* ============================================================================
 * 4. PAGINATED INVENTORY ROWS (Tabel Detail Inventaris Berhalaman)
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates paginated inventory detail rows from pm_asset_it.pm_asset_it_summary.
 */
export async function getPaginatedInventoryRowsRaw(
  input: AssetFilterInput,
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  typeFilter: string = "ALL",
): Promise<PaginatedInventoryResult> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter =
      !parsedMonth.isAll && parsedMonth.cumulativeMonths.length > 0;
    const siteVal =
      input.site && input.site !== "ALL" ? input.site.trim() : null;
    const companyClause = getSummaryCompanyClause(input.company);
    const searchVal = search.trim();
    const hasSearch = searchVal.length > 0;

    const searchClause = hasSearch
      ? sql`AND site ILIKE ${"%" + searchVal + "%"}`
      : sql``;

    const targetMonthClause = hasMonthFilter
      ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})`
      : sql``;

    const summaryRows = await sql<
      {
        site: string;
        workstation: string;
        infrastructure: string;
        peripheral: string;
        total: string;
        biaya: string;
      }[]
    >`
      SELECT
        UPPER(site) as site,
        COUNT(CASE WHEN LOWER(device_type) = 'workstation' THEN 1 END)::int as workstation,
        COUNT(CASE WHEN LOWER(device_type) = 'infrastructure' THEN 1 END)::int as infrastructure,
        COUNT(CASE WHEN LOWER(device_type) = 'peripheral' THEN 1 END)::int as peripheral,
        COUNT(*)::int as total,
        SUM(COALESCE(total_cost, 0))::numeric as biaya
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${targetMonthClause}
        ${siteVal ? sql`AND UPPER(site) = UPPER(${siteVal})` : sql``}
        ${companyClause}
        ${searchClause}
      GROUP BY UPPER(site)
      ORDER BY total DESC
    `;

    let filteredSummary = summaryRows.map((r) => {
      const siteName = r.site;
      const siteType = isUnitSite(siteName) ? "Unit" : "Operational";
      return { ...r, siteType };
    });

    if (typeFilter === "Unit") {
      filteredSummary = filteredSummary.filter((r) => r.siteType === "Unit");
    } else if (typeFilter === "Operational") {
      filteredSummary = filteredSummary.filter(
        (r) => r.siteType === "Operational",
      );
    }

    const totalCount = filteredSummary.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);

    const startOffset = (safePage - 1) * pageSize;
    const paginatedSummary = filteredSummary.slice(
      startOffset,
      startOffset + pageSize,
    );

    if (paginatedSummary.length === 0) {
      return {
        rows: [],
        totalCount,
        totalPages,
        page: safePage,
        pageSize,
      };
    }

    const targetSites = paginatedSummary.map((r) => r.site);

    const detailRows = await sql<
      {
        site: string;
        device_type: string;
        device: string;
        total: string;
      }[]
    >`
      SELECT
        CASE
          WHEN UPPER(site) IN ('JAKARTA', 'JAKARTA-CIDENG', 'CIDENG') AND code_division IS NOT NULL AND code_division <> ''
          THEN REGEXP_REPLACE(UPPER(code_division), '^DIV-?', '')
          ELSE UPPER(site)
        END as site,
        LOWER(device_type) as device_type,
        device,
        COUNT(*)::int as total
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE (
        CASE
          WHEN UPPER(site) IN ('JAKARTA', 'JAKARTA-CIDENG', 'CIDENG') AND code_division IS NOT NULL AND code_division <> ''
          THEN REGEXP_REPLACE(UPPER(code_division), '^DIV-?', '')
          ELSE UPPER(site)
        END
      ) = ANY(${targetSites})
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})` : sql``}
        ${companyClause}
      GROUP BY 1, LOWER(device_type), device
      ORDER BY total DESC
    `;

    const detailMap = new Map<string, Map<string, InventoryDetailItem[]>>();
    for (const d of detailRows) {
      const siteKey = d.site;
      const typeKey = d.device_type;
      if (!detailMap.has(siteKey)) {
        detailMap.set(siteKey, new Map());
      }
      const siteGroupMap = detailMap.get(siteKey)!;
      if (!siteGroupMap.has(typeKey)) {
        siteGroupMap.set(typeKey, []);
      }
      siteGroupMap.get(typeKey)!.push({
        label: formatDeviceLabel(d.device),
        value: Number(d.total || 0),
      });
    }

    const rows: InventorySiteRow[] = paginatedSummary.map((r, i) => {
      const siteName = r.site;
      const siteDetails = detailMap.get(siteName);

      const workstationItems = siteDetails?.get("workstation") || [];
      const infrastructureItems = siteDetails?.get("infrastructure") || [];
      const peripheralItems = siteDetails?.get("peripheral") || [];

      const detailGroups: InventoryDetailGroup[] = [
        { label: "Workstation", items: workstationItems },
        { label: "Infrastructure", items: infrastructureItems },
        { label: "Peripheral", items: peripheralItems },
      ];

      return {
        no: startOffset + i + 1,
        site: siteName,
        type: r.siteType,
        workstation: Number(r.workstation || 0),
        infrastructure: Number(r.infrastructure || 0),
        peripheral: Number(r.peripheral || 0),
        total: Number(r.total || 0),
        biaya: Number(r.biaya || 0),
        detail: detailGroups,
      };
    });

    return {
      rows,
      totalCount,
      totalPages,
      page: safePage,
      pageSize,
    };
  } catch (error) {
    console.error("Error in getPaginatedInventoryRowsRaw:", error);
    return {
      rows: [],
      totalCount: 0,
      totalPages: 1,
      page: 1,
      pageSize,
    };
  }
}

/**
 * Inline Cache Function: Public service wrapper for Paginated Inventory Rows data.
 */
export async function getPaginatedInventoryRowsData(
  input: AssetFilterInput,
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  typeFilter: string = "ALL",
): Promise<PaginatedInventoryResult> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () =>
      getPaginatedInventoryRowsRaw(input, page, pageSize, search, typeFilter),
    [
      "distribution-paginated-inventory-rows-data",
      input.year,
      input.month,
      siteKey,
      page.toString(),
      pageSize.toString(),
      search,
      typeFilter,
      companyKey,
    ],
    { revalidate: 300, tags: ["distribution-paginated-inventory-rows"] },
  )();
}
