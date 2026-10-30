import { dashboardDataSnapshot } from '../data/workplans';
import { UNCATEGORIZED_ID } from './programs';
import type {
  DataYear,
  PeriodEntry,
  ProgramId,
  ProgramMeta,
  ScheduleDeviation,
  StatusId,
  Workplan,
} from '../types';

export const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

export const MONTHS_ID_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export function monthIndex(label: string): number {
  const key = label.trim().slice(0, 3);
  return MONTHS_EN.findIndex((m) => m === key);
}

export function toIndonesianMonth(label: string): string {
  const i = monthIndex(label);
  return i >= 0 ? (MONTHS_ID[i] as string) : label;
}

export function toIndonesianDate(value: string): string {
  let out = value;
  MONTHS_EN.forEach((en, i) => {
    out = out.replace(new RegExp(`\\b${en}\\b`, 'g'), MONTHS_ID[i] as string);
  });
  return out;
}

export function deriveStatus(value: string): StatusId {
  const v = value.trim();
  if (v === '') return 'blank';
  if (/^(Done|Selesai)\b/.test(v)) return 'done';
  if (/^(Not Yet|Data belum lengkap)\b/.test(v)) return 'notyet';
  if (/^(On Progress|Terjadwal)\b/.test(v)) return 'progress';
  return 'recorded';
}

export function periodsFor(wp: Workplan, year: DataYear): PeriodEntry[] {
  return wp.periodsByYear[year] ?? [];
}

function periodsInMonths(wp: Workplan, year: DataYear, months?: readonly number[]): PeriodEntry[] {
  const entries = periodsFor(wp, year);
  if (!months || months.length === 0) return entries;
  return entries.filter((entry) => months.includes(monthIndex(entry.label) + 1));
}

export function comparisonYearOf(year: string): string | null {
  const years = ['2026', '2025'];
  const index = years.indexOf(year);
  return index < 0 ? null : (years[index + 1] ?? null);
}

export function previousYear(year: DataYear): DataYear | null {
  const previous = comparisonYearOf(String(year));
  return previous === null ? null : Number(previous);
}

export function allPrograms(): ProgramMeta[] {
  return dashboardDataSnapshot().programs;
}

export function programById(id: ProgramId): ProgramMeta | undefined {
  return dashboardDataSnapshot().programs.find((program) => program.id === id);
}

export function workplansOf(program: ProgramId): Workplan[] {
  return dashboardDataSnapshot().workplans.filter((w) => w.program === program);
}

export function programsInYear(year: DataYear, months?: readonly number[]): ProgramMeta[] {
  return dashboardDataSnapshot().programs.filter(
    (program) => checkpointCount(year, program.id, months) > 0,
  );
}

function pool(program?: ProgramId): Workplan[] {
  return program ? workplansOf(program) : dashboardDataSnapshot().workplans;
}

export function checkpointCount(
  year: DataYear,
  program?: ProgramId,
  months?: readonly number[],
): number {
  return pool(program).reduce((n, w) => n + periodsInMonths(w, year, months).length, 0);
}

export function doneCount(year: DataYear, program?: ProgramId, months?: readonly number[]): number {
  return pool(program).reduce(
    (n, w) =>
      n + periodsInMonths(w, year, months).filter((p) => deriveStatus(p.value) === 'done').length,
    0,
  );
}

export function scheduledWorkplans(
  year: DataYear,
  program?: ProgramId,
  months?: readonly number[],
): number {
  return pool(program).filter((w) => periodsInMonths(w, year, months).length > 0).length;
}

export function composition(
  year: DataYear,
  program?: ProgramId,
  months?: readonly number[],
): Record<StatusId, number> {
  const base: Record<StatusId, number> = {
    done: 0,
    recorded: 0,
    progress: 0,
    notyet: 0,
    blank: 0,
  };
  pool(program).forEach((w) =>
    periodsInMonths(w, year, months).forEach((p) => {
      base[deriveStatus(p.value)] += 1;
    }),
  );
  return base;
}

export function monthlySeries(
  year: DataYear,
  program?: ProgramId,
  months?: readonly number[],
): number[] {
  const series = MONTHS_EN.map(() => 0);
  pool(program).forEach((w) =>
    periodsInMonths(w, year, months).forEach((p) => {
      const i = monthIndex(p.label);
      if (i >= 0) series[i] = (series[i] ?? 0) + 1;
    }),
  );
  return series;
}

