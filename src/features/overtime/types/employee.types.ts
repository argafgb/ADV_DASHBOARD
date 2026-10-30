export interface ApprovalStatus {
  label: string;
  count: number;
  percentage: number;
  variant: "good" | "warn" | "risk" | "default";
}

export interface ApprovalStatusItem {
  label: string;
  count: number;
  percentage: number;
  color?: string;
  variant?: "good" | "warn" | "risk" | "default";
}

export interface ApprovalStatusData {
  items: ApprovalStatusItem[];
  totalSubmissions: number;
  avgApprovalTime: string;
}

export interface HeatmapCell {
  day: string;
  slot: string;
  heat: number;
  value?: number;
  isWeekend: boolean;
  label: string;
}

export interface RiskBox {
  count: number;
  countLabel?: string;
  title: string;
  description: string;
  tone?: "red" | "amber";
  icon?: "users" | "clock" | "gauge";
}

export interface WeeklyData {
  label: string;
  short: string;
  hours: number;
  reason: string;
}

export interface Employee {
  initials: string;
  name: string;
  id: string;
  role: string;
  area: string;
  reason: string;
  peakHeadline?: string;
  peakReason?: string;
  weekly: WeeklyData[];
  freq: number;
  hours: string;
  cost: string;
  level: string;
  tag: "risk" | "warn";
  repeatPattern?: string;
}

export interface RepeatEmployee {
  id: string;
  name: string;
  area: string;
  pattern: string;
  consecutiveWeeks: number;
  hours: string;
  totalHours: number;
}

export interface EmployeeComplianceData {
  approvalStatus: ApprovalStatusData;
  heatmap: HeatmapCell[];
  riskBoxes: RiskBox[];
  totalIndications: number;
  employees: Employee[];
  repeatEmployees: RepeatEmployee[];
}
