export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export interface CenconIncident {
  no: number;
  incidentId: number;
  down: string;
  up: string;
  durasi: string;
  issue: string;
  sev: IncidentSeverity;
  kendala: string;
  penyebab: string;
  action: string;
  solusi: string;
  verify: boolean;
}

export interface CenconSeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface CenconMonthlyMetric {
  month: string;
  mNum: number;
  slaCurr: number | null;
  slaPrev: number;
  freqCurr: number;
  freqPrev: number;
  downCurr: number;
  downPrev: number;
  cpuCurr: number;
  cpuPrev: number;
  memCurr: number;
  memPrev: number;
}

export interface CenconQuarterlyMetric {
  quarter: string;
  qCurr: number | null;
  qPrev: number;
}

export interface CenconPerformanceData {
  name: string;
  sub: string;
  year: number;
  prevYear: number;
  periodLabel: string;
  heroSla: number;
  heroSlaStatus: "Met" | "Missed";
  downtime: string;
  downtimeMinutes: number;
  target: number;
  severityBreakdown: CenconSeverityBreakdown;
  monthlyMetrics: CenconMonthlyMetric[];
  quarterlyMetrics: CenconQuarterlyMetric[];
  incidents: CenconIncident[];
}
