import type { DashboardProject } from "../types/dashboard-contracts";
import type { SanitizedProject } from "../types/types";

const PERIOD_MONTH_INDEX: Readonly<Record<string, number>> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  mei: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  agu: 7,
  ags: 7,
  sep: 8,
  oct: 9,
  okt: 9,
  nov: 10,
  dec: 11,
  des: 11,
};

export function parseProjectPeriodScore(
  period: string | null | undefined,
): number | null {
  if (!period) return null;

  const [monthPart, yearPart] = period.trim().split("-");
  const monthIndex = PERIOD_MONTH_INDEX[monthPart?.toLowerCase()];
  if (monthIndex === undefined || !yearPart) return null;

  let year = Number.parseInt(yearPart, 10);
  if (!Number.isInteger(year)) return null;
  if (yearPart.length === 2) year += 2000;

  return year * 12 + monthIndex;
}

export interface ProjectYearMonth {
  year: number;
  month: number;
}

/**
 * Jumlah bulan yang sudah benar-benar berjalan pada sebuah tahun.
 *
 * Chart bulanan tidak boleh menggambar bulan yang belum terjadi: nilai 0 di
 * bulan depan terbaca sebagai "tidak ada realisasi" padahal datanya memang
 * belum ada. Tahun yang sudah lewat memakai 12 bulan penuh, tahun berjalan
 * berhenti di bulan sekarang, dan tahun yang belum datang menghasilkan 0.
 */
export function getElapsedMonthCount(
  year: number,
  now: Date = new Date(),
): number {
  const currentYear = now.getFullYear();
  if (year < currentYear) return 12;
  if (year > currentYear) return 0;
  return now.getMonth() + 1;
}

/**
 * Reads the intake year out of the Notion "Project diajukan" column.
 *
 * The column is recorded per quarter ("Q3 2026"), sometimes with revision notes
 * ("Q4 2022 / Rev : Q2 2023") or a range ("Q1 2024 - Q1 2025"). Only the first
 * four-digit year is authoritative; no month can be derived from this column.
 */
export function parseSubmissionYear(value: unknown): string {
  const match = /(?:19|20)\d{2}/.exec(String(value ?? ""));
  return match ? match[0] : "";
}

export function parseProjectDateYearMonth(
  value: unknown,
): ProjectYearMonth | null {
  if (!value) return null;

  const rawDate = String(value).trim();
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(rawDate);
  if (isoDate) {
    const year = Number(isoDate[1]);
    const month = Number(isoDate[2]);
    return month >= 1 && month <= 12 ? { year, month } : null;
  }

  const timestamp = Date.parse(rawDate);
  if (Number.isNaN(timestamp)) return null;
  const date = new Date(timestamp);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export interface MonthlyProjectPipeline {
  months: number[];
  intakeByMonth: Record<number, SanitizedProject[]>;
  liveByMonth: Record<number, SanitizedProject[]>;
}

export function getProjectIntakeYearMonth(
  project: SanitizedProject,
): ProjectYearMonth | null {
  const createdRaw =
    project["Created time"] ??
    (project as { created_time?: unknown }).created_time ??
    (project.cleansed_data as Record<string, unknown> | undefined)?.[
      "Created time"
    ];
  const createdPeriod = parseProjectDateYearMonth(createdRaw);
  if (createdPeriod) {
    return createdPeriod;
  }

  const ticketMatch = /^(\d{2})(\d{2})/.exec(
    String(project.Ticket ?? "").trim(),
  );
  if (ticketMatch) {
    const ticketYear = 2000 + Number(ticketMatch[1]);
    const ticketMonth = Number(ticketMatch[2]);
    if (ticketMonth >= 1 && ticketMonth <= 12) {
      return { year: ticketYear, month: ticketMonth };
    }
  }

  return null;
}

export function buildMonthlyProjectPipeline(
  projects: readonly SanitizedProject[],
  year: number,
  startMonth: number,
  endMonth: number,
): MonthlyProjectPipeline {
  const firstMonth = Math.max(1, Math.min(startMonth, endMonth));
  const lastMonth = Math.min(12, Math.max(startMonth, endMonth));
  const months = Array.from(
    { length: Math.max(0, lastMonth - firstMonth + 1) },
    (_, index) => firstMonth + index,
  );
  const intakeByMonth: Record<number, SanitizedProject[]> = {};
  const liveByMonth: Record<number, SanitizedProject[]> = {};

  for (const month of months) {
    intakeByMonth[month] = [];
    liveByMonth[month] = [];
  }

  for (const project of projects) {
    const intakePeriod = getProjectIntakeYearMonth(project);
    if (
      intakePeriod &&
      intakePeriod.year === year &&
      intakeByMonth[intakePeriod.month]
    ) {
      intakeByMonth[intakePeriod.month].push(project);
    }

    const livePeriod = parseProjectDateYearMonth(
      project["(Live) Realized in Date"] ?? project["(Live) Realized in date"],
    );
    if (livePeriod?.year === year && liveByMonth[livePeriod.month]) {
      liveByMonth[livePeriod.month].push(project);
    }
  }

  return { months, intakeByMonth, liveByMonth };
}

export function getLatestProjectSyncTimestamp(
  projects: readonly DashboardProject[],
): string | null {
  let latestTime = Number.NEGATIVE_INFINITY;
  let latestTimestamp: string | null = null;

  for (const project of projects) {
    const value = project.last_synced;
    if (typeof value !== "string") continue;

    const time = Date.parse(value);
    if (Number.isNaN(time) || time <= latestTime) continue;

    latestTime = time;
    latestTimestamp = value;
  }

  return latestTimestamp;
}
