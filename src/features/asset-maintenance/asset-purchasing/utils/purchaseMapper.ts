import type {
  AssetPurchasingData,
  AssetPurchasingDbRow,
  PurchaseCategory,
  PurchaseItem,
  PurchaseMonth,
} from "../types";

const MONTH_LABELS = [
  ["Jan", "January"],
  ["Feb", "February"],
  ["Mar", "March"],
  ["Apr", "April"],
  ["May", "May"],
  ["Jun", "June"],
  ["Jul", "July"],
  ["Aug", "August"],
  ["Sep", "September"],
  ["Oct", "October"],
  ["Nov", "November"],
  ["Dec", "December"],
] as const;

function categoryFor(sourceCategory: AssetPurchasingDbRow["source_category"]): PurchaseCategory {
  return sourceCategory === "WORKSTATION" ? "Workstation" : "Peripheral";
}

export function purchaseMonth(year: number, month: number): PurchaseMonth {
  const labels = MONTH_LABELS[month - 1];
  return {
    year,
    month,
    label: labels?.[0] ?? String(month),
    fullLabel: labels?.[1] ?? String(month),
  };
}

export function mapAssetPurchasingRows(
  rows: readonly AssetPurchasingDbRow[],
  syncedAt: string | null,
): AssetPurchasingData {
  const monthKeys = new Set<string>();
  const itemMap = new Map<string, PurchaseItem>();

  for (const row of rows) {
    const year = Number(row.purchase_year);
    const month = Number(row.purchase_month);
    const quantity = Number(row.quantity);
    if (!Number.isInteger(year) || month < 1 || month > 12 || !Number.isFinite(quantity)) continue;

    const category = categoryFor(row.source_category);
    const monthKey = `${year}-${month}`;
    const itemKey = `${category}\u0000${row.item_type}`;
    monthKeys.add(monthKey);

    const item = itemMap.get(itemKey) ?? {
      name: row.item_type,
      category,
      unitsByPeriod: {},
    };
    item.unitsByPeriod[monthKey] = (item.unitsByPeriod[monthKey] ?? 0) + quantity;
    itemMap.set(itemKey, item);
  }

  const months = [...monthKeys]
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return purchaseMonth(year, month);
    })
    .sort((a, b) => a.year - b.year || a.month - b.month);

  return {
    items: [...itemMap.values()].sort(
      (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    ),
    months,
    syncedAt,
  };
}
