export type SeverityType =
  "Critical" | "Major" | "Minor" | "Recurring" | "Trivia";
export type SeverityKey = SeverityType | "Unclassified";
export type IssueStatus =
  "Done" | "On progress" | "On queue" | "Pending" | "Unmapped";
export type SimpleStatus = "Done" | "On Progress" | "Open";
export type IssueType = "Bug" | "CR" | "Unclassified";
export type BugKind = "SIT Bug" | "UAT Bug" | "Live Bug" | "CR Bug" | null;
export type FlagType = "Clean" | "Unmapped" | "Orphaned";
export type MatrixRole = "Developer" | "PIC Project" | "Bizdev";
export type MatrixType = "Bug" | "CR";

export interface ProjectItem {
  id: number;
  name: string;
  fsd: boolean;
  range: string;
}

export interface IssueRecord {
  id: number;
  pic: string;
  picRole: string;
  kind: BugKind;
  pid: number;
  project: string;
  dev: string;
  devRole: string;
  devInit: string;
  type: IssueType;
  typeLabel: string;
  sev: SeverityType;
  impact: number;
  status: IssueStatus;
  w: number; // weight
  period: string;
  disc: string;
  start: string;
  finish: string;
  sit: string;
  updated: string;
  by: string;
  cause: string;
  origin: string;
  fsd: boolean;
  section: string;
  tt: string;
  remarks: string;
  resp: string;
  flag: FlagType;
  spic?: string;
  pi?: number | null;
  dpi?: number;
}

export interface OverviewFilterParams {
  year: string;
  month: string;
  project: string;
  role: string;
  searchQuery?: string;
}

export interface DeltaInfo {
  show: boolean;
  text: string;
  tone: "good" | "bad" | "neutral";
  direction?: "up" | "down" | "flat";
}

export interface KpiEntry {
  count: number;
  delta: DeltaInfo;
}

/** Data mini chart YoY di kartu KPI — null bila tahun pembanding kosong. */
export interface KpiYoY {
  prevYear: string;
  curYear: string;
  prev: number;
  cur: number;
}

export interface StageChip {
  label: string;
  count: number;
  pct: number;
}

// ----------------------------------------------------------------------
// Bug breakdown modal (Total bug "Lihat detail")
// ----------------------------------------------------------------------
export interface BugBreakdownStageCard {
  label: string;
  count: number;
  pct: number;
}

export interface BugBreakdownSeverityRow {
  label: SeverityType;
  count: number;
  pct: number;
  color: string;
}

export interface BugBreakdownStatusRow {
  label: SimpleStatus;
  count: number;
  pct: number;
}

export interface BugBreakdownContributor {
  name: string;
  bugCount: number;
  criticalCount: number;
  chips: { label: SeverityType; count: number }[];
}

export interface BugBreakdownData {
  totalBugs: number;
  stageCards: BugBreakdownStageCard[];
  severityRows: BugBreakdownSeverityRow[];
  statusRows: BugBreakdownStatusRow[];
  topContributors: BugBreakdownContributor[];
}

// ----------------------------------------------------------------------
// Person detail modal
// ----------------------------------------------------------------------
export interface PersonSevMixItem {
  label: SeverityType;
  count: number;
  pct: number;
  color: string;
}

export interface PersonDetailData {
  name: string;
  role: MatrixRole;
  findings: number;
  projectCount: number;
  penalty: number;
  avgDays: number | null;
  doneCount: number;
  sevMix: PersonSevMixItem[];
  topProjects: { name: string; count: number }[];
}

export interface Row1OverviewData {
  findings: KpiEntry;
  findingsYoY: KpiYoY | null;
  bug: KpiEntry;
  bugYoY: KpiYoY | null;
  cr: KpiEntry;
  crYoY: KpiYoY | null;
  penalty: KpiEntry;
  penaltyYoY: KpiYoY | null;
  stageChips: StageChip[];
  periodLabel: string;
  bugModalData: BugBreakdownData;
  personDetails: Record<string, PersonDetailData>;
}

export interface DistributionSeg {
  label: string;
  count: number;
  pct: number;
  color: string;
}

export interface PersonBarItem {
  name: string;
  count: number;
  pct: number;
}

export interface DonutSeg {
  label: SeverityKey;
  count: number;
  pct: number;
  color: string;
}

export interface SevScaleItem {
  label: SeverityType;
  weight: number;
  desc: string;
}

export interface Row2OverviewData {
  mtRole: MatrixRole;
  mtType: MatrixType;
  periodLabel: string;
  srcSegs: DistributionSeg[];
  fsdSegs: DistributionSeg[];
  personBars: PersonBarItem[];
  donutTotal: number;
  donutSegs: DonutSeg[];
  sevScale: SevScaleItem[];
}

export interface AuditMatrixRow {
  rank: number;
  name: string;
  projectCount: number;
  doneCount: number;
  total: number;
  score: number;
  avgDays: number | null;
  sevCounts: Record<SeverityType, number>;
  statusLabel: "Perlu audit" | "Perlu dipantau" | "Terkendali";
  tone: "red" | "amber" | "green";
}

export interface Row3OverviewData {
  periodLabel: string;
  matrixRows: AuditMatrixRow[];
}

export interface FullOverviewDashboardData {
  row1: Row1OverviewData;
  row2: Row2OverviewData;
  row3: Row3OverviewData;
}

// ----------------------------------------------------------------------
// Legacy types kept for components that still reference them
// ----------------------------------------------------------------------
export interface DevRiskMatrixRow {
  rank: number;
  name: string;
  role: string;
  total: number;
  score: number;
  sevCounts: Record<SeverityType, number>;
  statusLabel: string;
  isCritical: boolean;
}

export interface DefectVolumeDevItem {
  name: string;
  role: string;
  count: number;
}

// Alias for backward compatibility
export type OverviewDashboardData = FullOverviewDashboardData;
export type Row1Data = Row1OverviewData;
export type Row2Data = Row2OverviewData;
export type Row3Data = Row3OverviewData;

export interface ProjectGroup {
  id: number;
  name: string;
  range: string;
  fsd: boolean;
  bugCount: number;
  crCount: number;
  rows: IssueRecord[];
}
