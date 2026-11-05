import type { MonthWindow } from "./period-filter";
import { parseProjectDateYearMonth } from "../services/project-data";

export const SLA_STAGE_DEFINITIONS = [
  {
    stage: "FSD",
    resultField: "FSD SLA",
    yearField: "FSD SLA YEAR",
  },
  {
    stage: "DEV",
    resultField: "DEV SLA",
    yearField: "DEV SLA YEAR",
  },
  {
    stage: "SIT",
    resultField: "SIT SLA",
    yearField: "SIT SLA YEAR",
  },
  {
    stage: "UAT",
    resultField: "UAT SLA",
    yearField: "UAT SLA YEAR",
  },
  {
    stage: "LIVE",
    resultField: "Live SLA",
    yearField: "LIVE SLA YEAR",
  },
] as const;

export type SlaStageDefinition = (typeof SLA_STAGE_DEFINITIONS)[number];
export type SlaStage = SlaStageDefinition["stage"];
export type SlaResultField = SlaStageDefinition["resultField"];
export type SlaYearField = SlaStageDefinition["yearField"];
export type SlaResult = "Achieved" | "Not Achieved";
export type SlaSelectedYear = string | number;
export type SlaProject = Readonly<Record<string, unknown>>;

/**
 * Tanggal realisasi tiap tahap. SLA YEAR selalu sama dengan tahun tanggal ini
 * (dicek pada 30 Sep 2026: 787 dari 787 baris SLA), jadi bulannya dipakai
 * untuk mempersempit evaluasi saat filter Bulan dipilih.
 */
export const SLA_STAGE_REALIZED_DATE_FIELDS: Readonly<
  Record<SlaStage, string>
> = {
  FSD: "(FSD) Realized in Date Diisi saat Approval Digital FSD by Owner selesai",
  DEV: "(Dev) Realized In Date",
  SIT: "(SIT) Realized in Date",
  UAT: "(UAT) Realized In Date",
  LIVE: "(Live) Realized in Date",
};

/** Tahun SLA yang dipersempit ke rentang bulan; `months: null` = All Months. */
export interface SlaPeriod {
  year: SlaSelectedYear;
  months: MonthWindow | null;
}

/** Tahun saja tetap diterima dan diperlakukan sebagai All Months. */
export type SlaSelectedPeriod = SlaSelectedYear | SlaPeriod;

function toSlaPeriod(selected: SlaSelectedPeriod): SlaPeriod {
  return typeof selected === "object"
    ? selected
    : { year: selected, months: null };
}

export interface SlaStageEvidence {
  stage: SlaStage;
  resultField: SlaResultField;
  yearField: SlaYearField;
  resultValue: unknown;
  yearValue: unknown;
}

export interface StageSlaEvaluation<Project extends SlaProject> {
  stage: SlaStage;
  resultField: SlaResultField;
  yearField: SlaYearField;
  contributors: number;
  contributorProjects: Project[];
  achieved: number;
  achievedProjects: Project[];
  notAchieved: number;
  notAchievedProjects: Project[];
  percentage: number | null;
}

export interface MultiStageFailure<Project extends SlaProject> {
  project: Project;
  failedStages: SlaStageEvidence[];
}

export function isValidSlaResult(value: unknown): value is SlaResult {
  return value === "Achieved" || value === "Not Achieved";
}

function parseSlaYear(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1000 && value <= 9999
      ? value
      : null;
  }

  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (!/^\d{4}$/.test(normalized)) return null;

  const year = Number(normalized);
  return year >= 1000 && year <= 9999 ? year : null;
}

export function isMatchingSlaYear(
  value: unknown,
  selectedYear: SlaSelectedYear,
): boolean {
  const normalizedSelectedYear = parseSlaYear(selectedYear);
  return (
    normalizedSelectedYear !== null &&
    parseSlaYear(value) === normalizedSelectedYear
  );
}

/**
 * Syarat tambahan filter Bulan: tanggal realisasi tahap jatuh di tahun dan
 * rentang bulan terpilih. Selalu true saat All Months (`months` null).
 */
export function getStageRealizedDate(
  project: SlaProject,
  stage: SlaStage,
): unknown {
  const cd = (project as { cleansed_data?: Record<string, unknown> }).cleansed_data;
  const candidates: Record<SlaStage, string[]> = {
    FSD: [
      "(FSD) Realized in Date Diisi saat Approval Digital FSD by Owner selesai",
      "(FSD) Realized in Date",
      "(FSD) Realized in date",
      "(FSD) Realized In Date",
    ],
    DEV: [
      "(Dev) Realized In Date",
      "(Dev) Realized in Date",
      "(Dev) Realized in date",
      "(DEV) Realized In Date",
      "(DEV) Realized in Date",
    ],
    SIT: [
      "(SIT) Realized in Date",
      "(SIT) Realized in date",
      "(SIT) Realized In Date",
    ],
    UAT: [
      "(UAT) Realized In Date",
      "(UAT) Realized in Date",
      "(UAT) Realized in date",
    ],
    LIVE: [
      "(Live) Realized in Date",
      "(Live) Realized in date",
      "(Live) Realized In Date",
      "(LIVE) Realized in Date",
      "(LIVE) Realized in date",
    ],
  };

  const keys = candidates[stage] || [];
  for (const k of keys) {
    if (project[k] !== undefined && project[k] !== null && project[k] !== "") {
      return project[k];
    }
    if (cd && cd[k] !== undefined && cd[k] !== null && cd[k] !== "") {
      return cd[k];
    }
  }

  const stageLower = stage.toLowerCase();
  for (const [k, v] of Object.entries(project)) {
    const kl = k.toLowerCase();
    if (kl.includes(stageLower) && kl.includes("realiz") && kl.includes("date") && v) {
      return v;
    }
  }
  if (cd) {
    for (const [k, v] of Object.entries(cd)) {
      const kl = k.toLowerCase();
      if (kl.includes(stageLower) && kl.includes("realiz") && kl.includes("date") && v) {
        return v;
      }
    }
  }

  return project[SLA_STAGE_REALIZED_DATE_FIELDS[stage]];
}

