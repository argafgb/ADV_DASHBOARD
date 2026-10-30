export interface OverviewPeriod {
  year: number;
  startMonth: number;
  endMonth: number;
  cutoffMonth: number;
  available: boolean;
  label: string;
  includesOpenMonth: boolean;
}

export interface KpiCardData {
  label: string;
  value: string;
  icon: string;
  deltaLabel: string;
  deltaValue: string;
  deltaAvailable: boolean;
  deltaDirection: "up" | "down";
  deltaTone: "up" | "down";
  tone: "blue" | "green" | "amber";
}

export interface YoyDataPoint {
  month: string;
  year2024: number | null;
  year2025: number | null;
  year2026: number | null;
}

export interface ParetoItem {
  name: string;
  hoursPct: number;
  costPct: number;
  label: string;
}

export interface CompositionData {
  totalLabel: string;
  totalValue: string;
  items: {
    name: string;
    percentage: string;
    detail: string;
    color: "brand" | "purple";
  }[];
}

export interface OverviewData {
  kpis: KpiCardData[];
  yoyHours: YoyDataPoint[];
  yoyCost: YoyDataPoint[];
  pareto: ParetoItem[];
  composition: CompositionData;
  period: OverviewPeriod;
}
