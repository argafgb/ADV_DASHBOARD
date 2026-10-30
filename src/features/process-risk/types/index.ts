export type ProgramId = string;

export type StatusId = 'done' | 'recorded' | 'progress' | 'notyet' | 'blank';

export type DataYear = number;

export interface PeriodEntry {
  sourceId?: string;
  label: string;
  value: string;
  date?: string;
  docNo?: string;
  notionUrl?: string;
  pic?: string;
  mismatch?: boolean;
  fileCount?: number;
}

export interface Workplan {
  row: string | number;
  program: ProgramId;
  programName: string;
  name: string;
  category?: string;
  pic?: string;
  remark?: string;
  periodsByYear: Record<number, PeriodEntry[]>;
  undated: PeriodEntry[];
}

export interface ProgramMeta {
  id: ProgramId;
  name: string;
  color: string;
  route: string;
  activityCount: number;
  recordCount: number;
}

export interface StatusMeta {
  id: StatusId;
  label: string;
  color: string;
}

export type ProgramSummary = ProgramMeta;

export interface ProcessRiskDashboardData {
  workplans: Workplan[];
  programs: ProgramSummary[];
  source: 'database';
  recordCount: number;
  undatedCount: number;
  updatedAt: string | null;
}

export interface ProcessRiskRow {
  id: string;
  name: string;
  program: string | null;
  category_kerja: string | null;
  deskripsi: string | null;
  pic: string | null;
  no_dokumen_ba: string | null;
  notion_url: string | null;
  periode_test_list: string[] | null;
  periode_test_month_numbers: number[] | null;
  period_mismatch: boolean | null;
  file_count: number | null;
  tanggal_pelaksanaan_ba: string | null;
  schedule_year: number | null;
  record_status: string;
}

export type ScheduleDeviation =
  | {
      kind: 'early' | 'late';
      plannedMonth: number;
      executionMonth: number;
      monthDifference: number;
      monthsDelta?: number;
    }
  | {
      kind: 'unknown';
      plannedMonth: number | null;
      executionMonth: number | null;
      monthDifference?: number;
      monthsDelta?: number;
    };

export interface MonthRange {
  value: string;
  months: number[];
  start: number | null;
  end: number | null;
  isAll: boolean;
}
