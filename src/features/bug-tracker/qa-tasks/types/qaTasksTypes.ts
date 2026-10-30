/* ------------------------------------------------------------------ */
/*  QA Tasks – Type definitions (synced with Notion "List Task QA")   */
/* ------------------------------------------------------------------ */

/** Notion "Task Type" options known when this page was built; each has a
 *  fixed colour. */
export type KnownTaskType =
  | "SIT"
  | "Testing"
  | "Manual Guide"
  | "Blueprint"
  | "Draft Testing"
  | "Monkey Test"
  | "Create Trip"
  | "Create"
  | "Pembuatan Video"
  | "Data Local"
  | "Pembuatan Trip Melalui Desktop"
  | "Pembuatan Trip Melalui Desktop s.d Muncul di DCT Loading"
  | "Temuan"
  | "Bug Hunter"
  | "Monitoring";

/** Notion can gain new "Task Type" options at any time (e.g. "Test Bug
 *  RTGS"), so the field accepts any string. */
export type TaskType = string;

/** Status (dynamic string from Notion/PostgreSQL). */
export type TaskStatus = string;

/** Bobot (dynamic string from Notion/PostgreSQL). */
export type TaskBobot = string;

/** Department (dynamic string from Notion/PostgreSQL). */
export type TaskDepartment = string;

export interface QaTask {
  id: string;
  number: number | null;
  taskName: string;
  assignor: string | null;
  department: TaskDepartment | null;
  taskType: TaskType | null;
  /** Merged unique list from the "Tester 1" / "Tester 2" / "Tester " people properties. */
  testers: string[];
  dateAssign: string | null; // ISO date
  planStart: string | null; // ISO date
  planEnd: string | null; // ISO date
  durationMinutes: number | null;
  /** Notion formula property ("Mandays"). */
  mandays: number | null;
  /** Notion "Nilai Assignor" number property. */
  score: number | null;
  status: TaskStatus | null;
  bobot: TaskBobot | null;
  feedbackAssignor: string | null;
}

/* ---------- KPI ---------- */
export interface QaTaskKpi {
  totalTasks: number;
  avgScore: number | null;
  testingHours: number;
  activeTesters: number;
  totalTasksDelta: number | null;
  avgScoreDelta: number | null;
  testingHoursDelta: number | null;
  activeTestersDelta: number | null;
}

/* ---------- Charts ---------- */
export interface TaskVolumeBar {
  label: string; // month short label
  done: number;
  onProgress: number;
  reviewing: number;
  inFixing: number;
  total: number;
}

export interface TaskTypeDonutSeg {
  key: TaskType;
  label: string;
  n: number;
  color: string;
  from: number;
  to: number;
}

export interface TesterWorkloadItem {
  name: string;
  done: number;
  onProgress: number;
  reviewing: number;
  inFixing: number;
  total: number;
  avgScore: number | null;
  avgMinutes: number | null;
}

export interface StatusDonutSeg {
  key: TaskStatus;
  label: string;
  n: number;
  color: string;
  from: number;
  to: number;
}

/* ---------- Full payload ---------- */
export interface QaTasksPayload {
  kpi: QaTaskKpi;
  volumeBars: TaskVolumeBar[];
  typeDonut: TaskTypeDonutSeg[];
  workload: TesterWorkloadItem[];
  statusDonut: StatusDonutSeg[];
  tasks: QaTask[];
}
