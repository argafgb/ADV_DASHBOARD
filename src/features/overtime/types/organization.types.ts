export interface OrgUnit {
  name: string;
  hours: string;
  cost: string;
  rank: number;
  children: string[];
}

export interface ComparisonRow {
  label: string;
  hours: number;
  hoursLabel: string;
  percentage: number;
  color: "brand" | "purple";
}

export interface RatioItem {
  name: string;
  value: string;
  fill: number;
}

export interface RatioUnmatched {
  units: number;
  hours: number;
}

export interface RatioData {
  items: RatioItem[];
  unmatched: RatioUnmatched;
}

export interface ScatterPoint {
  name: string;
  hours: number;
  cost: number;
  radius: number;
}

export interface TopUnitStat {
  label: string;
  hours: number;
  cost: number;
  sharePct: number;
}

export interface TopIncreaseStat {
  label: string;
  hours: number;
  prevHours: number;
  deltaPct: number;
}

export interface OrganizationData {
  opsUnits: OrgUnit[];
  hoUnits: OrgUnit[];
  comparison: {
    rows: ComparisonRow[];
    totalHours: number;
    topContributor: TopUnitStat | null;
    topIncrease: TopIncreaseStat | null;
  };
  ratio: RatioData;
  scatter: ScatterPoint[];
}

export interface ComparisonSegment {
  label: string;
  hours: number;
  hoursLabel: string;
  percentage: number;
  color: string;
}

export const EMPTY_STAT = "–";

export interface TopContributor {
  label: string;
  subtitle: string;
  hours: number;
  hoursLabel: string;
  detail: string;
}

export interface TopIncrease {
  label: string;
  subtitle: string;
  delta: string;
  hours: number;
  hoursLabel: string;
  detail: string;
}

export interface ComparisonCardData {
  totalHours: number;
  totalLabel: string;
  segments: ComparisonSegment[];
  topContributor: TopContributor;
  topIncrease: TopIncrease;
}

export interface RatioBarItem {
  name: string;
  value: number;
}

export interface RatioChartData {
  items: RatioBarItem[];
  unmatched: RatioUnmatched;
}
