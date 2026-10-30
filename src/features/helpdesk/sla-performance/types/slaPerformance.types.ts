export type SlaMetricTab = "resolve" | "response" | "both";

export interface SlaMetricSummary {
  percentage: number;
  target: number;
  achieved: number;
  missed: number;
  missedTickets?: string;
}

export interface SlaTrendPoint {
  month: number;
  label: string;
  problemResolve: number;
  responseTime: number;
}

export interface SlaPerformanceData {
  problemResolve: SlaMetricSummary;
  responseTime: SlaMetricSummary;
  avgDispatcherSeconds: number;
  reopenedTickets: number;
  totalTickets: number;
  trend: SlaTrendPoint[];
  avgDispatchFormatted: string;
  reopenPercentage: number;
}

export interface SlaPerformanceFilter {
  year?: string;
  month?: string;
  dept?: string;
}

export interface GrafanaProblemResolveRow {
  percent_sla_resolved: number | string | null;
  target_value: number | string | null;
}

export interface SlaPerformanceDashboardClientProps {
  data: SlaPerformanceData;
  slaProblemTrend: SlaTrendComparison[];
  slaResponseTrend: SlaTrendComparison[];
}

export interface SlaTrendComparison {
  month: number;
  prevYearPercentage: number;
  selectedYearPercentage: number;
  percentageGap: number | null;
}
