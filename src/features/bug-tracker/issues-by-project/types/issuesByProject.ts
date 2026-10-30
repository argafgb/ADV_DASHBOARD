import { IssueItem } from "@/features/bug-tracker/issues-data/types/issuesData";

export type { IssueItem };

// ---------------------------------------------------------------
// Payload (server -> client)
// ---------------------------------------------------------------
export interface IssuesByProjectPayload {
  /** Records within the selected month scope */
  items: IssueItem[];
  /** Records tahun sebelumnya (scope bulan/project/role sama), untuk kartu pembanding */
  prevItems: IssueItem[];
  /** Full-year findings per month (index 0 = Jan), by Periode month */
  foundPerMonth: number[];
  /** Full-year closed records per month, by finish date */
  closedPerMonth: number[];
  /** Findings per month for the previous year (YoY comparison), null when absent */
  foundPerMonthPrev: number[] | null;
  /** Closed records per month for the previous year, null when absent */
  closedPerMonthPrev: number[] | null;
  prevYear: number | null;
  periodLabel: string;
}

// ---------------------------------------------------------------
// Derived view models (built client-side)
// ---------------------------------------------------------------
export interface TopProject {
  name: string;
  n: number;
  /** Bar width percentage, min 3 */
  pct: number;
}

export interface FoundVsClosedPoint {
  month: string;
  /** Cumulative findings up to and including this month */
  found: number;
  /** Cumulative closed up to and including this month */
  closed: number;
}

export interface FoundVsClosedData {
  foundTotal: number;
  closedTotal: number;
  points: FoundVsClosedPoint[];
}

export interface BugCrBarRow {
  label: string;
  n: number;
  pct: number;
  colorKey: "bug" | "cr" | "unclassified";
  dim: boolean;
}

export interface BugCrBar {
  label: string;
  nb: number;
  nc: number;
  nu: number;
  hb: number;
  hc: number;
  tipTitle: string;
  rows: BugCrBarRow[];
}

export interface BugCrChartData {
  bars: BugCrBar[];
  totalBug: number;
  totalCr: number;
  totalUnclassified: number;
}

export interface ProjectGroup {
  key: string;
  name: string;
  /** Earliest / latest discovery date (ISO), "" when none */
  lo: string;
  hi: string;
  rangeLabel: string;
  bugCount: number;
  crCount: number;
  fsdYa: number;
  fsdNo: number;
  fsdOk: boolean;
  avgDays: number | null;
  rows: IssueItem[];
}

export type ProjectSortOption = "Terbaru" | "Terlama" | "Terbanyak";

export const PROJECT_SORT_OPTIONS: ProjectSortOption[] = [
  "Terbaru",
  "Terlama",
  "Terbanyak",
];
