import {
  RawProject,
  SanitizedProject,
  DashboardDataset,
  MilestoneItem,
} from "../types/types";
import {
  getElapsedMonthCount,
  parseProjectDateYearMonth,
} from "../services/project-data";
import { formatInstantForDisplay, getProjectSubmissionYear } from "./utils";
import {
  evaluateAllStageSlas,
  evaluateStageSla,
  isMatchingSlaYear,
  isValidSlaResult,
  selectMultiStageFailures,
} from "./sla-policy";

export function normalizeStatus(status: unknown): string {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

const STATUS_GROUP_BY_SOURCE: Readonly<Record<string, string>> = {
  canceled: "Canceled",
  cancelled: "Canceled",
  "hold by owner": "Hold",
  "hold by client/vendor": "Hold",
  "hold by it": "Hold",
  "live monitoring": "Monitoring",
  "live on monitoring": "Monitoring",
  "monitoring after live": "Monitoring",
  "uat on queue": "UAT",
  "uat on progress": "UAT",
  "change request on progress": "Change Request",
  "on queue": "Queue",
  "dev on queue": "Dalam Proses",
  "dev pending estimation": "Dalam Proses",
  "pending estimation": "Dalam Proses",
  "live on queue": "Dalam Proses",
  fps: "Dalam Proses",
  fsd: "Dalam Proses",
  dev: "Dalam Proses",
  development: "Dalam Proses",
  sit: "Dalam Proses",
  "fps on progress": "Dalam Proses",
  "fsd on progress": "Dalam Proses",
  "dev on progress": "Dalam Proses",
  "development on progress": "Dalam Proses",
  "sit on progress": "Dalam Proses",
  live: "Live",
};

export function statusGroupOf(status: string | null): string {
  return STATUS_GROUP_BY_SOURCE[normalizeStatus(status)] ?? "";
}

export type PipelineProjectCategory = "Completed" | "Active";
export type PipelineProjectFilter = "Total Projects" | PipelineProjectCategory;

const ACTIVE_PIPELINE_STATUS_GROUPS = new Set([
  "Queue",
  "Dalam Proses",
  "UAT",
  "Monitoring",
  "Hold",
  "Change Request",
]);

export function pipelineCategoryOfStatus(
  status: string | null,
): PipelineProjectCategory | null {
  const statusGroup = statusGroupOf(status);
  if (statusGroup === "Live") return "Completed";
  if (ACTIVE_PIPELINE_STATUS_GROUPS.has(statusGroup)) return "Active";
  return null;
}

export function filterPipelineProjects<T extends RawProject>(
  projects: readonly T[],
  filter: PipelineProjectFilter,
): T[] {
  if (filter === "Total Projects") return [...projects];
  return projects.filter(
    (project) => pipelineCategoryOfStatus(project["Last Status"]) === filter,
  );
}

function parseLate(val: unknown): number | null {
  if (val == null) return null;
  const m = String(val).match(/^(-?\d+)/);
  return m ? parseInt(m[1]) : null;
}

function parsePercent(val: unknown): number | null {
  if (val == null) return null;
  const m = String(val).match(/(\d+)/);
  return m ? parseInt(m[1]) : null;
}

// Strictly adheres to the requested sanitization block
export function sanitizeProjects(data: RawProject[]): SanitizedProject[] {
  return data.map((d) => {
    const cd = d.cleansed_data !== undefined ? d.cleansed_data : d;
    return {
      ...d,
      _year: getProjectSubmissionYear(d),
      _period: String(cd["Period"] ?? ""),
      // Keep the exact Type Project value. Breakdown selectors exclude blanks
      // rather than assigning a synthetic category.
      _typeGroup: String(cd["Type Project"] ?? ""),
      _lateFSD: parseLate(cd["(FSD) Late Days"] ?? d["(FSD) Late Days"]),
      _lateDev: parseLate(cd["(Dev) Late Days"] ?? d["(Dev) Late Days"]),
      _lateSIT: parseLate(cd["(SIT) Late Days"] ?? d["(SIT) Late Days"]),
      _lateUAT: parseLate(cd["(UAT) Late Days"] ?? d["(UAT) Late Days"]),
      _lateLive: parseLate(cd["Live (Late Days)"] ?? d["Live (Late Days)"]),
      _achDev: parsePercent(cd["Achieved Dev %"] ?? d["Achieved Dev %"]),
      _achFSD: parsePercent(cd["Achieved FSD %"] ?? d["Achieved FSD %"]),
      _achLive: parsePercent(cd["Achieved Live"] ?? d["Achieved Live"]),
      _achSIT: parsePercent(cd["Achieved SIT %"] ?? d["Achieved SIT %"]),
      _achUAT: parsePercent(cd["Achieved UAT %"] ?? d["Achieved UAT %"]),
      _feedback: (() => {
        const feedbackKeys = [
          "Nilai Feedback User :\nDapat berkolaborasi dengan Department lain dengan baik dalam Project",
          "Nilai Feedback User :\nDevelopment (include Fixing temuan selama Testing PIC dan SIT)",
          "Nilai Feedback User :\nDiskusi FPS dengan Developer sebelum FSD\n",
          "Nilai Feedback User :\nKejelasan komunikasi dan mudah dihubungi.",
          "Nilai Feedback User :\nKeterampilan teknis dan dokumentasi Project yang lengkap.",
          "Nilai Feedback User :\nMembantu menyelesaikan konflik di dalam Project.",
          "Nilai Feedback User :\nMemenuhi terget waktu Project.",
          "Nilai Feedback User :\nPembuatan FSD dan Review Internal IT",
          "Nilai Feedback User :\nTesting PIC Project dan SIT",
          "Nilai Feedback User :\nUAT (include perbaikan temuan UAT) dan Change Request 1",
          "Nilai Feedback User : Memahami kebutuhan klien dengan tepat.",
        ];
        let totalScore = 0;
        let validKeysCount = 0;

        feedbackKeys.forEach((key) => {
          const sourceValue = cd[key];
          if (
            sourceValue === null ||
            sourceValue === undefined ||
            sourceValue === ""
          ) {
            return;
          }
          const value = Number(sourceValue);
          if (!Number.isFinite(value) || value <= 0) return;
          totalScore += value > 5 ? value / 20 : value;
          validKeysCount++;
        });

        return validKeysCount === 0
          ? null
          : Math.min(5, totalScore / validKeysCount);
      })(),
    };
  });
}

/**
 * Every visual reads the same operational pool: Internal IT, Canceled, Pending
 * Requirement, and blank-status rows are already excluded upstream.
 *
 * Operational visuals show the live board and are never filtered by period.
 * Year-on-year visuals select their contributors through each stage's SLA YEAR,
 * or through the intake year taken from "Project diajukan".
 */
export function computeDashboardMetrics(
  data: SanitizedProject[],
  selectedYear?: number,
): DashboardDataset {
  const masterList = data;
  const slaList = data;
  const comparisonList = data;
  const comparisonSelectedYear = selectedYear ?? new Date().getFullYear();
  const comparisonPreviousYear = comparisonSelectedYear - 1;

  // Use the newest source edit, rather than a fixed label or whichever row
  // happens to be first after database sorting.
  const latestEditedAt = masterList.reduce<number | null>((latest, project) => {
    const rawValue = project["Last edited time"] ?? project.last_edited_time;
    if (!rawValue) return latest;

    const timestamp = Date.parse(String(rawValue));
    if (Number.isNaN(timestamp)) return latest;
    return latest === null || timestamp > latest ? timestamp : latest;
  }, null);
  const reportDate =
    formatInstantForDisplay(latestEditedAt) ?? "Belum tersedia";

  const completedProjects = filterPipelineProjects(data, "Completed");
  const activeProjects = filterPipelineProjects(data, "Active");

  const actualRawData = data;
  const queueProjects = actualRawData.filter(
    (project) => statusGroupOf(project["Last Status"]) === "Queue",
  );
  const queueCount = queueProjects.length;
  const progressCount = data.filter((project) => {
    const group = statusGroupOf(project["Last Status"]);
    return group === "Dalam Proses" || group === "Change Request";
  }).length;
  const uatCount = data.filter(
    (project) => statusGroupOf(project["Last Status"]) === "UAT",
  ).length;
  const monitoringCount = data.filter(
    (p) => statusGroupOf(p["Last Status"]) === "Monitoring",
  ).length;
  const holdCount = data.filter(
    (p) => statusGroupOf(p["Last Status"]) === "Hold",
  ).length;

  const holdByOwner = data.filter(
    (p) => p["Last Status"] === "Hold By Owner",
  ).length;
  const holdByVendor = data.filter((p) =>
    ["Hold By Client/Vendor", "Hold By IT"].includes(p["Last Status"]),
  ).length;

  const activeTotalCount = activeProjects.length;

  // Let's count high delay active projects as needing attention
  const needAttentionCount = activeProjects.filter((p) => {
    const devLate = p._lateDev || 0;
    const fsdLate = p._lateFSD || 0;
    const sitLate = p._lateSIT || 0;
    const uatLate = p._lateUAT || 0;
    const liveLate = p._lateLive || 0;
    return (
      devLate > 14 ||
      fsdLate > 14 ||
      sitLate > 14 ||
      uatLate > 14 ||
      liveLate > 14 ||
      (p["Reschedule UAT"] && p["Reschedule UAT"] > 1)
    );
  }).length;

  const year2026Count = data.filter(
    (p) => p._year === String(comparisonSelectedYear),
  ).length;

  // SLA contributors are selected from the filtered pool. A project contributes
  // to a stage only when its SLA YEAR matches AND its SLA result is
  // "Achieved" or "Not Achieved"; blank results are simply excluded.
  const stageSlaEvaluations = evaluateAllStageSlas(
    slaList,
    comparisonSelectedYear,
  );
  const stageSlaByName = Object.fromEntries(
    stageSlaEvaluations.map((evaluation) => [evaluation.stage, evaluation]),
  );
  const fsdSla = stageSlaByName.FSD;
  const devSla = stageSlaByName.DEV;
  const sitSla = stageSlaByName.SIT;
  const uatSla = stageSlaByName.UAT;
  const liveSla = stageSlaByName.LIVE;

  const milestones: MilestoneItem[] = [
    {
      stage: "FSD",
      pct: fsdSla.percentage,
      notAch: fsdSla.notAchieved,
      color: "#3B82F6",
    },
    {
      stage: "Development",
      pct: devSla.percentage,
      notAch: devSla.notAchieved,
      color: "#2563EB",
    },
    {
      stage: "SIT",
      pct: sitSla.percentage,
      notAch: sitSla.notAchieved,
      color: "#10B981",
    },
    {
      stage: "UAT",
      pct: uatSla.percentage,
      notAch: uatSla.notAchieved,
      color: "#F59E0B",
    },
    {
      stage: "Live",
      pct: liveSla.percentage,
      notAch: liveSla.notAchieved,
      color: "#059669",
    },
  ];

  // Intake cohorts come from the year in "Project diajukan" (see _year).
  const getHistoricalProjectsForYear = (year: string) =>
    comparisonList.filter((project) => project._year === year);

  const devSlaSelectedEvaluation = evaluateStageSla(
    slaList,
    "DEV",
    comparisonSelectedYear,
  );
  const devSla2026Proj = devSlaSelectedEvaluation.contributorProjects;
  const devSla2026Ach = devSlaSelectedEvaluation.achieved;
  const devSla2026Pct =
    devSlaSelectedEvaluation.percentage === null
      ? null
      : Math.round(devSlaSelectedEvaluation.percentage);
  const devSla2026MissedProjs = devSlaSelectedEvaluation.notAchievedProjects;

  // Annual SLA comparison uses each year's authoritative DEV SLA YEAR pool.
  const years = [
    String(comparisonPreviousYear),
    String(comparisonSelectedYear),
  ];

  // User Feedback Summary filtered by comparisonSelectedYear
  const fbVals = data
    .filter((p) => {
      if (p._feedback === null) return false;
      const cd = (p as unknown as { cleansed_data?: Record<string, unknown> }).cleansed_data ?? p;
      const ly = String(cd["LIVE SLA YEAR"] ?? (p as Record<string, unknown>)["LIVE SLA YEAR"] ?? "").trim();
      if (/^\d{4}$/.test(ly)) return ly === String(comparisonSelectedYear);
      const ld = String(cd["(Live) Realized in Date"] ?? (p as Record<string, unknown>)["(Live) Realized in Date"] ?? "").trim();
      const ldm = /^(\d{4})/.exec(ld);
      if (ldm) return ldm[1] === String(comparisonSelectedYear);
      const dy = String(cd["DEV SLA YEAR"] ?? (p as Record<string, unknown>)["DEV SLA YEAR"] ?? "").trim();
      if (/^\d{4}$/.test(dy)) return dy === String(comparisonSelectedYear);
      const tm = /^(\d{2})/.exec(String(p.Ticket || "").trim());
      if (tm) return String(2000 + Number(tm[1])) === String(comparisonSelectedYear);
      const dm = /(?:19|20)\d{2}/.exec(String(cd["Project diajukan"] ?? p._year ?? ""));
      if (dm) return dm[0] === String(comparisonSelectedYear);
      if (p.Year) return String(p.Year) === String(comparisonSelectedYear);
      return false;
    })
    .map((p) => p._feedback as number);
  const fbAvg =
    fbVals.length > 0
      ? fbVals.reduce((a, b) => a + b, 0) / fbVals.length
      : null;
  const fbScore = fbAvg === null ? "Belum diisi" : fbAvg.toFixed(2);
  const fbFilled = fbAvg === null ? 0 : Math.round(fbAvg);

  // UAT Rescheduled Active Rows
  const reschedTotalNum = data.filter(
    (p) => p["Reschedule UAT"] && p["Reschedule UAT"] > 0,
  ).length;
  const reschedActiveNum = activeProjects.filter(
    (p) => p["Reschedule UAT"] && p["Reschedule UAT"] > 0,
  ).length;

  const reschedRows = activeProjects
    .filter((p) => p["Reschedule UAT"] && p["Reschedule UAT"] > 0)
    .sort((a, b) => (b["Reschedule UAT"] || 0) - (a["Reschedule UAT"] || 0))
    .slice(0, 10)
    .map((p) => ({
      name: p["Project Name"],
      status: p["Last Status"] || "Belum diisi",
      count: `${p["Reschedule UAT"]}×`,
      isActive: true,
      originalProject: p,
    }));

  const reschedAllRows = data
    .filter((p) => p["Reschedule UAT"] && p["Reschedule UAT"] > 0)
    .sort((a, b) => (b["Reschedule UAT"] || 0) - (a["Reschedule UAT"] || 0))
    .slice(0, 15)
    .map((p) => {
      const isActive = activeProjects.some(
        (ap) =>
          (p.notion_page_id && ap.notion_page_id === p.notion_page_id) ||
          (p.Ticket && ap.Ticket === p.Ticket) ||
          ap["Project Name"] === p["Project Name"],
      );
      return {
        name: p["Project Name"],
        status: p["Last Status"] || "Belum diisi",
        count: `${p["Reschedule UAT"]}×`,
        isActive,
        originalProject: p,
      };
    });

  // Go-live list (Completed projects, sorted by Live realized date)
  const goLiveList = data
    .filter(
      (p) =>
        statusGroupOf(p["Last Status"]) === "Live" ||
        p["Last Status"] === "Live On Monitoring",
    )
    .map((p) => p["Project Name"])
    .slice(0, 9);

  // SLA Total 2026 (Dev SLA Total achieved count)
  const slaTotal2026 = devSla2026Ach;

  // Compute division leaderboard
  const divisionsMap: Record<
    string,
    { total: number; achieved: number; not: number }
  > = {};
  devSla2026Proj.forEach((p) => {
    const div = String(p["Owner Div"] ?? "").trim();
    if (!div) return;
    if (!divisionsMap[div]) {
      divisionsMap[div] = { total: 0, achieved: 0, not: 0 };
    }
    const devSlaVal = p["DEV SLA"];
    divisionsMap[div].total++;
    if (devSlaVal === "Achieved") {
      divisionsMap[div].achieved++;
    } else if (devSlaVal === "Not Achieved") {
      divisionsMap[div].not++;
    }
  });

  const leaderboard = Object.keys(divisionsMap)
    .filter((div) => divisionsMap[div].total > 0)
    .map((div) => {
      const stats = divisionsMap[div];
      const sla = Math.round((stats.achieved / stats.total) * 100);
      return {
        division: div,
        sla,
        not: stats.not,
        evaluated: stats.total,
      };
    })
    .sort((a, b) => b.sla - a.sla || b.evaluated - a.evaluated)
    .map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));

  const lowestDivName =
    leaderboard.length > 0
      ? leaderboard[leaderboard.length - 1].division
      : "Belum dievaluasi";
  const lowestDivSla =
    leaderboard.length > 0 ? leaderboard[leaderboard.length - 1].sla : null;

  const uniqueDivs = new Set(data.map((p) => p["Owner Div"]).filter(Boolean))
    .size;
  const uniqueTypes = new Set(data.map((p) => p._typeGroup).filter(Boolean))
    .size;

  // Count exact source Type Project values; blank values stay unclassified.
  const typeMap: Record<string, number> = {};
  data.forEach((p) => {
    const val = String(p._typeGroup ?? "").trim();
    if (!val) return;
    typeMap[val] = (typeMap[val] || 0) + 1;
  });
  const categories = Object.keys(typeMap)
    .map((k) => ({
      label: k,
      value: typeMap[k],
      color:
        k === "Project Utama"
          ? "#2563EB"
          : k === "Enhance Kecil"
            ? "#3B82F6"
            : k === "Approval Digital"
              ? "#10B981"
              : k === "Internal IT"
                ? "#F59E0B"
                : "#64748B",
    }))
    .sort((a, b) => b.value - a.value);

  // Status distribution displays exact Last Status values from Notion.
  const statusPieMap: Record<string, number> = {};
  data.forEach((p) => {
    const val = String(p["Last Status"] ?? "").trim();
    if (!val) return;
    statusPieMap[val] = (statusPieMap[val] || 0) + 1;
  });
  const statusPieColors: Record<string, string> = {};
  const statusPie = Object.keys(statusPieMap)
    .map((k) => ({
      label: k,
      value: statusPieMap[k],
      color: statusPieColors[k] || "#64748B",
    }))
    .sort((a, b) => b.value - a.value);

  // Group by priority
  const priorityMap: Record<string, number> = {};
  data.forEach((p) => {
    const val = String(p["Prioritas Mgmt"] ?? "").trim();
    if (!val) return;
    priorityMap[val] = (priorityMap[val] || 0) + 1;
  });
  const priorityColors: Record<string, string> = {
    High: "#EF4444",
    Medium: "#F59E0B",
    Low: "#10B981",
  };
  const priorities = Object.keys(priorityMap)
    .map((k) => ({
      label: k,
      value: priorityMap[k],
      color: priorityColors[k] || "#3B82F6",
    }))
    .sort((a, b) => b.value - a.value);

  // Divisions absolute project counts
  const divCountMap: Record<string, number> = {};
  data.forEach((p) => {
    const div = String(p["Owner Div"] ?? "").trim();
    if (!div) return;
    divCountMap[div] = (divCountMap[div] || 0) + 1;
  });
  const divisions = Object.keys(divCountMap)
    .map((k) => ({
      label: k,
      value: divCountMap[k],
      color: "#2563EB",
    }))
    .sort((a, b) => b.value - a.value);

  // Active projects grouped by type and division
  const activeTypeMap: Record<string, number> = {};
  const activeDivMap: Record<string, number> = {};
  activeProjects.forEach((p) => {
    const type = String(p._typeGroup ?? "").trim();
    if (type) activeTypeMap[type] = (activeTypeMap[type] || 0) + 1;
    const div = String(p["Owner Div"] ?? "").trim();
    if (div) activeDivMap[div] = (activeDivMap[div] || 0) + 1;
  });

  const activeByType = Object.keys(activeTypeMap)
    .map((k) => ({ label: k, value: activeTypeMap[k] }))
    .sort((a, b) => b.value - a.value);
  const activeByDivision = Object.keys(activeDivMap)
    .map((k) => ({ label: k, value: activeDivMap[k] }))
    .sort((a, b) => b.value - a.value);

  // Historical charts count every project per intake year (no month filter);
  // the running year is therefore partial and not comparable to a full year.
  const projectsByYear = years.map((year) => {
    const value = getHistoricalProjectsForYear(year).length;
    return {
      year,
      value,
      color: year === String(comparisonSelectedYear) ? "#F59E0B" : "#2563EB",
    };
  });

  // Delivery Depth compares the selected intake year with its predecessor.
  // Canceled rows never reach this pool, so only these two dispositions remain.
  const depth = [comparisonPreviousYear, comparisonSelectedYear].map((year) => {
    const yearLabel = String(year);
    const yearProjects = getHistoricalProjectsForYear(yearLabel);
    const completed = yearProjects.filter(
      (project) =>
        pipelineCategoryOfStatus(project["Last Status"]) === "Completed",
    ).length;
    const inflight = yearProjects.filter(
      (project) =>
        pipelineCategoryOfStatus(project["Last Status"]) === "Active",
    ).length;
    return {
      year: yearLabel,
      completed,
      inflight,
    };
  });

  // Dev SLA YoY grouped bar
  const devSlaYoY = years.flatMap((y) => {
    const evaluation = evaluateStageSla(slaList, "DEV", y);
    return evaluation.contributors === 0
      ? []
      : [
          {
            year: y,
            achieved: evaluation.achieved,
            not: evaluation.notAchieved,
          },
        ];
  });

  // Delay analytics use the same valid stage contributor rule as SLA charts.
  const selectedSlaDelay = (
    result: unknown,
    year: unknown,
    delay: number | null,
  ): number =>
    isMatchingSlaYear(year, comparisonSelectedYear) && isValidSlaResult(result)
      ? delay || 0
      : 0;
  const phaseDelays = slaList
    .filter((p) => {
      const fsdLate = selectedSlaDelay(
        p["FSD SLA"],
        p["FSD SLA YEAR"],
        p._lateFSD,
      );
      const devLate = selectedSlaDelay(
        p["DEV SLA"],
        p["DEV SLA YEAR"],
        p._lateDev,
      );
      const sitLate = selectedSlaDelay(
        p["SIT SLA"],
        p["SIT SLA YEAR"],
        p._lateSIT,
      );
      const uatLate = selectedSlaDelay(
        p["UAT SLA"],
        p["UAT SLA YEAR"],
        p._lateUAT,
      );
      const liveLate = selectedSlaDelay(
        p["Live SLA"],
        p["LIVE SLA YEAR"],
        p._lateLive,
      );
      return fsdLate + devLate + sitLate + uatLate + liveLate > 0;
    })
    .map((p) => {
      const fsdLate = selectedSlaDelay(
        p["FSD SLA"],
        p["FSD SLA YEAR"],
        p._lateFSD,
      );
      const devLate = selectedSlaDelay(
        p["DEV SLA"],
        p["DEV SLA YEAR"],
        p._lateDev,
      );
      const sitLate = selectedSlaDelay(
        p["SIT SLA"],
        p["SIT SLA YEAR"],
        p._lateSIT,
      );
      const uatLate = selectedSlaDelay(
        p["UAT SLA"],
        p["UAT SLA YEAR"],
        p._lateUAT,
      );
      const liveLate = selectedSlaDelay(
        p["Live SLA"],
        p["LIVE SLA YEAR"],
        p._lateLive,
      );
      const totalDelay = fsdLate + devLate + sitLate + uatLate + liveLate;

      // compile list of delayed stages
      const stages: [string, number][] = [];
      if (fsdLate > 0) stages.push(["FSD", fsdLate]);
      if (devLate > 0) stages.push(["DEV", devLate]);
      if (sitLate > 0) stages.push(["SIT", sitLate]);
      if (uatLate > 0) stages.push(["UAT", uatLate]);
      if (liveLate > 0) stages.push(["LIVE", liveLate]);

      const reasonFieldByStage: Record<string, string> = {
        FSD: "(FSD) Kategori Alasan Terlambat >=2022",
        DEV: "(Dev) Kategori Alasan Terlambat >=2022",
        SIT: "(SIT) Kategori Alasan Terlambat >=2022",
        UAT: "(UAT) Kategori Alasan Terlambat >=2022",
        LIVE: "(Live) Kategori Alasan Terlambat >=2022",
      };
      const reasons = stages
        .map(([stage]) => {
          const value = String(p[reasonFieldByStage[stage]] ?? "").trim();
          return value ? `${stage}: ${value}` : "";
        })
        .filter(Boolean);

      return {
        ticket: p["Ticket"] || "Belum diisi",
        name: p["Project Name"] || "Belum diisi",
        period: p["Durasi Project (IT)"] || p._period || "Belum diisi",
        stages,
        reason: reasons.length > 0 ? reasons.join(" • ") : "Belum diisi",
        days: totalDelay,
        status: p["Last Status"] || "Belum diisi",
      };
    })
    .sort((a, b) => b.days - a.days)
    .map((item, idx) => ({
      no: idx + 1,
      ...item,
    }));

  // Group DEV delay causes only for the selected DEV SLA YEAR denominator.
  const rootCauseMap: Record<string, number> = {};
  slaList.forEach((p) => {
    const devLate = selectedSlaDelay(
      p["DEV SLA"],
      p["DEV SLA YEAR"],
      p._lateDev,
    );
    if (devLate > 0) {
      const cause = String(
        p["(Dev) Kategori Alasan Terlambat >=2022"] ?? "",
      ).trim();
      if (cause) rootCauseMap[cause] = (rootCauseMap[cause] || 0) + 1;
    }
  });

  const rootCauseColors: Record<string, string> = {};

  const rootCause = Object.keys(rootCauseMap)
    .map((k) => ({
      label: k,
      value: rootCauseMap[k],
      color: rootCauseColors[k] || "#64748B",
    }))
    .sort((a, b) => b.value - a.value);

  const multiStage = selectMultiStageFailures(
    slaList,
    comparisonSelectedYear,
  ).map(({ project, failedStages }) => ({
    name: project["Project Name"] || "Belum diisi",
    stages: failedStages.map(({ stage }) => [stage, 1] as [string, number]),
    year: comparisonSelectedYear,
    status: project["Last Status"] || "Belum diisi",
  }));

  // Throughput (dynamic Monthly completed go live timeline)
  // Let's count completion count of live projects indexed by their starting or completed date
  const comp_months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  // Go-live throughput is keyed only by "(Live) Realized in Date", matching the
  // card title. Intake year (_year) is deliberately NOT part of the filter: a
  // project submitted in 2025 that went live in 2026 still went live in 2026.
  const getCompletionsForYearAndMonth = (year: number, monthIndex: number) =>
    comparisonList.filter((project) => {
      const livePeriod = parseProjectDateYearMonth(
        project["(Live) Realized in Date"],
      );
      return livePeriod?.year === year && livePeriod.month === monthIndex + 1;
    }).length;

  const monthIndices = comp_months.map((_, monthIndex) => monthIndex);
  const selectedYearElapsedMonths = getElapsedMonthCount(
    comparisonSelectedYear,
  );

  const throughputComparison = monthIndices.map((monthIndex) => {
    const previousYearValue = getCompletionsForYearAndMonth(
      comparisonPreviousYear,
      monthIndex,
    );
    const selectedYearValue = getCompletionsForYearAndMonth(
      comparisonSelectedYear,
      monthIndex,
    );
    return {
      monthIndex,
      monthName: comp_months[monthIndex].toUpperCase(),
      // Field names remain fixed by DashboardDataset; values are dynamic.
      val2025: previousYearValue,
      val2026: selectedYearValue,
      // Bulan yang belum terjadi pada tahun terpilih: tidak boleh digambar
      // sebagai realisasi nol. Tahun pembanding tetap ditampilkan penuh.
      selectedYearPending: monthIndex >= selectedYearElapsedMonths,
    };
  });

  const totalEvaluations = stageSlaEvaluations.reduce(
    (total, evaluation) => total + evaluation.contributors,
    0,
  );
  const totalSuccess = stageSlaEvaluations.reduce(
    (total, evaluation) => total + evaluation.achieved,
    0,
  );
  const totalNotAchieved = stageSlaEvaluations.reduce(
    (total, evaluation) => total + evaluation.notAchieved,
    0,
  );
  const overallSlaPct =
    totalEvaluations > 0
      ? Math.round((totalSuccess / totalEvaluations) * 100)
      : null;

  return {
    report: {
      date: reportDate,
      newProjects: year2026Count,
      activeTotal: activeTotalCount,
      needAttention: needAttentionCount,
    },
    kpis: [
      {
        key: "queue",
        label: "Queue",
        value: queueCount,
        sub: "Waiting to start",
        color: "#D97706",
        icon: "Inbox",
        filter: "Queue",
      },
      {
        key: "progress",
        label: "In Progress",
        value: progressCount,
        sub: "FSD · Dev · SIT · CR · Dev/Live On Queue",
        color: "#2563EB",
        icon: "Play",
        filter: "Dalam Proses",
      },
      {
        key: "uat",
        label: "UAT",
        value: uatCount,
        sub: "Queue & in progress",
        color: "#3B82F6",
        icon: "CheckSquare",
        filter: "UAT",
      },
      {
        key: "monitoring",
        label: "Monitoring",
        value: monitoringCount,
        sub: "Post go-live",
        color: "#0891B2",
        icon: "Activity",
        filter: "Monitoring",
      },
      {
        key: "hold",
        label: "Hold",
        value: holdCount,
        sub: "Paused pipelines",
        color: "#64748B",
        icon: "Pause",
        filter: "Hold",
        split: [
          { label: "Hold by Owner", value: holdByOwner },
          { label: "Hold by Client/VENDOR", value: holdByVendor },
        ],
      },
    ],
    statusCounts: [
      { label: "Queue", value: queueCount, kind: "queue" },
      { label: "In Progress", value: progressCount, kind: "progress" },
      { label: "UAT", value: uatCount, kind: "uat" },
      { label: "Monitoring", value: monitoringCount, kind: "monitoring" },
      { label: "Hold", value: holdCount, kind: "hold" },
    ],
    milestones,
    devSla2026: {
      pct: devSla2026Pct,
      achieved: devSla2026Ach,
      notAchieved: devSla2026MissedProjs.length,
      target: 93,
      missedProjs: devSla2026MissedProjs,
    },
    feedback: {
      score: fbScore,
      of: 5,
      filled: fbFilled,
      evaluated: fbVals.length,
    },
    uatRescheduled: {
      active: reschedActiveNum,
      total: reschedTotalNum,
      rows: reschedRows,
      allRows: reschedAllRows,
    },
    goLive: goLiveList,
    pipelineChips: [
      {
        label: "Total Projects",
        value: data.length,
        icon: "Folder",
        color: "blue",
      },
      {
        label: "Completed",
        value: completedProjects.length,
        icon: "Done",
        color: "green",
      },
      {
        label: "Active",
        value: activeTotalCount,
        icon: "Activity",
        color: "amber",
      },
    ],
    projectsByYear,
    onQueue: {
      total: queueProjects.length,
      types: [
        {
          label: "On Queue",
          value: actualRawData.filter(
            (p) => normalizeStatus(p["Last Status"]) === "on queue",
          ).length,
        },
      ],
      top: queueProjects.map((p) => ({
        name: p["Project Name"] || "Belum diisi",
        status: p["Last Status"] || "Belum diisi",
      })),
    },
    throughput: {
      comparison: throughputComparison,
    },
    depth,
    slaTotal2026,
    slaChips: [
      {
        label: "Evaluasi SLA",
        value: totalEvaluations,
        icon: "Activity",
        color: "blue",
      },
      {
        label: "Achieved SLA",
        value: totalSuccess,
        icon: "Check",
        color: "green",
      },
      {
        label: "Not Achieved SLA",
        value: totalNotAchieved,
        icon: "X",
        color: "red",
      },
      {
        label: "SLA Achievement %",
        value:
          overallSlaPct === null ? "Belum dievaluasi" : `${overallSlaPct}%`,
        icon: "Percent",
        color: "amber",
      },
    ],
    slaStageSummary: stageSlaEvaluations.map((evaluation) => ({
      stage: evaluation.stage,
      pct:
        evaluation.percentage === null
          ? null
          : Math.round(evaluation.percentage),
      notAch: evaluation.notAchieved,
    })),
    devSlaYoY,
    rootCause,
    multiStage,
    phaseDelays,
    projectChips: [
      {
        label: "Total Projects",
        value: data.length,
        icon: "Folder",
        color: "blue",
      },
      {
        label: "Active",
        value: activeTotalCount,
        icon: "Activity",
        color: "amber",
      },
      {
        label: "Completed",
        value: completedProjects.length,
        icon: "Done",
        color: "green",
      },
    ],
    categoryCards: [
      {
        label: "Kategori",
        value: uniqueTypes,
        sub: "Project Types Active",
        icon: "Grid",
        color: "blue",
      },
      {
        label: "Divisi Terlibat",
        value: uniqueDivs,
        sub: "Business divisions",
        icon: "Users",
        color: "green",
      },
      {
        label: "Avg Dev SLA %",
        value:
          overallSlaPct === null ? "Belum dievaluasi" : `${overallSlaPct}%`,
        sub: "Overall performance",
        icon: "Gauge",
        color: "amber",
      },
      {
        label: "SLA Dev Terendah",
        value: lowestDivSla === null ? "Belum dievaluasi" : `${lowestDivSla}%`,
        value2: lowestDivName,
        sub: "Critically delayed",
        icon: "ChevronRight",
        color: "red",
      },
    ],
    categories,
    statusPie,
    priorities,
    divisions,
    leaderboard,
    activeByType,
    activeByDivision,
  };
}
