import type { PeriodEntry, ProcessRiskRow, ProgramSummary, Workplan } from '../types';
import {
  UNCATEGORIZED_ID,
  UNCATEGORIZED_NAME,
  assignProgramColors,
  routeForProgram,
  slugifyProgram,
} from './programs';

export const MONTH_LABELS = [
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
];

export const ID_MONTH_TO_INDEX: Record<string, number> = {
  januari: 0,
  februari: 1,
  pebruari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  nopember: 10,
  desember: 11,
};

export function canonicalMonth(label: string): string {
  const key = label.trim().toLowerCase();
  const indonesian = ID_MONTH_TO_INDEX[key];
  if (indonesian !== undefined) return MONTH_LABELS[indonesian] as string;
  const english = MONTH_LABELS.findIndex((m) => m.toLowerCase() === key.slice(0, 3));
  return english >= 0 ? (MONTH_LABELS[english] as string) : label.trim();
}

export function statusText(row: ProcessRiskRow): string {
  if (row.record_status === 'planned') return 'Terjadwal';
  if (row.record_status !== 'completed') return 'Data belum lengkap';
  if (!row.tanggal_pelaksanaan_ba) return 'Selesai';

  const [year, month, day] = row.tanggal_pelaksanaan_ba.split('-').map(Number);
  const label = month ? MONTH_LABELS[month - 1] : undefined;
  return label && year && day ? `Selesai, ${day} ${label} ${String(year).slice(-2)}` : 'Selesai';
}

export function labelsOf(row: ProcessRiskRow): string[] {
  if (row.periode_test_month_numbers?.length) {
    return row.periode_test_month_numbers
      .map((month) => MONTH_LABELS[month - 1])
      .filter((label): label is string => Boolean(label));
  }
  return (row.periode_test_list ?? []).filter(Boolean).map(canonicalMonth);
}

export function entryOf(row: ProcessRiskRow, label: string): PeriodEntry {
  return {
    sourceId: row.id,
    label,
    value: statusText(row),
    date: row.tanggal_pelaksanaan_ba ?? undefined,
    docNo: row.no_dokumen_ba?.trim() || undefined,
    notionUrl: row.notion_url ?? undefined,
    pic: row.pic?.trim() || undefined,
    mismatch: row.period_mismatch === true ? true : undefined,
    fileCount: row.file_count ?? undefined,
  };
}

export function sortPeriods(entries: PeriodEntry[]): PeriodEntry[] {
  return entries.sort((a, b) => {
    const ai = MONTH_LABELS.indexOf(a.label);
    const bi = MONTH_LABELS.indexOf(b.label);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
}

export function rowsToWorkplans(rows: ProcessRiskRow[]): Workplan[] {
  const grouped = new Map<string, Workplan & { pics: Set<string> }>();

  for (const row of rows) {
    const programName = row.program?.trim() || UNCATEGORIZED_NAME;
    const program = row.program?.trim() ? slugifyProgram(programName) : UNCATEGORIZED_ID;
    const key = `${program}:${row.name.trim().toLocaleLowerCase('id-ID')}`;

    const workplan = grouped.get(key) ?? {
      row: row.id,
      program,
      programName,
      name: row.name.trim(),
      category: row.category_kerja?.trim() || undefined,
      remark: row.deskripsi?.trim() || undefined,
      periodsByYear: {} as Record<number, PeriodEntry[]>,
      undated: [] as PeriodEntry[],
      pics: new Set<string>(),
    };

    if (row.pic?.trim()) workplan.pics.add(row.pic.trim());
    workplan.category ??= row.category_kerja?.trim() || undefined;
    workplan.remark ??= row.deskripsi?.trim() || undefined;

    const labels = labelsOf(row);
    const effectiveLabels = labels.length ? labels : ['Periode belum ditentukan'];

    const bucket =
      row.schedule_year === null
        ? workplan.undated
        : (workplan.periodsByYear[row.schedule_year] ??= [] as PeriodEntry[]);

    effectiveLabels.forEach((label) => bucket.push(entryOf(row, label)));

    grouped.set(key, workplan);
  }

  return [...grouped.values()]
    .map(({ pics, ...workplan }) => {
      Object.values(workplan.periodsByYear).forEach(sortPeriods);
      sortPeriods(workplan.undated);
      return { ...workplan, pic: pics.size ? [...pics].join(', ') : undefined };
    })
    .sort(
      (a, b) =>
        a.programName.localeCompare(b.programName, 'id-ID') ||
        String(a.row).localeCompare(String(b.row), 'id-ID', { numeric: true }),
    );
}

export function summarize(workplans: Workplan[]): ProgramSummary[] {
  const byProgram = new Map<string, ProgramSummary>();
  const colors = assignProgramColors(workplans.map((workplan) => workplan.program));

  for (const workplan of workplans) {
    const summary = byProgram.get(workplan.program) ?? {
      id: workplan.program,
      name: workplan.programName,
      color: colors.get(workplan.program) ?? 'var(--domain-accent)',
      route: routeForProgram(workplan.program),
      activityCount: 0,
      recordCount: 0,
    };
    summary.activityCount += 1;
    summary.recordCount +=
      Object.values(workplan.periodsByYear).reduce((n, list) => n + list.length, 0) +
      workplan.undated.length;
    byProgram.set(workplan.program, summary);
  }

  return [...byProgram.values()].sort((a, b) => {
    if (a.id === UNCATEGORIZED_ID) return 1;
    if (b.id === UNCATEGORIZED_ID) return -1;
    return b.recordCount - a.recordCount || a.name.localeCompare(b.name, 'id-ID');
  });
}
