"use server";

import { scopedCache as unstable_cache } from "@/lib/auth/scoped-cache";
import { sql } from "@/lib/db";
import { getRequestDataScope } from "@/lib/auth/request-scope";
import { scopedTable } from "@/lib/auth/scoped-table";
import { parseMonthFilter } from "@/lib/filter-utils";
import { getRawSiteAliases, normalizeSiteName } from "@/lib/site-utils";
import {
  getSummaryCompanyClause,
  getJadwalCompanyClause,
  getRatingCompanyClause,
} from "@/lib/company-utils";
import { C } from "@/lib/utils";
import type {
  AssetFilterInput,
  BarDatum,
  DonutSlice,
  KpiDatum,
} from "@/types/asset-pm.types";
import type {
  TotalAssetKpis,
  Section1DataResult,
  YearlyGrowthPoint,
  OverviewDonutsResult,
  MonthlyTrendPoint,
  OverviewBottomChartsResult,
  PmScheduleMonth,
  PmStatus,
  FeedbackDetailItem,
} from "../types/overview.types";
import { calculateAssetFeedbackScore } from "@/lib/rating-utils";

/* ============================================================================
 * 1. ASSET GROWTH (Pertumbuhan Unit Aset per Tahun)
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates Asset Growth data for a specific deviceType
 * from pm_asset_it.pm_asset_it_summary.
 */
export async function getAssetGrowthRaw(
  input: AssetFilterInput,
  deviceType: string = "ALL",
): Promise<YearlyGrowthPoint[]> {
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

    const hasDeviceFilter = deviceType && deviceType.toUpperCase() !== "ALL";

    const rows = await sql`
      SELECT
        year::text as year,
        COUNT(*)::integer as total,
        COUNT(CASE WHEN LOWER(device_type) = 'workstation' THEN 1 END)::integer as workstation,
        COUNT(CASE WHEN LOWER(device_type) = 'infrastructure' THEN 1 END)::integer as infrastructure,
        COUNT(CASE WHEN LOWER(device_type) = 'peripheral' THEN 1 END)::integer as peripheral
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
        ${hasYear ? sql`AND year <= ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${companyClause}
        ${hasDeviceFilter ? sql`AND LOWER(device_type) = LOWER(${deviceType})` : sql``}
      GROUP BY year
      ORDER BY year ASC
    `;

    return rows.map((r) => ({
      year: String(r.year),
      total: Number(r.total || 0),
      workstation: Number(r.workstation || 0),
      infrastructure: Number(r.infrastructure || 0),
      peripheral: Number(r.peripheral || 0),
    }));
  } catch (error) {
    console.error("Error in getAssetGrowthRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for Asset Growth data.
 */
export async function getAssetGrowthData(
  input: AssetFilterInput,
  deviceType: string = "ALL",
): Promise<YearlyGrowthPoint[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getAssetGrowthRaw(input, deviceType),
    [
      "overview-asset-growth-data",
      input.year,
      input.month,
      siteKey,
      deviceType,
      companyKey,
    ],
    { revalidate: 300, tags: ["overview-asset-growth"] },
  )();
}

/* ============================================================================
 * 2. TOTAL ASSET KPIS (KPI Card Total Aset, Workstation, Infra, Peripheral)
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates Total Asset KPIs and Growth data
 * in parallel from pm_asset_it.pm_asset_it_summary.
 */
export async function getTotalAssetKpisRaw(
  input: AssetFilterInput,
  deviceType: string = "ALL",
): Promise<Section1DataResult> {
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

    const targetMonthClause = hasMonthFilter
      ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})`
      : sql``;

    const [kpiRows, growth] = await Promise.all([
      sql`
        SELECT
          COUNT(CASE WHEN LOWER(device_type) = 'workstation' THEN 1 END)::integer as total_workstation,
          COUNT(CASE WHEN LOWER(device_type) = 'infrastructure' THEN 1 END)::integer as total_infrastructure,
          COUNT(CASE WHEN LOWER(device_type) = 'peripheral' THEN 1 END)::integer as total_peripheral,
          COUNT(*)::integer as total_asset
        FROM ${scopedTable("pm_asset_it_summary", dataScope)}
        WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
          ${hasYear ? sql`AND year = ${yearVal}` : sql``}
          ${targetMonthClause}
          ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
          ${companyClause}
      `,
      getAssetGrowthRaw(input, deviceType),
    ]);

    const row = kpiRows[0] || {};
    const totalWorkstation = Number(row.total_workstation || 0);
    const totalInfrastructure = Number(row.total_infrastructure || 0);
    const totalPeripheral = Number(row.total_peripheral || 0);
    const totalAsset = Number(
      row.total_asset ||
        totalWorkstation + totalInfrastructure + totalPeripheral,
    );

    const kpis: TotalAssetKpis = {
      totalAsset,
      totalWorkstation,
      totalPeripheral,
      totalInfrastructure,
    };

    return { kpis, growth };
  } catch (error) {
    console.error("Error in getTotalAssetKpisRaw:", error);
    return {
      kpis: {
        totalAsset: 0,
        totalWorkstation: 0,
        totalPeripheral: 0,
        totalInfrastructure: 0,
      },
      growth: [],
    };
  }
}

