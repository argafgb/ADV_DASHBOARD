"use server";

import { scopedCache as unstable_cache } from "@/lib/auth/scoped-cache";
import { sql } from "@/lib/db";
import { getRequestDataScope } from "@/lib/auth/request-scope";
import { scopedTable } from "@/lib/auth/scoped-table";
import { parseMonthFilter, formatMonthRangeLabel } from "@/lib/filter-utils";
import {
  getRawSiteAliases,
  normalizeSiteName,
  isUnitSite,
} from "@/lib/site-utils";
import {
  getSummaryCompanyClause,
  getUsiaCompanyClause,
  getTemuanCompanyClause,
} from "@/lib/company-utils";
import type { AssetFilterInput, BarDatum } from "@/types/asset-pm.types";
import type { RnmDatum, UsiaAsetData } from "../types/comparison.types";

export type UsiaAsetTabCategory =
  | "workstation"
  | "infrastructure"
  | "peripheral";

export type RnmScope = "all" | "Operational" | "Unit";
export type RnmCategory =
  | "all"
  | "Workstation"
  | "Infrastructure"
  | "Peripheral";

export interface KategoriTemuanComparisonData {
  selectedYearData: BarDatum[];
  previousYearData: BarDatum[];
  selectedYearLabel: string;
  previousYearLabel: string;
}

/* ============================================================================
 * 1. DISTRIBUSI USIA ASET
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates Asset Age Distribution from pm_asset_it.pm_asset_it_usia.
 */
