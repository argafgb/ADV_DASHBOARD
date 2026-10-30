export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export interface DctIncident {
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

export interface DctSeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface DctMonthlyMetric {
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

export interface DctQuarterlyMetric {
  quarter: string;
  qCurr: number | null;
  qPrev: number;
}

export interface DctPerformanceData {
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
  severityBreakdown: DctSeverityBreakdown;
  monthlyMetrics: DctMonthlyMetric[];
  quarterlyMetrics: DctQuarterlyMetric[];
  incidents: DctIncident[];
}
