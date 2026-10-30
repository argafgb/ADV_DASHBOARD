import type { SanitizedProject } from "../types/types";
import type { CategoryModal } from "../types/category";
import type { MonthWindow } from "./period-filter";
import {
  evaluateAllStageSlas,
  isStageRealizedInMonths,
} from "./sla-policy";
import { statusGroupOf } from "./parser";

/** Kelompok status yang dihitung sebagai proyek aktif, sesuai urutan tampil. */
export const ACTIVE_STATUS_GROUPS: readonly string[] = [
  "Queue",
  "Dalam Proses",
  "UAT",
  "Monitoring",
  "Hold",
  "Change Request",
];

/** Baris kartu Active by Division atau Active by Type yang diklik. */
export type ActiveBreakdown = "division" | "type";

interface CategoryModalSelection {
  activeModal: CategoryModal | null;
  tabProjects: SanitizedProject[];
  rawProjects: SanitizedProject[];
  selectedDivision: string | null;
  lowestSlaDivision: string;
  slaSelectedYear: string;
  /** Rentang bulan filter Bulan; null/tidak diisi = All Months. */
  slaMonths?: MonthWindow | null;
}

interface DevSlaLeaderboardSelection {
  rawProjects: readonly SanitizedProject[];
  slaSelectedYear: string;
  slaMonths?: MonthWindow | null;
  selectedDivision?: string | null;
}

export function getCategoryDivision(project: SanitizedProject): string {
  return String(project["Owner Div"] ?? "").trim();
}

export function getProjectType(project: SanitizedProject): string {
  return String(project["Type Project"] ?? "").trim();
}

/**
 * Hari over SLA tahap DEV, apa adanya dari kolom Notion "(Dev) Late Days".
 * Hanya proyek Not Achieved yang punya nilai: proyek Achieved yang tetap
 * tercatat telat tidak dihitung over SLA, dan nilai kosong atau tidak positif
 * dibiarkan null alih-alih ditebak.
 */
export function getDevOverSlaDays(project: SanitizedProject): number | null {
  if (String(project["DEV SLA"] ?? "").trim() !== "Not Achieved") return null;

  const days = project._lateDev;
  return typeof days === "number" && days > 0 ? days : null;
}

export interface DevSlaLeaderboardRow {
  rank: number;
  division: string;
  sla: number;
  not: number;
  evaluated: number;
  /** Total hari over SLA proyek Not Achieved; null bila tidak ada yang tercatat. */
  overSlaDays: number | null;
}

/** Baris Division SLA Leaderboard dari evaluasi DEV SLA yang sudah difilter. */
export function buildDevSlaLeaderboard(
  projects: readonly SanitizedProject[],
): DevSlaLeaderboardRow[] {
  const divisionsMap: Record<
    string,
    { total: number; achieved: number; not: number; overSlaDays: number | null }
  > = {};

  projects.forEach((project) => {
    const division = getCategoryDivision(project);
    const stats = (divisionsMap[division] ??= {
      total: 0,
      achieved: 0,
      not: 0,
      overSlaDays: null,
    });
    const devSla = String(project["DEV SLA"] ?? "").trim();

    stats.total++;
    if (devSla === "Achieved") {
      stats.achieved++;
    } else if (devSla === "Not Achieved") {
      stats.not++;
      const days = getDevOverSlaDays(project);
      if (days !== null) stats.overSlaDays = (stats.overSlaDays ?? 0) + days;
    }
  });

  return Object.entries(divisionsMap)
    .map(([division, stats]) => ({
      division,
      sla: Math.round((stats.achieved / stats.total) * 100),
      not: stats.not,
      evaluated: stats.total,
      overSlaDays: stats.overSlaDays,
    }))
    .sort((a, b) => b.sla - a.sla || b.evaluated - a.evaluated)
    .map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));
}

/** Proyek aktif di balik satu baris kartu Active by Division/Type. */
export function selectActiveBreakdownProjects(
  activeProjects: readonly SanitizedProject[],
  breakdown: ActiveBreakdown,
  label: string,
): SanitizedProject[] {
  const labelOf =
    breakdown === "division" ? getCategoryDivision : getProjectType;
  return activeProjects.filter((project) => labelOf(project) === label);
}

/** Proyek aktif per kelompok status; kelompok tanpa proyek dilewati. */
export function groupActiveProjectsByStatus(
  projects: readonly SanitizedProject[],
): [string, SanitizedProject[]][] {
  return ACTIVE_STATUS_GROUPS.map((group): [string, SanitizedProject[]] => [
    group,
    projects.filter(
      (project) => statusGroupOf(project["Last Status"]) === group,
    ),
  ]).filter(([, list]) => list.length > 0);
}

export function selectDevSlaLeaderboardProjects({
  rawProjects,
  slaSelectedYear,
  slaMonths = null,
  selectedDivision,
}: DevSlaLeaderboardSelection): SanitizedProject[] {
  const selectedYear = String(slaSelectedYear).trim();

  return rawProjects.filter((project) => {
    if (String(project["DEV SLA YEAR"] ?? "").trim() !== selectedYear) {
      return false;
    }

    const result = String(project["DEV SLA"] ?? "").trim();
    if (result !== "Achieved" && result !== "Not Achieved") return false;

    if (!isStageRealizedInMonths(project, "DEV", selectedYear, slaMonths)) {
      return false;
    }

    const division = getCategoryDivision(project);
    if (!division) return false;
    return selectedDivision == null || division === selectedDivision;
  });
}

export function selectCategoryModalProjects({
  activeModal,
  tabProjects,
  rawProjects,
  selectedDivision,
  lowestSlaDivision,
  slaSelectedYear,
  slaMonths = null,
}: CategoryModalSelection): SanitizedProject[] {
  switch (activeModal) {
    case "classification":
      return tabProjects.filter(
        (project) => String(project["Type Project"] ?? "").trim() !== "",
      );
    case "requested":
      return tabProjects.filter(
        (project) => getCategoryDivision(project) !== "",
      );
    case "average": {
      const contributors = evaluateAllStageSlas(rawProjects, {
        year: slaSelectedYear,
        months: slaMonths,
      }).flatMap((evaluation) => evaluation.contributorProjects);
      return Array.from(new Set(contributors));
    }
    case "low_sla":
      if (!lowestSlaDivision) return [];
      return selectDevSlaLeaderboardProjects({
        rawProjects,
        slaSelectedYear,
        slaMonths,
        selectedDivision: lowestSlaDivision,
      });
    case "leaderboard_division":
      if (!selectedDivision) return [];
      return selectDevSlaLeaderboardProjects({
        rawProjects,
        slaSelectedYear,
        slaMonths,
        selectedDivision,
      });
    default:
      return [];
  }
}

export function groupProjectsBy(
  projects: readonly SanitizedProject[],
  getGroup: (project: SanitizedProject) => string,
): Record<string, SanitizedProject[]> {
  const groups: Record<string, SanitizedProject[]> = {};
  for (const project of projects) {
    const group = getGroup(project);
    (groups[group] ??= []).push(project);
  }

  return Object.fromEntries(
    Object.entries(groups).sort(([left], [right]) => left.localeCompare(right)),
  );
}
