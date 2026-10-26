"use server";

import { scopedCache as unstable_cache } from "@/lib/auth/scoped-cache";
import { sql } from "@/lib/db";
import { getRequestDataScope } from "@/lib/auth/request-scope";
import { scopedTable } from "@/lib/auth/scoped-table";
import { getSummaryCompanyClause } from "@/lib/company-utils";
import { getRawSiteAliases } from "@/lib/site-utils";
import type {
  AssetWarrantyData,
  InvalidWarrantySummary,
  WarrantyBrandBreakdown,
  WarrantyFilterInput,
  WarrantyMonthlyExpiry,
  WarrantyUrgentItem,
} from "../types/warranty.types";
import {
  calculateWarrantyKpis,
  buildWarrantyStatusDistribution,
  determineWarrantyUrgency,
  processTopBrandBreakdowns,
} from "../utils/warrantyModel";

const MONTH_NAMES_ID = [
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

function formatMonthLabel(monthKey: string): string {
  const parts = monthKey.split("-");
  if (parts.length !== 2) return monthKey;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const name = MONTH_NAMES_ID[monthIdx] || parts[1];
  return `${name} ${year}`;
}

interface WarrantyCountsRow {
  total: string | number;
  safe_long: string | number;
  med_180: string | number;
  warn_90: string | number;
  crit_30: string | number;
  expired: string | number;
}

interface MonthlyExpiryRow {
  month_key: string;
  count: string | number;
}

interface BrandBreakdownRow {
  brand: string;
  total: string | number;
  masih_panjang: string | number;
  segera_habis: string | number;
  sudah_habis: string | number;
}

interface UrgentItemRow {
  id: string;
  barcode: string;
  brand: string;
  additional_display: string | null;
  site: string;
  company: string;
  device: string;
  purchase_date: string;
  warranty_end_date: string;
  days_remaining: number;
}

const EMPTY_WARRANTY_DATA: AssetWarrantyData = {
  kpis: {
    totalActive: 0,
    activeWarranty: 0,
    activeWarrantyPct: 0,
    expiredWarranty: 0,
    expiredWarrantyPct: 0,
    expiringSoon: 0,
    expiringSoonPct: 0,
    expiringCritical: 0,
    expiringWarning: 0,
    mediumWarranty: 0,
    safeWarranty: 0,
  },
  statusDistribution: [],
  monthlyExpiry: [],
  brandBreakdown: [],
  urgentItems: [],
  syncedAt: null,
};

/* ============================================================================
 * 1. ASSET WARRANTY (pm_asset_it.asset_warranty)
 * ============================================================================ */

export async function getAssetWarrantyRaw(
  input: WarrantyFilterInput = {},
): Promise<AssetWarrantyData> {
  const dataScope = await getRequestDataScope();
  try {
    const companyClause = getSummaryCompanyClause(input.company);
    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const siteClause =
      siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``;

    const deviceVal = input.device?.trim();
    const deviceClause =
      deviceVal && deviceVal !== "ALL"
        ? sql`AND UPPER(device) = UPPER(${deviceVal})`
        : sql``;

    const [countsRows, monthlyRows, brandRows, urgentRows, syncRows] =
      await Promise.all([
        sql<WarrantyCountsRow[]>`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE warranty_end_date > CURRENT_DATE + interval '180 days')::int AS safe_long,
            COUNT(*) FILTER (WHERE warranty_end_date > CURRENT_DATE + interval '90 days' AND warranty_end_date <= CURRENT_DATE + interval '180 days')::int AS med_180,
            COUNT(*) FILTER (WHERE warranty_end_date > CURRENT_DATE + interval '30 days' AND warranty_end_date <= CURRENT_DATE + interval '90 days')::int AS warn_90,
            COUNT(*) FILTER (WHERE warranty_end_date >= CURRENT_DATE AND warranty_end_date <= CURRENT_DATE + interval '30 days')::int AS crit_30,
            COUNT(*) FILTER (WHERE warranty_end_date < CURRENT_DATE)::int AS expired
          FROM ${scopedTable("asset_warranty", dataScope)}
          WHERE year >= 2000
            ${companyClause}
            ${siteClause}
            ${deviceClause}
        `,
        sql<MonthlyExpiryRow[]>`
          SELECT
            to_char(date_trunc('month', warranty_end_date), 'YYYY-MM') AS month_key,
            COUNT(*)::int AS count
          FROM ${scopedTable("asset_warranty", dataScope)}
          WHERE year >= 2000
            AND warranty_end_date >= date_trunc('month', CURRENT_DATE)
            AND warranty_end_date < date_trunc('month', CURRENT_DATE) + interval '12 months'
            ${companyClause}
            ${siteClause}
            ${deviceClause}
          GROUP BY 1
          ORDER BY 1 ASC
        `,
        sql<BrandBreakdownRow[]>`
          SELECT
            UPPER(TRIM(brand)) AS brand,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE warranty_end_date > CURRENT_DATE + interval '90 days')::int AS masih_panjang,
            COUNT(*) FILTER (WHERE warranty_end_date >= CURRENT_DATE AND warranty_end_date <= CURRENT_DATE + interval '90 days')::int AS segera_habis,
            COUNT(*) FILTER (WHERE warranty_end_date < CURRENT_DATE)::int AS sudah_habis
          FROM ${scopedTable("asset_warranty", dataScope)}
          WHERE year >= 2000
            ${companyClause}
            ${siteClause}
            ${deviceClause}
          GROUP BY 1
          ORDER BY total DESC
        `,
        sql<UrgentItemRow[]>`
          SELECT
            id::text AS id,
            barcode,
            brand,
            COALESCE(additional_display, '-') AS additional_display,
            site,
            company,
            device,
            to_char(purchase_date, 'YYYY-MM-DD') AS purchase_date,
            to_char(warranty_end_date, 'YYYY-MM-DD') AS warranty_end_date,
            (warranty_end_date - CURRENT_DATE)::int AS days_remaining
          FROM ${scopedTable("asset_warranty", dataScope)}
          WHERE year >= 2000
            AND warranty_end_date >= CURRENT_DATE
            AND warranty_end_date <= CURRENT_DATE + interval '90 days'
            ${companyClause}
            ${siteClause}
            ${deviceClause}
          ORDER BY warranty_end_date ASC, barcode ASC
          LIMIT 100
        `,
        sql<{ synced_at: Date | string | null }[]>`
          SELECT MAX(synced_at) AS synced_at
          FROM ${scopedTable("asset_warranty", dataScope)}
        `,
      ]);

    const counts = countsRows[0] ?? {
      total: 0,
      safe_long: 0,
      med_180: 0,
      warn_90: 0,
      crit_30: 0,
      expired: 0,
    };

    const kpis = calculateWarrantyKpis({
      total: Number(counts.total || 0),
      safeLong: Number(counts.safe_long || 0),
      med180: Number(counts.med_180 || 0),
      warn90: Number(counts.warn_90 || 0),
      crit30: Number(counts.crit_30 || 0),
      expired: Number(counts.expired || 0),
    });

    const statusDistribution = buildWarrantyStatusDistribution(kpis);

    const monthlyExpiry: WarrantyMonthlyExpiry[] = monthlyRows.map((r) => {
      const count = Number(r.count || 0);
      const label = formatMonthLabel(r.month_key);
      return {
        monthKey: r.month_key,
        monthLabel: label,
        count,
        urgency: determineWarrantyUrgency(60),
      };
    });

    const rawBrands: WarrantyBrandBreakdown[] = brandRows.map((r) => ({
      brand: r.brand || "OTHER",
      total: Number(r.total || 0),
      masihPanjang: Number(r.masih_panjang || 0),
      segeraHabis: Number(r.segera_habis || 0),
      sudahHabis: Number(r.sudah_habis || 0),
    }));

    const brandBreakdown = processTopBrandBreakdowns(rawBrands);

    const urgentItems: WarrantyUrgentItem[] = urgentRows.map((r) => {
      const days = Number(r.days_remaining);
      return {
        id: r.id,
        barcode: r.barcode,
        brand: r.brand,
        additionalDisplay: r.additional_display || "-",
        site: r.site,
        company: r.company,
        device: r.device,
        purchaseDate: r.purchase_date,
        warrantyEndDate: r.warranty_end_date,
        daysRemaining: days,
        urgency: days <= 30 ? "critical" : "warning",
      };
    });

    const syncedAt = syncRows[0]?.synced_at
      ? new Date(syncRows[0].synced_at).toISOString()
      : null;

    return {
      kpis,
      statusDistribution,
      monthlyExpiry,
      brandBreakdown,
      urgentItems,
      syncedAt,
    };
  } catch (error) {
    console.error("[Asset Warranty Service] Error querying asset_warranty:", error);
    return EMPTY_WARRANTY_DATA;
  }
}

export async function getAssetWarrantyData(
  input: WarrantyFilterInput = {},
): Promise<AssetWarrantyData> {
  const companyKey = input.company || "ALL";
  const siteKey = input.site || "ALL";
  const deviceKey = input.device || "ALL";

  return unstable_cache(
    async () => getAssetWarrantyRaw(input),
    ["asset-warranty-data", companyKey, siteKey, deviceKey],
    { revalidate: 300, tags: ["asset-warranty"] },
  )();
}

/* ============================================================================
 * 2. INVALID / ANOMALY WARRANTY DATA (Tahun < 2000)
 * ============================================================================ */

const EMPTY_INVALID_SUMMARY: InvalidWarrantySummary = {
  total: 0,
  items: [],
  brands: [],
  years: [],
};

export async function getInvalidWarrantyAssetsRaw(
  input: WarrantyFilterInput = {},
): Promise<InvalidWarrantySummary> {
  const dataScope = await getRequestDataScope();
  try {
    const companyClause = getSummaryCompanyClause(input.company);
    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const siteClause =
      siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``;

    interface InvalidAggRow {
      total: string | number;
      items: Array<{
        id: string;
        barcode: string;
        brand: string;
        site: string;
        company: string;
        device: string;
        purchaseYear: number;
        purchaseDate: string;
      }> | null;
      brands: Array<{ brand: string; count: number }> | null;
      years: Array<{ year: number; count: number }> | null;
    }

    const rows = await sql<InvalidAggRow[]>`
      SELECT
        COUNT(*)::int AS total,
        json_agg(json_build_object(
          'id', id::text,
          'barcode', barcode,
          'brand', brand,
          'site', site,
          'company', company,
          'device', device,
          'purchaseYear', year,
          'purchaseDate', to_char(purchase_date, 'YYYY-MM-DD')
        )) FILTER (WHERE rn <= 50) AS items,
        (
          SELECT json_agg(json_build_object('brand', brand, 'count', n::int))
          FROM (
            SELECT brand, count(*) AS n
            FROM ${scopedTable("asset_warranty", dataScope)}
            WHERE year < 2000
              ${companyClause}
              ${siteClause}
            GROUP BY brand
            ORDER BY n DESC
          ) b
        ) AS brands,
        (
          SELECT json_agg(json_build_object('year', year, 'count', n::int))
          FROM (
            SELECT year, count(*) AS n
            FROM ${scopedTable("asset_warranty", dataScope)}
            WHERE year < 2000
              ${companyClause}
              ${siteClause}
            GROUP BY year
            ORDER BY year ASC
          ) y
        ) AS years
      FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY year ASC, barcode ASC) AS rn
        FROM ${scopedTable("asset_warranty", dataScope)}
        WHERE year < 2000
          ${companyClause}
          ${siteClause}
      ) sub
    `;

    const row = rows[0];
    if (!row) return EMPTY_INVALID_SUMMARY;

    return {
      total: Number(row.total || 0),
      items: row.items || [],
      brands: row.brands || [],
      years: row.years || [],
    };
  } catch (error) {
    console.error("[Invalid Warranty Service] Error querying invalid assets:", error);
    return EMPTY_INVALID_SUMMARY;
  }
}

export async function getInvalidWarrantyAssetsData(
  input: WarrantyFilterInput = {},
): Promise<InvalidWarrantySummary> {
  const companyKey = input.company || "ALL";
  const siteKey = input.site || "ALL";

  return unstable_cache(
    async () => getInvalidWarrantyAssetsRaw(input),
    ["asset-warranty-invalid-data", companyKey, siteKey],
    { revalidate: 300, tags: ["asset-warranty-invalid"] },
  )();
}
