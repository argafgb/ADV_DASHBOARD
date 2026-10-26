import { sql } from "@/lib/db";
import { parseCompanyFilter } from "@/lib/company-filter";
import { scopedTable } from "@/lib/auth/scoped-table";
import type { DataScope } from "@/lib/auth/data-scope";
import type { CompanyCode, CompanyFilterValue } from "@/types/asset-pm.types";

/**
 * Builds an SQL WHERE clause by combining active company conditions with OR.
 */
function buildCompoundClause(
  codes: CompanyCode[],
  condMap: Record<CompanyCode, ReturnType<typeof sql>>,
) {
  if (codes.length === 1) {
    return sql`AND ${condMap[codes[0]]}`;
  }
  if (codes.length === 2) {
    return sql`AND (${condMap[codes[0]]} OR ${condMap[codes[1]]})`;
  }
  return sql``;
}

/**
 * Generates SQL WHERE clause fragment for pm_asset_it.pm_asset_it_summary based on company filter.
 * Uses exact match equality to maximize PostgreSQL B-Tree index utilization.
 */
export function getSummaryCompanyClause(company?: CompanyFilterValue) {
  const parsed = parseCompanyFilter(company);
  if (parsed.isAll) return sql``;

  const condMap: Record<CompanyCode, ReturnType<typeof sql>> = {
    ADV: sql`(UPPER(company) = 'ADVANTAGE' AND UPPER(site) != 'ETRAMA')`,
    WSS: sql`(UPPER(company) = 'WISESA' AND UPPER(site) != 'ETRAMA' AND UPPER(COALESCE(code_division, '')) NOT IN ('ETRAMA', 'DIV-ETRAMA'))`,
    ETR: sql`(UPPER(site) = 'ETRAMA' OR UPPER(COALESCE(code_division, '')) IN ('ETRAMA', 'DIV-ETRAMA') OR UPPER(COALESCE(company, '')) = 'ETRAMA')`,
  };

  return buildCompoundClause(parsed.codes, condMap);
}

/**
 * Generates SQL WHERE clause fragment for pm_asset_it.pm_asset_it_usia based on company filter.
 * Uses exact match equality to maximize PostgreSQL B-Tree index utilization.
 */
export function getUsiaCompanyClause(company?: CompanyFilterValue) {
  const parsed = parseCompanyFilter(company);
  if (parsed.isAll) return sql``;

  const condMap: Record<CompanyCode, ReturnType<typeof sql>> = {
    ADV: sql`(UPPER(company) = 'ADVANTAGE' AND UPPER(COALESCE(branch, '')) != 'ETRAMA')`,
    WSS: sql`(UPPER(company) = 'WISESA' AND UPPER(COALESCE(branch, '')) != 'ETRAMA' AND UPPER(COALESCE(code_division, '')) NOT IN ('ETRAMA', 'DIV-ETRAMA'))`,
    ETR: sql`(UPPER(COALESCE(branch, '')) = 'ETRAMA' OR UPPER(COALESCE(code_division, '')) IN ('ETRAMA', 'DIV-ETRAMA') OR UPPER(COALESCE(company, '')) = 'ETRAMA')`,
  };

  return buildCompoundClause(parsed.codes, condMap);
}

/**
 * Generates SQL WHERE clause fragment for pm_asset_it.pm_asset_it_temuan based on company filter.
 */