export function monthlyExecutionSeries(
  year: DataYear,
  program?: ProgramId,
  months?: readonly number[],
): number[] {
  const series = MONTHS_EN.map(() => 0);
  pool(program).forEach((workplan) =>
    periodsFor(workplan, year).forEach((entry) => {
      const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entry.date ?? '');
      const executionMonth = dateMatch ? Number(dateMatch[2]) : Number.NaN;
      if (!Number.isInteger(executionMonth) || executionMonth < 1 || executionMonth > 12) return;

      const i = executionMonth - 1;
      if (months?.length && !months.includes(executionMonth)) return;
      series[i] = (series[i] ?? 0) + 1;
    }),
  );
  return series;
}

export function monthlyDoneSeries(year: DataYear, program?: ProgramId): number[] {
  const series = MONTHS_EN.map(() => 0);
  pool(program).forEach((w) =>
    periodsFor(w, year).forEach((p) => {
      if (deriveStatus(p.value) !== 'done') return;
      const i = monthIndex(p.label);
      if (i >= 0) series[i] = (series[i] ?? 0) + 1;
    }),
  );
  return series;
}

export function deriveScheduleDeviation(entry: PeriodEntry): ScheduleDeviation | null {
  const plannedIndex = monthIndex(entry.label);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entry.date ?? '');
  const executionMonth = dateMatch ? Number(dateMatch[2]) : null;
  const plannedMonth = plannedIndex >= 0 ? plannedIndex + 1 : null;
  if (
    plannedMonth === null ||
    executionMonth === null ||
    executionMonth < 1 ||
    executionMonth > 12
  ) {
    return entry.mismatch ? { kind: 'unknown', plannedMonth, executionMonth } : null;
  }
  const difference = executionMonth - plannedMonth;
  if (difference === 0) return null;
  return {
    kind: difference < 0 ? 'early' : 'late',
    plannedMonth,
    executionMonth,
    monthDifference: Math.abs(difference),
  } as ScheduleDeviation;
}

export function scheduleDeviationsByPlannedMonth(year: DataYear, program?: ProgramId) {
  const grouped: ScheduleDeviation[][] = Array.from({ length: 12 }, () => []);
  pool(program)
    .flatMap((workplan) => periodsFor(workplan, year))
    .filter((entry) => entry.mismatch)
    .forEach((entry) => {
      const deviation = deriveScheduleDeviation(entry) as (ScheduleDeviation & { plannedMonth?: number }) | null;
      const plannedMonth = deviation?.plannedMonth;
      if (deviation && plannedMonth !== null && plannedMonth !== undefined) {
        grouped[plannedMonth - 1]?.push(deviation);
      }
    });
  return grouped;
}

export function scheduleDeviationSummary(year: DataYear, program?: ProgramId) {
  const deviations = pool(program)
    .flatMap((workplan) => periodsFor(workplan, year))
    .filter((entry) => entry.mismatch)
    .map(deriveScheduleDeviation)
    .filter((item): item is ScheduleDeviation => item !== null);
  return {
    total: deviations.length,
    early: deviations.filter((item) => item.kind === 'early').length,
    late: deviations.filter((item) => item.kind === 'late').length,
    unknown: deviations.filter((item) => item.kind === 'unknown').length,
    details: deviations,
  };
}

export function mismatchCount(
  year: DataYear,
  program?: ProgramId,
  months?: readonly number[],
): number {
  return pool(program).reduce(
    (n, w) => n + periodsInMonths(w, year, months).filter((p) => p.mismatch).length,
    0,
  );
}

export function isMissingEvidence(entry: PeriodEntry): boolean {
  return deriveStatus(entry.value) === 'done' && !(entry.fileCount && entry.fileCount > 0);
}

export function missingEvidenceCount(
  year: DataYear,
  program?: ProgramId,
  months?: readonly number[],
): number {
  return pool(program).reduce(
    (n, w) => n + periodsInMonths(w, year, months).filter(isMissingEvidence).length,
    0,
  );
}

export function incompleteRecordCount(year: DataYear, program?: ProgramId): number {
  return pool(program).reduce(
    (n, w) => n + periodsFor(w, year).filter((p) => deriveStatus(p.value) === 'notyet').length,
    0,
  );
}

export function undatedEntries(program?: ProgramId): { workplan: Workplan; entry: PeriodEntry }[] {
  return pool(program).flatMap((workplan) =>
    workplan.undated.map((entry) => ({ workplan, entry })),
  );
}

