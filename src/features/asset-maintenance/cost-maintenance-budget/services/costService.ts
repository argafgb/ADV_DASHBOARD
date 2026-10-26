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
import { getSummaryCompanyClause } from "@/lib/company-utils";
import { C } from "@/lib/utils";
import type {
  AssetFilterInput,
  BarDatum,
  DonutSlice,
} from "@/types/asset-pm.types";
import type {
  CostSiteRow,
  MonthlyCostComparisonResult,
  PaginatedCostResult,
  RepairMaintenanceSummary,
} from "../types/cost.types";
import {
  transformRepairMaintenanceSummary,
  type RawRepairMaintenanceDbRow,
} from "../utils/repairMaintenanceTransformer";
import {
  transformMonthlyCostComparison,
  type RawMonthlyCostDbRow,
} from "../utils/monthlyCostComparisonTransformer";
import {
  transformMonthlyCellDetail,
  type RawMonthlyCellDbRow,
  type MonthlyCellDetailResult,
} from "../utils/monthlyCellDetailTransformer";

export type CostSiteUnitFilter = "ALL" | "site" | "unit";

/* ============================================================================
 * 1. PROPORSI BIAYA & TOTAL BIAYA
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates cost proportion and total cost from pm_asset_it.pm_asset_it_summary.
 */
export async function getProporsiBiayaRaw(input: AssetFilterInput): Promise<{
  total: number;
  slices: DonutSlice[];
}> {
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

    const rows = await sql<{ site: string; total_cost: string }[]>`
      SELECT 
        UPPER(site) as site,
        SUM(COALESCE(total_cost, COALESCE(rent_cost, 0) + COALESCE(repair_maintenance_cost, 0), 0))::numeric as total_cost
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN', 'TEST')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
      GROUP BY 1
    `;

    let operationalCost = 0;
    let unitCost = 0;

    for (const r of rows) {
      const norm = normalizeSiteName(r.site);
      if (!norm) continue;

      const cost = Number(r.total_cost || 0);

      if (isUnitSite(norm)) {
        unitCost += cost;
      } else {
        operationalCost += cost;
      }
    }

    const grandTotal = operationalCost + unitCost;

    return {
      total: grandTotal,
      slices: [
        { label: "Operational", value: operationalCost, color: C.accent },
        { label: "Unit", value: unitCost, color: C.amber },
      ],
    };
  } catch (error) {
    console.error("Error in getProporsiBiayaRaw:", error);
    return {
      total: 0,
      slices: [
        { label: "Operational", value: 0, color: C.accent },
        { label: "Unit", value: 0, color: C.amber },
      ],
    };
  }
}

/**
 * Inline Cache Function: Public service wrapper for Total Cost data.
 */
export async function getTotalBiayaData(
  input: AssetFilterInput,
): Promise<number> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  const res = await unstable_cache(
    async () => getProporsiBiayaRaw(input),
    ["cost-total-biaya-data", input.year, input.month, siteKey, companyKey],
    { revalidate: 300, tags: ["cost-total-biaya"] },
  )();
  return res.total;
}

/**
 * Inline Cache Function: Public service wrapper for Cost Proportion Slices data.
 */
export async function getProporsiBiayaData(
  input: AssetFilterInput,
): Promise<DonutSlice[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  const res = await unstable_cache(
    async () => getProporsiBiayaRaw(input),
    ["cost-proporsi-biaya-data", input.year, input.month, siteKey, companyKey],
    { revalidate: 300, tags: ["cost-proporsi-biaya"] },
  )();
  return res.slices;
}

/**
 * Inline Cache Function: Public service wrapper for Combined Cost Proportion (Total + Slices) data.
 */
export async function getProporsiBiayaCombinedData(
  input: AssetFilterInput,
): Promise<{ total: number; slices: DonutSlice[] }> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getProporsiBiayaRaw(input),
    [
      "cost-proporsi-biaya-combined-data",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["cost-proporsi-biaya"] },
  )();
}

/* ============================================================================
 * 2. BIAYA PM PER SITE & UNIT
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates cost per site & unit from pm_asset_it.pm_asset_it_summary.
 */
