import type {
  CategoryConditionStack,
  ConditionShare,
  TopItemType,
  TypeStockModalData,
  TypeStockModalRow,
  WarehouseStockFilters,
  WarehouseStockItem,
  WarehouseStockKpis,
} from "../types";

export const WAREHOUSE_LOCATIONS = [
  "Semua",
  "AMPASIT",
  "COS Semarang",
  "Repair AMPASIT",
  "Not recorded",
] as const;

export const MONTH_FILTER_OPTIONS = [
  { value: "All Months", label: "Semua Bulan" },
  { value: "Agustus", label: "Agustus 2026" },
  { value: "September", label: "September 2026" },
] as const;

export const COLOR_NEW = "#2563EB";
export const COLOR_SECOND = "#60A5FA";
export const MIN_STOCK_THRESHOLD = 10;

export function formatIndonesianNumber(n: number): string {
  return n.toLocaleString("id-ID");
}

export function formatIndonesianPercentage(val: number, total: number): string {
  if (!total) return "0%";
  return (val / total * 100).toFixed(1).replace(".", ",") + "%";
}

export function formatWarehouseDate(dateStr: string): string {
  if (!dateStr) return "-";
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return dateStr;
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const day = parseInt(m[3], 10);
  const monthName = monthNames[parseInt(m[2], 10) - 1] || m[2];
  const year = m[1];
  const time = `${m[4]}.${m[5]}`;
  return `${day} ${monthName} ${year} ${time}`;
}

export function normalizeWarehouseItem(item: WarehouseStockItem): WarehouseStockItem {
  return {
    ...item,
    condition: item.condition === "Etrama-owned" ? "Second" : item.condition,
  };
}

export function filterBaseWarehouseItems(
  items: WarehouseStockItem[],
  location: string,
  month: string,
): WarehouseStockItem[] {
  const monthPrefix =
    month === "Agustus"
      ? "2026-08"
      : month === "September"
        ? "2026-09"
        : null;

  return items
    .map(normalizeWarehouseItem)
    .filter((r) => {
      const matchLoc = location === "Semua" || r.location === location;
      const matchMonth =
        !monthPrefix || (r.last_edited || "").startsWith(monthPrefix);
      return matchLoc && matchMonth;
    });
}

export function calculateWarehouseKpis(
  baseItems: WarehouseStockItem[],
): WarehouseStockKpis {
  let totalUnits = 0;
  let newUnits = 0;
  let secondUnits = 0;
  let noLocationUnits = 0;
  let noLocationItems = 0;

  for (const r of baseItems) {
    const qty = r.qty || 0;
    totalUnits += qty;
    if (r.condition === "New") {
      newUnits += qty;
    } else {
      secondUnits += qty;
    }

    if (r.location === "Not recorded") {
      noLocationUnits += qty;
      noLocationItems += 1;
    }
  }

  return {
    totalUnits,
    totalItems: baseItems.length,
    newUnits,
    newPct: formatIndonesianPercentage(newUnits, totalUnits),
    secondUnits,
    secondPct: formatIndonesianPercentage(secondUnits, totalUnits),
    noLocationUnits,
    noLocationItems,
  };
}

export function calculateStockByCondition(
  baseItems: WarehouseStockItem[],
): ConditionShare[] {
  let newQty = 0;
  let secondQty = 0;
  let total = 0;

  for (const r of baseItems) {
    const q = r.qty || 0;
    total += q;
    if (r.condition === "New") {
      newQty += q;
    } else {
      secondQty += q;
    }
  }

  const shares: ConditionShare[] = [];
  if (newQty > 0 || total === 0) {
    shares.push({
      label: "New",
      value: newQty,
      percentage: formatIndonesianPercentage(newQty, total),
      color: COLOR_NEW,
    });
  }
  if (secondQty > 0) {
    shares.push({
      label: "Second",
      value: secondQty,
      percentage: formatIndonesianPercentage(secondQty, total),
      color: COLOR_SECOND,
    });
  }

  return shares;
}

export function calculateConditionByCategory(
  baseItems: WarehouseStockItem[],
): CategoryConditionStack[] {
  const map: Record<string, { newQty: number; secondQty: number; total: number }> =
    {};

  for (const r of baseItems) {
    const cat = r.category || "Uncategorized";
    if (!map[cat]) {
      map[cat] = { newQty: 0, secondQty: 0, total: 0 };
    }
    const q = r.qty || 0;
    map[cat].total += q;
    if (r.condition === "New") {
      map[cat].newQty += q;
    } else {
      map[cat].secondQty += q;
    }
  }

  return Object.entries(map)
    .map(([category, vals]) => ({
      category,
      newQty: vals.newQty,
      secondQty: vals.secondQty,
      total: vals.total,
    }))
    .sort((a, b) => b.total - a.total);
}

export function calculateTopItemTypes(
  baseItems: WarehouseStockItem[],
): TopItemType[] {
  const map: Record<string, number> = {};

  for (const r of baseItems) {
    const t = r.type || "Other";
    map[t] = (map[t] || 0) + (r.qty || 0);
  }

  const sorted = Object.entries(map)
    .map(([type, total]) => ({ type, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const maxTotal = sorted.length > 0 ? sorted[0].total : 1;

  return sorted.map((item, idx) => ({
    rank: idx + 1,
    type: item.type,
    total: item.total,
    percentageWidth: `${Math.max(2, (item.total / maxTotal) * 100)}%`,
  }));
}

export function calculateTypeStockModalData(
  baseItems: WarehouseStockItem[],
  selectedType: string | null,
): TypeStockModalData | null {
  if (!selectedType) return null;

  const itemMap: Record<string, number> = {};

  for (const r of baseItems) {
    if (r.type === selectedType) {
      itemMap[r.item] = (itemMap[r.item] || 0) + (r.qty || 0);
    }
  }

  const entries = Object.entries(itemMap).sort(
    (a, b) => a[1] - b[1] || a[0].localeCompare(b[0]),
  );

  const rows: TypeStockModalRow[] = entries.map(([item, stok]) => {
    let status: "OK" | "Low" = "OK";
    let dotColor = "#16A34A"; // green

    if (stok <= MIN_STOCK_THRESHOLD / 2) {
      status = "Low";
      dotColor = "#DC2626"; // red
    } else if (stok < MIN_STOCK_THRESHOLD) {
      status = "Low";
      dotColor = "#EA580C"; // orange
    }

    return {
      item,
      stok,
      min: MIN_STOCK_THRESHOLD,
      status,
      dotColor,
    };
  });

  return {
    title: selectedType,
    itemCount: entries.length,
    rows,
  };
}

export function filterTableItems(
  baseItems: WarehouseStockItem[],
  filters: Pick<
    WarehouseStockFilters,
    "category" | "condition" | "type" | "tableLocation" | "search"
  >,
): WarehouseStockItem[] {
  const q = filters.search.trim().toLowerCase();

  return baseItems
    .filter((r) => {
      if (filters.category !== "Semua" && r.category !== filters.category) {
        return false;
      }
      if (filters.condition !== "Semua" && r.condition !== filters.condition) {
        return false;
      }
      if (filters.type && r.type !== filters.type) {
        return false;
      }
      if (filters.tableLocation && r.location !== filters.tableLocation) {
        return false;
      }
      if (q) {
        const target = `${r.item} ${r.type} ${r.barcode} ${r.placement}`.toLowerCase();
        if (!target.includes(q)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => a.no - b.no);
}