export async function getUsiaAsetRaw(
  input: AssetFilterInput,
  category: UsiaAsetTabCategory = "workstation",
): Promise<UsiaAsetData> {
  const dataScope = await getRequestDataScope();
  try {
    const year = parseInt(input.year, 10) || 2026;
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter = !parsedMonth.isAll && parsedMonth.months.length > 0;
    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const companyClause = getUsiaCompanyClause(input.company);

    const deviceTypeMap: Record<UsiaAsetTabCategory, string> = {
      workstation: "Workstation",
      infrastructure: "Infrastructure",
      peripheral: "Peripheral",
    };
    const deviceType = deviceTypeMap[category] || "Workstation";

    const rows = await sql<{ production_year: number; total_device: string }[]>`
      SELECT 
        production_year,
        COUNT(*)::int AS total_device
      FROM ${scopedTable("pm_asset_it_usia", dataScope)}
      WHERE year = ${year}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND (UPPER(branch) = ANY(${siteAliases}) OR UPPER(company) = ANY(${siteAliases}))` : sql``}
        ${companyClause}
        AND UPPER(TRIM(device_type)) = UPPER(${deviceType})
        AND production_year IS NOT NULL
        AND production_year BETWEEN 2000 AND ${year}
      GROUP BY production_year
      ORDER BY production_year ASC
    `;

    const bars: BarDatum[] = rows.map((r) => ({
      label: String(r.production_year),
      value: Number(r.total_device || 0),
    }));

    const total = bars.reduce((s, b) => s + b.value, 0);
    const peak =
      bars.length > 0
        ? bars.reduce((m, b) => (b.value > m.value ? b : m), bars[0])
        : { label: "-", value: 0 };

    return { bars, total, peakYear: peak.label };
  } catch (error) {
    console.error("Error in getUsiaAsetRaw:", error);
    return { bars: [], total: 0, peakYear: "-" };
  }
}

/**
 * Inline Cache Function: Public service wrapper for Asset Age Distribution data.
 */
export async function getUsiaAsetData(
  input: AssetFilterInput,
  category: UsiaAsetTabCategory = "workstation",
): Promise<UsiaAsetData> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getUsiaAsetRaw(input, category),
    [
      "comparison-usia-aset-data",
      input.year,
      input.month,
      siteKey,
      category,
      companyKey,
    ],
    { revalidate: 300, tags: ["comparison-usia-aset"] },
  )();
}

/* ============================================================================
 * 2. PERBANDINGAN RNM PER CABANG
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates RnM comparison per branch from pm_asset_it.pm_asset_it_summary.
 */
export async function getRnmPerCabangRaw(
  input: AssetFilterInput,
  scope: RnmScope = "all",
  category: RnmCategory = "all",
  subCategory: string = "all",
): Promise<RnmDatum[]> {
  const dataScope = await getRequestDataScope();
  try {
    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const companyClause = getSummaryCompanyClause(input.company);
    const deviceTypeFilter = category !== "all" ? category : null;
    const deviceFilter = subCategory !== "all" ? subCategory : null;

    const monthCounts = await sql<{ year: number; mcount: string }[]>`
      SELECT year::int, COUNT(DISTINCT month)::int AS mcount
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE year IN (2025, 2026)
        AND site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
        ${companyClause}
      GROUP BY year
    `;

    const countMap: Record<number, number> = { 2025: 9, 2026: 5 };
    monthCounts.forEach((r) => {
      const cnt = Number(r.mcount || 0);
      if (cnt > 0) countMap[r.year] = cnt;
    });

    const div2025 = countMap[2025] || 9;
    const div2026 = countMap[2026] || 5;

    const rows = await sql<
      { site: string; total_2025: string; total_2026: string }[]
    >`
      SELECT 
        UPPER(site) as site,
        COUNT(CASE WHEN year = 2025 THEN 1 END)::int AS total_2025,
        COUNT(CASE WHEN year = 2026 THEN 1 END)::int AS total_2026
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE year IN (2025, 2026)
        AND (${deviceTypeFilter}::text IS NULL OR device_type = ${deviceTypeFilter})
        AND (${deviceFilter}::text IS NULL OR UPPER(device) = UPPER(${deviceFilter}))
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
        AND site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN', 'TEST')
      GROUP BY 1
    `;

    const filtered = rows.filter((r) => {
      const norm = normalizeSiteName(r.site);
      if (!norm) return false;
      if (scope === "Operational") return !isUnitSite(norm);
      if (scope === "Unit") return isUnitSite(norm);
      return true;
    });

    const sum25 = filtered.reduce(
      (acc, r) => acc + Number(r.total_2025 || 0) / div2025,
      0,
    );
    const sum26 = filtered.reduce(
      (acc, r) => acc + Number(r.total_2026 || 0) / div2026,
      0,
    );

    const rnmMap = new Map<string, { avg25: number; avg26: number }>();
    for (const r of filtered) {
      const norm = normalizeSiteName(r.site) || r.site;
      const avg25 = Number(r.total_2025 || 0) / div2025;
      const avg26 = Number(r.total_2026 || 0) / div2026;
      const existing = rnmMap.get(norm);
      if (existing) {
        existing.avg25 += avg25;
        existing.avg26 += avg26;
      } else {
        rnmMap.set(norm, { avg25, avg26 });
      }
    }

    return Array.from(rnmMap.entries())
      .map(([branch, data]) => {
        const y2025 =
          sum25 > 0 ? Math.round((data.avg25 / sum25) * 1000) / 10 : 0;
        const y2026 =
          sum26 > 0 ? Math.round((data.avg26 / sum26) * 1000) / 10 : 0;

        return {
          branch,
          y2025,
          y2026,
        };
      })
      .sort((a, b) => b.y2026 - a.y2026);
  } catch (error) {
    console.error("Error in getRnmPerCabangRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for RnM Comparison data.
 */
export async function getRnmPerCabangData(
  input: AssetFilterInput,
  scope: RnmScope = "all",
  category: RnmCategory = "all",
  subCategory: string = "all",
): Promise<RnmDatum[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getRnmPerCabangRaw(input, scope, category, subCategory),
    [
      "comparison-rnm-data",
      input.year,
      input.month,
      siteKey,
      scope,
      category,
      subCategory,
      companyKey,
    ],
    { revalidate: 300, tags: ["comparison-rnm"] },
  )();
}

/* ============================================================================
 * 3. PERBANDINGAN KATEGORI TEMUAN
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates Finding Category Comparison from pm_asset_it.pm_asset_it_temuan.
 */
export async function getKategoriTemuanComparisonRaw(
  input: AssetFilterInput,
): Promise<KategoriTemuanComparisonData> {
  const dataScope = await getRequestDataScope();
  try {
    const selectedYear = parseInt(input.year, 10) || 2026;
    const previousYear = selectedYear - 1;
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter = !parsedMonth.isAll && parsedMonth.months.length > 0;
    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const companyClause = getTemuanCompanyClause(input.company, dataScope);

    const selectedRows = await sql<
      { category_problem: string; total: string }[]
    >`
      SELECT 
        category_problem,
        COUNT(*) AS total
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE year = ${selectedYear}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
      GROUP BY category_problem
      ORDER BY total DESC
    `;

    const previousRows = await sql<
      { category_problem: string; total: string }[]
    >`
      SELECT 
        category_problem,
        COUNT(*) AS total
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE year = ${previousYear}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
      GROUP BY category_problem
      ORDER BY total DESC
    `;

    const selectedYearData: BarDatum[] = selectedRows.map((r) => ({
      label: r.category_problem,
      value: Number(r.total || 0),
      color: r.category_problem === "Lainnya" ? "#9CA3AF" : "#2563EB",
    }));

    const previousYearData: BarDatum[] = previousRows.map((r) => ({
      label: r.category_problem,
      value: Number(r.total || 0),
      color: "#60A5FA",
    }));

    const selectedYearLabel = formatMonthRangeLabel(
      input.month,
      String(selectedYear),
    );
    const previousYearLabel = formatMonthRangeLabel(
      input.month,
      String(previousYear),
    );

    return {
      selectedYearData,
      previousYearData,
      selectedYearLabel,
      previousYearLabel,
    };
  } catch (error) {
    console.error("Error in getKategoriTemuanComparisonRaw:", error);
    return {
      selectedYearData: [],
      previousYearData: [],
      selectedYearLabel: String(input.year),
      previousYearLabel: String(Number(input.year) - 1),
    };
  }
}

/**
 * Inline Cache Function: Public service wrapper for Finding Category Comparison data.
 */
export async function getKategoriTemuanComparisonData(
  input: AssetFilterInput,
): Promise<KategoriTemuanComparisonData> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getKategoriTemuanComparisonRaw(input),
    [
      "comparison-kategori-temuan-data",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["comparison-kategori-temuan"] },
  )();
}
