import { fmt } from "@/lib/utils";
import type {
  MonthlyCostComparisonResult,
  RegionSummaryCard,
  MonthlyCostMatrixRow,
  MonthlyCostMatrixCell,
} from "../types/cost.types";

export interface RawMonthlyCostDbRow {
  site: string;
  region: string;
  month: number | null;
  company: string;
  device_count: number;
  total_rent: number;
  total_repair: number;
  total_cost: number;
}

const MONTH_NAMES: Record<number, string> = {
  1: "JANUARI",
  2: "FEBRUARI",
  3: "MARET",
  4: "APRIL",
  5: "MEI",
  6: "JUNI",
  7: "JULI",
  8: "AGUSTUS",
  9: "SEPTEMBER",
  10: "OKTOBER",
  11: "NOVEMBER",
  12: "DESEMBER",
};

function formatCompactRp(val: number): string {
  if (!val || val === 0) return "0 rb";
  if (val >= 1_000_000_000) {
    const num = val / 1_000_000_000;
    return (
      num.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + " M"
    );
  }
  if (val >= 1_000_000) {
    const num = val / 1_000_000;
    return (
      num.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + " jt"
    );
  }
  if (val >= 1_000) {
    const num = Math.round(val / 1000);
    return num.toLocaleString("id-ID") + " rb";
  }
  return val.toString();
}

/**
 * Transforms raw SQL monthly cost aggregate rows into MonthlyCostComparisonResult.
 * Groups summary cards by unique valid regions (R1, R2, R3, etc.)
 */
export function transformMonthlyCostComparison(
  dbRows: RawMonthlyCostDbRow[],
): MonthlyCostComparisonResult {
  const activeMonthsSet = new Set<string>();

  // Map site -> region & monthly cells
  const siteMap = new Map<
    string,
    {
      site: string;
      region: string;
      cells: Record<
        string,
        { sewa: number; repair: number; total: number; deviceCount: number }
      >;
      total: number;
    }
  >();

  // Map region -> aggregated totals & sites set
  const regionMap = new Map<
    string,
    {
      region: string;
      sites: Set<string>;
      sewa: number;
      repair: number;
      total: number;
    }
  >();

  for (const r of dbRows) {
    const siteName = r.site || "UNKNOWN";
    const regionName = (r.region || "UNKNOWN").toUpperCase().trim();
    const monthNum = Number(r.month);
    const monthName =
      monthNum && MONTH_NAMES[monthNum] ? MONTH_NAMES[monthNum] : "TANPA TGL";

    activeMonthsSet.add(monthName);

    const isWisesa = (r.company || "").toLowerCase().includes("wisesa");
    const rentCost = isWisesa ? Number(r.total_rent || 0) : 0;
    const repairCost = Number(r.total_repair || 0);
    const cost = rentCost + repairCost;
    const count = Number(r.device_count || 0);

    // Site mapping
    let siteEntry = siteMap.get(siteName);
    if (!siteEntry) {
      siteEntry = {
        site: siteName,
        region: regionName,
        cells: {},
        total: 0,
      };
      siteMap.set(siteName, siteEntry);
    }

    if (!siteEntry.cells[monthName]) {
      siteEntry.cells[monthName] = {
        sewa: 0,
        repair: 0,
        total: 0,
        deviceCount: 0,
      };
    }

    siteEntry.cells[monthName].sewa += rentCost;
    siteEntry.cells[monthName].repair += repairCost;
    siteEntry.cells[monthName].total += cost;
    siteEntry.cells[monthName].deviceCount += count;
    siteEntry.total += cost;

    // Region mapping (Filter out empty, '-', 'NULL', 'UNKNOWN')
    const isValidRegion =
      regionName &&
      regionName !== "-" &&
      regionName !== "NULL" &&
      regionName !== "UNKNOWN";

    if (isValidRegion) {
      let regEntry = regionMap.get(regionName);
      if (!regEntry) {
        regEntry = {
          region: regionName,
          sites: new Set<string>(),
          sewa: 0,
          repair: 0,
          total: 0,
        };
        regionMap.set(regionName, regEntry);
      }
      regEntry.sites.add(siteName);
      regEntry.sewa += rentCost;
      regEntry.repair += repairCost;
      regEntry.total += cost;
    }
  }

  // Determine months array in chronological order
  const standardOrder = [
    "JANUARI",
    "FEBRUARI",
    "MARET",
    "APRIL",
    "MEI",
    "JUNI",
    "JULI",
    "AGUSTUS",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DESEMBER",
    "TANPA TGL",
  ];
  const months = standardOrder.filter((m) => activeMonthsSet.has(m));

  // Build RegionSummaryCard[] grouped by unique region
  const regions: RegionSummaryCard[] = Array.from(regionMap.values())
    .sort((a, b) => b.total - a.total)
    .map((reg) => {
      const sewaBarPct =
        reg.total > 0 ? ((reg.sewa / reg.total) * 100).toFixed(1) + "%" : "0%";
      const repairBarPct =
        reg.total > 0
          ? ((reg.repair / reg.total) * 100).toFixed(1) + "%"
          : "0%";

      return {
        region: reg.region,
        label: reg.region,
        siteCount: reg.sites.size,
        total: reg.total,
        totalFmt: `Rp ${fmt(reg.total)}`,
        sewa: reg.sewa,
        sewaFmt: formatCompactRp(reg.sewa),
        sewaBar: sewaBarPct,
        repair: reg.repair,
        repairFmt: formatCompactRp(reg.repair),
        repairBar: repairBarPct,
      };
    });

  // Build MonthlyCostMatrixRow[]
  const rows: MonthlyCostMatrixRow[] = Array.from(siteMap.values())
    .sort((a, b) => b.total - a.total)
    .map((siteItem) => {
      const cells: Record<string, MonthlyCostMatrixCell | null> = {};

      for (const m of months) {
        const cellData = siteItem.cells[m];
        if (cellData && cellData.total > 0) {
          cells[m] = {
            month: m,
            value: cellData.total,
            text: formatCompactRp(cellData.total),
            sewa: cellData.sewa,
            repair: cellData.repair,
            deviceCount: cellData.deviceCount,
          };
        } else {
          cells[m] = null;
        }
      }

      return {
        site: siteItem.site,
        region: siteItem.region,
        cells,
        total: siteItem.total,
        totalText: `Rp ${fmt(siteItem.total)}`,
      };
    });

  return {
    regions,
    months,
    rows,
  };
}