export async function getCostPerSiteUnitRaw(
  input: AssetFilterInput,
  filter: CostSiteUnitFilter = "ALL",
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

    const rows = await sql<{ site: string; total_cost: string }[]>`
      SELECT 
        UPPER(site) as site,
        SUM(COALESCE(total_cost, COALESCE(rent_cost, 0) + COALESCE(repair_maintenance_cost, 0), 0))::numeric as total_cost
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN', 'TEST')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
        ${hasSearch ? sql`AND UPPER(site) ILIKE ${"%" + searchVal.toUpperCase() + "%"}` : sql``}
      GROUP BY 1
      ORDER BY total_cost DESC
    `;

    const mapped: BarDatum[] = rows.map((r) => {
      const cost = Number(r.total_cost || 0);
      const isUnit = isUnitSite(r.site);
      return {
        label: r.site,
        value: cost,
        color: isUnit ? C.amber : C.accent,
      };
    });

    let filtered = mapped;
    if (filter === "site") {
      filtered = mapped.filter((r) => !isUnitSite(r.label));
    } else if (filter === "unit") {
      filtered = mapped.filter((r) => isUnitSite(r.label));
    }

    filtered.sort((a, b) => b.value - a.value);
    return filtered;
  } catch (error) {
    console.error("Error in getCostPerSiteUnitRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for Cost Per Site & Unit data.
 */
export async function getCostPerSiteUnitData(
  input: AssetFilterInput,
  filter: CostSiteUnitFilter = "ALL",
  search: string = "",
): Promise<BarDatum[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getCostPerSiteUnitRaw(input, filter, search),
    [
      "cost-per-site-unit-data",
      input.year,
      input.month,
      siteKey,
      filter,
      search,
      companyKey,
    ],
    { revalidate: 300, tags: ["cost-per-site-unit"] },
  )();
}

/* ============================================================================
 * 2.5 REPAIR & MAINTENANCE SUMMARY
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates Repair & Maintenance summary metrics from pm_asset_it.pm_asset_it_summary.
 */
export async function getRepairMaintenanceSummaryRaw(
  input: AssetFilterInput,
): Promise<RepairMaintenanceSummary> {
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

    const dbRows = await sql<
      {
        company: string;
        device_type: string;
        device_count: string;
        total_rent: string;
        total_repair: string;
      }[]
    >`
      SELECT 
        COALESCE(company, 'Wisesa') as company,
        LOWER(device_type) as device_type,
        COUNT(id)::numeric as device_count,
        SUM(COALESCE(rent_cost, 0))::numeric as total_rent,
        SUM(COALESCE(repair_maintenance_cost, 0))::numeric as total_repair
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
      GROUP BY COALESCE(company, 'Wisesa'), LOWER(device_type)
    `;

    const mappedRows: RawRepairMaintenanceDbRow[] = dbRows.map((r) => ({
      company: r.company,
      device_type: r.device_type,
      device_count: Number(r.device_count || 0),
      total_rent: Number(r.total_rent || 0),
      total_repair: Number(r.total_repair || 0),
    }));

    return transformRepairMaintenanceSummary(mappedRows);
  } catch (error) {
    console.error("Error in getRepairMaintenanceSummaryRaw:", error);
    return transformRepairMaintenanceSummary([]);
  }
}

/**
 * Inline Cache Function: Public service wrapper for Repair & Maintenance Summary data.
 */
export async function getRepairMaintenanceSummaryData(
  input: AssetFilterInput,
): Promise<RepairMaintenanceSummary> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getRepairMaintenanceSummaryRaw(input),
    [
      "cost-repair-maintenance-summary-data",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["cost-repair-maintenance-summary"] },
  )();
}

/* ============================================================================
 * 3. PAGINATED DETAIL BIAYA PER SITE
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates paginated detail cost rows from pm_asset_it.pm_asset_it_summary.
 */
