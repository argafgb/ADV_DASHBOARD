export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export interface CentranIncident {
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

export interface CentranSeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export type ServerLocationKey = "server1_ampasit" | "server2_ampasit" | "cos_smg" | "dc";

export interface ServerLocationMetric {
  total25: number;
  open25: number;
  close25: number;
  total26: number;
  open26: number;
  close26: number;
}

export interface MonthlyServerOpenCloseMetric {
  month: string;
  mNum: number;
  byServer: Record<ServerLocationKey, ServerLocationMetric>;
  allTotal25: number;
  allOpen25: number;
  allClose25: number;
  allTotal26: number;
  allOpen26: number;
  allClose26: number;
}

export interface CentranOpenCloseData {
  totalIncidents: number;
  serverTotals: Record<ServerLocationKey, number>;
  serverLabels?: Record<ServerLocationKey, string>;
  monthly: MonthlyServerOpenCloseMetric[];
}

export interface CentranMonthlyMetric {
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

export interface CentranQuarterlyMetric {
  quarter: string;
  qCurr: number | null;
  qPrev: number;
}

export interface CentranPerformanceData {
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
  severityBreakdown: CentranSeverityBreakdown;
  openCloseData: CentranOpenCloseData;
  monthlyMetrics: CentranMonthlyMetric[];
  quarterlyMetrics: CentranQuarterlyMetric[];
  incidents: CentranIncident[];
}
