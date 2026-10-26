export const PURCHASE_CATEGORIES = ["Workstation", "Peripheral"] as const;
export type PurchaseCategory = (typeof PURCHASE_CATEGORIES)[number];
export type PurchaseCategoryFilter = "all" | PurchaseCategory;

export interface PurchaseMonth {
  year: number;
  month: number;
  label: string;
  fullLabel: string;
}

export interface PurchaseItem {
  name: string;
  category: PurchaseCategory;
  unitsByPeriod: Record<string, number>;
}

export interface AssetPurchasingData {
  items: PurchaseItem[];
  months: PurchaseMonth[];
  syncedAt: string | null;
}

export interface AssetPurchasingDbRow {
  source_category: "WORKSTATION" | "PERIPHERAL";
  item_type: string;
  purchase_year: number | string;
  purchase_month: number | string;
  quantity: number | string;
}

export interface PurchasePeriodInput {
  year: string;
  month: string;
}

export interface PurchaseModelInput extends PurchasePeriodInput {
  category: PurchaseCategoryFilter;
  data: AssetPurchasingData;
  search?: string;
}

export interface PurchaseMonthlyTotal extends PurchaseMonth {
  Workstation: number;
  Peripheral: number;
  total: number;
}

export interface PurchaseTableRow extends Omit<PurchaseItem, "unitsByPeriod"> {
  units: number[];
  total: number;
  isZero: boolean;
}

export interface AssetPurchasingModel {
  supportedPeriod: boolean;
  selectedMonths: PurchaseMonth[];
  periodLabel: string;
  scopeLabel: string;
  totalUnits: number;
  categoryTotals: Record<PurchaseCategory, number>;
  peak: { label: string; units: number } | null;
  monthly: PurchaseMonthlyTotal[];
  topItems: Array<{ name: string; category: PurchaseCategory; total: number }>;
  tableRows: PurchaseTableRow[];
  searchedRows: PurchaseTableRow[];
  tableMonthlyTotals: number[];
  tableTotal: number;
}