export async function getPaginatedCostRowsRaw(
  input: AssetFilterInput,
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  typeFilter: string = "ALL",
): Promise<PaginatedCostResult> {
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

    const summaryRows = await sql<
      {
        site: string;
        ws_cost: string;
        periph_cost: string;
        infra_cost: string;
        total_cost: string;
      }[]
    >`
      SELECT 
        UPPER(site) as site,
        SUM(CASE WHEN LOWER(device_type) = 'workstation' THEN COALESCE(total_cost, COALESCE(rent_cost, 0) + COALESCE(repair_maintenance_cost, 0), 0) ELSE 0 END)::numeric as ws_cost,
        SUM(CASE WHEN LOWER(device_type) = 'peripheral' THEN COALESCE(total_cost, COALESCE(rent_cost, 0) + COALESCE(repair_maintenance_cost, 0), 0) ELSE 0 END)::numeric as periph_cost,
        SUM(CASE WHEN LOWER(device_type) = 'infrastructure' THEN COALESCE(total_cost, COALESCE(rent_cost, 0) + COALESCE(repair_maintenance_cost, 0), 0) ELSE 0 END)::numeric as infra_cost,
        SUM(COALESCE(total_cost, COALESCE(rent_cost, 0) + COALESCE(repair_maintenance_cost, 0), 0))::numeric as total_cost
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN', 'TEST')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
        ${hasSearch ? sql`AND UPPER(site) ILIKE ${"%" + searchVal.toUpperCase() + "%"}` : sql``}
      GROUP BY 1
      HAVING SUM(COALESCE(total_cost, COALESCE(rent_cost, 0) + COALESCE(repair_maintenance_cost, 0), 0)) > 0
      ORDER BY total_cost DESC
    `;

    const mappedRows = summaryRows
      .map((r) => {
        const siteName = r.site;
        const isUnit = isUnitSite(siteName);
        const type = isUnit ? "Unit" : "Cabang";

        const ws = Number(r.ws_cost || 0);
        const periph = Number(r.periph_cost || 0);
        const infra = Number(r.infra_cost || 0);
        const cost = Number(r.total_cost || 0);

        return {
          site: siteName,
          type,
          ws,
          periph,
          infra,
          cost,
        };
      })
      .filter((r) => r.cost > 0);

    let filtered = mappedRows;
    if (typeFilter !== "ALL") {
      filtered = mappedRows.filter(
        (r) => r.type.toLowerCase() === typeFilter.toLowerCase(),
      );
    }

    filtered.sort((a, b) => b.cost - a.cost);

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startOffset = (safePage - 1) * pageSize;

    const paginatedSlice = filtered.slice(startOffset, startOffset + pageSize);
    const paginatedRows: CostSiteRow[] = paginatedSlice.map((r, i) => ({
      no: startOffset + i + 1,
      ...r,
    }));

    return {
      rows: paginatedRows,
      totalCount,
      totalPages,
      page: safePage,
      pageSize,
    };
  } catch (error) {
    console.error("Error in getPaginatedCostRowsRaw:", error);
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
 * Inline Cache Function: Public service wrapper for Paginated Cost Rows data.
 */
export async function getPaginatedCostRowsData(
  input: AssetFilterInput,
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  typeFilter: string = "ALL",
): Promise<PaginatedCostResult> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () =>
      getPaginatedCostRowsRaw(input, page, pageSize, search, typeFilter),
    [
      "cost-paginated-rows-data",
      input.year,
      input.month,
      siteKey,
      page.toString(),
      pageSize.toString(),
      search,
      typeFilter,
      companyKey,
    ],
    { revalidate: 300, tags: ["cost-paginated-rows"] },
  )();
}

/* ============================================================================
 * 4. MONTHLY R&M COST COMPARISON
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates Monthly R&M Cost Comparison matrix & region totals from pm_asset_it.pm_asset_it_summary.
 */
export async function getMonthlyCostComparisonRaw(
  input: AssetFilterInput,
): Promise<MonthlyCostComparisonResult> {
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

    const dbRows = await sql<
      {
        site: string;
        region: string;
        month: number | null;
        company: string;
        device_count: string;
        total_rent: string;
        total_repair: string;
        total_cost: string;
      }[]
    >`
      SELECT 
        UPPER(site) as site,
        COALESCE(region, '-') as region,
        month,
        COALESCE(company, 'Wisesa') as company,
        COUNT(id)::numeric as device_count,
        SUM(COALESCE(rent_cost, 0))::numeric as total_rent,
        SUM(COALESCE(repair_maintenance_cost, 0))::numeric as total_repair,
        SUM(COALESCE(total_cost, COALESCE(rent_cost, 0) + COALESCE(repair_maintenance_cost, 0), 0))::numeric as total_cost
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN', 'TEST')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
      GROUP BY 1, COALESCE(region, '-'), month, COALESCE(company, 'Wisesa')
      ORDER BY 1, month
    `;

    const mappedRows: RawMonthlyCostDbRow[] = dbRows.map((r) => ({
      site: r.site,
      region: r.region,
      month: r.month,
      company: r.company,
      device_count: Number(r.device_count || 0),
      total_rent: Number(r.total_rent || 0),
      total_repair: Number(r.total_repair || 0),
      total_cost: Number(r.total_cost || 0),
    }));

    return transformMonthlyCostComparison(mappedRows);
  } catch (error) {
    console.error("Error in getMonthlyCostComparisonRaw:", error);
    return transformMonthlyCostComparison([]);
  }
}

