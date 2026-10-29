export interface Branch {
  name: string;
  district: string | null;
  region: string;
  /** R1–R6 / CID — the operational grouping behind "Ringkasan per region" */
  operationRegion: string;
}

/** One row of "Ringkasan per region", in display order. */
export interface RegionGroup {
  name: string;
  /** geographic regions this group spans, e.g. "Jawa Timur, Sulawesi" */
  area: string;
  branches: string[];
}

export interface DowntimeIncident {
  /** network_incidents.id — stable row identity; a branch can have several
   *  incidents in the same month, so site+periode is not unique */
  id: number;
  site: string;
  /** calendar year of downtime_start; null when the source has no timestamp */
  year: number | null;
  /** 0-indexed month of downtime_start, matching FilterContext's `bulan` */
  month: number | null;
  /** display form of year/month, e.g. "Jan-26" */
  periode: string;
  sla: string;
  durasi: string;
  durationMinutes: number;
  problem: string;
  level: "critical" | "high" | "medium" | "low";
  cause: string;
  causeCode: string;
  impact: string | null;
  solution: string | null;
  downtimeStart: string | null;
  uptimeEnd: string | null;
  /** incident is embedded in its branch's monthly report, so the SLA rollup counts it */
  verified: boolean;
}

export interface IspLink {
  v: string;
  mbps: number | null;
}

// TrafficRow described the mock table's positional tuple. Traffic now arrives
// as named fields from branch_traffic_monthly — see queries/traffic.ts.

/**
 * One branch-month. `value` is what the UI renders; where the logged incidents
 * exceeded the reported downtime it is recomputed from those incidents, and
 * `sourceValue` keeps what the source system said.
 */
export interface SlaCell {
  value: number;
  sourceValue: number;
  recomputed: boolean;
}

export type SlaMatrix = Record<number, Record<string, (SlaCell | null)[]>>;

export type Tone = "green" | "amber" | "red" | "gray";

export interface WeeklyQualityRecord {
  id: number;
  branchName: string;
  year: number;
  month: number;
  periodName: string | null;
  weekName: string | null;
  weekNumber: number | null;
  dateRangeLabel: string | null;
  slaUptime: number | null;
  slaLatencyMs: number | null;
  jitter: string | null;
  qualityGood: number | null;
  qualityWarning: number | null;
  qualityBad: number | null;
  qualityCritical: number | null;
  notes: string | null;
  infraCheckResult: string | null;
  picAdmin: string | null;
  picInfra: string | null;
}
