/**
 * Tipe bersama seluruh fitur Kaldev Performance.
 *
 * Bentuknya mengikuti artefak desain (`Kaldev Performance Dashboard.html`):
 * semua tanggal sudah berupa teks tampilan ("17 September 2026 08.45") karena
 * service layer yang bertanggung jawab memformat, komponen hanya menampilkan.
 */

export const PROJECT_STATUSES = [
  "Antrean",
  "Dikerjakan",
  "Selesai",
  "Ditahan",
  "Dibatalkan",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Label Inggris pada tab/lane, sesuai desain. */
export const STATUS_EN: Record<ProjectStatus, string> = {
  Antrean: "On queue",
  Dikerjakan: "On progress",
  Selesai: "Done",
  Ditahan: "On hold",
  Dibatalkan: "Cancelled",
};

export type StatusTone = "green" | "blue" | "amber" | "red" | "gray";

export function statusTone(status: ProjectStatus): StatusTone {
  switch (status) {
    case "Selesai":
      return "green";
    case "Dikerjakan":
      return "blue";
    case "Ditahan":
      return "amber";
    case "Dibatalkan":
      return "red";
    default:
      return "gray";
  }
}

export type ProjectSource = "Bizdev" | "PIC";
export type SourceFilter = "Semua" | ProjectSource;
export type ProjectFlag = "late" | "near" | "idle" | "nodev";

export function parseSource(value: string | undefined): SourceFilter {
  return value === "Bizdev" || value === "PIC" ? value : "Semua";
}

export interface Project {
  id: string;
  name: string;
  /** null = "Belum ditugaskan". */
  programmer: string | null;
  basis: string;
  kategori: string;
  status: ProjectStatus;
  progress: number | null;
  dibuat: string;
  mulai: string | null;
  target: string | null;
  selesai: string | null;
  /** > 0 hari terlambat, 0 tepat waktu, < 0 sisa hari ke target, null tidak berlaku. */
  late: number | null;
  flag?: ProjectFlag | null;
  note: string;
  source: ProjectSource;
  /** Indeks bulan periode (0 = Januari): bulan selesai untuk Selesai, bulan dibuat untuk lainnya. */
  month: number;
  achieved: boolean | null;
  implementer?: string | null;
  idle?: number | null;
  last?: string | null;
  wait?: number | null;
  reason?: string | null;
  since?: string | null;
  approver?: string | null;
}

/** Filter global yang dibawa URL: chip shell (Tahun, Bulan) + "Project dari". */
export interface KaldevFilters {
  year: string;
  /** "ALL" | "N" | "N-N" (1-based), format shell fleet. */
  month: string;
  from: SourceFilter;
}

/* ── Overview ─────────────────────────────────────────────────────────── */

export interface DeltaInfo {
  current: number;
  previous: number;
  span: number;
}

export interface OverviewKpi {
  aktif: string;
  aktifSub: string;
  late: string;
  near: string;
  done: string;
  doneSub: string;
  doneDelta: DeltaInfo | null;
}

export interface SlaBreach {
  label: string;
  detail: string;
  value: string;
}

export interface SlaSummary {
  pct: number;
  pctLabel: string;
  target: number;
  periodLabel: string;
  achievedCount: string;
  notAchievedCount: string;
  gapText: string;
  achieved: boolean;
  breachTitle: string;
  breaches: SlaBreach[];
}

export interface TrendPoint {
  key: string;
  label: string;
  full: string;
  partial: boolean;
  ok: number;
  no: number;
  pct: number;
}

export type AttentionKind =
  "late" | "near" | "nodev" | "idle" | "hold" | "team";

export interface AttentionItem {
  kind: AttentionKind;
  text: string;
  tone: "red" | "amber" | "blue";
  href: string;
}

export interface MixSlice {
  key: "done" | "prog" | "queue" | "planned";
  label: string;
  value: number;
  pct: number;
  tipUnit: string;
  tipSub: string;
}

export interface IntakeMonth {
  key: string;
  label: string;
  full: string;
  partial: boolean;
  done: number;
  progress: number;
  queue: number;
  other: number;
  total: number;
}

export interface TeamLoadRow {
  name: string;
  q: number;
  p: number;
  today: number;
  total: number;
}

export interface CategoryRow {
  label: string;
  value: number;
}

export interface CategorySlice extends CategoryRow {
  pct: number;
  /** Rincian kategori kecil yang digabung ke "Lainnya". */
  detail: string | null;
}

export interface OverviewData {
  asOfLabel: string;
  yearLabel: string;
  kpi: OverviewKpi;
  sla: SlaSummary;
  trend: TrendPoint[];
  trendNote: string | null;
  attention: AttentionItem[];
  mix: {
    slices: MixSlice[];
    total: number;
    subtitle: string;
    holdCount: number;
    cancelCount: number;
  };
  intake: IntakeMonth[];
  teamLoad: TeamLoadRow[];
  teamMax: number;
  categories: CategoryRow[];
}

/* ── Action required ──────────────────────────────────────────────────── */

export type AttentionTab = "sla" | "noprog" | "idle" | "hold";

export interface DueRow {
  id: string;
  name: string;
  programmer: string | null;
  target: string | null;
  /** > 0 terlambat N hari, < 0 sisa N hari. */
  days: number;
}

export interface NoDevRow {
  id: string;
  name: string;
  basis: string;
  kategori: string;
  dibuat: string;
  createdBy: string | null;
  programmer: string | null;
  wait: number;
}

export interface IdleRow {
  id: string;
  name: string;
  implementer: string | null;
  dev: string | null;
  last: string | null;
  idle: number;
}

export interface HoldItem {
  id: string;
  name: string;
  programmer: string | null;
  basis: string;
  since: string | null;
  approver: string | null;
  reason: string | null;
}

export interface AttentionData {
  counts: Record<AttentionTab, number>;
  due: DueRow[];
  noDev: NoDevRow[];
  idle: IdleRow[];
  holds: HoldItem[];
}

/* ── Project register ─────────────────────────────────────────────────── */

export type RegisterView = "kanban" | "table";

export interface RegisterQuery {
  view: RegisterView;
  status: "Semua" | ProjectStatus;
  cat: string;
  basis: string;
  prog: string;
  q: string;
  page: number;
  laneLimits: Partial<Record<ProjectStatus, number>>;
}

export interface KanbanCard {
  id: string;
  name: string;
  programmer: string | null;
  basis: string;
  kategori: string;
  dateText: string;
  progress: number | null;
  showProgress: boolean;
  flag: { text: string; tone: "red" | "amber" | "green" } | null;
}

export interface KanbanLane {
  status: ProjectStatus;
  label: string;
  tone: StatusTone;
  count: number;
  cards: KanbanCard[];
  hasMore: boolean;
  moreText: string;
  nextLimit: number;
}

export interface RegisterData {
  statusCounts: Record<"Semua" | ProjectStatus, number>;
  options: { categories: string[]; bases: string[]; programmers: string[] };
  table: {
    rows: Project[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    rangeText: string;
  };
  kanban: { lanes: KanbanLane[]; total: number };
}

/* ── Team performance ─────────────────────────────────────────────────── */

export type TeamTab = "sla" | "beban" | "tren";
export type QuarterKey = "Q1" | "Q2" | "Q3" | "Q4";

export interface TeamQuery {
  tab: TeamTab;
  quarter: QuarterKey;
}

export interface DoneRow {
  name: string;
  m1: number;
  m2: number;
  m3: number;
}

export interface SlaRow {
  name: string;
  ok: number;
  no: number;
  total: number;
  pct: number;
  kind?: "total";
}

export interface TeamRow extends TeamLoadRow {
  kind?: "un" | "total";
}

export interface MonthRow {
  name: string;
  ok: number;
  no: number;
  total: number;
  pct: number;
  partial?: boolean;
  kind?: "total";
}

export interface TeamPerformanceData {
  target: number;
  asOfLabel: string;
  quarter: {
    key: QuarterKey;
    labels: string[];
    rows: DoneRow[];
    max: number;
    note: string;
  };
  sla: {
    rows: SlaRow[];
    totalRow: SlaRow | null;
    rangeText: string;
    unassignedText: string;
  };
  team: {
    rows: TeamRow[];
    unassignedRow: TeamRow;
    totalRow: TeamRow;
    max: number;
  };
  month: { rows: MonthRow[]; totalRow: MonthRow | null; rangeText: string };
  trend: TrendPoint[];
  trendNote: string | null;
  categories: { slices: CategorySlice[]; total: number };
}
