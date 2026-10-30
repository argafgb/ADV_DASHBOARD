export type SystemKey = "dct" | "cencon" | "centran" | "email";

export type SeverityLevel = "critical" | "high" | "medium" | "low";

export interface IncidentItem {
  no: number;
  down: string;
  up: string;
  durasi: string;
  peak: string;
  issue: string;
  sev: SeverityLevel;
  kendala: string;
  penyebab: string;
}

export interface SystemCounter {
  label: string;
  open: number;
  close: number;
  open25: number;
  close25: number;
}

export interface SystemData {
  name: string;
  sub: string;
  heroSla: string;
  downtime: string;
  sla25: number[];
  sla26: number[];
  freq25?: number[];
  freq26?: number[];
  down25: number[];
  down26: number[];
  q25?: (number | null)[];
  q26?: (number | null)[];
  cpu25?: number[];
  cpu26?: number[];
  mem25?: number[];
  mem26?: number[];
  counters?: SystemCounter[];
  incidents: IncidentItem[];
}

export interface DeltaInfo {
  value: string;
  isUp: boolean;
  tone: "green" | "red";
  basis: "MoM" | "YoY";
}

export interface OverviewMetrics {
  availabilitySla: number;
  availabilityDelta: DeltaInfo;
  downtimeMinutes: number;
  downtimeDelta: DeltaInfo;
  totalIncidents: number;
  incidentsDelta: DeltaInfo;
  periodLabel: string;
}

export interface SystemSlaBreakdown {
  key: SystemKey;
  name: string;
  sla: string;
  status: string;
}

export interface SystemDowntimeBreakdown {
  key: SystemKey;
  name: string;
  downtime: string;
  status: string;
}

export interface TrendChartPoint {
  month: string;
  sla2025: number | null;
  sla2026: number | null;
}

export interface RootCauseItem {
  label: string;
  count: number;
  percentage: number;
  severity: SeverityLevel;
}

export interface RecentIncidentDisplay {
  sysKey: SystemKey;
  sysLabel: string;
  sysColor: string;
  down: string;
  durasi: string;
  issue: string;
  sev: SeverityLevel;
  kendala: string;
  penyebab: string;
}

export interface DataSourceItem {
  name: string;
  status: "green" | "gray";
  txt: string;
  dotColor?: string;
}

export interface Row1OverviewData {
  metrics: {
    availabilitySla: number;
    availabilityDelta: DeltaInfo;
    downtimeMinutes: number;
    downtimeDelta: DeltaInfo;
    periodLabel: string;
  };
  systemSlas: SystemSlaBreakdown[];
  systemDowntimes: SystemDowntimeBreakdown[];
}

export interface Row2OverviewData {
  totalIncidents: number;
  incidentsDelta: DeltaInfo;
  periodLabel: string;
  rootCauses: RootCauseItem[];
  recentIncidents: RecentIncidentDisplay[];
}

export interface Row3OverviewData {
  trendData: TrendChartPoint[];
  periodLabel: string;
}

export interface FullOverviewDashboardData {
  row1: Row1OverviewData;
  row2: Row2OverviewData;
  row3: Row3OverviewData;
}