export function distinctPics(
  year: DataYear,
  program?: ProgramId,
  months?: readonly number[],
): string[] {
  const names = new Set<string>();
  pool(program).forEach((w) =>
    periodsInMonths(w, year, months).forEach((p) => {
      p.pic
        ?.split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .forEach((name) => names.add(name));
    }),
  );
  return [...names].sort((a, b) => a.localeCompare(b, 'id-ID'));
}

export interface BaEvent {
  workplan: Workplan;
  entry: PeriodEntry;
  monthIndex: number;
  time: number;
  status: StatusId;
}

export function timeline(
  year: DataYear,
  program?: ProgramId,
  months?: readonly number[],
): BaEvent[] {
  const events: BaEvent[] = [];
  pool(program).forEach((workplan) =>
    periodsInMonths(workplan, year, months).forEach((entry) => {
      const i = monthIndex(entry.label);
      const parsed = entry.date ? Date.parse(entry.date) : Number.NaN;
      events.push({
        workplan,
        entry,
        monthIndex: i,
        time: Number.isNaN(parsed) ? new Date(year, Math.max(i, 0), 1).getTime() : parsed,
        status: deriveStatus(entry.value),
      });
    }),
  );
  return events.sort((a, b) => a.time - b.time);
}

export function upcoming(year: DataYear, from: Date, months?: readonly number[]): BaEvent[] {
  const currentYear = from.getFullYear();
  const firstMonth = year > currentYear ? 0 : year === currentYear ? from.getMonth() : 12;

  return timeline(year, undefined, months).filter(
    (event) => event.status === 'progress' && event.monthIndex >= firstMonth,
  );
}

export function recentlyCompleted(
  year: DataYear,
  limit = 6,
  program?: ProgramId,
  months?: readonly number[],
): BaEvent[] {
  return timeline(year, program, months)
    .filter((event) => event.status === 'done')
    .sort((a, b) => b.time - a.time)
    .slice(0, limit);
}

export function lastRecorded(
  year: DataYear,
  wp?: Workplan,
  program?: ProgramId,
  periodMonths?: number[] | number | null,
): string | null {
  const selectedMonths = Array.isArray(periodMonths)
    ? periodMonths
    : typeof periodMonths === 'number'
      ? [periodMonths + 1]
      : periodMonths;
  const list = wp ? [wp] : program ? workplansOf(program) : dashboardDataSnapshot().workplans;
  let best: { time: number; text: string } | null = null;
  list.forEach((w) =>
    periodsFor(w, year).forEach((p) => {
      if (
        selectedMonths !== undefined &&
        selectedMonths !== null &&
        selectedMonths.length > 0 &&
        !selectedMonths.includes(monthIndex(p.label) + 1)
      )
        return;
      if (!p.date) return;
      const [y, m, d] = p.date.split('-').map(Number);
      if (!y || !m || !d) return;
      const time = new Date(y, m - 1, d).getTime();
      if (!best || time > best.time) {
        best = { time, text: `${d} ${MONTHS_ID[m - 1]} ${String(y).slice(-2)}` };
      }
    }),
  );
  return best ? (best as { text: string }).text : null;
}

export interface YearComparison {
  year: DataYear;
  previous: number | null;
  current: number;
  delta: number | null;
}

export function lastActiveMonth(year: DataYear): number {
  const series = monthlySeries(year);
  for (let i = series.length - 1; i >= 0; i -= 1) {
    if ((series[i] ?? 0) > 0) return i;
  }
  return -1;
}

export function isYearInProgress(year: DataYear, today = new Date()): boolean {
  return year >= today.getFullYear();
}

export function yearSummary(
  year: DataYear,
  prev: DataYear | null,
  program?: ProgramId,
  months?: readonly number[],
): YearComparison {
  const current = doneCount(year, program, months);
  if (prev === null) return { year, previous: null, current, delta: null };
  if (checkpointCount(prev, program, months) === 0) {
    return { year, previous: null, current, delta: null };
  }
  const previous = doneCount(prev, program, months);
  return { year, previous, current, delta: current - previous };
}

export function coverageLabel(year: DataYear): string {
  const series = monthlySeries(year);
  const first = series.findIndex((n) => n > 0);
  const last = lastActiveMonth(year);
  if (first < 0 || last < 0) return '—';
  return first === last ? (MONTHS_ID[first] as string) : `${MONTHS_ID[first]}–${MONTHS_ID[last]}`;
}

export function isUncategorized(id: ProgramId): boolean {
  return id === UNCATEGORIZED_ID;
}
