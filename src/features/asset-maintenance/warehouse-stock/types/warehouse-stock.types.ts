export type StockCondition = "New" | "Second" | "Etrama-owned";

export interface WarehouseStockItem {
  no: number;
  item: string;
  category: string;
  type: string;
  spec: string;
  location: string;
  placement: string;
  condition: StockCondition;
  qty: number;
  qty_note: string;
  barcode: string;
  last_edited: string;
}

export interface WarehouseStockFilters {
  location: string;
  month: string;
  category: string;
  condition: string;
  type: string | null;
  tableLocation: string | null;
  search: string;
}

export interface WarehouseStockKpis {
  totalUnits: number;
  totalItems: number;
  newUnits: number;
  newPct: string;
  secondUnits: number;
  secondPct: string;
  noLocationUnits: number;
  noLocationItems: number;
}

export interface ConditionShare {
  label: "New" | "Second";
  value: number;
  percentage: string;
  color: string;
}

export interface CategoryConditionStack {
  category: string;
  newQty: number;
  secondQty: number;
  total: number;
}

export interface TopItemType {
  rank: number;
  type: string;
  total: number;
  percentageWidth: string;
}

export interface TypeStockModalRow {
  item: string;
  stok: number;
  min: number;
  status: "OK" | "Low";
  dotColor: string;
}

export interface TypeStockModalData {
  title: string;
  itemCount: number;
  rows: TypeStockModalRow[];
}

export interface WarehouseStockData {
  items: WarehouseStockItem[];
  syncedAt: string | null;
}
