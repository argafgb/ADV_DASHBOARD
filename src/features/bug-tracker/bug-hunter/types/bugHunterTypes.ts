/* ------------------------------------------------------------------ */
/*  Bug Hunter – Type definitions (synced with Notion "LIST BUG HUNTER") */
/* ------------------------------------------------------------------ */

/** Category Problem (dynamic string from Notion/PostgreSQL). */
export type FindingCategory = string;

/** Severity / Task Type (dynamic string from Notion/PostgreSQL). */
export type FindingSeverity = string;

/** Priority (dynamic string from Notion/PostgreSQL). */
export type FindingPriority = string;

/** Status (dynamic string from Notion/PostgreSQL). */
export type FindingStatus = string;

/** Platform (dynamic string from Notion/PostgreSQL). */
export type FindingPlatform = string;

export interface BugFinding {
  id: string;
  number: number | null;
  /** Notion "Name" title property. */
  finding: string;
  category: FindingCategory | null;
  /** Notion "Problem LV 1" multi_select property (specific module/menu name). */
  module: string | null;
  /** Notion "Sub Menu" rich_text property. */
  subMenu: string | null;
  severity: FindingSeverity | null;
  priority: FindingPriority | null;
  platform: FindingPlatform | null;
  /** Notion "Worker / Tester " people property. */
  hunter: string | null;
  /** Notion "Dev Name" multi_select property. */
  devName: string | null;
  /** Notion "Bizdev Name" select property. */
  bizdevName: string | null;
  dateFound: string | null; // ISO date
  /** Notion "(Doc) Realized Date" date property. */
  docRealizedDate: string | null;
  /** Notion "(Live) Realized Date" date property. */
  liveRealizedDate: string | null;
  status: FindingStatus | null;
  /** Notion "Progress Penyelesaian" rich_text property. */
  progressPenyelesaian: string | null;
  /** Notion "Progress QA" rich_text property. */
  progressQA: string | null;
  /** Notion "Last Update" rich_text property. */
  lastUpdate: string | null;
  /** Derived from Notion "Ket. Berulang" rich_text property === "Y". */
  recurring: boolean;
  linkMenu: string | null;
  linkLogTemuan: string | null;
}

/* ---------- KPI ---------- */
export interface BugHunterKpi {
  totalFindings: number;
  openFindings: number;
  blockerMajor: number;
  avgResolutionDays: number | null;
  totalFindingsDelta: number | null;
  openFindingsDelta: number | null;
  blockerMajorDelta: number | null;
  avgResolutionDelta: number | null;
}

/* ---------- Charts ---------- */
export interface CategoryBarItem {
  category: FindingCategory;
  count: number;
  color: string;
}

export interface SeverityDonutSeg {
  key: FindingSeverity;
  label: string;
  n: number;
  color: string;
  from: number;
  to: number;
}

export interface StatusBarItem {
  status: FindingStatus;
  count: number;
  percentage: number;
  color: string;
}

export interface FindingsTrendBar {
  label: string; // month short label
  found: number;
  resolved: number;
  total: number;
}

export interface HunterLeaderboardItem {
  rank: number;
  name: string;
  findings: number;
  /** combined Blocker + Major count for this hunter */
  criticalCount: number;
  /** share of total findings this hunter contributed, 0–100 */
  share: number;
}

/* ---------- Full payload ---------- */
export interface BugHunterPayload {
  kpi: BugHunterKpi;
  categoryBars: CategoryBarItem[];
  severityDonut: SeverityDonutSeg[];
  statusBars: StatusBarItem[];
  trendBars: FindingsTrendBar[];
  leaderboard: HunterLeaderboardItem[];
  findings: BugFinding[];
}