export function isStageRealizedInMonths(
  project: SlaProject,
  stage: SlaStage,
  selectedYear: SlaSelectedYear,
  months: MonthWindow | null,
): boolean {
  if (months === null) return true;

  const rawDate = getStageRealizedDate(project, stage);
  const realized = parseProjectDateYearMonth(rawDate);
  const targetYear = parseSlaYear(selectedYear);

  return (
    realized !== null &&
    realized.year === targetYear &&
    realized.month >= months.startMonth &&
    realized.month <= months.endMonth
  );
}

/** Tahap proyek ini ikut dievaluasi (Achieved/Not Achieved) pada periode. */
export function isEvaluatedInSlaPeriod(
  project: SlaProject,
  stage: SlaStage,
  selected: SlaSelectedPeriod,
): boolean {
  const { year, months } = toSlaPeriod(selected);
  const definition = getStageDefinition(stage);
  return (
    isValidSlaResult(project[definition.resultField]) &&
    isMatchingSlaYear(project[definition.yearField], year) &&
    isStageRealizedInMonths(project, stage, year, months)
  );
}

function getStageDefinition(stage: SlaStage): SlaStageDefinition {
  const definition = SLA_STAGE_DEFINITIONS.find(
    (candidate) => candidate.stage === stage,
  );

  if (!definition) {
    throw new RangeError(`Unknown SLA stage: ${stage}`);
  }

  return definition;
}

function stageEvidence(
  project: SlaProject,
  definition: SlaStageDefinition,
): SlaStageEvidence {
  return {
    stage: definition.stage,
    resultField: definition.resultField,
    yearField: definition.yearField,
    resultValue: project[definition.resultField],
    yearValue: project[definition.yearField],
  };
}

export function evaluateStageSla<Project extends SlaProject>(
  projects: readonly Project[],
  stage: SlaStage,
  selected: SlaSelectedPeriod,
): StageSlaEvaluation<Project> {
  const definition = getStageDefinition(stage);
  const { year: selectedYear, months } = toSlaPeriod(selected);
  const contributorProjects: Project[] = [];
  const achievedProjects: Project[] = [];
  const notAchievedProjects: Project[] = [];

  for (const project of projects) {
    const resultValue = project[definition.resultField];
    const yearValue = project[definition.yearField];
    const matchesSelectedYear =
      isMatchingSlaYear(yearValue, selectedYear) &&
      isStageRealizedInMonths(project, stage, selectedYear, months);

    if (matchesSelectedYear) {
      if (resultValue === "Achieved") {
        contributorProjects.push(project);
        achievedProjects.push(project);
      } else if (resultValue === "Not Achieved") {
        contributorProjects.push(project);
        notAchievedProjects.push(project);
      }
    }
  }

  const contributors = contributorProjects.length;
  const achieved = achievedProjects.length;
  const notAchieved = notAchievedProjects.length;

  return {
    stage: definition.stage,
    resultField: definition.resultField,
    yearField: definition.yearField,
    contributors,
    contributorProjects,
    achieved,
    achievedProjects,
    notAchieved,
    notAchievedProjects,
    percentage: contributors === 0 ? null : (achieved / contributors) * 100,
  };
}

export function evaluateAllStageSlas<Project extends SlaProject>(
  projects: readonly Project[],
  selected: SlaSelectedPeriod,
): StageSlaEvaluation<Project>[] {
  return SLA_STAGE_DEFINITIONS.map(({ stage }) =>
    evaluateStageSla(projects, stage, selected),
  );
}

export function selectSlaYearProjects<Project extends SlaProject>(
  projects: readonly Project[],
  selected: SlaSelectedPeriod,
): Project[] {
  const contributors = evaluateAllStageSlas(projects, selected).flatMap(
    (evaluation) => evaluation.contributorProjects,
  );

  return Array.from(new Set(contributors));
}

export function selectMultiStageFailures<Project extends SlaProject>(
  projects: readonly Project[],
  selected: SlaSelectedPeriod,
  minimumStages = 2,
): MultiStageFailure<Project>[] {
  const { year: selectedYear, months } = toSlaPeriod(selected);
  const normalizedSelectedYear = parseSlaYear(selectedYear);

  return projects.flatMap((project) => {
    const failedStages = SLA_STAGE_DEFINITIONS.filter((definition) => {
      const resultValue = project[definition.resultField];
      const yearValue = project[definition.yearField];

      return (
        resultValue === "Not Achieved" &&
        normalizedSelectedYear !== null &&
        isMatchingSlaYear(yearValue, normalizedSelectedYear) &&
        isStageRealizedInMonths(
          project,
          definition.stage,
          normalizedSelectedYear,
          months,
        )
      );
    }).map((definition) => stageEvidence(project, definition));

    return failedStages.length >= minimumStages
      ? [{ project, failedStages }]
      : [];
  });
}
