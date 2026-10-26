"use server";

import { scopedCache as unstable_cache } from "@/lib/auth/scoped-cache";
import { sql } from "@/lib/db";
import { getRequestDataScope } from "@/lib/auth/request-scope";
import { scopedTable } from "@/lib/auth/scoped-table";
import { parseMonthFilter } from "@/lib/filter-utils";
import { getRawSiteAliases, normalizeSiteName } from "@/lib/site-utils";
import { getTemuanCompanyClause } from "@/lib/company-utils";
import { C } from "@/lib/utils";
import type {
  AssetFilterInput,
  BarDatum,
  DonutSlice,
  FindingStatus,
} from "@/types/asset-pm.types";
import {
  RESOLUTION_STATUSES,
  type BranchResolution,
  type CategoryTrendPoint,
  type FindingRow,
  type ReplacementPoint,
} from "../types/findings.types";

import { mapDbStatus } from "../utils/findingsUtils";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export interface PaginatedFindingResult {
  data: FindingRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ============================================================================
 * 1. TEMUAN PER KATEGORI
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates findings count per category from pm_asset_it.pm_asset_it_temuan.
 */
export async function getTemuanPerKategoriRaw(
  input: AssetFilterInput,
): Promise<BarDatum[]> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter = !parsedMonth.isAll && parsedMonth.months.length > 0;
    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const companyClause = getTemuanCompanyClause(input.company, dataScope);

    const rows = await sql`
      SELECT
        COALESCE(NULLIF(TRIM(category_problem), ''), 'Lainnya') as label,
        COUNT(*)::int as value
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
      GROUP BY label
      ORDER BY value DESC
    `;

    if (rows.length === 0) return [];

    const colors: string[] = [C.accent, C.green, C.amber, C.red, C.blue2];
    const top: BarDatum[] = rows.slice(0, 5).map((r, i) => ({
      label: String(r.label),
      value: Number(r.value || 0),
      color: colors[i % colors.length],
    }));

    const restSlice = rows.slice(5);
    const restSum = restSlice.reduce((sum, r) => sum + Number(r.value || 0), 0);

    if (restSum > 0) {
      const subItems = restSlice.map((r) => ({
        label: String(r.label),
        value: Number(r.value || 0),
      }));

      top.push({
        label: "Lainnya",
        value: restSum,
        color: C.muted,
        subItems,
      });
    }

    return top;
  } catch (error) {
    console.error("Error in getTemuanPerKategoriRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for Finding Category Breakdown data.
 */
export async function getTemuanPerKategoriData(
  input: AssetFilterInput,
): Promise<BarDatum[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getTemuanPerKategoriRaw(input),
    [
      "findings-temuan-per-kategori-data",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["findings-temuan-per-kategori"] },
  )();
}

/* ============================================================================
 * 2. TREN KATEGORI PER BULAN
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates monthly category problem trends.
 */
export async function getCategoryTrendRaw(
  input: AssetFilterInput,
): Promise<CategoryTrendPoint[]> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const siteVal =
      input.site && input.site !== "ALL" ? input.site.trim() : null;
    const companyClause = getTemuanCompanyClause(input.company, dataScope);

    const rows = await sql`
      SELECT
        month::int as month,
        SUM(CASE WHEN UPPER(category_problem) = 'GENERAL' THEN 1 ELSE 0 END)::int as general,
        SUM(CASE WHEN UPPER(category_problem) IN ('BATTERY', 'MOUSE', 'LAPTOP', 'RAM', 'SSD', 'STORAGE', 'KEYBOARD', 'CHARGER', 'MINI PC', 'MONITOR', 'LCD', 'FAN', 'MOTHERBOARD', 'SPEAKER', 'WIFI CARD', 'RAM DAN BATERAI', 'LAPTOP DAN KEYBOARD', 'MOUSE DAN KEYBOARD', 'KABEL POWER') THEN 1 ELSE 0 END)::int as hardware,
        SUM(CASE WHEN UPPER(category_problem) IN ('AKUN ADMINISTRATOR', 'APLIKASI SOP', 'OS', 'SOFTWARE', 'HOSTNAME', 'BARCODE', 'PASSWOARD') THEN 1 ELSE 0 END)::int as software,
        SUM(CASE WHEN UPPER(category_problem) IN ('RUSAK', 'HILANG', 'MUTASI', 'IT') THEN 1 ELSE 0 END)::int as lifecycle
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${siteVal ? sql`AND UPPER(site) = UPPER(${siteVal})` : sql``}
        ${companyClause}
      GROUP BY month
      ORDER BY month ASC
    `;

    if (rows.length === 0) return [];

    const monthMap = new Map<number, CategoryTrendPoint>();
    const monthsToUse = parsedMonth.isAll
      ? [1, 2, 3, 4, 5, 6, 7]
      : parsedMonth.months;

    for (const m of monthsToUse) {
      monthMap.set(m, {
        month: MONTH_NAMES[m - 1] || `Bln ${m}`,
        general: 0,
        hardware: 0,
        software: 0,
        lifecycle: 0,
      });
    }

    for (const r of rows) {
      const m = Number(r.month);
      if (monthMap.has(m)) {
        monthMap.set(m, {
          month: MONTH_NAMES[m - 1] || `Bln ${m}`,
          general: Number(r.general || 0),
          hardware: Number(r.hardware || 0),
          software: Number(r.software || 0),
          lifecycle: Number(r.lifecycle || 0),
        });
      }
    }

    return Array.from(monthMap.values());
  } catch (error) {
    console.error("Error in getCategoryTrendRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for Category Trend data.
 */
export async function getCategoryTrendData(
  input: AssetFilterInput,
): Promise<CategoryTrendPoint[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getCategoryTrendRaw(input),
    [
      "findings-category-trend-data",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["findings-category-trend"] },
  )();
}

/* ============================================================================
 * 3. STATUS RESOLUSI & EVENT LIFECYCLE ASSET
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates finding resolution status slices.
 */
export async function getStatusResolusiRaw(
  input: AssetFilterInput,
): Promise<DonutSlice[]> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter = !parsedMonth.isAll && parsedMonth.months.length > 0;
    const siteVal =
      input.site && input.site !== "ALL" ? input.site.trim() : null;
    const companyClause = getTemuanCompanyClause(input.company, dataScope);

    const rows = await sql`
      SELECT
        status_temuan,
        COUNT(*)::int as value
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteVal ? sql`AND UPPER(site) = UPPER(${siteVal})` : sql``}
        ${companyClause}
      GROUP BY status_temuan
    `;

    if (rows.length === 0) return [];

    let selesai = 0;
    let dalamProses = 0;
    let belumDitangani = 0;

    for (const r of rows) {
      const st = r.status_temuan
        ? String(r.status_temuan).toUpperCase().trim()
        : "";
      const val = Number(r.value || 0);

      if (st === "DONE" || st === "SELESAI") selesai += val;
      else if (st === "ON PROGRESS" || st === "DALAM PROSES")
        dalamProses += val;
      else belumDitangani += val;
    }

    return [
      { label: "Selesai", value: selesai, color: C.green },
      { label: "Dalam Proses", value: dalamProses, color: C.accent },
      { label: "Belum Ditangani", value: belumDitangani, color: C.amber },
      { label: "Aset Decommissioned", value: 0, color: C.violet },
      { label: "Lainnya", value: 0, color: C.muted },
    ];
  } catch (error) {
    console.error("Error in getStatusResolusiRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for Resolution Status data.
 */
export async function getStatusResolusiData(
  input: AssetFilterInput,
): Promise<DonutSlice[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getStatusResolusiRaw(input),
    [
      "findings-status-resolusi-data",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["findings-status-resolusi"] },
  )();
}

/**
 * Raw SQL Query: Calculates event lifecycle donut slices & flagged percentage.
 */
export async function getEventLifecycleRaw(input: AssetFilterInput): Promise<{
  slices: DonutSlice[];
  flaggedPct: string;
}> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter = !parsedMonth.isAll && parsedMonth.months.length > 0;
    const siteVal =
      input.site && input.site !== "ALL" ? input.site.trim() : null;
    const companyClause = getTemuanCompanyClause(input.company, dataScope);

    const rows = await sql`
      SELECT
        SUM(CASE WHEN UPPER(category_problem) = 'RUSAK' OR UPPER(action_it) LIKE '%RUSAK%' THEN 1 ELSE 0 END)::int as rusak,
        SUM(CASE WHEN UPPER(category_problem) = 'MUTASI' OR UPPER(action_it) LIKE '%MUTASI%' THEN 1 ELSE 0 END)::int as mutasi,
        SUM(CASE WHEN UPPER(action_it) LIKE '%DIKELUARKAN DARI DATA ASSET%' OR UPPER(action_it) LIKE '%KEMBALI%' THEN 1 ELSE 0 END)::int as not_used,
        SUM(CASE WHEN UPPER(category_problem) = 'HILANG' OR UPPER(action_it) LIKE '%HILANG%' THEN 1 ELSE 0 END)::int as hilang,
        COUNT(*)::int as total
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteVal ? sql`AND UPPER(site) = UPPER(${siteVal})` : sql``}
        ${companyClause}
    `;

    if (rows.length === 0 || Number(rows[0].total || 0) === 0) {
      return {
        slices: [
          { label: "Rusak", value: 0, color: C.red },
          { label: "Mutasi", value: 0, color: C.amber },
          { label: "Not Used", value: 0, color: C.muted },
          { label: "Hilang", value: 0, color: C.accent },
        ],
        flaggedPct: "0%",
      };
    }

    const r = rows[0];
    const rusak = Number(r.rusak || 0);
    const mutasi = Number(r.mutasi || 0);
    const notUsed = Number(r.not_used || 0);
    const hilang = Number(r.hilang || 0);
    const totalAsset = Number(r.total || 1);

    const slices: DonutSlice[] = [
      { label: "Rusak", value: rusak, color: C.red },
      { label: "Mutasi", value: mutasi, color: C.amber },
      { label: "Not Used", value: notUsed, color: C.muted },
      { label: "Hilang", value: hilang, color: C.accent },
    ];

    const flagged = rusak + mutasi + notUsed + hilang;
    const pct = totalAsset > 0 ? (flagged / totalAsset) * 100 : 0;

    return { slices, flaggedPct: pct.toFixed(1) + "%" };
  } catch (error) {
    console.error("Error in getEventLifecycleRaw:", error);
    return {
      slices: [
        { label: "Rusak", value: 0, color: C.red },
        { label: "Mutasi", value: 0, color: C.amber },
        { label: "Not Used", value: 0, color: C.muted },
        { label: "Hilang", value: 0, color: C.accent },
      ],
      flaggedPct: "0%",
    };
  }
}

