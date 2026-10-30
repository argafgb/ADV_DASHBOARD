import type { StatusId, StatusMeta } from '../types';

export const STATUSES: Record<StatusId, StatusMeta> = {
  done: { id: 'done', label: 'Selesai', color: 'var(--st-done)' },
  recorded: { id: 'recorded', label: 'Realisasi tercatat', color: 'var(--st-recorded)' },
  progress: { id: 'progress', label: 'Terjadwal', color: 'var(--st-progress)' },
  notyet: { id: 'notyet', label: 'Data belum lengkap', color: 'var(--st-notyet)' },
  blank: { id: 'blank', label: 'Belum ada data', color: 'var(--st-blank-border)' },
};

export const STATUS_ORDER: StatusId[] = ['done', 'progress', 'notyet', 'recorded', 'blank'];

export const PROCESS_RISK_CONFIG = {
  years: ['2026', '2025'] as const,
  defaultMonth: 'ALL',
} as const;

export const DEFAULT_YEAR = Number(PROCESS_RISK_CONFIG.years[0]);
export const DEFAULT_MONTH = PROCESS_RISK_CONFIG.defaultMonth;

export const YEAR_OPTIONS = PROCESS_RISK_CONFIG.years.map((y) => ({ v: y, t: y }));

export const MONTH_NAMES = [
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

export const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Ags',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;
