import {
  IssueType,
  SeverityKey,
  SimpleStatus,
} from "../../overview/types/overviewTypes";

export type { IssueType, SeverityKey, SimpleStatus };

export type StageLabel =
  "Testing PIC" | "SIT" | "Change Request" | "Live on Monitoring";

export type SectionLabel = "PIC Project" | "Bizdev" | "Unclassified";

export type FsdMark = "Ya" | "Tidak" | "-";

/** Lean, client-safe record shape used by the Issues data page. */
export interface IssueItem {
  id: string;
  no: number | null;
  /** Judul halaman Notion (nama temuan) */
  name: string | null;
  /** Link halaman Notion */
  url: string | null;
  /** Link lampiran/screenshot dari Notion */
  screenshotUrl: string | null;
  project: string;
  pic: string;
  dev: string;
  section: SectionLabel;
  stage: StageLabel;
  type: IssueType;
  sev: SeverityKey;
  weight: number;
  status: SimpleStatus;
  statusPic: string;
  remarks: string;
  resp: string;
  fsd: FsdMark;
  /** ISO dates (YYYY-MM-DD) or null */
  disc: string | null;
  start: string | null;
  finish: string | null;
  sitRealized: string | null;
  /** ISO timestamp (YYYY-MM-DDTHH:MM) or null */
  timeInput: string | null;
  /** ISO timestamp (YYYY-MM-DDTHH:MM) or null; kapan record terakhir diubah di Notion */
  timeEdit: string | null;
  month: number | null;
  year: number | null;
  quarter: number | null;
  periode: string | null;
  /** Handling days discovery -> finish; null when incomplete or negative */
  days: number | null;
}

export interface IssuesDataPayload {
  items: IssueItem[];
  /** Records tahun sebelumnya (scope bulan/project/role sama) untuk pembanding YoY */
  prevItems: IssueItem[];
  prevYear: number | null;
  periodLabel: string;
}

export type IssueTypeFilter = "All type" | IssueType;

export type GroupByOption =
  "Default" | "PIC / Bizdev" | "Developer" | "Project" | "Tahap testing";

// ---------------------------------------------------------------
// Derived view models (built client-side from filtered IssueItems)
// ---------------------------------------------------------------
export interface DonutSeg {
  key: SeverityKey;
  label: string;
  n: number;
  color: string;
  from: number;
  to: number;
}

export interface SeverityDonutData {
  total: number;
  segs: DonutSeg[];
}

export interface HeatmapCell {
  n: number;
  /** 0..1 intensity relative to max cell */
  t: number;
}

export interface HeatmapRow {
  name: string;
  cells: HeatmapCell[];
}

export interface MonthBarSeg {
  color: string;
  h: number;
}

export interface MonthBarRow {
  label: string;
  n: number;
  pct: number;
  color: string;
  dim: boolean;
}

export interface MonthBar {
  label: string;
  total: number;
  h: number;
  segs: MonthBarSeg[];
  rows: MonthBarRow[];
  tipTitle: string;
}

export interface SevLegendItem {
  label: string;
  n: number;
  color: string;
}

export interface IssueGroup {
  key: string;
  name: string;
  count: number;
  bugCount: number;
  crCount: number;
  avgDays: number | null;
  rangeLabel: string;
  section: SectionLabel;
  rows: IssueItem[];
}

export interface DetailStage {
  name: string;
  date: string;
  gap: string;
  filled: boolean;
  align: "start" | "center" | "end";
}

export interface IssueDetailData {
  noLabel: string;
  stages: DetailStage[];
  progress: string;
  daysBig: string;
  daysTone: "green" | "amber" | "red" | "muted";
  daysNote: string;
  duration: string;
  flag: "Lengkap" | "Perlu dilengkapi";
  flagNote: string;
  devLoad: number;
  picLoad: number;
  periodLabel: string;
}