/**
 * Inline Cache Function: Public service wrapper for Total Asset KPIs data.
 */
export async function getTotalAssetKpisData(
  input: AssetFilterInput,
  deviceType: string = "ALL",
): Promise<Section1DataResult> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getTotalAssetKpisRaw(input, deviceType),
    [
      "overview-total-asset-kpis-data",
      input.year,
      input.month,
      siteKey,
      deviceType,
      companyKey,
    ],
    { revalidate: 300, tags: ["overview-total-asset-kpis"] },
  )();
}

/* ============================================================================
 * 3. PM SUMMARY KPIS (Total Temuan, % Selesai, Jumlah Site)
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates PM Summary KPIs scoped by device filter,
 * including MoM delta percentage comparison vs last month.
 */
export async function getPmSummaryKpisRaw(
  input: AssetFilterInput,
  device: string = "ALL",
): Promise<KpiDatum[]> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);

    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter =
      !parsedMonth.isAll && parsedMonth.cumulativeMonths.length > 0;

    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const jadwalCompanyClause = getJadwalCompanyClause(input.company, dataScope);

    const hasSummaryDevice = device && device.toUpperCase() !== "ALL";

    // Previous period calculation for MoM delta comparison
    let lastYear = hasYear ? yearVal : new Date().getFullYear();
    let lastTemuanMonths: number[] = [];

    if (hasMonthFilter) {
      if (parsedMonth.endMonth === 1) {
        lastYear = lastYear - 1;
        lastTemuanMonths = [12];
      } else {
        const shift = parsedMonth.months.length;
        lastTemuanMonths = parsedMonth.months.map((m) =>
          Math.max(1, m - shift),
        );
      }
    } else {
      lastYear = lastYear - 1;
    }

    // 1. Current period Jumlah Site (Done sites + Total scheduled sites from pm_asset_it_jadwal)
    const curJadwalSitesPromise = sql`
      SELECT
        COUNT(DISTINCT CASE WHEN LOWER(status) = 'done' THEN UPPER(site) END)::integer as done_sites,
        COUNT(DISTINCT UPPER(site))::integer as total_sites
      FROM ${scopedTable("pm_asset_it_jadwal", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${jadwalCompanyClause}
    `;

    // 2. Current period temuan query (Total Temuan, % Selesai) -> pm_asset_it_temuan (Strict Filter Month)
    const curTemuanPromise = sql`
      SELECT
        COUNT(*) as total_temuan,
        COUNT(CASE WHEN LOWER(status_temuan) = 'done' OR status_temuan = '2' THEN 1 END) as total_done
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE 1=1
        AND device IS NOT NULL AND device != '' AND UPPER(device) NOT IN ('-', 'NULL')
        AND device_type IS NOT NULL AND device_type != '' AND UPPER(device_type) NOT IN ('-', 'NULL')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${hasSummaryDevice ? sql`AND LOWER(device_type) = LOWER(${device})` : sql``}
    `;

    // 3. Last period temuan query -> pm_asset_it_temuan (Strict Filter Month)
    const lastTemuanPromise = sql`
      SELECT
        COUNT(*) as total_temuan,
        COUNT(CASE WHEN LOWER(status_temuan) = 'done' OR status_temuan = '2' THEN 1 END) as total_done
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE 1=1
        AND device IS NOT NULL AND device != '' AND UPPER(device) NOT IN ('-', 'NULL')
        AND device_type IS NOT NULL AND device_type != '' AND UPPER(device_type) NOT IN ('-', 'NULL')
        ${hasYear ? sql`AND year = ${lastYear}` : sql``}
        ${lastTemuanMonths.length > 0 ? sql`AND month = ANY(${lastTemuanMonths})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${hasSummaryDevice ? sql`AND LOWER(device_type) = LOWER(${device})` : sql``}
    `;

    const [
      curJadwalSitesRows,
      curTemuanRows,
      lastTemuanRows,
    ] = await Promise.all([
      curJadwalSitesPromise,
      curTemuanPromise,
      lastTemuanPromise,
    ]);

    const curJadwalSiteRow = curJadwalSitesRows[0] || {};
    const curTemuanRow = curTemuanRows[0] || {};
    const lastTemuanRow = lastTemuanRows[0] || {};

    const curTemuan = Number(curTemuanRow.total_temuan || 0);
    const curDone = Number(curTemuanRow.total_done || 0);
    const curPctSelesai =
      curTemuan > 0 ? Math.round((curDone / curTemuan) * 100) : 0;
    const curDoneSites = Number(curJadwalSiteRow.done_sites || 0);
    const curTotalSites = Number(curJadwalSiteRow.total_sites || 0);
    const lastTemuan = Number(lastTemuanRow.total_temuan || 0);
    const lastDone = Number(lastTemuanRow.total_done || 0);
    const lastPctSelesai =
      lastTemuan > 0 ? Math.round((lastDone / lastTemuan) * 100) : 0;

    const temuanDelta = computeDeltaInfo(curTemuan, lastTemuan, true);
    let pctSelesaiDelta = computeDeltaInfo(
      curPctSelesai,
      lastPctSelesai,
      false,
    );
    if (curTemuan === 0 || lastTemuan === 0) {
      pctSelesaiDelta = { deltaPct: 0, isUp: false, positive: true };
    }
    const allSitesDone = curTotalSites > 0 && curDoneSites === curTotalSites;
    const sitesCompletionPct =
      curTotalSites > 0 ? Math.round((curDoneSites / curTotalSites) * 100) : 0;
    const sitesPeriodLabel = allSitesDone
      ? "semua branch sukses dari semua jadwal"
      : "branch sukses dari total jadwal";

    const periodLabel = hasMonthFilter
      ? "dibanding bulan sebelumnya"
      : "dibanding periode sebelumnya";

    return [
      {
        label: "Total Temuan PM",
        value: curTemuan,
        icon: "alert",
        deltaPct: temuanDelta.deltaPct,
        isUp: temuanDelta.isUp,
        positive: temuanDelta.positive,
        periodLabel,
      },
      {
        label: "% Temuan Selesai",
        value: curPctSelesai,
        unit: "%",
        icon: "check",
        deltaPct: pctSelesaiDelta.deltaPct,
        isUp: pctSelesaiDelta.isUp,
        positive: pctSelesaiDelta.positive,
        periodLabel,
      },
      {
        label: "Jumlah Site PM",
        value: curDoneSites,
        unit: `/${curTotalSites}`,
        icon: "pin",
        deltaPct: allSitesDone ? 100 : sitesCompletionPct,
        isUp: true,
        positive: true,
        periodLabel: sitesPeriodLabel,
      },
    ];
  } catch (error) {
    console.error("Error in getPmSummaryKpisRaw:", error);
    return [
      {
        label: "Total Temuan PM",
        value: 0,
        icon: "alert",
        deltaPct: 0,
        isUp: false,
        positive: true,
      },
      {
        label: "% Temuan Selesai",
        value: 0,
        unit: "%",
        icon: "check",
        deltaPct: 0,
        isUp: false,
        positive: true,
      },
      {
        label: "Jumlah Site PM",
        value: 0,
        icon: "pin",
        deltaPct: 0,
        isUp: false,
        positive: true,
      },
    ];
  }
}

/**
 * Inline Cache Function: Public service wrapper for PM Summary KPIs data.
 */
export async function getPmSummaryKpisData(
  input: AssetFilterInput,
  device: string = "ALL",
): Promise<KpiDatum[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getPmSummaryKpisRaw(input, device),
    [
      "overview-pm-summary-kpis-v6-data",
      input.year,
      input.month,
      siteKey,
      device,
      companyKey,
    ],
    { revalidate: 300, tags: ["overview-pm-summary-kpis-v6"] },
  )();
}

/**
 * Helper: Computes percentage delta, arrow direction (isUp), and business indicator (positive).
 */
function computeDeltaInfo(
  cur: number,
  last: number,
  lowerIsBetter: boolean = false,
): { deltaPct: number; isUp: boolean; positive: boolean } {
  const diff = cur - last;
  const isUp = diff > 0;

  let deltaPct = 0;
  if (last > 0) {
    deltaPct = Math.round((diff / last) * 100);
  } else {
    deltaPct = 0;
  }

  let positive = true;
  if (diff === 0 || deltaPct === 0) {
    positive = true;
  } else if (lowerIsBetter) {
    positive = diff < 0;
  } else {
    positive = diff > 0;
  }

  return {
    deltaPct: Math.abs(deltaPct),
    isUp,
    positive,
  };
}

/* ============================================================================
 * 4. OVERVIEW DONUT CHARTS (PM Completion, Site Temuan vs Bersih, Status Temuan)
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates data for 3 Overview Donut Charts & Monthly Trend
 * from pm_asset_it_summary, pm_asset_it_temuan, and pm_asset_it_jadwal.
 */
export async function getOverviewDonutChartsRaw(
  input: AssetFilterInput,
  device: string = "ALL",
): Promise<OverviewDonutsResult> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);

    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter =
      !parsedMonth.isAll && parsedMonth.cumulativeMonths.length > 0;

    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const jadwalCompanyClause = getJadwalCompanyClause(input.company, dataScope);

    const hasSummaryDevice = device && device.toUpperCase() !== "ALL";

    let temuanDeviceClause = sql``;
    if (hasSummaryDevice) {
      const devLower = device.toLowerCase();
      if (devLower === "workstation") {
        temuanDeviceClause = sql`AND (LOWER(device) IN ('notebook', 'mini pc', 'minipc', 'pc', 'asus') OR LOWER(device) LIKE '%pc%' OR LOWER(device) LIKE '%notebook%' OR LOWER(device) LIKE '%laptop%')`;
      } else if (devLower === "infrastructure") {
        temuanDeviceClause = sql`AND (LOWER(device) LIKE '%ap%' OR LOWER(device) LIKE '%rb%' OR LOWER(device) LIKE '%tl%' OR LOWER(device) LIKE '%switch%' OR LOWER(device) LIKE '%router%')`;
      } else if (devLower === "peripheral") {
        temuanDeviceClause = sql`AND (LOWER(device) LIKE '%l-%' OR LOWER(device) LIKE '%printer%' OR LOWER(device) LIKE '%scanner%' OR LOWER(device) LIKE '%mouse%' OR LOWER(device) LIKE '%keyboard%')`;
      }
    }

    // 1. Query for Donut 3 (Distribusi Status Temuan) -> pm_asset_it_temuan (Strict Filter Month)
    const statusTemuanPromise = sql`
      SELECT
        COUNT(CASE WHEN LOWER(status_temuan) = 'done' OR status_temuan = '2' THEN 1 END) as selesai,
        COUNT(CASE WHEN LOWER(status_temuan) = 'on progress' OR status_temuan = '1' THEN 1 END) as dalam_proses,
        COUNT(CASE WHEN LOWER(status_temuan) = 'no' OR status_temuan = '0' OR status_temuan IS NULL THEN 1 END) as belum_ditangani
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${temuanDeviceClause}
    `;

    // 2. Query for Donut 2 (Site dengan Temuan vs Bersih) -> total branch from pm_asset_it_jadwal
    const temuanVsBersihPromise = sql`
      WITH total_jadwal_sites AS (
        SELECT DISTINCT UPPER(site) as site
        FROM ${scopedTable("pm_asset_it_jadwal", dataScope)}
        WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
          ${hasYear ? sql`AND year = ${yearVal}` : sql``}
          ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
          ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
          ${jadwalCompanyClause}
      ),
      temuan_sites AS (
        SELECT DISTINCT UPPER(site) as site
        FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
        WHERE 1=1
          ${hasYear ? sql`AND year = ${yearVal}` : sql``}
          ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
          ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
          ${temuanDeviceClause}
      )
      SELECT
        (SELECT COUNT(*) FROM total_jadwal_sites WHERE site IN (SELECT site FROM temuan_sites)) as site_ada_temuan,
        (SELECT COUNT(*) FROM total_jadwal_sites WHERE site NOT IN (SELECT site FROM temuan_sites)) as site_bersih
    `;

    // 3. Query for Donut 1 (Status Penyelesaian PM per Site) -> pm_asset_it_jadwal (Strict Filter Month)
    const pmCompletionPromise = sql`
      SELECT
        COUNT(CASE WHEN LOWER(status) = 'done' THEN 1 END)::integer as selesai,
        COUNT(CASE WHEN LOWER(status) = 'on progress' THEN 1 END)::integer as dalam_proses,
        COUNT(CASE WHEN LOWER(status) = 'on queue' THEN 1 END)::integer as belum
      FROM ${scopedTable("pm_asset_it_jadwal", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${jadwalCompanyClause}
        AND site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL')
    `;

    // 4. Query for Monthly Temuan Trend -> pm_asset_it_temuan (Strict Filter Month)
    const monthlyTrendPromise = sql`
      SELECT
        month::integer as month_num,
        COUNT(*) as temuan
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${temuanDeviceClause}
      GROUP BY month
      ORDER BY month_num ASC
    `;

    const [
      statusTemuanRows,
      temuanVsBersihRows,
      pmCompletionRows,
      monthlyTrendRows,
    ] = await Promise.all([
      statusTemuanPromise,
      temuanVsBersihPromise,
      pmCompletionPromise,
      monthlyTrendPromise,
    ]);

    const st = statusTemuanRows[0] || {};
    const tvb = temuanVsBersihRows[0] || {};
    const pm = pmCompletionRows[0] || {};

    const statusTemuan: DonutSlice[] = [
      { label: "Selesai", value: Number(st.selesai || 0), color: C.green },
      {
        label: "Dalam Proses",
        value: Number(st.dalam_proses || 0),
        color: C.amber,
      },
      {
        label: "Belum Ditangani",
        value: Number(st.belum_ditangani || 0),
        color: C.red,
      },
    ];

    const temuanVsBersih: DonutSlice[] = [
      {
        label: "Ada Temuan",
        value: Number(tvb.site_ada_temuan || 0),
        color: C.accent,
      },
      { label: "Bersih", value: Number(tvb.site_bersih || 0), color: C.green },
    ];

    const pmCompletion: DonutSlice[] = [
      { label: "Selesai", value: Number(pm.selesai || 0), color: C.green },
      {
        label: "Dalam Proses",
        value: Number(pm.dalam_proses || 0),
        color: C.amber,
      },
      { label: "Belum", value: Number(pm.belum || 0), color: C.red },
    ];

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

    const trendRowMap = new Map<number, number>();
    for (const r of monthlyTrendRows) {
      trendRowMap.set(Number(r.month_num), Number(r.temuan || 0));
    }

    const targetMonths =
      hasMonthFilter && parsedMonth.months.length > 0
        ? parsedMonth.months
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    const monthlyTrend: MonthlyTrendPoint[] = targetMonths.map((mNum) => {
      const mIndex = mNum - 1;
      const monthLabel =
        mIndex >= 0 && mIndex < 12 ? MONTH_NAMES[mIndex] : `Bln ${mNum}`;
      return {
        month: monthLabel,
        temuan: trendRowMap.get(mNum) || 0,
      };
    });

    return {
      pmCompletion,
      temuanVsBersih,
      statusTemuan,
      monthlyTrend,
    };
  } catch (error) {
    console.error("Error in getOverviewDonutChartsRaw:", error);
    return {
      pmCompletion: [
        { label: "Selesai", value: 0, color: C.green },
        { label: "Dalam Proses", value: 0, color: C.amber },
        { label: "Belum", value: 0, color: C.red },
      ],
      temuanVsBersih: [
        { label: "Ada Temuan", value: 0, color: C.accent },
        { label: "Bersih", value: 0, color: C.green },
      ],
      statusTemuan: [
        { label: "Selesai", value: 0, color: C.green },
        { label: "Dalam Proses", value: 0, color: C.amber },
        { label: "Belum Ditangani", value: 0, color: C.red },
      ],
      monthlyTrend: [],
    };
  }
}

/**
 * Inline Cache Function: Public service wrapper for Overview Donut Charts data.
 */
export async function getOverviewDonutChartsData(
  input: AssetFilterInput,
  device: string = "ALL",
): Promise<OverviewDonutsResult> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getOverviewDonutChartsRaw(input, device),
    [
      "overview-donut-charts-v2-data",
      input.year,
      input.month,
      siteKey,
      device,
      companyKey,
    ],
    { revalidate: 300, tags: ["overview-donut-charts-v2"] },
  )();
}

/* ============================================================================
 * 5. PM SCHEDULE (Jadwal PM per Site)
 * ============================================================================ */

const PM_SCHEDULE_MONTHS = [
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

/**
 * Raw SQL Query: Calculates 12-month PM Schedule list from pm_asset_it.pm_asset_it_jadwal.
 */
export async function getPmScheduleRaw(
  input: AssetFilterInput,
): Promise<PmScheduleMonth[]> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);

    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const jadwalCompanyClause = getJadwalCompanyClause(input.company, dataScope);

    const rows = await sql`
      SELECT
        month::integer as month_num,
        ARRAY_AGG(DISTINCT site) as sites,
        COUNT(CASE WHEN LOWER(status) = 'on progress' THEN 1 END)::integer as count_progress,
        COUNT(CASE WHEN LOWER(status) = 'done' THEN 1 END)::integer as count_done,
        COUNT(CASE WHEN LOWER(status) = 'on queue' THEN 1 END)::integer as count_queue
      FROM ${scopedTable("pm_asset_it_jadwal", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        AND site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL')
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${jadwalCompanyClause}
      GROUP BY month
      ORDER BY month_num ASC
    `;

    const rowMap = new Map<
      number,
      {
        sites: string[];
        count_progress: number;
        count_done: number;
        count_queue: number;
      }
    >();
    for (const r of rows) {
      const mNum = Number(r.month_num);
      const rawSites: string[] = Array.isArray(r.sites) ? r.sites : [];
      const normalizedSitesSet = new Set<string>();
      for (const s of rawSites) {
        const norm = normalizeSiteName(s);
        if (norm) {
          normalizedSitesSet.add(norm);
        }
      }
      const cleanSites = Array.from(normalizedSitesSet).sort((a, b) =>
        a.localeCompare(b),
      );

      rowMap.set(mNum, {
        sites: cleanSites,
        count_progress: Number(r.count_progress || 0),
        count_done: Number(r.count_done || 0),
        count_queue: Number(r.count_queue || 0),
      });
    }

    const currentYearNum = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1;

    const result: PmScheduleMonth[] = [];

    for (let i = 0; i < PM_SCHEDULE_MONTHS.length; i++) {
      const mNum = i + 1;
      const data = rowMap.get(mNum);
      if (!data || data.sites.length === 0) {
        continue;
      }

      let status: PmStatus = "upcoming";

      if (data.count_progress > 0) {
        status = "ongoing";
      } else if (data.count_done > 0 && data.count_queue === 0) {
        status = "done";
      } else if (data.count_queue > 0) {
        status = "upcoming";
      } else {
        if (hasYear && yearVal < currentYearNum) {
          status = "done";
        } else if (hasYear && yearVal > currentYearNum) {
          status = "upcoming";
        } else {
          status =
            mNum < currentMonthNum
              ? "done"
              : mNum === currentMonthNum
                ? "ongoing"
                : "upcoming";
        }
      }

      result.push({
        month: PM_SCHEDULE_MONTHS[i],
        sites: data.sites,
        status,
      });
    }

    return result;
  } catch (error) {
    console.error("Error in getPmScheduleRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for PM Schedule data.
 */
export async function getPmScheduleData(
  input: AssetFilterInput,
  device: string = "ALL",
): Promise<PmScheduleMonth[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getPmScheduleRaw(input),
    [
      "overview-pm-schedule-data",
      input.year,
      input.month,
      siteKey,
      device,
      companyKey,
    ],
    { revalidate: 300, tags: ["overview-pm-schedule"] },
  )();
}

/* ============================================================================
 * 6. OVERVIEW DISTRIBUTION CHARTS (Top 5 Cabang & Komposisi Perangkat)
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates Top 5 Cabang & Komposisi Perangkat
 * from pm_asset_it_summary and pm_asset_it_temuan.
 */
export async function getOverviewDistributionChartsRaw(
  input: AssetFilterInput,
  device: string = "ALL",
): Promise<OverviewBottomChartsResult> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);

    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter =
      !parsedMonth.isAll && parsedMonth.cumulativeMonths.length > 0;

    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const summaryCompanyClause = getSummaryCompanyClause(input.company);

    const hasSummaryDevice = device && device.toUpperCase() !== "ALL";

    let temuanDeviceClause = sql``;
    if (hasSummaryDevice) {
      const devLower = device.toLowerCase();
      if (devLower === "workstation") {
        temuanDeviceClause = sql`AND (LOWER(device) IN ('notebook', 'mini pc', 'minipc', 'pc', 'asus') OR LOWER(device) LIKE '%pc%' OR LOWER(device) LIKE '%notebook%' OR LOWER(device) LIKE '%laptop%')`;
      } else if (devLower === "infrastructure") {
        temuanDeviceClause = sql`AND (LOWER(device) LIKE '%ap%' OR LOWER(device) LIKE '%rb%' OR LOWER(device) LIKE '%tl%' OR LOWER(device) LIKE '%switch%' OR LOWER(device) LIKE '%router%')`;
      } else if (devLower === "peripheral") {
        temuanDeviceClause = sql`AND (LOWER(device) LIKE '%l-%' OR LOWER(device) LIKE '%printer%' OR LOWER(device) LIKE '%scanner%' OR LOWER(device) LIKE '%mouse%' OR LOWER(device) LIKE '%keyboard%')`;
      }
    }

    // 1. Query for Top 5 Cabang dengan Temuan Terbanyak -> pm_asset_it_temuan (Strict Filter Month)
    const top5CabangPromise = sql`
      SELECT
        UPPER(site) as label,
        COUNT(*)::integer as value
      FROM ${scopedTable("pm_asset_it_temuan", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) != 'NULL'
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${temuanDeviceClause}
      GROUP BY UPPER(site)
      ORDER BY value DESC
    `;

    const targetMonthClause = hasMonthFilter
      ? sql`AND month = ANY(${parsedMonth.cumulativeMonths})`
      : sql``;

    // 2. Query for Komposisi Perangkat
    const komposisiPromise = sql`
      SELECT
        COUNT(CASE WHEN LOWER(device_type) = 'workstation' THEN 1 END)::integer as ws,
        COUNT(CASE WHEN LOWER(device_type) = 'infrastructure' THEN 1 END)::integer as infra,
        COUNT(CASE WHEN LOWER(device_type) = 'peripheral' THEN 1 END)::integer as periph
      FROM ${scopedTable("pm_asset_it_summary", dataScope)}
      WHERE site IS NOT NULL AND site != '' AND UPPER(site) NOT IN ('-', 'NULL', 'UNKNOWN')
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${targetMonthClause}
        ${siteAliases.length > 0 ? sql`AND UPPER(site) = ANY(${siteAliases})` : sql``}
        ${summaryCompanyClause}
        ${hasSummaryDevice ? sql`AND LOWER(device_type) = LOWER(${device})` : sql``}
    `;

    const [top5Rows, komposisiRows] = await Promise.all([
      top5CabangPromise,
      komposisiPromise,
    ]);

    const top5Cabang: BarDatum[] = top5Rows
      .map((r) => ({
        label:
          normalizeSiteName(String(r.label || "")) ?? String(r.label || ""),
        value: Number(r.value || 0),
      }))
      .reduce((acc: BarDatum[], curr: BarDatum) => {
        const existing = acc.find((item) => item.label === curr.label);
        if (existing) {
          existing.value += curr.value;
        } else {
          acc.push(curr);
        }
        return acc;
      }, [])
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const kRow = komposisiRows[0] || {};
    const komposisiPerangkat: BarDatum[] = [
      { label: "Workstation", value: Number(kRow.ws || 0), color: C.accent },
      {
        label: "Infrastructure",
        value: Number(kRow.infra || 0),
        color: C.green,
      },
      { label: "Peripheral", value: Number(kRow.periph || 0), color: C.amber },
    ];

    return {
      top5Cabang,
      komposisiPerangkat,
    };
  } catch (error) {
    console.error("Error in getOverviewDistributionChartsRaw:", error);
    return {
      top5Cabang: [],
      komposisiPerangkat: [
        { label: "Workstation", value: 0, color: C.accent },
        { label: "Infrastructure", value: 0, color: C.green },
        { label: "Peripheral", value: 0, color: C.amber },
      ],
    };
  }
}

/**
 * Inline Cache Function: Public service wrapper for Overview Distribution Charts data.
 */
export async function getOverviewDistributionChartsData(
  input: AssetFilterInput,
  device: string = "ALL",
): Promise<OverviewBottomChartsResult> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getOverviewDistributionChartsRaw(input, device),
    [
      "overview-distribution-charts-data",
      input.year,
      input.month,
      siteKey,
      device,
      companyKey,
    ],
    { revalidate: 300, tags: ["overview-distribution-charts"] },
  )();
}

/* ============================================================================
 * 7. OVERVIEW RATING (Rating PM Keseluruhan dari pm_asset_it.asset_ratings)
 * ============================================================================ */

/**
 * Raw SQL Query: Calculates overall PM rating average (0.00 – 5.00)
 * from pm_asset_it.asset_ratings.
 */
export async function getOverviewRatingRaw(
  input: AssetFilterInput,
): Promise<number> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter = !parsedMonth.isAll && parsedMonth.months.length > 0;
    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const ratingCompanyClause = getRatingCompanyClause(input.company, dataScope);

    const rows = await sql<{ avg_rating: string | number }[]>`
      SELECT 
        ROUND(COALESCE(AVG(
          (CASE WHEN performa_ok = 'Ya' THEN 1.0 ELSE 0.0 END +
           CASE WHEN aplikasi_ok = 'Ya' THEN 1.0 ELSE 0.0 END +
           CASE WHEN baterai_ok = 'Ya' THEN 1.0 ELSE 0.0 END) / 3.0 * 5.0
        ), 0), 2)::float as avg_rating
      FROM ${scopedTable("asset_ratings", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(cabang) = ANY(${siteAliases})` : sql``}
        ${ratingCompanyClause}
    `;

    return Number(rows[0]?.avg_rating || 0);
  } catch (error) {
    console.error("Error in getOverviewRatingRaw:", error);
    return 0;
  }
}

/**
 * Inline Cache Function: Public service wrapper for Overview Rating data.
 */
export async function getOverviewRatingData(
  input: AssetFilterInput,
): Promise<number> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getOverviewRatingRaw(input),
    ["overview-rating-data", input.year, input.month, siteKey, companyKey],
    { revalidate: 300, tags: ["overview-rating"] },
  )();
}

/* ============================================================================
 * 8. OVERVIEW FEEDBACK DETAILS (Detail Data Feedback dari pm_asset_it.asset_ratings)
 * ============================================================================ */

interface AssetRatingDbRow {
  id: string;
  record_timestamp: string | null;
  year: number;
  month: number;
  quarter: number;
  nik: string | null;
  nama: string | null;
  email: string | null;
  no_hp: string | null;
  divisi: string | null;
  cabang: string | null;
  barcode: string | null;
  performa_ok: string | null;
  aplikasi_ok: string | null;
  baterai_ok: string | null;
}

/**
 * Raw SQL Query: Fetches detailed feedback records from pm_asset_it.asset_ratings.
 */
export async function getOverviewFeedbackDetailsRaw(
  input: AssetFilterInput,
): Promise<FeedbackDetailItem[]> {
  const dataScope = await getRequestDataScope();
  try {
    const yearVal = parseInt(input.year, 10);
    const hasYear = !isNaN(yearVal);
    const parsedMonth = parseMonthFilter(input.month);
    const hasMonthFilter = !parsedMonth.isAll && parsedMonth.months.length > 0;
    const siteAliases =
      input.site && input.site !== "ALL" ? getRawSiteAliases(input.site) : [];
    const ratingCompanyClause = getRatingCompanyClause(input.company, dataScope);

    const rows = await sql<AssetRatingDbRow[]>`
      SELECT 
        id::text as id,
        COALESCE(TO_CHAR(record_timestamp, 'YYYY-MM-DD HH24:MI:SS'), '') as record_timestamp,
        year::int as year,
        month::int as month,
        quarter::int as quarter,
        COALESCE(nik, '-') as nik,
        COALESCE(nama, '-') as nama,
        COALESCE(email, '-') as email,
        COALESCE(no_hp, '-') as no_hp,
        COALESCE(divisi, '-') as divisi,
        COALESCE(cabang, '-') as cabang,
        COALESCE(barcode, '-') as barcode,
        COALESCE(performa_ok, 'Tidak') as performa_ok,
        COALESCE(aplikasi_ok, 'Tidak') as aplikasi_ok,
        COALESCE(baterai_ok, 'Tidak') as baterai_ok
      FROM ${scopedTable("asset_ratings", dataScope)}
      WHERE 1=1
        ${hasYear ? sql`AND year = ${yearVal}` : sql``}
        ${hasMonthFilter ? sql`AND month = ANY(${parsedMonth.months})` : sql``}
        ${siteAliases.length > 0 ? sql`AND UPPER(cabang) = ANY(${siteAliases})` : sql``}
        ${ratingCompanyClause}
      ORDER BY record_timestamp DESC, id DESC
    `;

    return rows.map((r) => {
      const scoreStars = calculateAssetFeedbackScore(
        r.performa_ok,
        r.aplikasi_ok,
        r.baterai_ok,
      );
      return {
        id: r.id,
        recordTimestamp: r.record_timestamp || "",
        year: r.year,
        month: r.month,
        quarter: r.quarter,
        nik: r.nik || "-",
        nama: r.nama || "-",
        email: r.email || "-",
        noHp: r.no_hp || "-",
        divisi: r.divisi || "-",
        cabang: r.cabang || "-",
        barcode: r.barcode || "-",
        performaOk: r.performa_ok || "Tidak",
        aplikasiOk: r.aplikasi_ok || "Tidak",
        bateraiOk: r.baterai_ok || "Tidak",
        scoreStars,
      };
    });
  } catch (error) {
    console.error("Error in getOverviewFeedbackDetailsRaw:", error);
    return [];
  }
}

/**
 * Inline Cache Function: Public service wrapper for Feedback Details data.
 */
export async function getOverviewFeedbackDetailsData(
  input: AssetFilterInput,
): Promise<FeedbackDetailItem[]> {
  const siteKey = input.site || "ALL";
  const companyKey = input.company || "ALL";
  return unstable_cache(
    async () => getOverviewFeedbackDetailsRaw(input),
    [
      "overview-rating-details-data",
      input.year,
      input.month,
      siteKey,
      companyKey,
    ],
    { revalidate: 300, tags: ["overview-rating-details"] },
  )();
}