export function getTemuanCompanyClause(company: CompanyFilterValue | undefined, scope: DataScope) {
  const parsed = parseCompanyFilter(company);
  if (parsed.isAll) return sql``;

  const condMap: Record<CompanyCode, ReturnType<typeof sql>> = {
    ADV: sql`(UPPER(no_barcode) LIKE 'ADV%' OR no_barcode IN (SELECT barcode FROM ${scopedTable("pm_asset_it_summary", scope)} WHERE UPPER(company) = 'ADVANTAGE' AND UPPER(site) != 'ETRAMA'))`,
    WSS: sql`((UPPER(no_barcode) LIKE 'WS%' OR no_barcode IN (SELECT barcode FROM ${scopedTable("pm_asset_it_summary", scope)} WHERE UPPER(company) = 'WISESA' AND UPPER(site) != 'ETRAMA' AND UPPER(COALESCE(code_division, '')) NOT IN ('ETRAMA', 'DIV-ETRAMA'))) AND UPPER(COALESCE(site, '')) != 'ETRAMA')`,
    ETR: sql`(UPPER(COALESCE(site, '')) = 'ETRAMA' OR UPPER(COALESCE(unit, '')) LIKE '%ETRAMA%' OR no_barcode IN (SELECT barcode FROM ${scopedTable("pm_asset_it_summary", scope)} WHERE UPPER(site) = 'ETRAMA' OR UPPER(COALESCE(code_division, '')) IN ('ETRAMA', 'DIV-ETRAMA')))`,
  };

  return buildCompoundClause(parsed.codes, condMap);
}

/**
 * Generates SQL WHERE clause fragment for pm_asset_it.asset_ratings based on company filter.
 * Barcodes in asset_ratings may contain stray whitespace, so they are TRIM-normalized.
 */
export function getRatingCompanyClause(company: CompanyFilterValue | undefined, scope: DataScope) {
  const parsed = parseCompanyFilter(company);
  if (parsed.isAll) return sql``;

  const condMap: Record<CompanyCode, ReturnType<typeof sql>> = {
    ADV: sql`((UPPER(TRIM(barcode)) LIKE 'ADV%' OR TRIM(barcode) IN (SELECT barcode FROM ${scopedTable("pm_asset_it_summary", scope)} WHERE UPPER(company) = 'ADVANTAGE' AND UPPER(site) != 'ETRAMA')) AND UPPER(COALESCE(cabang, '')) != 'ETRAMA')`,
    WSS: sql`((UPPER(TRIM(barcode)) LIKE 'WS%' OR TRIM(barcode) IN (SELECT barcode FROM ${scopedTable("pm_asset_it_summary", scope)} WHERE UPPER(company) = 'WISESA' AND UPPER(site) != 'ETRAMA' AND UPPER(COALESCE(code_division, '')) NOT IN ('ETRAMA', 'DIV-ETRAMA'))) AND UPPER(COALESCE(cabang, '')) != 'ETRAMA')`,
    ETR: sql`(UPPER(COALESCE(cabang, '')) = 'ETRAMA' OR TRIM(barcode) IN (SELECT barcode FROM ${scopedTable("pm_asset_it_summary", scope)} WHERE UPPER(site) = 'ETRAMA' OR UPPER(COALESCE(code_division, '')) IN ('ETRAMA', 'DIV-ETRAMA')))`,
  };

  return buildCompoundClause(parsed.codes, condMap);
}

/**
 * Generates SQL WHERE clause fragment for pm_asset_it.pm_asset_it_jadwal based on company filter.
 */
export function getJadwalCompanyClause(company: CompanyFilterValue | undefined, scope: DataScope) {
  const parsed = parseCompanyFilter(company);
  if (parsed.isAll) return sql``;

  const condMap: Record<CompanyCode, ReturnType<typeof sql>> = {
    ADV: sql`UPPER(site) IN (SELECT DISTINCT UPPER(site) FROM ${scopedTable("pm_asset_it_summary", scope)} WHERE UPPER(company) = 'ADVANTAGE' AND UPPER(site) != 'ETRAMA')`,
    WSS: sql`UPPER(site) IN (SELECT DISTINCT UPPER(site) FROM ${scopedTable("pm_asset_it_summary", scope)} WHERE UPPER(company) = 'WISESA' AND UPPER(site) != 'ETRAMA' AND UPPER(COALESCE(code_division, '')) NOT IN ('ETRAMA', 'DIV-ETRAMA'))`,
    ETR: sql`UPPER(site) IN (SELECT DISTINCT UPPER(site) FROM ${scopedTable("pm_asset_it_summary", scope)} WHERE UPPER(site) = 'ETRAMA')`,
  };

  return buildCompoundClause(parsed.codes, condMap);
}