/**
 * Inline Cache Function: Public service wrapper for Event Lifecycle data.
 */
export async function getEventLifecycleData(
  input: AssetFilterInput,
): Promise<{ slices: DonutSlice[]; flaggedPct: string }> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getEventLifecycleRaw(input),
    [
      "findings-event-lifecycle-data",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["findings-event-lifecycle"] },
  )();
}

/* ============================================================================
 * 4. REPLACEMENT VS NEW ASSET
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates replacement vs new asset monthly trends.
 */
export async function getReplacementVsNewRaw(
  input: AssetFilterInput,
): Promise<ReplacementPoint[]> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter = !parsedMonth.isAll && parsedMonth.months.length > 0;

    const rows = await sql`
      SELECT
        month::int as month,
        SUM(COALESCE(change, 0))::int as replacement,
        SUM(COALESCE(addition, 0))::int as new_asset
      FROM ${scopedTable("pm_asset_it_lifecycle", dataScope)}
      WHERE 1=1
        AND (LOWER(device_type) = 'workstation' OR LOWER(device_name) IN ('laptop', 'pc', 'mini pc', 'notebook', 'minipc', 'workstation'))
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
      GROUP BY month
      ORDER BY month ASC
    `;

    if (rows.length === 0) return [];

    const monthMap = new Map<number, ReplacementPoint>();
    const monthsToUse = parsedMonth.isAll
      ? [1, 2, 3, 4, 5, 6, 7]
      : parsedMonth.months;

    for (const m of monthsToUse) {
      monthMap.set(m, {
        month: MONTH_NAMES[m - 1] || `Bln ${m}`,
        replacement: 0,
        newAsset: 0,
      });
    }

    for (const r of rows) {
      const m = Number(r.month);
      if (monthMap.has(m)) {
        monthMap.set(m, {
          month: MONTH_NAMES[m - 1] || `Bln ${m}`,
          replacement: Number(r.replacement || 0),
          newAsset: Number(r.new_asset || 0),
        });
      }
    }

    return Array.from(monthMap.values());
  } catch (error) {
    console.error("Error in getReplacementVsNewRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for Replacement vs New Asset data.
 */
export async function getReplacementVsNewData(
  input: AssetFilterInput,
): Promise<ReplacementPoint[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getReplacementVsNewRaw(input),
    [
      "findings-replacement-vs-new-data",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["findings-replacement-vs-new"] },
  )();
}

/* ============================================================================
 * 5. STATUS RESOLUSI PER CABANG
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates resolution status distribution per branch.
 */
export async function getStatusPerCabangRaw(
  input: AssetFilterInput,
): Promise<BranchResolution[]> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter = !parsedMonth.isAll && parsedMonth.months.length > 0;
    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const companyClause = getTemuanCompanyClause(input.company, dataScope);

    const rows = await sql`
      SELECT
        site,
        status_temuan,
        COUNT(*)::int as value
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
      GROUP BY site, status_temuan
      ORDER BY site ASC
    `;

    if (rows.length === 0) return [];

    const branchMap = new Map<string, Map<FindingStatus, number>>();

    for (const r of rows) {
      const canonical = normalizeSiteName(String(r.site || ""));
      if (!canonical) continue;

      const status = mapDbStatus(
        r.status_temuan ? String(r.status_temuan) : null,
      );
      const val = Number(r.value || 0);

      if (!branchMap.has(canonical)) {
        branchMap.set(canonical, new Map());
      }
      const stMap = branchMap.get(canonical)!;
      stMap.set(status, (stMap.get(status) || 0) + val);
    }

    const result: BranchResolution[] = [];

    for (const [branch, stMap] of branchMap.entries()) {
      const segments = RESOLUTION_STATUSES.map((s) => ({
        label: s.label,
        value: stMap.get(s.label as FindingStatus) || 0,
        color: s.color,
      })).filter((s) => s.value > 0);

      const total = segments.reduce((sum, s) => sum + s.value, 0);
      if (total > 0) {
        result.push({ branch, total, segments });
      }
    }

    return result.sort((a, b) => b.total - a.total).slice(0, 10);
  } catch (error) {
    console.error("Error in getStatusPerCabangRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for Resolution Status per Branch data.
 */
export async function getStatusPerCabangData(
  input: AssetFilterInput,
): Promise<BranchResolution[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getStatusPerCabangRaw(input),
    [
      "findings-status-per-cabang-data",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["findings-status-per-cabang"] },
  )();
}

/* ============================================================================
 * 6. TABEL DETAIL TEMUAN & LIFECYCLE
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates paginated finding detail rows.
 */
export async function getFindingRowsRaw(
  input: AssetFilterInput,
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
): Promise<PaginatedFindingResult> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter = !parsedMonth.isAll && parsedMonth.months.length > 0;
    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const companyClause = getTemuanCompanyClause(input.company, dataScope);

    const searchVal = search.trim();
    const hasSearch = searchVal.length > 0;
    const searchClause = hasSearch
      ? sql`AND (site ILIKE ${"%" + searchVal + "%"} OR device ILIKE ${"%" + searchVal + "%"} OR no_barcode ILIKE ${"%" + searchVal + "%"} OR category_problem ILIKE ${"%" + searchVal + "%"} OR problem_descs ILIKE ${"%" + searchVal + "%"} OR action_it ILIKE ${"%" + searchVal + "%"})`
      : sql``;

    const offset = Math.max(0, (page - 1) * pageSize);

    const countRows = await sql`
      SELECT COUNT(*)::int as total
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
        ${searchClause}
    `;

    const total = Number(countRows[0]?.total || 0);

    if (total === 0) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 1,
      };
    }

    const dbRows = await sql`
      SELECT
        id,
        no_barcode,
        year,
        month,
        site,
        unit,
        device,
        category_problem,
        problem_descs,
        action_it,
        status_temuan,
        status_repair,
        time_input
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
        ${searchClause}
      ORDER BY time_input DESC NULLS LAST, id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const data: FindingRow[] = dbRows.map((r, i) => {
      const mIdx = Number(r.month || 1) - 1;
      const monthStr = MONTH_NAMES[mIdx] || "Jan";
      const yearStr = String(r.year || input.year);
      const siteStr =
        normalizeSiteName(String(r.site || "")) || String(r.site || "").trim();
      const unitStr = String(r.unit || "").trim();
      const branchLabel = siteStr + (unitStr ? ` - ${unitStr}` : "");

      const barcodeStr = r.no_barcode
        ? String(r.no_barcode)
        : `AST-${yearStr.slice(2)}${String(offset + i + 1).padStart(3, "0")}`;

      return {
        id: String(r.id || `row-${offset + i}`),
        barcode: barcodeStr,
        periode: `${monthStr} ${yearStr}`,
        branch: branchLabel,
        device: String(r.device || "-"),
        kategori: String(r.category_problem || "-"),
        problem: String(r.problem_descs || "-"),
        action: String(r.action_it || "-"),
        status: mapDbStatus(r.status_temuan ? String(r.status_temuan) : null),
      };
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error) {
    console.error("Error in getFindingRowsRaw:", error);
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
    };
  }
}

/**
 * Inline Cache Function: Public service wrapper for Finding Rows data.
 */
export async function getFindingRowsData(
  input: AssetFilterInput,
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
): Promise<PaginatedFindingResult> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getFindingRowsRaw(input, page, pageSize, search),
    [
      "findings-finding-rows-data",
      input.year,
      input.month,
      siteKey,
      page.toString(),
      pageSize.toString(),
      search,
      companyKey,
    ],
    { revalidate: 300, tags: ["findings-finding-rows"] },
  )();
}
