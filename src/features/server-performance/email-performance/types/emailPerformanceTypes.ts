export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export interface EmailIncident {
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

export interface EmailSeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface EmailMonthlyMetric {
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

export interface EmailQuarterlyMetric {
  quarter: string;
  qCurr: number | null;
  qPrev: number;
}

export interface EmailPerformanceData {
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
  severityBreakdown: EmailSeverityBreakdown;
  monthlyMetrics: EmailMonthlyMetric[];
  quarterlyMetrics: EmailQuarterlyMetric[];
  incidents: EmailIncident[];
}
