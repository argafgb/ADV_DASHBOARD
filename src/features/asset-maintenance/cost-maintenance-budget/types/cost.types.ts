/**
 * Types specific to the Cost & Maintenance Budget dashboard feature.
 */

/** One site row in the cost detail table. */
export interface CostSiteRow {
  no: number;
  site: string;
  type: string;
  ws: number;
  periph: number;
  infra: number;
  cost: number;
}

export interface OwnerTotal {
  label: string;
  total: number;
  totalFmt: string;
  color: string;
}

export interface GroupOwnerItem {
  label: string;
  value: number;
  valueFmt: string;
  pct: string;
  color: string;
}

export interface RepairMaintenanceGroup {
  label: string;
  sharePct: string;
  total: number;
  totalFmt: string;
  owners: GroupOwnerItem[];
}

export interface CategorySummaryItem {
  label: string;
  total: number;
  totalFmt: string;
  sewaShare: string;
  sewaBar: string;
  repairBar: string;
  sewa: number;
  sewaFmt: string;
  repair: number;
  repairFmt: string;
}

export interface RepairMaintenanceSummary {
  ownAdv: number;
  ownWisesa: number;
  ownerTotals: OwnerTotal[];
  sumGroups: RepairMaintenanceGroup[];
  sumCats: CategorySummaryItem[];
}

/** Paginated result payload for cost detail table. */
export interface PaginatedCostResult {
  rows: CostSiteRow[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export interface RegionSummaryCard {
  region: string;
  label: string;
  siteCount: number;
  total: number;
  totalFmt: string;
  sewa: number;
  sewaFmt: string;
  sewaBar: string;
  repair: number;
  repairFmt: string;
  repairBar: string;
}

export interface MonthlyCostMatrixCell {
  month: string;
  value: number;
  text: string;
  sewa: number;
  repair: number;
  deviceCount: number;
}

export interface MonthlyCostMatrixRow {
  site: string;
  region: string;
  cells: Record<string, MonthlyCostMatrixCell | null>;
  total: number;
  totalText: string;
}

export interface MonthlyCostComparisonResult {
  regions: RegionSummaryCard[];
  months: string[];
  rows: MonthlyCostMatrixRow[];
}


