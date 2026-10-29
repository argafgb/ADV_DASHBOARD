import type {
  AssetCategory,
  AssetCategoryFilter,
  AssetInfraItem,
  AssetKpis,
  AssetStatusFilter,
  AssetTableRow,
  BranchActivityItem,
  CategoryDonutItem,
  MonthlyCategoryTrend,
  AssetCalculatedMetrics,
} from "../types/asset.types";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  MONTH_NAMES_SHORT,
  getStatusBadgeStyle,
} from "./assetFormatters";

export const ALL_CATEGORIES: AssetCategory[] = ["Router", "Switch", "AP"];

export function filterAssetItems(
  all: AssetInfraItem[],
  category: AssetCategoryFilter,
  status: AssetStatusFilter,
  query: string,
): AssetInfraItem[] {
  const q = (query || "").trim().toLowerCase();

  return all.filter((item) => {
    const matchCat = category === "all" || item.Kategori === category;
    const matchStatus = status === "all" || item.Status === status;
    const matchQuery =
      !q ||
      item.Ditujukan.toLowerCase().includes(q) ||
      item["Nama Barang"].toLowerCase().includes(q) ||
      item.Barcode.toLowerCase().includes(q);

    return matchCat && matchStatus && matchQuery;
  });
}

export function calculateAssetKpis(filtered: AssetInfraItem[]): AssetKpis {
  const total = filtered.length;
  const addCount = filtered.filter((d) => d.Status === "Penambahan").length;
  const repCount = filtered.filter((d) => d.Status === "Pergantian").length;
  const branchesCount = new Set(filtered.map((d) => d.Ditujukan.trim())).size;
  const uniqueMonths = new Set(filtered.map((d) => d.Tanggal.slice(0, 7)));

  const addPct = total
    ? `${Math.round((addCount / total) * 100)}% dari total`
    : "0% dari total";
  const repPct = total
    ? `${Math.round((repCount / total) * 100)}% dari total`
    : "0% dari total";

  const avgVal = uniqueMonths.size
    ? Math.round((total / uniqueMonths.size) * 10) / 10
    : 0;
  const avgPerMonth = String(avgVal).replace(".", ",");

  return {
    total,
    branchesCount,
    addCount,
    addPct,
    repCount,
    repPct,
    avgPerMonth,
  };
}

export function calculateMonthlyTrends(
  filtered: AssetInfraItem[],
  all: AssetInfraItem[],
): MonthlyCategoryTrend[] {
  const allMonths = [...new Set(all.map((d) => d.Tanggal.slice(0, 7)))].sort();

  return allMonths.map((monthKey) => {
    const monthNum = parseInt(monthKey.slice(5, 7), 10) - 1;
    const monthLabel = MONTH_NAMES_SHORT[monthNum] || monthKey;

    const inMonth = filtered.filter((d) => d.Tanggal.slice(0, 7) === monthKey);
    const routerCount = inMonth.filter((d) => d.Kategori === "Router").length;
    const switchCount = inMonth.filter((d) => d.Kategori === "Switch").length;
    const apCount = inMonth.filter((d) => d.Kategori === "AP").length;

    return {
      monthKey,
      monthLabel,
      Router: routerCount,
      Switch: switchCount,
      AP: apCount,
      total: routerCount + switchCount + apCount,
    };
  });
}

export function calculateCategoryDonut(
  filtered: AssetInfraItem[],
): CategoryDonutItem[] {
  const total = filtered.length || 1;

  return ALL_CATEGORIES.map((cat) => {
    const count = filtered.filter((d) => d.Kategori === cat).length;
    const pct = filtered.length ? Math.round((count / total) * 100) : 0;

    return {
      name: CATEGORY_LABELS[cat],
      categoryKey: cat,
      count,
      pct,
      color: CATEGORY_COLORS[cat],
    };
  });
}

export function calculateTopBranches(
  filtered: AssetInfraItem[],
  limit = 12,
): BranchActivityItem[] {
  const branchCounts: Record<string, number> = {};
  for (const item of filtered) {
    const b = item.Ditujukan.trim();
    branchCounts[b] = (branchCounts[b] || 0) + 1;
  }

  const topSorted = Object.entries(branchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const maxVal = topSorted.length ? topSorted[0][1] : 1;

  return topSorted.map(([name, count], idx) => {
    const rCount = filtered.filter(
      (d) => d.Ditujukan.trim() === name && d.Kategori === "Router",
    ).length;
    const sCount = filtered.filter(
      (d) => d.Ditujukan.trim() === name && d.Kategori === "Switch",
    ).length;
    const apCount = filtered.filter(
      (d) => d.Ditujukan.trim() === name && d.Kategori === "AP",
    ).length;

    const categoryBreakdown = `Router ${rCount} · Switch ${sCount} · Access Point ${apCount}`;
    const width = `${Math.max(4, Math.round((count / maxVal) * 100))}%`;
    const color = idx < 3 ? "var(--accent)" : "#93BBF7";

    return {
      name,
      count,
      width,
      color,
      categoryBreakdown,
    };
  });
}

export function formatTableRows(filtered: AssetInfraItem[]): AssetTableRow[] {
  return [...filtered]
    .sort((a, b) => b.Tanggal.localeCompare(a.Tanggal))
    .map((item) => {
      const badgeStyle = getStatusBadgeStyle(item.Status);

      return {
        tanggal: item.Tanggal,
        cabang: item.Ditujukan.trim(),
        barang: item["Nama Barang"],
        barcode: item.Barcode,
        kategori: CATEGORY_LABELS[item.Kategori] || item.Kategori,
        kategoriKey: item.Kategori,
        katColor: CATEGORY_COLORS[item.Kategori] || "#6B7280",
        status: item.Status,
        badgeBg: badgeStyle.bg,
        badgeFg: badgeStyle.fg,
      };
    });
}

export function calculateAllAssetMetrics(
  all: AssetInfraItem[],
  category: AssetCategoryFilter,
  status: AssetStatusFilter,
  query: string,
): AssetCalculatedMetrics {
  const filteredRows = filterAssetItems(all, category, status, query);
  const kpis = calculateAssetKpis(filteredRows);
  const tableRows = formatTableRows(filteredRows);
  const monthlyTrends = calculateMonthlyTrends(filteredRows, all);
  const categoryDonut = calculateCategoryDonut(filteredRows);
  const topBranches = calculateTopBranches(filteredRows, 12);

  return {
    kpis,
    filteredRows,
    tableRows,
    monthlyTrends,
    categoryDonut,
    topBranches,
  };
}
