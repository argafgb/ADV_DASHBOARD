import { fmtNum, rupiah, ringkas } from "./formatters";
import {
  TR_MONTHS,
  ISLAND_AREA,
  ISLAND_ORDER,
  islandOf,
} from "../data/ispCostDataset";
import type {
  IspCostFinancials,
  IspCostKpi,
  IspCostVendorRow,
  IspCostBranchTopRow,
  IspRegionCostRow,
  IspBranchMonthlyRow,
  IspProviderMonthlyRow,
  RawInternetCostRow,
} from "../types/isp-cost.types";

/**
 * Branch name normalization map for non-standard entries in network_internet_cost.
 */
const BRANCH_NAME_MAP: Record<string, { name: string; region: string }> = {
  COS: { name: "COS Semarang", region: "Unit" },
  "COS Semarang": { name: "COS Semarang", region: "Unit" },
  GA: { name: "Senen GA", region: "Unit" },
  "Senen GA": { name: "Senen GA", region: "Unit" },
  Yogya: { name: "Yogyakarta", region: "R5" },
  "Tanah Abang": { name: "Tanah Abang 5", region: "Unit" },
  "Tanah Abang 5": { name: "Tanah Abang 5", region: "Unit" },
  "Batam Baru": { name: "Batam", region: "R1" },
  IT: { name: "IT Support", region: "Unit" },
  Ampasit: { name: "Ampasit", region: "Unit" },
  Wiracarita: { name: "Wiracarita", region: "Unit" },
  WiraCarita: { name: "Wiracarita", region: "Unit" },
};

/**
 * ISP vendor name normalization map.
 */
const ISP_NAME_MAP: Record<string, string> = {
  "By U": "By.u",
  "Live On": "LiveOn",
  Netstar: "Netstart",
  Jujungnet: "Jujung",
  SmartFren: "Smartfren",
};

export function normalizeBranchName(
  raw: string,
  dbRegion?: string | null,
): {
  name: string;
  region: string;
} {
  const trimmed = raw.trim();
  if (BRANCH_NAME_MAP[trimmed]) return BRANCH_NAME_MAP[trimmed];
  if (dbRegion === "Others" || dbRegion === "Unit") {
    return { name: trimmed, region: "Unit" };
  }
  return { name: trimmed, region: dbRegion || islandOf(trimmed) };
}

export function normalizeIspName(raw: string): string {
  const trimmed = raw.trim();
  if (ISP_NAME_MAP[trimmed]) return ISP_NAME_MAP[trimmed];
  return trimmed;
}

/**
 * Transforms real network_internet_cost rows into the existing UI contract.
 * Missing periods return a truthful empty structure; they never synthesize costs.
 */