/**
 * Inline Cache Function: Public service wrapper for Monthly R&M Cost Comparison data.
 */
export async function getMonthlyCostComparisonData(
  input: AssetFilterInput,
): Promise<MonthlyCostComparisonResult> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getMonthlyCostComparisonRaw(input),
    [
      "cost-monthly-comparison-data-v2",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["cost-monthly-comparison"] },
  )();
}

/* ============================================================================
 * 5. MONTHLY CELL DETAIL MODAL METRICS
 * ============================================================================ */

const MONTH_NAME_TO_INT: Record<string, number> = {
  JANUARI: 1,
  FEBRUARI: 2,
  MARET: 3,
  APRIL: 4,
  MEI: 5,
  JUNI: 6,
  JULI: 7,
  AGUSTUS: 8,
  SEPTEMBER: 9,
  OKTOBER: 10,
  NOVEMBER: 11,
  DESEMBER: 12,
};

/**
 * Raw SQL Query: Calculates detailed cell metrics for a specific site, region, month & year from pm_asset_it.pm_asset_it_summary.
 */
export async function getMonthlyCellDetailRaw(
  input: AssetFilterInput,
  siteName: string,
  regionName: string,
  typeName: string,
  monthStr: string,
  rowTotal: number,
): Promise<MonthlyCellDetailResult> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const monthNum = MONTH_NAME_TO_INT[monthStr.toUpperCase().trim()];
    const isTanpaTgl = monthStr.toUpperCase().trim() === "TANPA TGL";
    const targetSiteStr = siteName.trim().toUpperCase();
    const companyClause = getSummaryCompanyClause(input.company);

    const dbRows = await sql<
      {
        company: string;
        device_type: string;
        device_count: string;
        total_rent: string;
        total_repair: string;
        total_cost: string;
      }[]
    >`
      SELECT 
        COALESCE(company, 'Wisesa') as company,
        LOWER(device_type) as device_type,
        COUNT(id)::numeric as device_count,
        SUM(COALESCE(rent_cost, 0))::numeric as total_rent,
        SUM(COALESCE(repair_maintenance_cost, 0))::numeric as total_repair,
        SUM(COALESCE(total_cost, COALESCE(rent_cost, 0) + COALESCE(repair_maintenance_cost, 0), 0))::numeric as total_cost
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site <> ''
        AND UPPER(site) = ${targetSiteStr}
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${
          monthNum
            ? sql`AND month = ${monthNum}`
            : isTanpaTgl
              ? sql`AND (month IS NULL OR month = 0)`
              : sql``
        }
        ${companyClause}
      GROUP BY COALESCE(company, 'Wisesa'), LOWER(device_type)
    `;

    const mappedRows: RawMonthlyCellDbRow[] = dbRows.map((r) => ({
      company: r.company,
      device_type: r.device_type,
      device_count: Number(r.device_count || 0),
      total_rent: Number(r.total_rent || 0),
      total_repair: Number(r.total_repair || 0),
      total_cost: Number(r.total_cost || 0),
    }));

    return transformMonthlyCellDetail(
      mappedRows,
      siteName,
      regionName,
      typeName,
      monthStr,
      rowTotal,
    );
  } catch (error) {
    console.error("Error in getMonthlyCellDetailRaw:", error);
    return transformMonthlyCellDetail(
      [],
      siteName,
      regionName,
      typeName,
      monthStr,
      rowTotal,
    );
  }
}

/**
 * Inline Cache Function: Public service wrapper for Monthly Cell Detail Modal data.
 */
export async function getMonthlyCellDetailData(
  input: AssetFilterInput,
  siteName: string,
  regionName: string,
  typeName: string,
  monthStr: string,
  rowTotal: number,
): Promise<MonthlyCellDetailResult> {
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () =>
      getMonthlyCellDetailRaw(
        input,
        siteName,
        regionName,
        typeName,
        monthStr,
        rowTotal,
      ),
    ["cost-monthly-cell-detail-data", input.year, siteName, monthStr, companyKey],
    { revalidate: 300, tags: ["cost-monthly-cell-detail"] },
  )();
}
