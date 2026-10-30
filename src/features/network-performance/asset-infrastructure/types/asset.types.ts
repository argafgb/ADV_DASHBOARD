export type AssetCategory = "Router" | "Switch" | "AP";

export type AssetStatus = "Penambahan" | "Pergantian";

export interface AssetInfraItem {
  Tanggal: string; // YYYY-MM-DD
  Ditujukan: string; // Branch name
  "Nama Barang": string; // Device description
  Barcode: string; // Serial / Barcode
  Status: AssetStatus;
  Kategori: AssetCategory;
}

export type AssetCategoryFilter = "all" | AssetCategory;

export type AssetStatusFilter = "all" | AssetStatus;

export interface AssetKpis {
  total: number;
  branchesCount: number;
  addCount: number;
  addPct: string;
  repCount: number;
  repPct: string;
  avgPerMonth: string;
}

export interface MonthlyCategoryTrend {
  monthKey: string; // e.g. "2026-01"
  monthLabel: string; // e.g. "Jan"
  Router: number;
  Switch: number;
  AP: number;
  total: number;
}

export interface CategoryDonutItem {
  name: string;
  categoryKey: AssetCategory;
  count: number;
  pct: number;
  color: string;
}

export interface BranchActivityItem {
  name: string;
  count: number;
  width: string;
  color: string;
  categoryBreakdown: string;
}

export interface AssetTableRow {
  tanggal: string;
  cabang: string;
  barang: string;
  barcode: string;
  kategori: string;
  kategoriKey: AssetCategory;
  katColor: string;
  status: AssetStatus;
  badgeBg: string;
  badgeFg: string;
}

export interface AssetCalculatedMetrics {
  kpis: AssetKpis;
  filteredRows: AssetInfraItem[];
  tableRows: AssetTableRow[];
  monthlyTrends: MonthlyCategoryTrend[];
  categoryDonut: CategoryDonutItem[];
  topBranches: BranchActivityItem[];
}
