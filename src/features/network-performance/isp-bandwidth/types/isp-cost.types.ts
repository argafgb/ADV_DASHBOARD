export interface IspCostLink {
  branch: string;
  vendor: string;
  mbps: number;
  cost: number;
  share?: number;
}

export interface IspCostKpi {
  label: string;
  value: string;
  tone: "blue" | "amber" | "green" | "red";
  tip: {
    title: string;
    primary: string;
    secondary: string;
    meta: string;
    tone: "blue" | "amber" | "green" | "red";
  };
}

export interface IspCostVendorRow {
  vendor: string;
  cost: string;
  rawCost: number;
  links: number;
  pct: string;
  width: string;
  color: string;
  mbps: number;
  tip: {
    title: string;
    primary: string;
    secondary: string;
    meta: string;
    tone: "blue" | "amber" | "green" | "red";
  };
}

export interface IspCostBranchTopRow {
  branch: string;
  region: string;
  cost: string;
  rawCost: number;
  links: number;
  width: string;
  pct: string;
  color: string;
  tip: {
    title: string;
    primary: string;
    secondary: string;
    meta: string;
    tone: "blue" | "amber" | "green" | "red";
  };
}

export interface IspRegionCostRow {
  region: string;
  area: string;
  count: number;
  cost: number;
  costFull: string;
  barPct: string;
  mbpsLabel: string;
  linksLabel: string;
  names: string[];
  topVendor: string;
  topVendorShare: string;
}

export interface IspBranchMonthlyLinkItem {
  vendor: string;
  mbps: number;
  cost: number;
  share: number;
}

export interface IspBranchMonthlyRow {
  no: number;
  branch: string;
  region: string;
  linkN: number;
  mbps: number;
  cost: number;
  months: number[];
  avgM: number;
  yearTotal: number;
  links: IspBranchMonthlyLinkItem[];
}

export interface IspProviderMonthlyRow {
  vendor: string;
  links: number;
  branches: number;
  mbps: number;
  months: number[];
  avg: number;
  hi: number;
  lo: number;
}

export interface IspBranchModalData {
  branch: string;
  region: string;
  linkN: number;
  subtitle: string;
  cost: string;
  yearTotal: string;
  hiLabel: string;
  hiValue: string;
  loLabel: string;
  loValue: string;
  spread: string;
  aboveNote: string;
  months: {
    month: string;
    value: string;
    width: string;
    color: string;
    delta: string;
    deltaColor: string;
    note: string;
  }[];
  links: {
    vendor: string;
    mbps: string;
    cost: string;
    share: string;
    width: string;
    color: string;
  }[];
}

export interface IspRegionModalData {
  region: string;
  area: string;
  total: string;
  subtitle: string;
  rows: {
    branch: string;
    links: string;
    cost: string;
    width: string;
    color: string;
  }[];
}

export interface IspCostFinancials {
  grandCost: number;
  grandCostFormatted: string;
  kpis: IspCostKpi[];
  costVendors: IspCostVendorRow[];
  costTopBranches: IspCostBranchTopRow[];
  regionRows: IspRegionCostRow[];
  branchRows: IspBranchMonthlyRow[];
  providerRows: IspProviderMonthlyRow[];
  providerTotals: number[];
  providerCellMax: number;
}

export interface RawInternetCostRow {
  year: number;
  month: number;
  quarter: number;
  raw_branch_name: string;
  branch_display_name: string | null;
  operation_region: string | null;
  raw_isp: string;
  isp_name: string | null;
  bandwidth_mbps: number | null;
  cost: number;
}
