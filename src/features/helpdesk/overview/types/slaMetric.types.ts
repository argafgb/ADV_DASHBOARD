export interface SLAMetricsByDepartment {
  year: number;
  month: number;
  pc_sla_resolved_dct: number;
  pc_sla_response_dct: number;
  pc_sla_resolved_it: number;
  pc_sla_response_it: number;
  target: number;
}

export interface SLAMetricsAllDepartment {
  year: number;
  month: number;
  pc_sla_resolved: number;
  pc_sla_response: number;
  target: number;
}

export interface SlaMetric {
  percentage: number;
  achieved: number;
  custom_pct?: string; // Optional custom string representation
  missed: number;
  missedTickets?: string;
  ok: boolean;
  prevPercentage?: number;
  error?: boolean;
}

export interface CombinedSLAMetricsData {
  metrics: SLAMetricsByDepartment;
  dctResolve: SlaMetric;
  dctResponse: SlaMetric;
  itResolve: SlaMetric;
  itResponse: SlaMetric;
  /** Pre-aggregated ALL-dept resolve metric (server-side weighted average) */
  allResolve: SlaMetric;
  /** Pre-aggregated ALL-dept response metric (server-side weighted average) */
  allResponse: SlaMetric;
}

export interface CombinedOverallSLAData {
  metrics: SLAMetricsAllDepartment;
  resolve: SlaMetric;
  response: SlaMetric;
}

export interface BadgeSpec {
  label: string;
  variant: "success" | "warning" | "error" | "info";
}

export function badge(ok: boolean): BadgeSpec {
  return {
    label: ok ? "Achieved" : "Not Achieved",
    variant: ok ? "success" : "error",
  };
}

export function fmt(val: number): string {
  return val.toLocaleString("id-ID");
}