export function getHybridFinancials(
  rawDbRows: RawInternetCostRow[],
  selectedYear: number = 2026,
  selectedMonth: number | null = null,
  bulanMonths?: number[] | null,
): IspCostFinancials {
  const yearRows = rawDbRows.filter((r) => r.year === selectedYear);
  if (!yearRows.length) {
    return {
      grandCost: 0,
      grandCostFormatted: rupiah(0),
      kpis: [],
      costVendors: [],
      costTopBranches: [],
      regionRows: [],
      branchRows: [],
      providerRows: [],
      providerTotals: new Array(12).fill(0),
      providerCellMax: 1,
    };
  }

  // Determine active month filter
  const targetMonths =
    selectedMonth != null
      ? [selectedMonth + 1] // DB month is 1-based (1..12), FilterContext month is 0-based (0..11)
      : bulanMonths && bulanMonths.length > 0
        ? bulanMonths.map((m) => m + 1)
        : Array.from({ length: 12 }, (_, i) => i + 1);

  // Group normalized records
  interface EnrichedLink {
    branch: string;
    region: string;
    vendor: string;
    mbps: number;
    cost: number;
    month: number;
  }

  const allEnriched: EnrichedLink[] = [];
  const branchMonthlyMatrix: Record<
    string,
    {
      region: string;
      months: number[];
      links: Record<
        string,
        { mbps: number; cost: number; activeMonths: number }
      >;
    }
  > = {};
  const providerMonthlyMatrix: Record<
    string,
    { months: number[]; links: number; branches: Set<string>; mbps: number }
  > = {};

  for (const row of yearRows) {
    const branchInfo = normalizeBranchName(
      row.branch_display_name || row.raw_branch_name,
      row.operation_region,
    );
    const vendorName = normalizeIspName(row.isp_name || row.raw_isp);
    const mbps =
      row.bandwidth_mbps != null && row.bandwidth_mbps > 0
        ? row.bandwidth_mbps
        : 0;
    const cost = Number(row.cost);
    const m = row.month;

    allEnriched.push({
      branch: branchInfo.name,
      region: branchInfo.region,
      vendor: vendorName,
      mbps,
      cost,
      month: m,
    });

    // Branch matrix tally
    if (!branchMonthlyMatrix[branchInfo.name]) {
      branchMonthlyMatrix[branchInfo.name] = {
        region: branchInfo.region,
        months: new Array(12).fill(0),
        links: {},
      };
    }
    branchMonthlyMatrix[branchInfo.name].months[m - 1] += cost;
    if (!branchMonthlyMatrix[branchInfo.name].links[vendorName]) {
      branchMonthlyMatrix[branchInfo.name].links[vendorName] = {
        mbps: 0,
        cost: 0,
        activeMonths: 0,
      };
    }
    branchMonthlyMatrix[branchInfo.name].links[vendorName].mbps = Math.max(
      branchMonthlyMatrix[branchInfo.name].links[vendorName].mbps,
      mbps,
    );
    branchMonthlyMatrix[branchInfo.name].links[vendorName].cost += cost;
    branchMonthlyMatrix[branchInfo.name].links[vendorName].activeMonths += 1;

    // Provider matrix tally
    if (!providerMonthlyMatrix[vendorName]) {
      providerMonthlyMatrix[vendorName] = {
        months: new Array(12).fill(0),
        links: 0,
        branches: new Set<string>(),
        mbps: 0,
      };
    }
    providerMonthlyMatrix[vendorName].months[m - 1] += cost;
    providerMonthlyMatrix[vendorName].branches.add(branchInfo.name);
    providerMonthlyMatrix[vendorName].mbps += mbps;
  }

  // Filtered rows according to active month window for top cards
  const activePeriodRows = allEnriched.filter((r) =>
    targetMonths.includes(r.month),
  );
  const numMonthsInWindow = Math.max(1, targetMonths.length);

  // Total cost in period normalized to per-month rate if window is full year, or selected month
  const totalPeriodCost = activePeriodRows.reduce((a, r) => a + r.cost, 0);
  const grandMonthlyRate =
    selectedMonth != null
      ? totalPeriodCost
      : totalPeriodCost / numMonthsInWindow;
  const annualBurden = grandMonthlyRate * 12;

  // Active branches in period
  const activeBranchSet = new Set(activePeriodRows.map((r) => r.branch));
  const totalBranchCount = Math.max(1, activeBranchSet.size);
  const avgCostPerBranch = grandMonthlyRate / totalBranchCount;

  // Total Mbps in period
  const totalMbpsRaw =
    activePeriodRows.reduce((a, r) => a + r.mbps, 0) / numMonthsInWindow;
  const pricePerMbps =
    totalMbpsRaw > 0 ? Math.round(grandMonthlyRate / totalMbpsRaw) : 0;

  // Top 4 KPIs
  const kpis: IspCostKpi[] = [
    {
      label:
        selectedMonth != null ? "Biaya bulan ini" : "Kontrak berjalan / bulan",
      value: ringkas(grandMonthlyRate),
      tone: "blue",
      tip: {
        title: "Nilai realisasi bulanan",
        primary: rupiah(grandMonthlyRate) + " per bulan",
        secondary: `(${activePeriodRows.length} tagihan di ${totalBranchCount} cabang)`,
        meta: "Nilai realisasi aktual dari pembukuan database network_internet_cost.",
        tone: "blue",
      },
    },
    {
      label: "Beban setahun",
      value: ringkas(annualBurden),
      tone: "blue",
      tip: {
        title: "Estimasi beban setahun",
        primary: rupiah(annualBurden),
        secondary: "(biaya bulanan berjalan × 12 bulan)",
        meta: "Proyeksi beban tahunan berdasarkan rata-rata tagihan berjalan.",
        tone: "blue",
      },
    },
    {
      label: "Rata-rata tiap cabang",
      value: ringkas(avgCostPerBranch),
      tone: "blue",
      tip: {
        title: "Rata-rata per cabang",
        primary: rupiah(Math.round(avgCostPerBranch)) + " / bulan",
        secondary: `(biaya dibagi ${totalBranchCount} cabang aktif)`,
        meta: "Rata-rata biaya langganan internet per cabang.",
        tone: "blue",
      },
    },
    {
      label: "Harga tiap Mbps",
      value: rupiah(pricePerMbps),
      tone: "blue",
      tip: {
        title: "Harga tiap Mbps",
        primary: rupiah(pricePerMbps) + " per Mbps setiap bulan",
        secondary: `(total ~${fmtNum(totalMbpsRaw, 0)} Mbps bandwidth)`,
        meta: "Rasio biaya per unit kapasitas bandwidth yang terpasang.",
        tone: "blue",
      },
    },
  ];

  // Cost by Vendor list
  const vTally: Record<string, { cost: number; n: number; mbps: number }> = {};
  activePeriodRows.forEach((r) => {
    const t =
      vTally[r.vendor] || (vTally[r.vendor] = { cost: 0, n: 0, mbps: 0 });
    t.cost += r.cost / numMonthsInWindow;
    t.n++;
    t.mbps += r.mbps / numMonthsInWindow;
  });

  const V_SCALE = 100e6;
  const costVendors: IspCostVendorRow[] = Object.keys(vTally)
    .sort((a, b) => vTally[b].cost - vTally[a].cost)
    .map((k, i) => {
      const t = vTally[k];
      const linkCount = Math.round(t.n / numMonthsInWindow) || 1;
      return {
        vendor: k,
        cost: ringkas(t.cost),
        rawCost: t.cost,
        links: linkCount,
        pct: Math.round((t.cost / (grandMonthlyRate || 1)) * 100) + "%",
        width: Math.min(100, (t.cost / V_SCALE) * 100) + "%",
        color: i === 0 ? "var(--accent)" : i < 3 ? "#60A5FA" : "#BFD5FA",
        mbps: Math.round(t.mbps),
        tip: {
          title: k,
          primary: rupiah(t.cost) + " / bulan",
          secondary: `(${linkCount} link · ${fmtNum(t.mbps, 0)} Mbps)`,
          meta: `Menyerap ${Math.round((t.cost / (grandMonthlyRate || 1)) * 100)}% dari seluruh biaya`,
          tone: "blue",
        },
      };
    });

  // Top 10 Branches list
  const bTally: Record<
    string,
    { cost: number; region: string; linkCount: number }
  > = {};
  activePeriodRows.forEach((r) => {
    const t =
      bTally[r.branch] ||
      (bTally[r.branch] = { cost: 0, region: r.region, linkCount: 0 });
    t.cost += r.cost / numMonthsInWindow;
    t.linkCount++;
  });

  const B_SCALE = 50e6;
  const costTopBranches: IspCostBranchTopRow[] = Object.keys(bTally)
    .sort((a, b) => bTally[b].cost - bTally[a].cost)
    .slice(0, 10)
    .map((bn, i) => {
      const t = bTally[bn];
      const linkCount = Math.round(t.linkCount / numMonthsInWindow) || 1;
      return {
        branch: bn,
        region: t.region,
        cost: ringkas(t.cost),
        rawCost: t.cost,
        links: linkCount,
        width: Math.min(100, (t.cost / B_SCALE) * 100) + "%",
        pct: Math.round((t.cost / (grandMonthlyRate || 1)) * 100) + "%",
        color: i < 3 ? "var(--accent)" : "#93BBF7",
        tip: {
          title: bn,
          primary: rupiah(t.cost) + " / bulan",
          secondary: `(${linkCount} link · region ${t.region})`,
          meta: `Menyerap ${Math.round((t.cost / (grandMonthlyRate || 1)) * 100)}% dari biaya`,
          tone: "blue",
        },
      };
    });

  // Region rows (R1–R6)
  const regionCostTotals: Record<
    string,
    {
      count: Set<string>;
      cost: number;
      mbps: number;
      links: number;
      vendors: Record<string, number>;
    }
  > = {};
  ISLAND_ORDER.forEach((rg) => {
    regionCostTotals[rg] = {
      count: new Set(),
      cost: 0,
      mbps: 0,
      links: 0,
      vendors: {},
    };
  });

  activePeriodRows.forEach((r) => {
    if (r.region && regionCostTotals[r.region]) {
      const t = regionCostTotals[r.region];
      t.count.add(r.branch);
      t.cost += r.cost / numMonthsInWindow;
      t.mbps += r.mbps / numMonthsInWindow;
      t.links++;
      t.vendors[r.vendor] = (t.vendors[r.vendor] || 0) + r.cost;
    }
  });

  const maxRegionCost = Math.max(
    ...ISLAND_ORDER.map((rg) => regionCostTotals[rg].cost),
    1,
  );

  const regionRows: IspRegionCostRow[] = ISLAND_ORDER.map((rg) => {
    const t = regionCostTotals[rg];
    const topVendor =
      Object.keys(t.vendors).sort((a, b) => t.vendors[b] - t.vendors[a])[0] ||
      "—";
    const vendorShare =
      t.cost > 0 && t.vendors[topVendor]
        ? Math.round((t.vendors[topVendor] / t.cost) * 100) + "%"
        : "—";
    const linksCount = Math.round(t.links / numMonthsInWindow) || t.count.size;

    return {
      region: rg,
      area: ISLAND_AREA[rg] || "",
      count: t.count.size,
      cost: t.cost,
      costFull: rupiah(t.cost),
      barPct: ((t.cost / maxRegionCost) * 100).toFixed(1) + "%",
      mbpsLabel: fmtNum(t.mbps, 0) + " Mbps",
      linksLabel: linksCount + " link",
      names: Array.from(t.count),
      topVendor,
      topVendorShare: vendorShare,
    };
  });

  // Monthly branch table rows
  const branchNames = Object.keys(branchMonthlyMatrix);
  const branchRows: IspBranchMonthlyRow[] = branchNames.map((bn) => {
    const data = branchMonthlyMatrix[bn];
    const totalCostYear = data.months.reduce((a, c) => a + c, 0);
    const nonZeroMonths = data.months.filter((c) => c > 0).length || 1;
    const avgM = totalCostYear / nonZeroMonths;
    const linkItems = Object.keys(data.links).map((v) => {
      const l = data.links[v];
      const vendorActiveM = l.activeMonths || 1;
      const vendorMonthlyRate = l.cost / vendorActiveM;
      return {
        vendor: v,
        mbps: l.mbps,
        cost: vendorMonthlyRate,
        share: 0,
      };
    });
    const totalMonthlyLinkCost = linkItems.reduce((a, l) => a + l.cost, 0);
    linkItems.forEach((l) => {
      l.share =
        totalMonthlyLinkCost > 0 ? (l.cost / totalMonthlyLinkCost) * 100 : 0;
    });
    const totalMbps = linkItems.reduce((a, l) => a + l.mbps, 0);

    return {
      no: 0,
      branch: bn,
      region: data.region,
      linkN: Math.max(1, linkItems.length),
      mbps: totalMbps,
      cost: avgM,
      months: data.months,
      avgM,
      yearTotal: totalCostYear,
      links: linkItems,
    };
  });

  branchRows.sort((a, b) => b.cost - a.cost);
  branchRows.forEach((r, i) => {
    r.no = i + 1;
  });

  // Monthly provider rows
  const providerNames = Object.keys(providerMonthlyMatrix);
  const providerRows: IspProviderMonthlyRow[] = providerNames.map((v) => {
    const data = providerMonthlyMatrix[v];
    const totalCostYear = data.months.reduce((a, c) => a + c, 0);
    const nonZeroMonths = data.months.filter((c) => c > 0).length || 1;
    const avg = totalCostYear / nonZeroMonths;
    const hi = Math.max(...data.months);
    const lo = Math.min(...data.months.filter((c) => c > 0)) || 0;
    const linkCount =
      Math.round(data.links / nonZeroMonths) || data.branches.size;

    return {
      vendor: v,
      links: linkCount,
      branches: data.branches.size,
      mbps: Math.round(data.mbps / nonZeroMonths) || 0,
      months: data.months,
      avg,
      hi,
      lo,
    };
  });

  providerRows.sort((a, b) => b.avg - a.avg);

  const providerTotals = TR_MONTHS.map((_, mi) =>
    providerRows.reduce((a, r) => a + r.months[mi], 0),
  );

  const providerCellMax = Math.max(
    ...providerRows.map((r) => Math.max(...r.months)),
    1,
  );

  return {
    grandCost: grandMonthlyRate,
    grandCostFormatted: rupiah(grandMonthlyRate),
    kpis,
    costVendors,
    costTopBranches,
    regionRows,
    branchRows,
    providerRows,
    providerTotals,
    providerCellMax,
  };
}
