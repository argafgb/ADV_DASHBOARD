"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import type { DashboardDataset, SanitizedProject } from "../types/types";
import { Card, Icon } from "./UI";
import { normalizeStatus, statusGroupOf } from "../utils/parser";
import {
  buildMonthlyProjectPipeline,
  getElapsedMonthCount,
} from "../services/project-data";
import { evaluateStageSla, selectSlaYearProjects } from "../utils/sla-policy";
import {
  formatPeriodLabel,
  MONTH_OPTIONS,
  monthWindowOf,
} from "../utils/period-filter";
import { HoverTip, TipScope, useHoverTip } from "./chart-tooltip";
import {
  getSlaEvaluationPool,
  isExcludedFeedbackProjectType,
} from "../utils/project-normalization";
import { getStatusPalette } from "../utils/status-style";
import { useModalDismiss, backdropDismissProps } from "../utils/use-modal-dismiss";
import {
  getGlobalProjectDate,
  getGlobalProgressUpdate,
  calculateProjectAverageScore,
  getChronologicalLogEntries,
  formatLogWithNewLines,
  formatSourceDateForDisplay,
} from "../utils/utils";

const IN_PROGRESS_STAGE_BY_STATUS: Readonly<
  Record<string, "FSD" | "DEV" | "SIT" | "CR">
> = {
  fps: "FSD",
  fsd: "FSD",
  "fps on progress": "FSD",
  "fsd on progress": "FSD",
  dev: "DEV",
  development: "DEV",
  "dev on progress": "DEV",
  "dev on queue": "DEV",
  "dev pending estimation": "DEV",
  "pending estimation": "DEV",
  "development on progress": "DEV",
  sit: "SIT",
  "sit on progress": "SIT",
  "change request on progress": "CR",
};

const HOLD_STATUSES = new Set([
  "hold by owner",
  "hold by client/vendor",
  "hold by it",
]);

function getInProgressStage(project: SanitizedProject) {
  return (
    IN_PROGRESS_STAGE_BY_STATUS[normalizeStatus(project["Last Status"])] ?? null
  );
}

function isHoldProject(project: SanitizedProject): boolean {
  return HOLD_STATUSES.has(normalizeStatus(project["Last Status"]));
}

function getStatusBadgeClass(status: unknown): string {
  return getStatusPalette(status).pill;
}

interface TabOverviewProps {
  dataset: DashboardDataset;
  onNavigateToTab: (index: number) => void;
  filteredProjects?: SanitizedProject[];
  slaProjects?: SanitizedProject[];
  startYear?: number;
  endYear?: number;
  /** Pilihan chip Bulan: "ALL", "3", atau "3-5". */
  month?: string;
  syncTrigger?: number;
}

type StageKpiCardVariant = "default" | "primary";

interface StageKpiCardProps {
  label: string;
  value: number;
  /**
   * Ringkasan satu baris yang menjelaskan arti kartu dalam bahasa pengguna.
   * Sengaja dijaga pendek supaya kelima kartu tetap sama tinggi.
   */
  summary: React.ReactNode;
  /** Nama status apa adanya dari Notion, tampil sebagai tooltip. */
  statusHint: string;
  icon: React.ReactNode;
  iconClassName: string;
  onClick: () => void;
  variant?: StageKpiCardVariant;
}

function StageKpiCard({
  label,
  value,
  summary,
  statusHint,
  icon,
  iconClassName,
  onClick,
  variant = "default",
}: StageKpiCardProps) {
  const isPrimary = variant === "primary";
  const { triggerProps, tip } = useHoverTip(statusHint);

  return (
    <div
      onClick={onClick}
      {...triggerProps}
      className={`min-h-40 rounded-[14px] border p-4 sm:p-5 flex flex-col justify-between cursor-pointer group transition-all duration-150 ${
        isPrimary
          ? "bg-blue-600 border-blue-600 text-white shadow-none hover:bg-blue-700 hover:border-blue-700"
          : "bg-white border-[#E8EBF0] hover:border-[#C7D7FB] hover:shadow-[0_3px_10px_rgba(17,24,39,0.06)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span
            className={`text-xs font-semibold font-sans block ${isPrimary ? "text-blue-100" : "text-gray-500"}`}
          >
            {label}
          </span>
          <span
            className={`text-3xl font-semibold tabular-nums tracking-tight block ${isPrimary ? "text-white" : "text-gray-900"}`}
          >
            {value}
          </span>
        </div>
        <div
          className={`p-2.5 rounded-[10px] transition-colors ${isPrimary ? "bg-white/20 text-white ring-1 ring-white/20 group-hover:bg-white/25" : iconClassName}`}
        >
          {icon}
        </div>
      </div>
      {/* Ringkasan status */}
      <div
        className={`mt-4 border-t pt-3 min-w-0 ${isPrimary ? "border-white/20" : "border-[#F1F3F7]"}`}
      >
        <span
          className={`block min-w-0 truncate text-[11.5px] font-medium ${isPrimary ? "text-blue-100" : "text-gray-400"}`}
        >
          {summary}
        </span>
      </div>
      {tip}
    </div>
  );
}

function ProgressCircle({
  pct,
  color,
  size = 128,
  strokeWidth = 12,
}: {
  pct: number | null;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const numericPct = pct ?? 0;
  const strokeDashoffset = circumference - (numericPct / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center select-none bg-white rounded-full z-10 shadow-3xs"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Underlay base circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-gray-100"
          strokeWidth={strokeWidth}
          fill="white"
        />
        {/* Colorful dynamic progress ring arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute max-w-24 text-center text-lg font-extrabold leading-tight text-slate-800 font-sans">
        {pct === null ? "Belum dievaluasi" : `${pct}%`}
      </span>
    </div>
  );
}

const getFeedbackComments = (p: SanitizedProject): string[] => {
  const source = p.cleansed_data ?? p;
  return Object.entries(source)
    .filter(([key]) => /komentar|comment|saran/i.test(key))
    .map(([, value]) => toSourceText(value))
    .filter((value) => value !== "");
};

const MONTH_SHORT_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SLA_TARGET_PERCENTAGE = 93;

const SLA_STAGE_DEFINITIONS = [
  {
    stage: "FSD",
    slaField: "FSD SLA",
    yearField: "FSD SLA YEAR",
    reasonFields: [
      "(FSD) Kategori Alasan Terlambat >=2022",
      "(FSD) Deskripsi Terlambat >=2022",
    ],
  },
  {
    stage: "DEV",
    slaField: "DEV SLA",
    yearField: "DEV SLA YEAR",
    reasonFields: [
      "(Dev) Kategori Alasan Terlambat >=2022",
      "(Dev) Deskripsi Terlambat >=2022",
    ],
  },
  {
    stage: "SIT",
    slaField: "SIT SLA",
    yearField: "SIT SLA YEAR",
    reasonFields: [
      "(SIT) Kategori Alasan Terlambat >=2022",
      "(SIT) Deskripsi Terlambat >=2022",
    ],
  },
  {
    stage: "UAT",
    slaField: "UAT SLA",
    yearField: "UAT SLA YEAR",
    reasonFields: [
      "(UAT) Kategori Alasan Terlambat >=2022",
      "(UAT) Deskripsi Terlambat >=2022",
    ],
  },
  {
    stage: "LIVE",
    slaField: "Live SLA",
    yearField: "LIVE SLA YEAR",
    reasonFields: [
      "(Live) Kategori Alasan Terlambat >=2022",
      "(Live) Deskripsi Terlambat >=2022",
    ],
  },
] as const;

type SlaStageName = (typeof SLA_STAGE_DEFINITIONS)[number]["stage"];

/**
 * Pass-through — dulu meng-exclude div IT/WISESA & Approval Digital, tapi rule
 * itu membuang row valid yang ada di Notion. Sumber kebenaran = kolom Notion.
 */

const MISSING_DISPLAY_VALUE = "Belum diisi";

function toSourceText(value: unknown): string {
  const text = String(value ?? "").trim();
  return text === "" || text === "-" || text === "—" ? "" : text;
}

function toDisplayText(value: unknown): string {
  return toSourceText(value) || MISSING_DISPLAY_VALUE;
}

function getProjectSourceInformation(
  project: SanitizedProject,
  fields: readonly string[],
): string {
  const uniqueValues = Array.from(
    new Set(
      fields.map((field) => toSourceText(project[field])).filter(Boolean),
    ),
  );
  return uniqueValues.length > 0
    ? uniqueValues.join(" • ")
    : MISSING_DISPLAY_VALUE;
}

const YOY_TONE_CLASSES = {
  amber: {
    dot: "bg-amber-500",
    title: "text-amber-700",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
  },
  blue: {
    dot: "bg-blue-600",
    title: "text-blue-700",
    chip: "border-blue-200 bg-blue-50 text-blue-700",
  },
} as const;

function formatDevDelay(project: SanitizedProject) {
  const delay = project._lateDev;

  if (delay === null) {
    return (
      <span className="tabular-nums text-[11px] text-zinc-400">
        {MISSING_DISPLAY_VALUE}
      </span>
    );
  }
  if (delay > 0) {
    return (
      <span className="rounded-md border border-rose-100 bg-rose-50 px-1.5 py-0.5 tabular-nums text-[11px] font-bold text-rose-600">
        +{delay} d
      </span>
    );
  }
  if (delay < 0) {
    return (
      <span className="rounded-md border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 tabular-nums text-[11px] font-semibold text-emerald-600">
        {delay} d
      </span>
    );
  }
  return (
    <span className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 tabular-nums text-[11px] text-zinc-500">
      0 d
    </span>
  );
}

function YoySlaColumn({
  year,
  projects,
  achieved,
  notAchieved,
  percentage,
  tone,
}: {
  year: number | string;
  projects: SanitizedProject[];
  achieved: number;
  notAchieved: number;
  percentage: number | null;
  tone: "amber" | "blue";
}) {
  const toneClass = YOY_TONE_CLASSES[tone];

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs">
      <header className="shrink-0 border-b border-zinc-100 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4
            className={
              "flex items-center gap-2 text-sm font-extrabold " +
              toneClass.title
            }
          >
            <span className={"h-2.5 w-2.5 rounded-full " + toneClass.dot} />
            Tahun {year}
          </h4>
          <span
            className={
              "rounded-lg border px-2 py-0.5 tabular-nums text-[11px] font-bold " +
              toneClass.chip
            }
          >
            {percentage === null ? MISSING_DISPLAY_VALUE : percentage + "% SLA"}
          </span>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-zinc-500">
          <span>{projects.length} proyek</span>
          <span className="text-emerald-600">{achieved} Achieved</span>
          <span className="text-rose-600">{notAchieved} Not Achieved</span>
        </p>
      </header>

      <ul className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto overscroll-contain select-text">
        {projects.map((project, index) => {
          const result = toSourceText(project["DEV SLA"]);
          const reason = getProjectSourceInformation(project, [
            "(Dev) Kategori Alasan Terlambat >=2022",
            "(Dev) Deskripsi Terlambat >=2022",
          ]);

          return (
            <li
              key={project.notion_page_id || index}
              className="px-4 py-3 transition-colors hover:bg-zinc-50/70"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="tabular-nums text-[10px] font-bold tracking-wide text-zinc-400">
                    {toDisplayText(project["Ticket"])}
                  </span>
                  <p className="text-[12.5px] font-bold break-words text-zinc-800">
                    {toDisplayText(project["Project Name"])}
                  </p>
                </div>
                <div className="shrink-0">{formatDevDelay(project)}</div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span
                  className={
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase " +
                    (result === "Achieved"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : result === "Not Achieved"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-zinc-200 bg-zinc-50 text-zinc-500")
                  }
                >
                  {toDisplayText(project["DEV SLA"])}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-zinc-500">
                  <Icon
                    name="users"
                    className="h-3 w-3 shrink-0 text-zinc-400"
                  />
                  <span className="truncate">
                    {toDisplayText(
                      project["PIC Short Name"] || project["PIC Name"],
                    )}
                  </span>
                </span>
              </div>

              {reason !== MISSING_DISPLAY_VALUE && (
                <p className="mt-2 border-l-2 border-zinc-200 pl-2.5 text-[11px] leading-relaxed break-words text-zinc-500">
                  {reason}
                </p>
              )}
            </li>
          );
        })}

        {projects.length === 0 && (
          <li className="px-4 py-12 text-center text-xs text-zinc-400 italic">
            Tidak ada proyek pada {year}.
          </li>
        )}
      </ul>
    </section>
  );
}

function toFiniteNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundPercentageForDisplay(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

function getStagePriorityWeight(item: SanitizedProject): number {
  const lastStatus = normalizeStatus(item["Last Status"]);
  const fsdStatus = item["(FSD) Status"]
    ? item["(FSD) Status"].trim().toLowerCase()
    : "";
  const devStatus = item["(Dev) Status"]
    ? item["(Dev) Status"].trim().toLowerCase()
    : "";
  const sitStatus = item["(SIT) Status"]
    ? item["(SIT) Status"].trim().toLowerCase()
    : "";

  // 1. FSD Stage Active -> Priority 1
  if (
    fsdStatus !== "" &&
    fsdStatus !== "done" &&
    !fsdStatus.includes("not start")
  ) {
    return 1;
  }
  // 2. Dev Stage: Pending Estimation -> Priority 2
  if (lastStatus.includes("estimation") || devStatus.includes("estimation")) {
    return 2;
  }
  // 3. Dev Stage: On Queue -> Priority 3
  if (
    (lastStatus.includes("dev on queue") || devStatus.includes("queue")) &&
    !lastStatus.includes("sit") &&
    !lastStatus.includes("uat")
  ) {
    return 3;
  }
  // 4. Dev Stage Active -> Priority 4
  if (devStatus === "on progress" || devStatus.includes("progress")) {
    return 4;
  }
  // 5. SIT Stage Active -> Priority 5
  if (sitStatus === "on progress" || sitStatus.includes("progress")) {
    return 5;
  }
  // 6. Fallback -> Priority 6
  return 6;
}

export function TabOverview({
  dataset,
  filteredProjects,
  slaProjects,
  startYear,
  endYear,
  month = "ALL",
}: TabOverviewProps) {
  const { uatRescheduled } = dataset;
  const list = useMemo(() => filteredProjects || [], [filteredProjects]);
  const operationalList = list;

  const selectedYear = endYear || startYear || new Date().getFullYear();
  const previousYear = selectedYear - 1;

  // Filter Bulan: card SLA memakai bulan Realized Date tiap tahap, card go-live
  // memakai "(Live) Realized in Date". All Months (null) = perilaku tahunan.
  const monthWindow = useMemo(() => monthWindowOf(month), [month]);
  const slaPeriod = useMemo(
    () => ({ year: selectedYear, months: monthWindow }),
    [monthWindow, selectedYear],
  );
  const selectedPeriodLabel = formatPeriodLabel(selectedYear, monthWindow);

  // Grafik bulanan berhenti di bulan berjalan supaya bulan yang belum terjadi
  // tidak tergambar sebagai realisasi nol.
  const elapsedMonthNum = Math.max(1, getElapsedMonthCount(selectedYear));
  const endMonthNum = Math.min(
    monthWindow?.endMonth ?? elapsedMonthNum,
    elapsedMonthNum,
  );
  const startMonthNum = Math.min(monthWindow?.startMonth ?? 1, endMonthNum);
  const actualGoLivePeriodLabel =
    monthWindow === null
      ? `Jan–${MONTH_SHORT_LABELS[endMonthNum - 1]} ${selectedYear}`
      : selectedPeriodLabel;

  // SLA visuals read the complete database, then mirror Notion's
  // `Type Project: Not Internal IT` filter through the shared SLA pool.
  const masterSlaList = useMemo(() => slaProjects ?? list, [slaProjects, list]);
  const slaList = useMemo(
    () => getSlaEvaluationPool(masterSlaList),
    [masterSlaList],
  );
  const yoySlaList = slaList;

  const stageSlaSummary = useMemo(
    () =>
      SLA_STAGE_DEFINITIONS.map((definition) => {
        const evaluation = evaluateStageSla(
          slaList,
          definition.stage,
          slaPeriod,
        );

        return {
          ...definition,
          projects: evaluation.contributorProjects,
          achievedProjects: evaluation.achievedProjects,
          notAchievedProjects: evaluation.notAchievedProjects,
          evaluated: evaluation.contributors,
          achieved: evaluation.achieved,
          notAch: evaluation.notAchieved,
          rawPct: evaluation.percentage,
          pct: roundPercentageForDisplay(evaluation.percentage),
        };
      }),
    [slaList, slaPeriod],
  );

  const yoySlaOverridden = useMemo(
    () =>
      [previousYear, selectedYear].flatMap((year, index) => {
        const evaluation = evaluateStageSla(yoySlaList, "DEV", {
          year,
          months: monthWindow,
        });
        if (evaluation.contributors === 0) return [];

        return [
          {
            year: String(year),
            label: formatPeriodLabel(year, monthWindow),
            projects: evaluation.contributorProjects,
            evaluatedContributors: evaluation.contributors,
            achieved: evaluation.achieved,
            notAchieved: evaluation.notAchieved,
            pct: roundPercentageForDisplay(evaluation.percentage),
            color: index === 0 ? "#F59E0B" : "#2563EB",
          },
        ];
      }),
    [monthWindow, previousYear, selectedYear, yoySlaList],
  );
  const previousYearSla = yoySlaOverridden.find(
    (item) => item.year === String(previousYear),
  );
  const selectedYearSla = yoySlaOverridden.find(
    (item) => item.year === String(selectedYear),
  );

  // Active status groups
  const activeTypes = useMemo(
    () => [
      "Queue",
      "Dalam Proses",
      "UAT",
      "Monitoring",
      "Hold",
      "Change Request",
    ],
    [],
  );

  const delayedUATProjects = useMemo(() => {
    return list.filter((p) => {
      const uatLate = p._lateUAT || 0;
      const reschedVal = p["Reschedule UAT"] || 0;
      const statusGrp = statusGroupOf(p["Last Status"]);
      const isActive = statusGrp !== "Live" && statusGrp !== "Canceled";
      return isActive && (uatLate > 0 || reschedVal > 0);
    });
  }, [list]);

  // Modal State
  const [activeModal, setActiveModal] = useState<{
    title: string;
    type:
      | "feedback"
      | "contributors"
      | "kpi_card"
      | "milestone_sla"
      | "yoy_comparison"
      | "uat_delay_audit"
      | "historical_queue";
    projects?: SanitizedProject[];
    kpiKey?: "queue" | "progress" | "uat" | "monitoring" | "hold";
    stageName?: "FSD" | "DEV" | "SIT" | "UAT" | "LIVE";
  } | null>(null);

  const closeActiveModal = useCallback(
    () => setActiveModal(null),
    [setActiveModal],
  );
  useModalDismiss(activeModal !== null, closeActiveModal);
  const modalBackdropProps = backdropDismissProps(closeActiveModal);

  const [modalActiveView, setModalActiveView] = useState<"golive" | "incoming">(
    "incoming",
  );
  const [selectedIncomingMonth, setSelectedIncomingMonth] =
    useState<number>(endMonthNum);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Filter modal In Progress. Disimpan di level komponen supaya nilainya bisa
  // direset saat kartu diklik, bukan tertinggal dari sesi modal sebelumnya.
  const [progressStageFilter, setProgressStageFilter] = useState<
    "ALL" | "FSD" | "DEV" | "SIT" | "CR"
  >("ALL");
  const [progressDevSubFilter, setProgressDevSubFilter] = useState<
    "ALL" | "ESTIMATION" | "QUEUE" | "PROGRESS"
  >("ALL");
  const [progressSearch, setProgressSearch] = useState("");
  const [uatRescheduledFilter, setUatRescheduledFilter] = useState<
    "active" | "all"
  >("active");

  // Queue KPI mirrors the single Notion status grouped as Queue: On Queue.
  // Dev/Live On Queue count as In Progress, and UAT On Queue stays in UAT.
  const queueProjectsPool = useMemo(() => {
    return list.filter(
      (item) => statusGroupOf(item["Last Status"]) === "Queue",
    );
  }, [list]);

  const queueCount = queueProjectsPool.length;

  // Intake dan go-live dibandingkan berdasarkan tanggal masing-masing, jadi
  // gunakan snapshot penuh agar proyek lintas tahun tidak hilang karena filter Period.
  const monthlyPipeline = useMemo(
    () =>
      buildMonthlyProjectPipeline(
        operationalList,
        selectedYear,
        startMonthNum,
        endMonthNum,
      ),
    [operationalList, startMonthNum, endMonthNum, selectedYear],
  );

  // In Progress: murni dari kolom "Last Status" Notion (bukan tebakan dari
  // sub-kolom fase, yang sering tidak sinkron dengan Last Status di Notion).
  const cleanInProgressPool = useMemo(
    () => operationalList.filter((item) => getInProgressStage(item) !== null),
    [operationalList],
  );

  const activeInProgressPool = cleanInProgressPool;

  const progressCount = activeInProgressPool.length;

  const uatProjectsPool = useMemo(
    () =>
      operationalList.filter(
        (project) => statusGroupOf(project["Last Status"]) === "UAT",
      ),
    [operationalList],
  );
  const monitoringProjectsPool = useMemo(
    () =>
      operationalList.filter(
        (project) => statusGroupOf(project["Last Status"]) === "Monitoring",
      ),
    [operationalList],
  );
  const holdProjectsPool = useMemo(
    () => operationalList.filter(isHoldProject),
    [operationalList],
  );

  const uatCount = uatProjectsPool.length;
  const monitoringCount = monitoringProjectsPool.length;
  const holdCount = holdProjectsPool.length;
  const totalActiveTickets =
    queueCount + progressCount + uatCount + monitoringCount + holdCount;
  const holdByOwnerCount = holdProjectsPool.filter(
    (project) => normalizeStatus(project["Last Status"]) === "hold by owner",
  ).length;
  const holdByClientVendorCount = holdProjectsPool.filter(
    (project) =>
      normalizeStatus(project["Last Status"]) === "hold by client/vendor",
  ).length;
  const holdByItCount = holdProjectsPool.filter(
    (project) => normalizeStatus(project["Last Status"]) === "hold by it",
  ).length;

  // Ringkasan Hold hanya menyebut sebab yang benar-benar terisi. Hold By IT
  // umumnya bertipe Internal IT sehingga sudah terbuang dari pool operasional,
  // dan menampilkannya sebagai "0 IT" hanya jadi angka mati di kartu.
  const holdReasons = (
    [
      [holdByOwnerCount, "Owner"],
      [holdByClientVendorCount, "Client/Vendor"],
      [holdByItCount, "IT"],
    ] as const
  ).filter(([count]) => count > 0);

  const holdSummary =
    holdReasons.length > 0
      ? `Tertahan di ${holdReasons.map(([, reason]) => reason).join(", ")}`
      : "Tidak ada proyek tertahan";

  const holdStatusHint =
    holdReasons.length > 0
      ? `Status: ${holdReasons
          .map(([count, reason]) => `Hold By ${reason} (${count})`)
          .join(", ")}`
      : "Status: tidak ada proyek berstatus Hold";

  const goLiveProjs = useMemo(
    () =>
      monthlyPipeline.months.flatMap(
        (month) => monthlyPipeline.liveByMonth[month] || [],
      ),
    [monthlyPipeline],
  );

  // Feedback berangkat dari scope actual go-live yang sama dengan kartu
  // periode, lalu membuang Type Project yang memang tidak dinilai lewat form
  // feedback user. Kartu Go-Live sendiri tetap memakai scope penuh.
  // Proyek tanpa nilai tetap tampil di drill-down tapi tidak ikut rata-rata.
  const feedbackMetrics = useMemo(() => {
    const scopeProjects = goLiveProjs.filter(
      (project) => !isExcludedFeedbackProjectType(project._typeGroup),
    );
    const withFeedback = scopeProjects.filter(
      (project) => calculateProjectAverageScore(project) !== null,
    );
    const feedbackScores = withFeedback
      .map((project) => calculateProjectAverageScore(project))
      .filter((score): score is number => score !== null);
    const averageScore =
      feedbackScores.length > 0
        ? feedbackScores.reduce((total, score) => total + score, 0) /
          feedbackScores.length
        : null;
    const scoreText =
      averageScore === null ? MISSING_DISPLAY_VALUE : averageScore.toFixed(2);

    return {
      scopeProjects,
      withFeedback,
      scoreText,
    };
  }, [goLiveProjs]);

  const feedbackProjects = feedbackMetrics.scopeProjects;

  // Select unique projects whose stage-specific SLA YEAR matches the year.
  const evaluatedProjs = useMemo(
    () => selectSlaYearProjects(slaList, slaPeriod),
    [slaList, slaPeriod],
  );

  // Preserve the existing attention eligibility and source pool. The UI only
  // adds a per-project Late Days breakdown; it does not change card membership.
  const attentionProjs = useMemo(() => {
    return list.filter((p) => {
      const isAct = activeTypes.includes(statusGroupOf(p["Last Status"]));
      if (!isAct) return false;
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
    });
  }, [activeTypes, list]);

  const getProjectDisplayDate = (project: SanitizedProject): string =>
    toDisplayText(getGlobalProjectDate(project));

  const handleQueueCardClick = () => {
    setActiveModal({
      title: "Queue Projects",
      type: "kpi_card",
      kpiKey: "queue",
    });
  };

  const handleInProgressCardClick = () => {
    setProgressStageFilter("ALL");
    setProgressDevSubFilter("ALL");
    setProgressSearch("");
    setActiveModal({
      title: "In Progress Projects",
      type: "kpi_card",
      kpiKey: "progress",
    });
  };

  const handleUatCardClick = () => {
    setActiveModal({
      title: "UAT Projects",
      type: "kpi_card",
      kpiKey: "uat",
    });
  };

  const handleMonitoringCardClick = () => {
    setActiveModal({
      title: "Monitoring Projects",
      type: "kpi_card",
      kpiKey: "monitoring",
    });
  };

  const handleHoldCardClick = () => {
    setActiveModal({
      title: "Hold Projects",
      type: "kpi_card",
      kpiKey: "hold",
    });
  };

  // Milestone SLA click handler
  const handleMilestoneClick = (stageName: string) => {
    let cleanStage = stageName.toUpperCase();
    if (cleanStage === "DEVELOPMENT") cleanStage = "DEV";
    setActiveModal({
      title: `${stageName} Stage SLA Details`,
      type: "milestone_sla",
      stageName: cleanStage as "FSD" | "DEV" | "SIT" | "UAT" | "LIVE",
    });
  };

  const handleYoYCardClick = () => {
    setActiveModal({
      title: "DEV SLA Year-on-Year Comparison",
      type: "yoy_comparison",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Executive Summary Mini Row Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-gray-100 pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest font-sans">
            Executive Summary Overview
          </h3>
          <HoverTip
            content="Tahap operasional (Queue, In Progress, UAT, Monitoring, Hold) menyajikan seluruh proyek yang saat ini sedang aktif berjalan di sistem agar beban kerja operasional tetap terpantau menyeluruh tanpa terpotong filter periode."
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 select-none cursor-help"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Papan Operasional Aktif
            <Icon name="info" className="w-3 h-3 text-blue-500" />
          </HoverTip>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <HoverTip
            content={`Total ${totalActiveTickets} proyek yang saat ini aktif berjalan (${queueCount} Queue, ${progressCount} In Progress, ${uatCount} UAT, ${monitoringCount} Monitoring, ${holdCount} Hold).`}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 cursor-help"
          >
            <strong className="font-extrabold">{totalActiveTickets}</strong>
            proyek aktif berjalan
          </HoverTip>
        </div>
      </div>

      {/* Top row: Satisfaction rating and KPI tags */}
      <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs flex flex-col md:flex-row items-stretch justify-between gap-5">
        {/* User satisfaction score - CLICKABLE */}
        <div
          onClick={() =>
            setActiveModal({
              title: `User Feedback • Actual Go-Live ${selectedPeriodLabel}`,
              projects: feedbackProjects,
              type: "feedback",
            })
          }
          className="flex min-w-0 flex-col justify-center border-b md:min-w-50 md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 pr-0 md:pr-6 cursor-pointer hover:bg-slate-50/70 p-3 rounded-2xl transition-all group"
        >
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between gap-2 min-w-0">
            <span className="truncate">User Satisfaction Rate</span>
            <span className="inline-flex items-center gap-0.5 text-[9px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 whitespace-nowrap">
              Detail
              <ArrowRight aria-hidden="true" className="h-2.5 w-2.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-extrabold text-gray-900 font-display tracking-tight leading-none text-slate-850">
              {feedbackMetrics.scoreText}
            </span>
          </div>
          <span className="mt-1 text-[10px] font-medium text-gray-400">
            Rata-rata feedback actual go-live {actualGoLivePeriodLabel}
          </span>
          <span className="text-[10px] text-gray-450 font-bold tracking-tight mt-1">
            {feedbackMetrics.withFeedback.length} proyek dengan feedback
          </span>
        </div>

        {/* 3 small horizontal KPI tags matching Card info styles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 flex-1">
          {/* Tag 1: Proyek dievaluasi - CLICKABLE */}
          <div
            onClick={() =>
              setActiveModal({
                title: "SLA Evaluated Projects",
                projects: evaluatedProjs,
                type: "contributors",
              })
            }
            className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer hover:bg-amber-50 hover:shadow-xs transition-all select-none group"
          >
            <span className="text-2xl font-extrabold text-amber-700 font-display tracking-tight leading-none group-hover:scale-105 transition-transform origin-left block">
              {evaluatedProjs.length}
            </span>
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block mt-2.5 leading-tight">
              Evaluated Projects
            </span>
          </div>

          {/* Tag 2: Go-Live periode ini - CLICKABLE */}
          <div
            onClick={() =>
              setActiveModal({
                title: "Go-Live This Period Projects",
                projects: goLiveProjs,
                type: "contributors",
              })
            }
            className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer hover:bg-emerald-50 hover:shadow-xs transition-all select-none group"
          >
            <span className="text-2xl font-extrabold text-emerald-700 font-display tracking-tight leading-none group-hover:scale-105 transition-transform origin-left block">
              {goLiveProjs.length}
            </span>
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block mt-2.5 leading-tight">
              Go-Live This Period
            </span>
            <span className="mt-1 block text-[9px] font-medium leading-tight text-gray-400">
              Event tanggal realisasi · dapat overlap status aktif
            </span>
          </div>

          {/* Tag 3: Perlu perhatian - CLICKABLE */}
          <div
            onClick={() =>
              setActiveModal({
                title: "Needs Attention Projects",
                projects: attentionProjs,
                type: "contributors",
              })
            }
            className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer hover:bg-rose-50 hover:shadow-xs transition-all select-none group"
          >
            <span className="text-2xl font-extrabold text-rose-700 font-display tracking-tight leading-none group-hover:scale-105 transition-transform origin-left block">
              {attentionProjs.length}
            </span>
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block mt-2.5 leading-tight">
              Needs Attention
            </span>
          </div>
        </div>
      </div>

      {/* Section Header: Tahapan Proyek Berjalan (Tidak Terikat Filter Periode) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest font-sans">
            Tahapan Proyek Berjalan
          </h4>
          <HoverTip
            content="Kelima kartu tahapan di bawah ini mencerminkan seluruh proyek yang saat ini sedang aktif berjalan di sistem dan sengaja tidak dipotong oleh filter tahun atau bulan agar beban kerja operasional tetap terpantau menyeluruh."
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 select-none cursor-help"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Data Proyek Berjalan • Tidak Terikat Filter Periode
            <Icon name="info" className="w-3.5 h-3.5 text-amber-600" />
          </HoverTip>
        </div>
        <div className="text-[11px] font-medium text-gray-400">
          Status proyek aktif saat ini di setiap tahapan
        </div>
      </div>

      {/* Row 2: 5 Stage KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Queue */}
        <StageKpiCard
          label="Queue"
          value={queueCount}
          summary="Menunggu dikerjakan"
          statusHint="Status: On Queue"
          icon={<Icon name="Inbox" className="w-5 h-5 stroke-[2]" />}
          iconClassName="bg-blue-50 text-blue-600 group-hover:bg-blue-100/70"
          onClick={handleQueueCardClick}
        />

        {/* Card 2: In Progress */}
        <StageKpiCard
          label="In Progress"
          value={progressCount}
          summary="FSD, Dev, SIT & Change Request"
          statusHint="Status: FSD On Progress, Dev Pending Estimation, Dev On Queue, Dev On Progress, SIT On Progress, Change Request On Progress"
          icon={<Icon name="Play" className="w-5 h-5 stroke-[2]" />}
          iconClassName="bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100/70"
          onClick={handleInProgressCardClick}
          variant="primary"
        />

        {/* Card 3: UAT */}
        <StageKpiCard
          label="UAT"
          value={uatCount}
          summary="Tahap pengujian user"
          statusHint="Status: UAT On Queue, UAT On Progress"
          icon={<Icon name="CheckSquare" className="w-5 h-5 stroke-[2]" />}
          iconClassName="bg-amber-50 text-amber-500 group-hover:bg-amber-100/70"
          onClick={handleUatCardClick}
        />

        {/* Card 4: Monitoring */}
        <StageKpiCard
          label="Monitoring"
          value={monitoringCount}
          summary="Pemantauan pasca go-live"
          statusHint="Status: Live On Monitoring"
          icon={<Icon name="Activity" className="w-5 h-5 stroke-[2]" />}
          iconClassName="bg-teal-50 text-teal-600 group-hover:bg-teal-100/70"
          onClick={handleMonitoringCardClick}
        />

        {/* Card 5: Hold */}
        <StageKpiCard
          label="Hold"
          value={holdCount}
          summary={holdSummary}
          statusHint={holdStatusHint}
          icon={<Icon name="Pause" className="w-5 h-5 stroke-[2]" />}
          iconClassName="bg-rose-50 text-rose-600 group-hover:bg-rose-100/70"
          onClick={handleHoldCardClick}
        />
      </div>

      {/* Row 3: Milestone SLA Pipeline connected nodes chart */}
      <Card
        title="Milestone SLA Pipeline"
        sub={`Tingkat ketercapaian SLA milestone per tahap • ${selectedPeriodLabel}`}
        rightElement={
          <span className="inline-flex items-center rounded-lg border border-emerald-150 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
            Target SLA min. {SLA_TARGET_PERCENTAGE}%
          </span>
        }
        padding="p-6 md:p-8"
        className="relative isolate"
      >
        <TipScope
          className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-8 mt-6"
          getTip={(stageName) => {
            const stage = stageSlaSummary.find(
              (item) => item.stage === stageName,
            );
            if (!stage) return null;
            return {
              title: `${stage.stage} · ${selectedPeriodLabel}`,
              rows: [
                { color: "#10B981", label: "Achieved", value: stage.achieved },
                {
                  color: "#EF4444",
                  label: "Not Achieved",
                  value: stage.notAch,
                },
                { label: "Dievaluasi", value: stage.evaluated },
              ],
            };
          }}
        >
          {/* Connecting dotted timeline line overlay */}
          <div className="hidden md:block absolute top-[64px] left-[10%] right-[10%] h-[2px] border-b-2 border-dashed border-gray-200 z-0" />

          {stageSlaSummary.map((stage, idx) => {
            const hasStageEvaluations = stage.evaluated > 0;
            const hasStageData = hasStageEvaluations;
            let borderCol = "#94A3B8";
            if (stage.pct !== null) {
              borderCol = "#EF4444";
              if (stage.pct >= SLA_TARGET_PERCENTAGE) borderCol = "#10B981";
              else if (stage.pct >= 80) borderCol = "#F59E0B";
            }

            const statusLabel = !hasStageData
              ? "Tidak Ada Data"
              : !hasStageEvaluations || stage.pct === null
                ? "Belum Dievaluasi"
                : stage.pct < SLA_TARGET_PERCENTAGE
                  ? "Not Achieved"
                  : "Achieved";
            const statusColor =
              !hasStageEvaluations || stage.pct === null
                ? "text-slate-500"
                : stage.pct < SLA_TARGET_PERCENTAGE
                  ? "text-rose-600"
                  : "text-emerald-600";

            return (
              <div
                key={idx}
                data-tip={stage.stage}
                onClick={() => handleMilestoneClick(stage.stage)}
                className="flex flex-col items-center flex-1 text-center z-10 w-full md:w-auto cursor-pointer group hover:opacity-90 active:scale-98 transition-all"
              >
                {/* Visual Circle gauge */}
                <ProgressCircle
                  pct={stage.pct}
                  color={borderCol}
                  size={128}
                  strokeWidth={12}
                />

                {/* Identifier tag */}
                <span className="text-sm font-bold tracking-wide uppercase text-slate-700 font-display mt-3.5 block group-hover:text-blue-600 transition-colors">
                  {stage.stage}
                </span>

                {/* SLA Stage Status threshold indicator */}
                <span
                  className={`text-xs font-bold tracking-wider uppercase mt-0.5 block ${statusColor}`}
                >
                  {statusLabel}
                </span>

                {/* Subtitle status explanation */}
                <span
                  className={`text-xs font-medium text-slate-500 mt-0.5 font-sans block`}
                >
                  {stage.notAch > 0 ? (
                    <span>
                      <strong className="text-slate-800 font-extrabold">
                        {stage.notAch}
                      </strong>{" "}
                      tidak tercapai
                    </span>
                  ) : stage.evaluated === 0 ? (
                    <span className="text-slate-500 font-semibold">
                      Belum ada data
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">
                      Tercapai sepenuhnya
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </TipScope>
      </Card>

      {/* Monthly Pipeline Trend Card (real Notion data) */}
      <Card
        title="Unified Pipeline Analytics (Dual-Line Chart)"
        sub="Perbandingan intake proyek baru dan realisasi go-live per bulan"
        rightElement={
          <button
            onClick={() => {
              setSelectedIncomingMonth(endMonthNum);
              setModalActiveView("incoming");
              setActiveModal({
                title: "Monthly Pipeline Registry",
                type: "historical_queue",
              });
            }}
            className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-105 border border-blue-150 rounded-xl px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Icon name="ListCollapse" className="w-3.5 h-3.5" />
            <span>Lihat Log Antrean & Intake</span>
          </button>
        }
        padding="p-5 md:p-6"
        className="w-full mt-6"
      >
        <div className="relative w-full overflow-hidden mt-2">
          {/* Main Chart Section (tanpa frame dalam, gaya Monthly Program Cadence) */}
          <div className="w-full">
            {(() => {
              const trendLabels = monthlyPipeline.months.map(
                (m) => MONTH_SHORT_LABELS[m - 1],
              );
              const trace1Values = monthlyPipeline.months.map(
                (m) => monthlyPipeline.liveByMonth[m].length,
              );
              const trace2Values = monthlyPipeline.months.map(
                (m) => monthlyPipeline.intakeByMonth[m].length,
              );
              const yMaxVal =
                Math.max(10, ...trace1Values, ...trace2Values) + 2;
              const tickStep = Math.max(1, Math.ceil(yMaxVal / 5));
              const yTicks: number[] = [];
              for (let t = 0; t <= yMaxVal; t += tickStep) yTicks.push(t);
              const chartWidth = 1200;
              const gridLeft = 54;
              const gridRight = chartWidth - 54;
              const endpointInset = 42;
              const dataLeft = gridLeft + endpointInset;
              const dataRight = gridRight - endpointInset;
              const chartHeight = 250;
              const plotTop = 18;
              const plotBottom = 220;
              const plotHeight = plotBottom - plotTop;
              const xAxisLabelY = 244;
              const pointGap =
                (dataRight - dataLeft) / Math.max(trendLabels.length - 1, 1);

              const linePoints1 = trace1Values.map((v, i) => {
                const x = dataLeft + i * pointGap;
                const y = plotBottom - (v / yMaxVal) * plotHeight;
                return { x, y, value: v, label: trendLabels[i] };
              });

              const linePoints2 = trace2Values.map((v, i) => {
                const x = dataLeft + i * pointGap;
                const y = plotBottom - (v / yMaxVal) * plotHeight;
                return { x, y, value: v, label: trendLabels[i] };
              });

              const getLabelY = (
                point: { y: number },
                otherPoint: { y: number },
                series: "backlog" | "incoming",
              ) => {
                const isClose = Math.abs(point.y - otherPoint.y) < 30;
                const proposed =
                  isClose && series === "backlog" ? point.y + 18 : point.y - 16;
                return Math.max(
                  plotTop - 8,
                  Math.min(plotBottom - 12, proposed),
                );
              };

              // Smooth cubic bezier path (gaya sama dengan chart Monthly
              // Realization di dashboard Learning & Growth) agar garis tidak
              // patah-patah dan proporsi SVG tidak terdistorsi.
              const smoothPath = (pts: { x: number; y: number }[]): string => {
                if (pts.length === 0) return "";
                return pts.slice(1).reduce(
                  (path, next, index) => {
                    const curr = pts[index];
                    const cOff = (next.x - curr.x) / 3;
                    return `${path} C${(curr.x + cOff).toFixed(1)},${curr.y.toFixed(1)} ${(next.x - cOff).toFixed(1)},${next.y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
                  },
                  `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`,
                );
              };

              const lineD1 = smoothPath(linePoints1);
              const areaD1 = `${lineD1} L ${dataRight},${plotBottom} L ${dataLeft},${plotBottom} Z`;

              const lineD2 = smoothPath(linePoints2);
              const areaD2 = `${lineD2} L ${dataRight},${plotBottom} L ${dataLeft},${plotBottom} Z`;

              return (
                <div className="w-full overflow-x-auto">
                  <div className="mb-1 flex min-w-180 items-center justify-end gap-5 pr-2 text-xs font-semibold text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-600 bg-white" />
                      Go-Live Terealisasi
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rotate-90 border-y-5 border-y-transparent border-l-8 border-l-blue-600" />
                      Intake Proyek Baru
                    </span>
                  </div>
                  <TipScope
                    getTip={(key) => {
                      const index = Number(key);
                      const month = monthlyPipeline.months[index];
                      if (!month) return null;
                      return {
                        title: `${MONTH_OPTIONS[month - 1].label} ${selectedYear}`,
                        rows: [
                          {
                            color: "#059669",
                            label: "Go-live terealisasi",
                            value: `${trace1Values[index]} proyek`,
                          },
                          {
                            color: "#2563EB",
                            label: "Intake masuk",
                            value: `${trace2Values[index]} proyek`,
                          },
                        ],
                      };
                    }}
                  >
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="block h-auto w-full min-w-180 select-none"
                    >
                      <defs>
                        <linearGradient
                          id="backlogGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#3B82F6"
                            stopOpacity="0.22"
                          />
                          <stop
                            offset="100%"
                            stopColor="#3B82F6"
                            stopOpacity="0.00"
                          />
                        </linearGradient>
                        <linearGradient
                          id="incomingGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#10B981"
                            stopOpacity="0.22"
                          />
                          <stop
                            offset="100%"
                            stopColor="#10B981"
                            stopOpacity="0.00"
                          />
                        </linearGradient>
                      </defs>

                      {/* Y-Axis Grid Lines and Labels */}
                      {yTicks.map((t) => {
                        const yPos = plotBottom - (t / yMaxVal) * plotHeight;
                        return (
                          <g key={t}>
                            <line
                              x1={gridLeft}
                              x2={gridRight}
                              y1={yPos}
                              y2={yPos}
                              stroke="#E5E7EB"
                              strokeDasharray="3 3"
                              strokeWidth="1"
                            />
                            <text
                              x={gridLeft - 8}
                              y={yPos + 4}
                              textAnchor="end"
                              className="text-[14px] fill-gray-400 font-display font-semibold"
                            >
                              {t}
                            </text>
                          </g>
                        );
                      })}

                      {/* Shaded Areas */}
                      <path
                        d={areaD1}
                        fill="url(#incomingGrad)"
                        className="transition-all duration-300"
                      />
                      <path
                        d={areaD2}
                        fill="url(#backlogGrad)"
                        className="transition-all duration-300"
                      />

                      {/* Line Paths */}
                      <path
                        d={lineD1}
                        fill="none"
                        stroke="#059669"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={lineD2}
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="7 6"
                      />

                      {/* Compact labels are offset when both series are close. */}
                      {linePoints1.map((p, i) => {
                        const labelY = getLabelY(p, linePoints2[i], "backlog");
                        return (
                          <g key={`lbl1-${i}`} className="pointer-events-none">
                            <rect
                              x={p.x - 15}
                              y={labelY - 13}
                              width={30}
                              height={17}
                              rx={3.5}
                              fill="#ECFDF5"
                              fillOpacity="0.95"
                              stroke="#A7F3D0"
                              strokeWidth="1"
                            />
                            <text
                              x={p.x}
                              y={labelY}
                              textAnchor="middle"
                              fontSize="12"
                              fontWeight="700"
                              className="font-display fill-emerald-700"
                            >
                              {p.value}
                            </text>
                          </g>
                        );
                      })}

                      {/* Explicit Data Labels Trace 2 (Blue - New Incoming Intake) */}
                      {linePoints2.map((p, i) => {
                        const labelY = getLabelY(p, linePoints1[i], "incoming");
                        return (
                          <g key={`lbl2-${i}`} className="pointer-events-none">
                            <rect
                              x={p.x - 15}
                              y={labelY - 13}
                              width={30}
                              height={17}
                              rx={3.5}
                              fill="#EFF6FF"
                              fillOpacity="0.95"
                              stroke="#BFDBFE"
                              strokeWidth="1"
                            />
                            <text
                              x={p.x}
                              y={labelY}
                              textAnchor="middle"
                              fontSize="12"
                              fontWeight="700"
                              className="font-display fill-blue-700"
                            >
                              {p.value}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area hover selebar kolom bulan, di bawah titik supaya
                        titik tetap bisa diklik. */}
                      {linePoints1.map((p, i) => (
                        <rect
                          key={`band-${i}`}
                          data-tip={String(i)}
                          x={p.x - pointGap / 2}
                          y={plotTop}
                          width={pointGap}
                          height={plotBottom - plotTop}
                          fill="transparent"
                          onMouseEnter={() => setHoveredIdx(i)}
                          onMouseLeave={() => setHoveredIdx(null)}
                        />
                      ))}

                      {/* Interactive Nodes Trace 1 (Green - Go-Live Realized) */}
                      {linePoints1.map((p, i) => {
                        const isHovered = hoveredIdx === i;
                        return (
                          <g
                            key={`t1-${i}`}
                            data-tip={String(i)}
                            className="cursor-pointer outline-none"
                            role="button"
                            tabIndex={0}
                            aria-label={`${p.label}: go-live terealisasi ${p.value} proyek. Tekan Enter untuk membuka detail.`}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            onFocus={() => setHoveredIdx(i)}
                            onBlur={() => setHoveredIdx(null)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.currentTarget.dispatchEvent(
                                  new MouseEvent("click", { bubbles: true }),
                                );
                              }
                            }}
                            onClick={() => {
                              setSelectedIncomingMonth(
                                monthlyPipeline.months[i],
                              );
                              setModalActiveView("golive");
                              setActiveModal({
                                title: "Monthly Pipeline Registry",
                                type: "historical_queue",
                              });
                            }}
                          >
                            {isHovered && (
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={10}
                                fill="#6EE7B7"
                                opacity="0.4"
                              />
                            )}
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={6}
                              fill="#059669"
                              stroke="#FFFFFF"
                              strokeWidth="1.75"
                            />
                            <circle cx={p.x} cy={p.y} r={2} fill="#FFFFFF" />
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={24}
                              fill="transparent"
                            />
                          </g>
                        );
                      })}

                      {/* Interactive Nodes Trace 2 (Blue - New Incoming Intake) */}
                      {linePoints2.map((p, i) => {
                        const isHovered = hoveredIdx === i;
                        const pPrev = linePoints2[Math.max(0, i - 1)];
                        const pNext =
                          linePoints2[Math.min(linePoints2.length - 1, i + 1)];
                        // `Math.atan2` boleh berbeda pada digit terakhir antara
                        // runtime server dan browser, dan selisih itu memicu
                        // hydration mismatch pada atribut transform. Dibulatkan
                        // seperti geometri chart lain agar kedua sisi identik.
                        const angle = (
                          (Math.atan2(pNext.y - pPrev.y, pNext.x - pPrev.x) *
                            180) /
                          Math.PI
                        ).toFixed(2);
                        return (
                          <g
                            key={`t2-${i}`}
                            data-tip={String(i)}
                            className="cursor-pointer outline-none"
                            role="button"
                            tabIndex={0}
                            aria-label={`${p.label}: intake baru ${p.value} proyek. Tekan Enter untuk membuka detail.`}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            onFocus={() => setHoveredIdx(i)}
                            onBlur={() => setHoveredIdx(null)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.currentTarget.dispatchEvent(
                                  new MouseEvent("click", { bubbles: true }),
                                );
                              }
                            }}
                            onClick={() => {
                              setSelectedIncomingMonth(
                                monthlyPipeline.months[i],
                              );
                              setModalActiveView("incoming");
                              setActiveModal({
                                title: "Monthly Pipeline Registry",
                                type: "historical_queue",
                              });
                            }}
                          >
                            {isHovered && (
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={10}
                                fill="#93C5FD"
                                opacity="0.4"
                              />
                            )}
                            <polygon
                              points={`${p.x + 7},${p.y} ${p.x - 5},${p.y - 6} ${p.x - 5},${p.y + 6}`}
                              fill="#FFFFFF"
                              stroke="#2563EB"
                              strokeWidth={2}
                              strokeLinejoin="round"
                              transform={`rotate(${angle} ${p.x} ${p.y})`}
                              style={{ pointerEvents: "none" }}
                            />
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={24}
                              fill="transparent"
                            />
                          </g>
                        );
                      })}

                      {/* X-Axis Labels */}
                      {linePoints1.map((p, i) => (
                        <text
                          key={i}
                          x={p.x}
                          y={xAxisLabelY}
                          textAnchor={
                            i === 0
                              ? "start"
                              : i === linePoints1.length - 1
                                ? "end"
                                : "middle"
                          }
                          className="text-[15px] font-semibold fill-gray-500 font-display transition-colors cursor-pointer hover:fill-blue-600"
                          onClick={() => {
                            setSelectedIncomingMonth(monthlyPipeline.months[i]);
                            setModalActiveView("incoming");
                            setActiveModal({
                              title: "Monthly Pipeline Registry",
                              type: "historical_queue",
                            });
                          }}
                        >
                          {p.label}
                        </text>
                      ))}

                      {/* Garis bantu bulan yang disorot; isinya tampil di tooltip standar. */}
                      {hoveredIdx !== null && linePoints1[hoveredIdx] && (
                        <line
                          x1={linePoints1[hoveredIdx].x}
                          x2={linePoints1[hoveredIdx].x}
                          y1={plotTop}
                          y2={plotBottom}
                          stroke="#4B5563"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                          opacity="0.4"
                          className="pointer-events-none"
                        />
                      )}
                    </svg>
                  </TipScope>
                </div>
              );
            })()}
          </div>
        </div>
      </Card>

      {/* Row 4: UAT Rescheduled Active Pushback lists (Full Width) */}
      <Card
        title="UAT Rescheduled"
        sub="Monitoring proyek dengan riwayat pergeseran atau penundaan jadwal UAT"
        rightElement={
          <HoverTip
            content={`${uatRescheduled.active} proyek berstatus aktif saat ini dengan reschedule UAT. ${uatRescheduled.total} adalah total keseluruhan riwayat proyek yang pernah mengalami reschedule UAT (termasuk yang sudah selesai/Live).`}
            className="text-xs tabular-nums font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-0.5 select-none cursor-help"
          >
            {uatRescheduled.active} aktif &bull; {uatRescheduled.total} total
            riwayat
          </HoverTip>
        }
        padding="p-5"
        className="w-full flex flex-col justify-between"
      >
        {/* Sub-tabs toggle button: Proyek Aktif vs Semua Riwayat */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-1 mb-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl select-none self-start">
            <button
              type="button"
              onClick={() => setUatRescheduledFilter("active")}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                uatRescheduledFilter === "active"
                  ? "bg-white text-amber-800 shadow-xs border border-amber-200/60"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Proyek Aktif ({uatRescheduled.active})
            </button>
            <button
              type="button"
              onClick={() => setUatRescheduledFilter("all")}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                uatRescheduledFilter === "all"
                  ? "bg-white text-amber-800 shadow-xs border border-amber-200/60"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua Riwayat ({uatRescheduled.total})
            </button>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {uatRescheduledFilter === "active"
              ? "Menampilkan tiket yang saat ini masih dalam proses"
              : "Menampilkan semua proyek termasuk yang sudah Live"}
          </span>
        </div>

        {/* Rows list of reschedule items */}
        {(() => {
          const displayedRescheduledRows =
            uatRescheduledFilter === "all"
              ? (uatRescheduled.allRows ?? uatRescheduled.rows)
              : uatRescheduled.rows;

          return (
            <div className="space-y-3 my-2 flex-grow">
              {displayedRescheduledRows.map((row, idx) => {
                const orig = row.originalProject;
                const isDelayed = orig
                  ? statusGroupOf(orig["Last Status"]) !== "Live" &&
                    statusGroupOf(orig["Last Status"]) !== "Canceled" &&
                    ((orig._lateUAT || 0) > 0 ||
                      (orig["Reschedule UAT"] || 0) > 0)
                  : false;
                const isRowActive = row.isActive ?? true;

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-gray-50/40 border border-gray-100/60 rounded-2xl hover:bg-gray-50 transition-colors duration-150 gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isRowActive
                            ? "bg-amber-500 animate-pulse"
                            : "bg-emerald-500"
                        }`}
                      />
                      <p className="text-[12px] font-bold text-gray-800 select-all flex flex-wrap items-center gap-2 whitespace-normal break-words">
                        <span className="whitespace-normal break-words">
                          {row.name}
                        </span>
                        {isDelayed && (
                          <HoverTip
                            content="Terdeteksi penundaan UAT"
                            className="inline-flex items-center gap-0.5 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 uppercase tracking-wide shrink-0 select-none"
                          >
                            <Icon name="warn" className="w-3 h-3" />
                            Delayed
                          </HoverTip>
                        )}
                        {uatRescheduledFilter === "all" && (
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                              isRowActive
                                ? "text-amber-700 bg-amber-50 border-amber-200/60"
                                : "text-emerald-700 bg-emerald-50 border-emerald-200/60"
                            }`}
                          >
                            {isRowActive ? "Aktif" : "Selesai"}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3.5 self-end sm:self-auto flex-shrink-0">
                      <span
                        className={`text-[10px] font-extrabold uppercase tabular-nums tracking-wider px-2 py-0.5 rounded-md border ${getStatusBadgeClass(
                          row.status,
                        )}`}
                      >
                        {row.status}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-gray-800 bg-gray-100/80 border border-gray-200 rounded-md px-2 py-0.5 text-center whitespace-nowrap">
                        Reschedule {row.count.replace(/×/g, "x")}
                      </span>
                    </div>
                  </div>
                );
              })}
              {displayedRescheduledRows.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400">
                  {uatRescheduledFilter === "active"
                    ? "Tidak ada proyek UAT aktif yang dijadwalkan ulang."
                    : "Tidak ada riwayat proyek dengan reschedule UAT."}
                </div>
              )}
            </div>
          );
        })()}

        {/* Warning Escalation alert - clickable */}
        <div
          onClick={() => {
            setActiveModal({
              title: "Delayed UAT Projects Review",
              type: "uat_delay_audit",
              projects: delayedUATProjects,
            });
          }}
          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl p-3 flex items-center justify-between gap-2.5 mt-3 select-none cursor-pointer hover:shadow-xs transition-all duration-150 group"
        >
          <div className="flex items-center gap-2.5">
            <svg
              className="w-4.5 h-4.5 text-rose-500 flex-shrink-0 animate-pulse"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              <strong className="font-extrabold">
                {delayedUATProjects.length} proyek masih terlambat
              </strong>{" "}
              &mdash; perlu koordinasi dan eskalasi segera dengan tim
              klien/vendor untuk menjaga jadwal.
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-150/50 rounded-lg px-2 py-0.5 transition-colors group-hover:bg-rose-200 select-none flex-shrink-0">
            View Review List
            <ArrowRight aria-hidden="true" className="h-3 w-3" />
          </span>
        </div>
      </Card>

      {/* Section 5: DEV SLA Year-on-Year comparison chart - COMPARATIVE GRID REPAIRED */}
      <Card
        title="DEV SLA Year-on-Year"
        sub="Klik card untuk detail"
        className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200 group relative"
        padding="p-6"
        onClick={handleYoYCardClick}
        rightElement={
          <button className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-100 transition-colors pointer-events-none select-none">
            Lihat Perbandingan{" "}
            <Icon name="chevron" className="w-3.5 h-3.5 animate-pulse" />
          </button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-2">
          {/* Left Side: Comparison bars */}
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full min-w-0">
              <TipScope
                className="relative h-44 flex items-end justify-around border-b border-gray-150 pb-2.5 pt-6 px-12"
                getTip={(year) => {
                  const item = yoySlaOverridden.find(
                    (candidate) => candidate.year === year,
                  );
                  if (!item) return null;
                  return {
                    title: `DEV SLA · ${item.label}`,
                    rows: [
                      {
                        color: item.color,
                        label: "Ketercapaian",
                        value:
                          item.pct === null
                            ? "Belum dievaluasi"
                            : `${item.pct}%`,
                      },
                      { label: "Achieved", value: item.achieved },
                      { label: "Not Achieved", value: item.notAchieved },
                    ],
                  };
                }}
              >
                {/* Score guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none mt-6 pb-2.5 text-[10px] tabular-nums text-gray-400 select-none">
                  <div className="border-b border-dashed border-gray-200 w-full flex justify-between">
                    <span>100% Maksimum</span>
                  </div>
                  <div className="border-b border-dashed border-gray-200 w-full flex justify-between">
                    <span>50% Mid-Point</span>
                  </div>
                  <div className="border-b border-dashed border-gray-200 w-full flex justify-between">
                    <span>0% Base-Level</span>
                  </div>
                </div>

                {yoySlaOverridden.map((item, idx) => (
                  <div
                    key={idx}
                    data-tip={item.year}
                    className="flex flex-col items-center z-10 w-24"
                  >
                    <span className="text-[13px] tabular-nums font-extrabold text-gray-900 mb-2">
                      {item.pct === null ? "Belum dievaluasi" : `${item.pct}%`}
                    </span>
                    <div
                      className="rounded-t-xl w-12 transition-all duration-750 ease-out shadow-xs"
                      style={{
                        height: `${((item.pct ?? 0) / 100) * 110}px`,
                        backgroundColor: item.color,
                      }}
                    />
                    <span className="text-xs font-bold text-gray-500 mt-2.5 font-sans leading-none">
                      {item.label}
                    </span>
                  </div>
                ))}
              </TipScope>
            </div>
          </div>

          {/* Right Side: comparative benchmarking summary table */}
          <div className="space-y-4">
            <div>
              <h4 className="text-[11px] font-bold uppercase text-gray-400 tracking-wider font-display">
                Ringkasan Per Tahun
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {yoySlaOverridden.map((item) => (
                <div
                  key={item.year}
                  className={`p-4 rounded-2xl border ${
                    item.year === String(selectedYear)
                      ? "bg-blue-50/20 border-blue-100"
                      : "bg-amber-50/20 border-amber-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 font-sans uppercase">
                      Tahun {item.label}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md tabular-nums ${
                        item.year === String(selectedYear)
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}
                    >
                      {item.pct === null
                        ? "Belum dievaluasi"
                        : `${item.pct}% SLA`}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs font-sans">
                      <span className="text-gray-400 font-medium">
                        Jumlah data:
                      </span>
                      <strong className="shrink-0 text-gray-800 font-extrabold tabular-nums">
                        {item.evaluatedContributors} proyek
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-gray-400 font-medium">
                        Achieved:
                      </span>
                      <strong className="text-emerald-700 font-extrabold tabular-nums">
                        {item.achieved} proyek
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-gray-400 font-medium">
                        Not Achieved:
                      </span>
                      <strong className="text-rose-600 font-extrabold tabular-nums">
                        {item.notAchieved} proyek
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* RENDER DYNAMIC DRILL-DOWN MODALS - DELAYED UAT PROJECTS AUDIT */}
      {activeModal &&
        activeModal.type === "uat_delay_audit" &&
        (() => {
          const renderChronologicalProgress = (notes: string) => {
            const entries = getChronologicalLogEntries(notes);
            if (entries.length === 0) {
              return <span>{MISSING_DISPLAY_VALUE}</span>;
            }
            return entries.map((entry, index) => (
              <div key={`${index}-${entry}`} className="mb-1.5">
                • {entry}
              </div>
            ));
          };

          return (
            <div
              className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
              {...modalBackdropProps}
            >
              <div className="flex w-full max-w-6xl max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-gray-150 bg-gray-50/55 p-4 select-none sm:items-center sm:p-5">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 font-display">
                      Delayed UAT Projects Review
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      Menampilkan {(activeModal.projects || []).length} proyek
                      UAT aktif yang terlambat atau dijadwalkan ulang dan perlu
                      dieskalasi
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-105 rounded-xl transition-colors cursor-pointer text-sm"
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>

                {/* Structured Table */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                  <div className="overflow-x-auto border border-gray-150 rounded-2xl shadow-xs">
                    <table className="min-w-250 w-full text-left text-xs border-collapse divide-y divide-gray-150">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-[10.5px] text-gray-400 font-bold uppercase tracking-wider font-display select-none">
                          <th className="py-3 px-4">
                            Ticket &amp; Project Name
                          </th>
                          <th className="py-3 px-3">PIC Name</th>
                          <th className="py-3 px-3">Owner Division</th>
                          <th className="py-3 px-3">Owner Name</th>
                          <th className="py-3 px-3">Current Stage Status</th>
                          <th className="py-3 px-3 text-center">
                            UAT Reschedule
                          </th>
                          <th className="py-3 px-3 text-center">
                            Delayed Days
                          </th>
                          <th className="py-3 px-4 w-[35%]">
                            Progress Update Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-105 select-text bg-white">
                        {(activeModal.projects || []).map((p, idx) => {
                          const reschedCount = p["Reschedule UAT"] || 0;
                          const lateDays = p._lateUAT || 0;
                          const progressNotes = toSourceText(
                            p["(UAT) Progress Updated"],
                          );
                          return (
                            <tr
                              key={p.notion_page_id || idx}
                              className="hover:bg-gray-50/40 transition-colors"
                            >
                              <td className="py-3 px-4 font-sans align-top whitespace-normal break-words">
                                <p className="font-bold text-gray-900 text-xs whitespace-normal break-words">
                                  {toDisplayText(p["Project Name"])}
                                </p>
                                <span className="tabular-nums text-[10px] text-gray-400 mt-1 block whitespace-normal break-words">
                                  {toDisplayText(p["Ticket"])}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-sans font-semibold text-gray-750 align-top whitespace-normal break-words">
                                {toDisplayText(
                                  p["PIC Short Name"] || p["PIC Name"],
                                )}
                              </td>
                              <td className="py-3 px-3 text-xs font-medium text-slate-600 align-top whitespace-normal break-words">
                                {toDisplayText(p["Owner Div"])}
                              </td>
                              <td className="py-3 px-3 text-xs font-medium text-slate-600 align-top whitespace-normal break-words">
                                {toDisplayText(p["Owner Name"])}
                              </td>
                              <td className="py-3 px-3 align-top whitespace-normal break-words">
                                <span className="inline-block px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-amber-50 text-amber-700 border border-amber-100 select-none whitespace-normal break-normal">
                                  {toDisplayText(p["Last Status"])}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center tabular-nums font-extrabold text-xs text-gray-950 align-top select-none whitespace-normal break-words">
                                Reschedule {reschedCount}x
                              </td>
                              <td className="py-3 px-3 text-center align-top whitespace-normal break-words select-none">
                                <span
                                  className={`inline-block tabular-nums font-black text-xs px-2 py-0.5 rounded-lg ${lateDays > 0 ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-gray-100 text-gray-600"}`}
                                >
                                  {lateDays} Days
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs font-medium text-gray-650 leading-relaxed align-top whitespace-normal break-words select-text">
                                <div className="whitespace-normal text-xs leading-relaxed text-slate-700 bg-slate-50/55 p-3 rounded-md border border-slate-100 max-h-[150px] overflow-y-auto block">
                                  {renderChronologicalProgress(progressNotes)}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {(activeModal.projects || []).length === 0 && (
                          <tr>
                            <td
                              colSpan={8}
                              className="py-12 text-center text-xs text-gray-400 font-semibold italic"
                            >
                              No delayed UAT projects identified.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-150 flex justify-end bg-gray-50/55 select-none">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Close Review List
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* RENDER DYNAMIC DRILL-DOWN MODALS - USER SATISFACTION FEEDBACK */}
      {activeModal && activeModal.type === "feedback" && (
        <div
          className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          {...modalBackdropProps}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            className="flex w-full max-w-5xl max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-150 bg-gray-50/55 p-4 sm:items-center sm:p-5">
              <div className="min-w-0">
                <h3
                  id="feedback-dialog-title"
                  className="text-base font-extrabold text-gray-900 font-display"
                >
                  {activeModal.title}
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Menampilkan {(activeModal.projects || []).length} proyek
                  (Project Utama dan Enhancement Kecil) dengan tanggal actual
                  go-live pada {actualGoLivePeriodLabel}
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-105 rounded-xl transition-colors cursor-pointer text-sm"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            {/* Top Metadata Summary Header */}
            {(() => {
              const modalScopeData = activeModal.projects || [];
              const countWithFeedback = modalScopeData.filter(
                (project) => calculateProjectAverageScore(project) !== null,
              ).length;

              return (
                <div className="px-6 py-3 bg-gray-50/30 border-b border-gray-150 flex flex-wrap items-center gap-3.5 select-none font-sans">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Ringkasan:
                  </span>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-blue-150 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span>
                      Actual Go-Live {actualGoLivePeriodLabel}:{" "}
                      {modalScopeData.length}
                    </span>
                  </div>
                  <div
                    id="modal-with-feedback-badge"
                    className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-850 border border-emerald-150 rounded-xl px-3 py-1 text-xs font-semibold"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{countWithFeedback} With Feedback</span>
                  </div>
                </div>
              );
            })()}

            {/* Structured Table */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="overflow-x-auto border border-gray-150 rounded-2xl shadow-xs">
                <table className="min-w-180 w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-[10.5px] text-gray-405 font-bold uppercase tracking-wider font-display">
                      <th className="py-3 px-4">Project Name &amp; Ticket</th>
                      <th className="py-3 px-3">PIC Short Name</th>
                      <th className="py-3 px-3">Last Status</th>
                      <th className="py-3 px-3 text-center">Average Score</th>
                      <th className="py-3 px-4 w-[45%]">Feedback Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-105 select-text">
                    {(activeModal.projects || []).map((p, idx) => {
                      const comments = getFeedbackComments(p);
                      const avgScore = calculateProjectAverageScore(p);
                      const scoreDisplay =
                        avgScore === null
                          ? MISSING_DISPLAY_VALUE
                          : avgScore.toFixed(2);
                      return (
                        <tr
                          key={p.notion_page_id || idx}
                          className="hover:bg-gray-50/[15] transition-colors"
                        >
                          <td className="py-4 px-4 font-sans align-top">
                            <p className="font-bold text-gray-800 text-xs">
                              {toDisplayText(p["Project Name"])}
                            </p>
                            <span className="tabular-nums text-[10px] text-gray-400 mt-1 block">
                              {toDisplayText(p["Ticket"])}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-gray-600 font-bold align-top whitespace-nowrap">
                            {toDisplayText(
                              p["PIC Short Name"] || p["PIC Name"],
                            )}
                          </td>
                          <td className="py-4 px-3 align-top whitespace-normal">
                            {(() => {
                              const lastStatusRaw = p["Last Status"] || "";
                              const lastStatusLower = lastStatusRaw
                                .trim()
                                .toLowerCase();
                              let badgeClass =
                                "text-slate-650 bg-slate-50 border-slate-150";

                              if (
                                lastStatusLower.includes("live") ||
                                lastStatusLower.includes("live monitoring")
                              ) {
                                badgeClass =
                                  "text-emerald-750 bg-emerald-50 border-emerald-150";
                              } else if (lastStatusLower.includes("uat")) {
                                badgeClass =
                                  "text-blue-750 bg-blue-50 border-blue-150";
                              } else if (
                                lastStatusLower.includes("change request") ||
                                lastStatusLower.includes("progress")
                              ) {
                                badgeClass =
                                  "text-amber-750 bg-amber-50 border-amber-150";
                              }

                              return (
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tabular-nums border whitespace-nowrap ${badgeClass}`}
                                >
                                  {toDisplayText(lastStatusRaw)}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-4 px-3 text-center align-top">
                            <span
                              className={`inline-block rounded-full border px-2.5 py-0.5 tabular-nums text-[11px] font-extrabold ${
                                avgScore === null
                                  ? "border-gray-105 bg-gray-50 text-gray-400"
                                  : "border-amber-100 bg-amber-50 text-amber-800"
                              }`}
                            >
                              {scoreDisplay}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs text-gray-650 align-top">
                            {avgScore !== null ? (
                              <div className="space-y-2">
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 border border-emerald-150 px-3 py-2 rounded-xl text-[11px] w-full">
                                  <Icon
                                    name="checkcircle"
                                    className="w-3.5 h-3.5 shrink-0"
                                  />
                                  Feedback Form Completed
                                </span>
                                {comments.length > 0 ? (
                                  <div className="space-y-1.5 pl-1">
                                    {comments.map((comment, cIdx) => (
                                      <p
                                        key={cIdx}
                                        className="italic text-gray-600 leading-relaxed bg-gray-50/50 p-2.5 rounded-xl border border-gray-100"
                                      >
                                        &ldquo;{comment}&rdquo;
                                      </p>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-amber-600/90 font-medium italic bg-amber-50/40 border border-amber-105 px-3 py-2 rounded-xl text-[11px] w-full">
                                <Icon
                                  name="warn"
                                  className="w-3.5 h-3.5 shrink-0"
                                />
                                {MISSING_DISPLAY_VALUE}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {(activeModal.projects || []).length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-xs text-gray-400 font-sans italic"
                        >
                          Tidak ada proyek dengan actual go-live pada{" "}
                          {actualGoLivePeriodLabel}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER DYNAMIC DRILL-DOWN MODALS - TOP CONTRIBS */}
      {activeModal &&
        activeModal.type === "contributors" &&
        (() => {
          const modalTitle = activeModal.title || "";
          const isSlaEvaluated = modalTitle === "SLA Evaluated Projects";
          const isGoLive =
            modalTitle === "Go-Live This Period Projects" ||
            modalTitle === "Go-Live This Period";
          const isSlaAccomplished =
            modalTitle === "SLA Accomplished 2026 Projects";
          const isAttention = modalTitle === "Needs Attention Projects";

          const modalProjects = activeModal.projects || [];

          // 1. Dynamic status summary breakdown badges (For Go-live modal next to project count)
          const statusCountsMap: Record<string, number> = {};
          if (isGoLive) {
            modalProjects.forEach((p: SanitizedProject) => {
              const rawVal = p["Last Status"] || "";
              const cleanVal = String(rawVal).trim().toUpperCase();
              if (cleanVal) {
                statusCountsMap[cleanVal] =
                  (statusCountsMap[cleanVal] || 0) + 1;
              }
            });
          }

          const getAttentionDetails = (p: SanitizedProject) => {
            const lateStages = [
              {
                stage: "FSD Late Days",
                days: Math.max(0, toFiniteNumber(p._lateFSD)),
              },
              {
                stage: "DEV Late Days",
                days: Math.max(0, toFiniteNumber(p._lateDev)),
              },
              {
                stage: "SIT Late Days",
                days: Math.max(0, toFiniteNumber(p._lateSIT)),
              },
              {
                stage: "UAT Late Days",
                days: Math.max(0, toFiniteNumber(p._lateUAT)),
              },
              {
                stage: "LIVE Late Days",
                days: Math.max(0, toFiniteNumber(p._lateLive)),
              },
            ].filter(({ days }) => days > 0);
            const totalLateDays = lateStages.reduce(
              (total, { days }) => total + days,
              0,
            );
            const rescheduleCount = Math.max(
              0,
              toFiniteNumber(p["Reschedule UAT"] ?? p._rescheduleUAT),
            );

            return { lateStages, totalLateDays, rescheduleCount };
          };

          const modalMaxWidth =
            isGoLive || isAttention ? "max-w-6xl" : "max-w-5xl";

          return (
            <div
              className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
              {...modalBackdropProps}
            >
              <div
                className={`flex w-full ${modalMaxWidth} max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200`}
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/55">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 font-display">
                      {activeModal.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400 font-medium whitespace-normal">
                        Daftar kontributor data aktif &bull;{" "}
                        {modalProjects.length} proyek ditemukan
                      </p>

                      {/* Unique Status Badges for Go Live modal in header area */}
                      {isGoLive &&
                        Object.entries(statusCountsMap).map(
                          ([statusName, count]) => {
                            let badgeColor =
                              "bg-slate-50 text-slate-800 border-slate-200";
                            const lowerName = statusName.toLowerCase();
                            if (lowerName.includes("live")) {
                              badgeColor =
                                "bg-emerald-50 text-emerald-800 border-emerald-150";
                            } else if (lowerName.includes("uat")) {
                              badgeColor =
                                "bg-blue-50 text-blue-850 border-blue-150";
                            } else if (
                              lowerName.includes("change request") ||
                              lowerName.includes("progress")
                            ) {
                              badgeColor =
                                "bg-amber-50 text-amber-850 border-amber-150";
                            }
                            return (
                              <span
                                key={statusName}
                                className={`inline-flex items-center gap-1 text-[10px] uppercase tabular-nums font-extrabold px-2 py-0.5 rounded-full border whitespace-nowrap ${badgeColor}`}
                              >
                                {statusName}: {count}
                              </span>
                            );
                          },
                        )}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-105 rounded-xl transition-colors cursor-pointer text-sm"
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>

                {/* Informational alert banners */}
                {isSlaEvaluated && (
                  <div
                    id="sla-evaluated-prompt-banner"
                    className="bg-blue-50/70 border border-blue-150 p-4 rounded-xl mx-6 mt-4 flex items-start gap-2.5"
                  >
                    <span className="text-blue-600 mt-0.5 shrink-0">
                      <Icon name="info" className="w-4 h-4" />
                    </span>
                    <div className="text-xs text-blue-800 font-medium leading-relaxed whitespace-normal">
                      Daftar ini menampilkan proyek {selectedPeriodLabel} yang
                      sudah memiliki hasil SLA pada sedikitnya satu tahap.
                    </div>
                  </div>
                )}

                {isSlaAccomplished && (
                  <div
                    id="sla-accomplished-prompt-banner"
                    className="bg-emerald-50/70 border border-emerald-150 p-4 rounded-xl mx-6 mt-4 flex items-start gap-2.5"
                  >
                    <span className="text-emerald-600 mt-0.5 shrink-0">
                      <Icon name="checkcircle" className="w-4 h-4" />
                    </span>
                    <div className="text-xs text-emerald-800 font-medium leading-relaxed whitespace-normal">
                      <strong>Catatan kriteria:</strong> Proyek dalam daftar ini
                      mencapai kondisi delivery ideal dengan memenuhi atau
                      melampaui tolok ukur kecepatan target, serta mencatat 0
                      hari keterlambatan bersih pada gerbang pemeriksaan
                      Development.
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                  <div className="overflow-x-auto rounded-2xl border border-gray-150 shadow-xs">
                    <table
                      className={`w-full text-left text-xs border-collapse ${isAttention ? "min-w-[900px]" : "min-w-[760px]"}`}
                    >
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-[10.5px] text-gray-405 font-bold uppercase tracking-wider font-display">
                          {isGoLive ? (
                            <>
                              <th className="py-3 px-4 w-[12%] whitespace-normal">
                                Ticket
                              </th>
                              <th className="py-3 px-4 w-[23%] min-w-[140px] whitespace-normal">
                                Project Name
                              </th>
                              <th className="py-3 px-3 w-[15%] whitespace-normal">
                                PIC Name
                              </th>
                              <th className="py-3 px-3 w-[15%] whitespace-normal text-center">
                                Planning &amp; Realization
                              </th>
                              <th className="py-3 px-3 w-[15%] whitespace-normal">
                                Live Status
                              </th>
                              <th className="py-3 px-4 w-[20%] whitespace-normal">
                                Live Progress Updates
                              </th>
                            </>
                          ) : isAttention ? (
                            <>
                              <th className="py-3 px-4 w-[11%] whitespace-normal">
                                Ticket
                              </th>
                              <th className="py-3 px-4 w-[27%] min-w-[180px] whitespace-normal">
                                Project Name
                              </th>
                              <th className="py-3 px-3 w-[14%] whitespace-normal">
                                PIC Name
                              </th>
                              <th className="py-3 px-3 w-[13%] whitespace-normal text-center">
                                Last Status
                              </th>
                              <th className="py-3 px-4 w-[35%] min-w-[240px] whitespace-normal text-left">
                                Attention Details
                              </th>
                            </>
                          ) : (
                            <>
                              <th className="py-3 px-4 w-[15%] whitespace-normal">
                                Ticket
                              </th>
                              <th className="py-3 px-4 w-[50%] min-w-[200px] whitespace-normal">
                                Project Name
                              </th>
                              <th className="py-3 px-3 w-[20%] whitespace-normal">
                                PIC Name
                              </th>
                              <th className="py-3 px-3 w-[15%] whitespace-normal text-right">
                                Last Status
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 select-text">
                        {modalProjects.map((p, idx) => {
                          const stampColor = getStatusBadgeClass(
                            p["Last Status"],
                          );

                          if (isGoLive) {
                            return (
                              <tr
                                key={p.notion_page_id || idx}
                                className="hover:bg-gray-50/10 transition-colors"
                              >
                                <td className="py-3 px-4 tabular-nums font-bold text-gray-500 text-[11px] align-top whitespace-normal">
                                  {toDisplayText(p["Ticket"])}
                                </td>
                                <td
                                  className="py-3 px-4 text-gray-800 font-bold whitespace-normal break-words align-top"
                                  style={{ minWidth: "140px" }}
                                >
                                  {p["Project Name"]}
                                </td>
                                <td className="py-3 px-3 text-gray-600 font-semibold align-top whitespace-normal">
                                  {toDisplayText(p["PIC Name"])}
                                </td>
                                <td className="py-3 px-3 align-top whitespace-normal text-center">
                                  <div className="flex flex-col gap-1 items-center justify-center">
                                    {toSourceText(p["(Live) Plan in Week"]) && (
                                      <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 uppercase tabular-nums">
                                        Plan:{" "}
                                        {formatSourceDateForDisplay(
                                          p["(Live) Plan in Week"],
                                        )}
                                      </span>
                                    )}
                                    {toSourceText(
                                      p["(Live) Realized in Date"] ||
                                        p["(Live) Realized in date"],
                                    ) && (
                                      <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-850 border border-emerald-150 uppercase tabular-nums">
                                        Realized:{" "}
                                        {formatSourceDateForDisplay(
                                          p["(Live) Realized in Date"] ||
                                            p["(Live) Realized in date"],
                                        )}
                                      </span>
                                    )}
                                    {!toSourceText(p["(Live) Plan in Week"]) &&
                                      !toSourceText(
                                        p["(Live) Realized in date"],
                                      ) &&
                                      !toSourceText(
                                        p["(Live) Realized in Date"],
                                      ) && (
                                        <span className="text-gray-400 italic text-[11px]">
                                          {MISSING_DISPLAY_VALUE}
                                        </span>
                                      )}
                                  </div>
                                </td>
                                <td className="py-3 px-3 align-top text-[11px] font-semibold text-gray-700 whitespace-normal">
                                  {toDisplayText(p["(Live) Status"])}
                                </td>
                                <td className="py-3 px-4 whitespace-pre-wrap break-words max-w-lg text-[11.5px] leading-relaxed text-gray-650 align-top overflow-y-auto max-h-[140px]">
                                  {formatLogWithNewLines(
                                    p["(Live) Progress Updated"],
                                  )}
                                </td>
                              </tr>
                            );
                          }

                          if (isAttention) {
                            const attentionDetails = getAttentionDetails(p);
                            return (
                              <tr
                                key={p.notion_page_id || idx}
                                className="hover:bg-gray-50/10 transition-colors"
                              >
                                <td className="py-3 px-4 tabular-nums font-bold text-gray-500 text-[11px] align-top whitespace-normal">
                                  {toDisplayText(p["Ticket"])}
                                </td>
                                <td
                                  className="py-3 px-4 text-gray-800 font-bold whitespace-normal break-words align-top"
                                  style={{ minWidth: "180px" }}
                                >
                                  {p["Project Name"]}
                                </td>
                                <td className="py-3 px-3 text-gray-600 font-semibold align-top whitespace-normal">
                                  {toDisplayText(p["PIC Name"])}
                                </td>
                                <td className="py-3 px-3 align-top text-center whitespace-normal">
                                  <span
                                    className={`inline-flex items-center whitespace-nowrap leading-none text-[10px] uppercase tabular-nums font-bold px-2 py-0.5 rounded-full border ${stampColor}`}
                                  >
                                    {toDisplayText(p["Last Status"])}
                                  </span>
                                </td>
                                <td className="py-3 px-4 align-top whitespace-normal">
                                  <div className="w-full min-w-[220px] rounded-xl border border-rose-100 bg-rose-50/30 p-2.5 text-left">
                                    <div className="space-y-1.5">
                                      {attentionDetails.lateStages.map(
                                        ({ stage, days }) => (
                                          <div
                                            key={stage}
                                            className="flex items-center justify-between gap-4 rounded-lg border border-rose-100/80 bg-white px-2.5 py-1.5 text-[11px]"
                                          >
                                            <span className="font-bold text-slate-600">
                                              {stage}
                                            </span>
                                            <strong className="tabular-nums font-extrabold text-rose-700 whitespace-nowrap">
                                              {days} hari
                                            </strong>
                                          </div>
                                        ),
                                      )}
                                      {attentionDetails.rescheduleCount > 1 && (
                                        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-150 bg-amber-50 px-2.5 py-1.5 text-[11px]">
                                          <span className="font-bold text-amber-800">
                                            Reschedule UAT
                                          </span>
                                          <strong className="tabular-nums font-extrabold text-amber-800 whitespace-nowrap">
                                            {attentionDetails.rescheduleCount}x
                                          </strong>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between gap-4 border-t border-rose-150 pt-2 text-[11px] text-slate-700">
                                      <span className="font-extrabold">
                                        Total:
                                      </span>
                                      <strong className="tabular-nums text-xs font-black text-rose-700 whitespace-nowrap">
                                        {attentionDetails.totalLateDays} hari
                                      </strong>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          // Standard SLA Evaluated, SLA Accomplished, or general contributors modal
                          return (
                            <tr
                              key={p.notion_page_id || idx}
                              className="hover:bg-gray-50/10 transition-colors"
                            >
                              <td className="py-3 px-4 tabular-nums font-bold text-gray-500 text-[11px] align-top whitespace-normal">
                                {toDisplayText(p["Ticket"])}
                              </td>
                              <td
                                className="py-3 px-4 text-gray-800 font-bold whitespace-normal break-words align-top"
                                style={{ minWidth: "200px" }}
                              >
                                {p["Project Name"]}
                              </td>
                              <td className="py-3 px-3 text-gray-600 font-semibold align-top whitespace-normal">
                                {toDisplayText(p["PIC Name"])}
                              </td>
                              <td className="py-3 px-3 text-right align-top whitespace-normal">
                                <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                  <span
                                    className={`inline-flex items-center whitespace-nowrap leading-none text-[10px] uppercase tabular-nums font-bold px-2 py-0.5 rounded-full border ${stampColor}`}
                                  >
                                    {toDisplayText(p["Last Status"])}
                                  </span>
                                  {isSlaAccomplished && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/60 border border-emerald-200 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                      <Icon
                                        name="check"
                                        className="w-2.5 h-2.5"
                                      />
                                      ACHIEVED
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {modalProjects.length === 0 && (
                          <tr>
                            <td
                              colSpan={isGoLive ? 6 : isAttention ? 5 : 4}
                              className="py-12 text-center text-xs text-gray-400 font-sans italic"
                            >
                              Tidak ada proyek kontributor yang sesuai dengan
                              kriteria ini pada rentang terpilih.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Tutup Detail
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* RENDER DYNAMIC DRILL-DOWN MODALS - HISTORICAL snapshot queue metadata */}
      {/* RENDER DYNAMIC DRILL-DOWN MODALS - HISTORICAL snapshot queue metadata */}
      {activeModal &&
        activeModal.type === "historical_queue" &&
        (() => {
          const activeMonth = monthlyPipeline.months.includes(
            selectedIncomingMonth,
          )
            ? selectedIncomingMonth
            : (monthlyPipeline.months[monthlyPipeline.months.length - 1] ?? 12);
          const activeMonthLabel = `${MONTH_SHORT_LABELS[activeMonth - 1]} ${selectedYear}`;

          const toRow = (p: SanitizedProject, idx: number) => ({
            id: idx + 1,
            ticket: toSourceText(p["Ticket"]),
            projectName: toSourceText(p["Project Name"]),
            picName: toSourceText(p["PIC Name"]),
            owner: toSourceText(p["Owner Name"]),
            department: toSourceText(p["Owner Div"]),
            createdDate: formatSourceDateForDisplay(
              p["Created time"] ??
                (p as { created_time?: unknown }).created_time ??
                (p.cleansed_data as Record<string, unknown> | undefined)?.[
                  "Created time"
                ],
            ),
          });

          const currentRows = (
            monthlyPipeline.liveByMonth[activeMonth] || []
          ).map(toRow);

          const departmentAggregator: Record<string, number> = {};
          currentRows.forEach((project) => {
            const deptName = project.department.trim().toUpperCase();
            if (deptName) {
              departmentAggregator[deptName] =
                (departmentAggregator[deptName] || 0) + 1;
            }
          });

          const getDeptStyles = (name: string) => {
            const lower = name.toLowerCase();
            if (lower.includes("business process")) {
              return {
                bg: "bg-blue-50/80",
                border: "border-blue-150",
                text: "text-blue-900",
                numText: "text-blue-600",
                icon: "users" as const,
              };
            }
            if (lower.includes("operation")) {
              return {
                bg: "bg-emerald-50/80",
                border: "border-emerald-150",
                text: "text-emerald-900",
                numText: "text-emerald-700",
                icon: "settings" as const,
              };
            }
            if (lower.includes("finance") || lower.includes("accounting")) {
              return {
                bg: "bg-amber-50/80",
                border: "border-amber-150",
                text: "text-amber-900",
                numText: "text-amber-700",
                icon: "percent" as const,
              };
            }
            if (lower.includes("marketing")) {
              return {
                bg: "bg-rose-50/80",
                border: "border-rose-150",
                text: "text-rose-900",
                numText: "text-rose-600",
                icon: "pie" as const,
              };
            }
            if (lower.includes("guarding")) {
              return {
                bg: "bg-sky-50/80",
                border: "border-sky-150",
                text: "text-sky-900",
                numText: "text-sky-600",
                icon: "clock" as const,
              };
            }
            return {
              bg: "bg-slate-50/90",
              border: "border-slate-200",
              text: "text-slate-800",
              numText: "text-slate-600",
              icon: "layers" as const,
            };
          };

          const incomingList = (
            monthlyPipeline.intakeByMonth[activeMonth] || []
          ).map(toRow);

          return (
            <div
              className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
              {...modalBackdropProps}
            >
              <div className="flex h-[80vh] w-[92vw] max-w-7xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/55 select-none hover:shadow-2xs transition-shadow duration-155">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 font-display">
                      {activeModal.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      {modalActiveView === "golive" ? (
                        <>
                          Go-Live Realized &bull; {currentRows.length} projects
                          live in{" "}
                          <span className="font-extrabold text-blue-600 tabular-nums">
                            {activeMonthLabel}
                          </span>
                        </>
                      ) : (
                        <>
                          Incoming Registries &bull; {incomingList.length} new
                          intakes for{" "}
                          <span className="font-extrabold text-emerald-600 tabular-nums">
                            {activeMonthLabel}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Sub-Tabs Selector: months of the active period (real counts) */}
                  <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl self-start md:self-center">
                    {monthlyPipeline.months.map((m) => {
                      const isActive = activeMonth === m;
                      const count =
                        modalActiveView === "golive"
                          ? monthlyPipeline.liveByMonth[m].length
                          : monthlyPipeline.intakeByMonth[m].length;
                      const activeCls =
                        modalActiveView === "golive"
                          ? "bg-white text-blue-700 shadow-xs border border-gray-200/40"
                          : "bg-white text-emerald-700 shadow-xs border border-gray-200/40";
                      return (
                        <button
                          key={m}
                          onClick={() => setSelectedIncomingMonth(m)}
                          className={`px-3 py-1.5 text-xs font-extrabold rounded-lg cursor-pointer transition-all ${
                            isActive
                              ? activeCls
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          {MONTH_SHORT_LABELS[m - 1]} ({count})
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-105 rounded-xl transition-colors cursor-pointer text-sm self-end md:self-center"
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>

                {/* View Selector segmented control tab bar */}
                <div className="flex px-6 pt-3 border-b border-gray-150 gap-6 bg-white select-none">
                  <button
                    onClick={() => setModalActiveView("golive")}
                    className={`pb-3 text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      modalActiveView === "golive"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Icon name="Layers" className="w-3.5 h-3.5" />
                    <span>[Go-Live Realized]</span>
                  </button>
                  <button
                    onClick={() => setModalActiveView("incoming")}
                    className={`pb-3 text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      modalActiveView === "incoming"
                        ? "border-emerald-600 text-emerald-600"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Icon name="Inbox" className="w-3.5 h-3.5" />
                    <span>[New Incoming Projects Registry]</span>
                  </button>
                </div>

                {modalActiveView === "golive" ? (
                  <>
                    {/* Informative description banner */}
                    <div className="bg-slate-50/80 border border-slate-150 p-4 rounded-xl mx-6 mt-4 flex items-start gap-2.5">
                      <span className="text-slate-500 mt-0.5 shrink-0">
                        <Icon name="clipboard" className="w-4 h-4" />
                      </span>
                      <div className="text-xs text-slate-700 font-semibold leading-relaxed whitespace-normal select-text">
                        <strong>Cakupan data go-live:</strong> Tampilan ini
                        mencatat proyek dengan tanggal realisasi live (kolom
                        “(Live) Realized in Date”) pada {activeMonthLabel}.
                      </div>
                    </div>

                    {/* Dynamic Department Summary Cards with High Contrast */}
                    <div className="grid grid-cols-5 gap-2 mx-6 mt-2 select-none">
                      {Object.entries(departmentAggregator)
                        .filter(([, count]) => count > 0)
                        .map(([deptName, count]) => {
                          const styles = getDeptStyles(deptName);
                          return (
                            <div
                              key={deptName}
                              className={`py-1.5 px-3 h-11 rounded-lg border ${styles.border} ${styles.bg} shadow-3xs flex items-center justify-between gap-2 transition-all hover:shadow-2xs min-w-0`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon
                                  name={styles.icon}
                                  className={`w-3.5 h-3.5 ${styles.numText} shrink-0`}
                                />
                                <p
                                  className={`text-[10px] font-bold tracking-tight uppercase truncate ${styles.text}`}
                                >
                                  <HoverTip content={deptName}>
                                    {deptName}
                                  </HoverTip>
                                </p>
                              </div>
                              <div className="shrink-0 flex items-center gap-1">
                                <span
                                  className={`text-xs font-black tabular-nums leading-none ${styles.numText}`}
                                >
                                  {count}
                                </span>
                                <span className="text-[8px] uppercase font-bold text-gray-400 tracking-wide leading-none">
                                  {count === 1 ? "Prj" : "Prjs"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Snapshot Table */}
                    <div className="flex-1 overflow-y-auto overflow-x-auto mt-4 border border-slate-200 rounded-lg mx-6 mb-6 select-text">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-150 text-[10.5px] text-gray-405 font-bold uppercase tracking-wider font-display select-none">
                            <th className="py-3 px-4 w-[10%] text-center">
                              Row ID
                            </th>
                            <th className="py-3 px-4 w-[15%]">Ticket</th>
                            <th className="py-3 px-4 w-[40%] min-w-[200px]">
                              Project Name
                            </th>
                            <th className="py-3 px-3 w-[15%]">PIC Name</th>
                            <th className="py-3 px-3 w-[10%]">Owner</th>
                            <th className="py-3 px-4 w-[10%]">Department</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 select-text">
                          {currentRows.map((r, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50/10 transition-colors"
                            >
                              <td className="py-3 px-4 text-center tabular-nums font-bold text-gray-400">
                                {r.id}
                              </td>
                              <td className="py-3 px-4 tabular-nums font-bold text-gray-600 text-[11px]">
                                {toDisplayText(r.ticket)}
                              </td>
                              <td
                                className="py-3 px-4 text-gray-950 font-bold whitespace-normal break-words"
                                style={{ minWidth: "200px" }}
                              >
                                {toDisplayText(r.projectName)}
                              </td>
                              <td className="py-3 px-3 text-gray-600 font-semibold">
                                {toDisplayText(r.picName)}
                              </td>
                              <td className="py-3 px-3 text-gray-500 font-semibold">
                                {toDisplayText(r.owner)}
                              </td>
                              <td className="py-3 px-4 text-gray-500 font-semibold whitespace-normal break-words">
                                {toDisplayText(r.department)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Informative description banner for incoming intake registry */}
                    <div className="bg-emerald-50/80 border border-emerald-150 p-4 rounded-xl mx-6 mt-4 flex items-start gap-2.5">
                      <span className="text-emerald-500 mt-0.5 shrink-0">
                        <Icon name="clipboard" className="w-4 h-4" />
                      </span>
                      <div className="text-xs text-emerald-800 font-semibold leading-relaxed whitespace-normal select-text">
                        <strong>Cakupan data intake:</strong> Tampilan ini
                        mencatat seluruh intake permintaan sistem baru
                        (berdasarkan tanggal pengajuan tiket) selama{" "}
                        {activeMonthLabel}.
                      </div>
                    </div>

                    {/* Snapshot Table for Incoming Projects */}
                    <div className="flex-1 overflow-y-auto overflow-x-auto mt-4 border border-emerald-200 rounded-lg mx-6 mb-6 select-text">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-emerald-50 border-b border-emerald-150 text-[10.5px] text-emerald-800 font-bold uppercase tracking-wider font-display select-none">
                            <th className="py-3 px-4 w-[6%] text-center">No</th>
                            <th className="py-3 px-4 w-[14%]">Ticket</th>
                            <th className="py-3 px-4 w-[34%] min-w-[200px]">
                              Project Name
                            </th>
                            <th className="py-3 px-3 w-[12%]">PIC Name</th>
                            <th className="py-3 px-3 w-[12%]">Owner</th>
                            <th className="py-3 px-3 w-[12%]">Division</th>
                            <th className="py-3 px-3 w-[10%] text-center">
                              Created Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100 select-text">
                          {incomingList.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-emerald-50/20 transition-colors"
                            >
                              <td className="py-3 px-4 text-center tabular-nums font-bold text-emerald-400">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4 tabular-nums font-bold text-gray-600 text-[11px]">
                                {toDisplayText(item.ticket)}
                              </td>
                              <td
                                className="py-3 px-4 text-gray-900 font-bold whitespace-normal break-words"
                                style={{ minWidth: "200px" }}
                              >
                                {toDisplayText(item.projectName)}
                              </td>
                              <td className="py-3 px-3 text-gray-600 font-semibold whitespace-normal break-words">
                                {toDisplayText(item.picName)}
                              </td>
                              <td className="py-3 px-3 text-gray-500 font-semibold whitespace-normal break-words">
                                {toDisplayText(item.owner)}
                              </td>
                              <td className="py-3 px-3 text-gray-650 font-semibold whitespace-normal break-words">
                                {toDisplayText(item.department)}
                              </td>
                              <td className="py-3 px-3 text-center tabular-nums text-gray-500 font-semibold whitespace-nowrap text-[11px]">
                                {toDisplayText(item.createdDate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Footer */}
                <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Tutup Matriks Proyek
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* RENDER DYNAMIC DRILL-DOWN MODALS - KPI CARDS */}
      {activeModal &&
        activeModal.type === "kpi_card" &&
        activeModal.kpiKey &&
        (() => {
          const key = activeModal.kpiKey;
          let pList: SanitizedProject[] = [];
          let modalSub = "";

          if (key === "queue") {
            pList = queueProjectsPool;
            modalSub = `Menampilkan ${pList.length} proyek berstatus On Queue`;
          } else if (key === "progress") {
            pList = [...cleanInProgressPool].sort(
              (a, b) => getStagePriorityWeight(a) - getStagePriorityWeight(b),
            );
            modalSub = `Menampilkan ${pList.length} proyek aktif dalam siklus pengembangan`;
          } else if (key === "uat") {
            pList = uatProjectsPool;
            modalSub = `Menampilkan ${pList.length} proyek pada tahap UAT dari data terbaru`;
          } else if (key === "monitoring") {
            pList = monitoringProjectsPool;
            modalSub = `Menampilkan ${pList.length} proyek pada tahap monitoring setelah go-live`;
          } else if (key === "hold") {
            pList = holdProjectsPool;
            modalSub = `Menampilkan ${pList.length} proyek dengan Last Status HOLD dari data terbaru`;
          }

          // Breakdown murni dari kolom "Last Status" Notion agar totalnya
          // selalu = jumlah baris di tabel modal.
          let fsdProgressCount = 0;
          let devProgressCount = 0;
          let sitProgressCount = 0;
          let crProgressCount = 0;
          let devEstimationCount = 0;
          let devQueueCount = 0;
          let devOnProgressCount = 0;

          cleanInProgressPool.forEach((item) => {
            const stage = getInProgressStage(item);
            if (stage === "FSD") fsdProgressCount++;
            else if (stage === "DEV") {
              devProgressCount++;
              const norm = normalizeStatus(item["Last Status"]);
              if (norm.includes("estimation")) {
                devEstimationCount++;
              } else if (norm.includes("queue")) {
                devQueueCount++;
              } else {
                devOnProgressCount++;
              }
            } else if (stage === "SIT") sitProgressCount++;
            else if (stage === "CR") crProgressCount++;
          });

          const uatOnQueueCount = uatProjectsPool.filter(
            (project) =>
              normalizeStatus(project["Last Status"]) === "uat on queue",
          ).length;
          const uatOnProgressCount = uatProjectsPool.filter(
            (project) =>
              normalizeStatus(project["Last Status"]) === "uat on progress",
          ).length;

          // Breakdown uses the same exact Last Status values as the Notion view.
          const holdByOwnerList = pList.filter(
            (project) =>
              normalizeStatus(project["Last Status"]) === "hold by owner",
          );
          const holdByClientVendorList = pList.filter(
            (project) =>
              normalizeStatus(project["Last Status"]) ===
              "hold by client/vendor",
          );
          const holdByItList = pList.filter(
            (project) =>
              normalizeStatus(project["Last Status"]) === "hold by it",
          );

          const renderChronologicalProgress = (log: string) => {
            const entries = getChronologicalLogEntries(log);
            if (entries.length === 0) {
              return <span>{MISSING_DISPLAY_VALUE}</span>;
            }
            return entries.map((entry, index) => (
              <div key={`${index}-${entry}`} className="mb-1.5">
                • {entry}
              </div>
            ));
          };

          if (key === "progress") {
            const progressStageChips = [
              ["ALL", "Semua", pList.length],
              ["FSD", "FSD", fsdProgressCount],
              ["DEV", "DEV", devProgressCount],
              ["SIT", "SIT", sitProgressCount],
              ["CR", "Change Request", crProgressCount],
            ] as const;

            const progressKeyword = progressSearch.trim().toLowerCase();
            const visibleProgressList = pList.filter((project) => {
              const stage = getInProgressStage(project);
              if (stage === null) return false;
              if (
                progressStageFilter !== "ALL" &&
                stage !== progressStageFilter
              )
                return false;
              if (
                progressStageFilter === "DEV" &&
                progressDevSubFilter !== "ALL"
              ) {
                const norm = normalizeStatus(project["Last Status"]);
                if (
                  progressDevSubFilter === "ESTIMATION" &&
                  !norm.includes("estimation")
                ) {
                  return false;
                }
                if (
                  progressDevSubFilter === "QUEUE" &&
                  !norm.includes("queue")
                ) {
                  return false;
                }
                if (
                  progressDevSubFilter === "PROGRESS" &&
                  (norm.includes("estimation") || norm.includes("queue"))
                ) {
                  return false;
                }
              }
              if (progressKeyword === "") return true;

              // Pencarian menyapu kolom yang terlihat di baris supaya hasilnya
              // bisa ditelusuri balik oleh PIC tanpa menebak field tersembunyi.
              return [
                project["No Ticket"],
                project["Ticket"],
                project["Project Name"],
                project["Nama Project"],
                project["Owner Div"],
                project["Owner Division"],
                project["Owner Name"],
                project["PIC Short Name"],
                project["PIC Project"],
                project["PIC Name"],
                project["Last Status"],
              ].some((field) =>
                toSourceText(field).toLowerCase().includes(progressKeyword),
              );
            });

            const isProgressFiltered =
              progressStageFilter !== "ALL" ||
              progressDevSubFilter !== "ALL" ||
              progressKeyword !== "";

            return (
              <div
                className="fixed inset-0 z-2000 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
                {...modalBackdropProps}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="progress-dialog-title"
                  className="flex w-full max-w-160 min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200"
                  style={{ maxHeight: "min(640px, 90vh)" }}
                >
                  <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                        <Icon name="play" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3
                          id="progress-dialog-title"
                          className="truncate text-base font-extrabold text-slate-900"
                        >
                          In Progress Projects
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {pList.length} proyek aktif pada tahap FSD, DEV
                          (termasuk Pending Estimation & Antrean), SIT, dan
                          change request
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Tutup detail proyek"
                      onClick={() => setActiveModal(null)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-650 sm:h-8 sm:w-8"
                    >
                      <Icon name="x" className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="shrink-0 space-y-2.5 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 sm:px-6">
                    <div
                      role="group"
                      aria-label="Filter tahap proyek"
                      className="flex items-center gap-2 overflow-x-auto text-[10px] font-bold uppercase tracking-wide text-zinc-500"
                    >
                      {progressStageChips.map(([value, label, count]) => {
                        const isActiveChip = progressStageFilter === value;
                        // Chip kosong tetap tampil tapi mati: PIC perlu tahu
                        // tahapnya memang nihil, bukan chip-nya yang hilang.
                        const isDisabled = count === 0 && value !== "ALL";

                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={isActiveChip}
                            disabled={isDisabled}
                            onClick={() => {
                              setProgressStageFilter(value);
                              if (value !== "DEV") {
                                setProgressDevSubFilter("ALL");
                              }
                            }}
                            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                              isActiveChip
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/60"
                            } ${isDisabled ? "cursor-not-allowed opacity-45 hover:border-slate-200 hover:bg-white" : ""}`}
                          >
                            {label}
                            <strong
                              className={`tabular-nums ${isActiveChip ? "text-white" : "text-blue-700"}`}
                            >
                              {count}
                            </strong>
                          </button>
                        );
                      })}
                    </div>

                    {progressStageFilter === "DEV" && (
                      <div
                        role="group"
                        aria-label="Filter sub-tahap DEV"
                        className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-200/70"
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 select-none">
                          Status DEV:
                        </span>
                        {[
                          {
                            id: "ALL" as const,
                            label: "Semua DEV",
                            count: devProgressCount,
                            pillActive:
                              "border-blue-600 bg-blue-600 text-white shadow-xs",
                            pillInactive:
                              "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/50",
                          },
                          {
                            id: "ESTIMATION" as const,
                            label: "Pending Estimation",
                            count: devEstimationCount,
                            pillActive:
                              "border-indigo-600 bg-indigo-600 text-white shadow-xs",
                            pillInactive:
                              "border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100/60",
                            dotColor: "bg-indigo-500",
                          },
                          {
                            id: "QUEUE" as const,
                            label: "Dev On Queue",
                            count: devQueueCount,
                            pillActive:
                              "border-sky-600 bg-sky-600 text-white shadow-xs",
                            pillInactive:
                              "border-sky-200 bg-sky-50/60 text-sky-700 hover:bg-sky-100/60",
                            dotColor: "bg-sky-400",
                          },
                          {
                            id: "PROGRESS" as const,
                            label: "Dev On Progress",
                            count: devOnProgressCount,
                            pillActive:
                              "border-blue-700 bg-blue-700 text-white shadow-xs",
                            pillInactive:
                              "border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100/60",
                            dotColor: "bg-blue-600",
                          },
                        ].map((sub) => {
                          const isSubActive = progressDevSubFilter === sub.id;
                          const isSubDisabled =
                            sub.count === 0 && sub.id !== "ALL";

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              aria-pressed={isSubActive}
                              disabled={isSubDisabled}
                              onClick={() => setProgressDevSubFilter(sub.id)}
                              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                isSubActive ? sub.pillActive : sub.pillInactive
                              } ${isSubDisabled ? "cursor-not-allowed opacity-45 hover:border-slate-200" : ""}`}
                            >
                              {sub.dotColor && !isSubActive && (
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${sub.dotColor}`}
                                />
                              )}
                              {sub.label}
                              <strong
                                className={`tabular-nums ${isSubActive ? "text-white" : ""}`}
                              >
                                {sub.count}
                              </strong>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <Icon name="search" className="h-3.5 w-3.5" />
                      </span>
                      <input
                        type="search"
                        placeholder="Cari proyek, tiket, divisi, PIC, atau status..."
                        value={progressSearch}
                        onChange={(e) => setProgressSearch(e.target.value)}
                        aria-label="Cari proyek in progress"
                        className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-xs font-medium text-gray-800 shadow-xs outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      {progressSearch !== "" && (
                        <button
                          type="button"
                          onClick={() => setProgressSearch("")}
                          aria-label="Hapus pencarian"
                          className="absolute inset-y-0 right-2 flex w-7 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <Icon name="x" className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-1 sm:px-6">
                    {pList.length === 0 ? (
                      <div className="flex min-h-48 items-center justify-center px-6 text-center text-xs text-slate-400">
                        Tidak ada proyek aktif pada tahap pengembangan.
                      </div>
                    ) : visibleProgressList.length === 0 ? (
                      <div className="flex min-h-48 flex-col items-center justify-center gap-2.5 px-6 text-center text-xs text-slate-400">
                        <span>
                          Tidak ada proyek yang cocok dengan filter atau kata
                          kunci saat ini.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setProgressStageFilter("ALL");
                            setProgressDevSubFilter("ALL");
                            setProgressSearch("");
                          }}
                          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-650 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          Reset filter
                        </button>
                      </div>
                    ) : (
                      <ol className="divide-y divide-zinc-100">
                        {visibleProgressList.map((project, index) => {
                          const stage = getInProgressStage(project);
                          if (stage === null) return null;

                          const ticket = toDisplayText(
                            project["No Ticket"] || project["Ticket"],
                          );
                          const projectName = toDisplayText(
                            project["Project Name"] || project["Nama Project"],
                          );
                          const division = toDisplayText(
                            project["Owner Div"] || project["Owner Division"],
                          );
                          const pic = toDisplayText(
                            project["PIC Short Name"] ||
                              project["PIC Project"] ||
                              project["PIC Name"],
                          );
                          const statusPalette = getStatusPalette(
                            project["Last Status"],
                          );

                          return (
                            <li
                              key={
                                project.notion_page_id || `${ticket}-${index}`
                              }
                              className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-3.5 transition-colors hover:bg-zinc-50 sm:px-3.5"
                            >
                              <span className="text-xs font-medium text-slate-300">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="shrink-0 tabular-nums text-[10px] font-bold text-slate-400">
                                    {ticket}
                                  </span>
                                  <h4 className="truncate text-xs font-bold text-slate-800">
                                    <HoverTip content={projectName}>
                                      {projectName}
                                    </HoverTip>
                                  </h4>
                                </div>
                                <p className="mt-1 truncate text-[10.5px] text-slate-400">
                                  {division} · {pic}
                                </p>
                              </div>
                              <span
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusPalette.pill}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${statusPalette.dot}`}
                                />
                                {toDisplayText(project["Last Status"])}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-4 py-3 sm:px-6">
                    <span className="text-xs text-slate-400">
                      {isProgressFiltered
                        ? `Menampilkan ${visibleProgressList.length} dari ${pList.length} proyek`
                        : `Total ${pList.length} proyek`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
              {...modalBackdropProps}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="kpi-detail-title"
                className="flex w-full max-w-5xl max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200"
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/55">
                  <div>
                    <h3
                      id="kpi-detail-title"
                      className="text-base font-extrabold text-gray-900 font-display"
                    >
                      {activeModal.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      {modalSub}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-105 rounded-xl transition-colors cursor-pointer text-sm"
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>

                {key === "hold" && (
                  <div className="px-6 py-3 bg-slate-50/70 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center select-none">
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                      <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Hold By Owner
                      </span>
                      <strong className="text-base font-extrabold text-slate-700 tabular-nums">
                        {holdByOwnerList.length}
                      </strong>
                    </div>
                    <div className="bg-white border border-blue-100 rounded-xl p-2.5">
                      <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Hold By Client / Vendor
                      </span>
                      <strong className="text-base font-extrabold text-blue-700 tabular-nums">
                        {holdByClientVendorList.length}
                      </strong>
                    </div>
                    <div className="bg-white border border-violet-100 rounded-xl p-2.5">
                      <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Hold By IT
                      </span>
                      <strong className="text-base font-extrabold text-violet-700 tabular-nums">
                        {holdByItList.length}
                      </strong>
                    </div>
                  </div>
                )}

                {key === "uat" && (
                  <div className="px-6 py-3 bg-amber-50/30 border-b border-gray-100 grid grid-cols-2 gap-4 text-center select-none">
                    <div className="bg-white border border-amber-100 rounded-xl p-2.5">
                      <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        UAT On Queue
                      </span>
                      <strong className="text-base font-extrabold text-amber-700 tabular-nums">
                        {uatOnQueueCount}
                      </strong>
                    </div>
                    <div className="bg-white border border-amber-100 rounded-xl p-2.5">
                      <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        UAT On Progress
                      </span>
                      <strong className="text-base font-extrabold text-amber-700 tabular-nums">
                        {uatOnProgressCount}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Main content table area. Scroll viewport dipisah per cabang
                    supaya header tabel bisa dibekukan terhadap viewport yang
                    benar-benar bergulir. */}
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {key === "hold" ? (
                    // HOLD split table view
                    <div className="min-h-0 flex-1 overflow-auto">
                      <div className="space-y-6 px-6 pb-6">
                        {/* Hold by Owner */}
                        {holdByOwnerList.length > 0 && (
                          <div>
                            {/* Jarak ke tabel memakai padding, bukan margin,
                              supaya ikut tertutup latar saat digulir. Tinggi
                              total dikunci (h-13) agar offset thead presisi. */}
                            <div className="sticky top-0 z-30 -mx-6 flex h-13 items-center justify-between bg-white px-6 pb-2 select-none">
                              <h4 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider font-display flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                                Hold by Owner ({holdByOwnerList.length}{" "}
                                Projects)
                              </h4>
                            </div>
                            <div className="border border-gray-150 rounded-2xl overflow-clip shadow-xs">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="[&_th]:sticky [&_th]:top-13 [&_th]:z-20 [&_th]:border-b [&_th]:border-gray-150 [&_th]:bg-gray-50">
                                  <tr className="bg-gray-50 border-b border-gray-150 text-[10px] text-gray-500 font-bold uppercase tracking-wider font-display">
                                    <th className="py-2.5 px-3 text-center w-12">
                                      No
                                    </th>
                                    <th className="py-2.5 px-3">Ticket</th>
                                    <th className="py-2.5 px-3 min-w-[150px]">
                                      Project Name
                                    </th>
                                    <th
                                      className="py-2.5 px-3 text-left min-w-[140px]"
                                      style={{ minWidth: "140px" }}
                                    >
                                      OWNER DIVISION
                                    </th>
                                    <th
                                      className="py-2.5 px-3 text-left min-w-[120px]"
                                      style={{ minWidth: "120px" }}
                                    >
                                      OWNER NAME
                                    </th>
                                    <th className="py-2.5 px-3">PIC Short</th>
                                    <th className="py-2.5 px-3">Last Status</th>
                                    <th className="py-2.5 px-3 text-right">
                                      Target/Realized Date
                                    </th>
                                    <th className="py-2.5 px-3 text-left">
                                      LATEST PHASING LOG
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-101 select-text">
                                  {holdByOwnerList.map((p, idx) => {
                                    const rawStatus = toSourceText(
                                      p["Last Status"],
                                    );
                                    const displayDate =
                                      getProjectDisplayDate(p);

                                    return (
                                      <tr
                                        key={idx}
                                        className="hover:bg-gray-50/55"
                                      >
                                        <td className="py-2.5 px-3 text-center tabular-nums text-[11px] font-bold text-gray-300 align-top">
                                          {idx + 1}
                                        </td>
                                        <td className="py-2.5 px-3 tabular-nums font-bold text-gray-500 align-top">
                                          {toDisplayText(p["Ticket"])}
                                        </td>
                                        <td
                                          className="py-2.5 px-3 font-bold text-gray-800 whitespace-normal break-words align-top"
                                          style={{ minWidth: "150px" }}
                                        >
                                          {toDisplayText(p["Project Name"])}
                                        </td>
                                        <td
                                          className="py-2.5 px-3 text-xs text-slate-600 whitespace-normal break-words align-top text-left min-w-[140px]"
                                          style={{ minWidth: "140px" }}
                                        >
                                          {toDisplayText(
                                            p["Owner Div"] ||
                                              p["Owner Division"],
                                          )}
                                        </td>
                                        <td
                                          className="py-2.5 px-3 text-xs text-slate-600 whitespace-normal break-words align-top text-left min-w-[120px]"
                                          style={{ minWidth: "120px" }}
                                        >
                                          {toDisplayText(p["Owner Name"])}
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-650 align-top">
                                          {toDisplayText(
                                            p["PIC Short Name"] ||
                                              p["PIC Name"],
                                          )}
                                        </td>
                                        <td className="py-2.5 px-3 align-top">
                                          <span className="inline-block text-[9px] uppercase tabular-nums font-bold px-1.5 py-0.5 rounded-md border text-slate-700 bg-slate-100/70 border-slate-200 font-sans">
                                            {toDisplayText(rawStatus)}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right align-top">
                                          <div className="max-h-[96px] overflow-y-auto whitespace-pre-wrap break-words text-xs text-slate-600 font-medium pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm ml-auto text-right">
                                            {displayDate}
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 align-top">
                                          <div className="max-h-[110px] overflow-y-auto whitespace-normal break-words text-[11px] leading-relaxed text-slate-600 pr-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm">
                                            {renderChronologicalProgress(
                                              getGlobalProgressUpdate(p),
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {holdByOwnerList.length === 0 && (
                                    <tr>
                                      <td
                                        colSpan={9}
                                        className="py-6 text-center text-xs text-gray-400 italic"
                                      >
                                        Tidak ada proyek Owner Hold pada rentang
                                        saat ini
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Hold by Client/VENDOR */}
                        {holdByClientVendorList.length > 0 && (
                          <div>
                            <div className="sticky top-0 z-30 -mx-6 flex h-13 items-center justify-between bg-white px-6 pb-2 select-none">
                              <h4 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider font-display flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                Hold by Client / Vendor (
                                {holdByClientVendorList.length} Projects)
                              </h4>
                            </div>
                            <div className="border border-gray-150 rounded-2xl overflow-clip shadow-xs">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="[&_th]:sticky [&_th]:top-13 [&_th]:z-20 [&_th]:border-b [&_th]:border-gray-150 [&_th]:bg-gray-50">
                                  <tr className="bg-gray-50 border-b border-gray-150 text-[10px] text-gray-500 font-bold uppercase tracking-wider font-display">
                                    <th className="py-2.5 px-3 text-center w-12">
                                      No
                                    </th>
                                    <th className="py-2.5 px-3">Ticket</th>
                                    <th className="py-2.5 px-3 min-w-[150px]">
                                      Project Name
                                    </th>
                                    <th
                                      className="py-2.5 px-3 text-left min-w-[140px]"
                                      style={{ minWidth: "140px" }}
                                    >
                                      OWNER DIVISION
                                    </th>
                                    <th
                                      className="py-2.5 px-3 text-left min-w-[120px]"
                                      style={{ minWidth: "120px" }}
                                    >
                                      OWNER NAME
                                    </th>
                                    <th className="py-2.5 px-3">PIC Short</th>
                                    <th className="py-2.5 px-3">Last Status</th>
                                    <th className="py-2.5 px-3 text-right">
                                      Target/Realized Date
                                    </th>
                                    <th className="py-2.5 px-3 text-left">
                                      LATEST PHASING LOG
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-101 select-text">
                                  {holdByClientVendorList.map((p, idx) => {
                                    const rawStatus = toSourceText(
                                      p["Last Status"],
                                    );
                                    const displayDate =
                                      getProjectDisplayDate(p);

                                    return (
                                      <tr
                                        key={idx}
                                        className="hover:bg-gray-50/55"
                                      >
                                        <td className="py-2.5 px-3 text-center tabular-nums text-[11px] font-bold text-gray-300 align-top">
                                          {idx + 1}
                                        </td>
                                        <td className="py-2.5 px-3 tabular-nums font-bold text-gray-500 align-top">
                                          {toDisplayText(p["Ticket"])}
                                        </td>
                                        <td
                                          className="py-2.5 px-3 font-bold text-gray-800 whitespace-normal break-words align-top"
                                          style={{ minWidth: "150px" }}
                                        >
                                          {toDisplayText(p["Project Name"])}
                                        </td>
                                        <td
                                          className="py-2.5 px-3 text-xs text-slate-600 whitespace-normal break-words align-top text-left min-w-[140px]"
                                          style={{ minWidth: "140px" }}
                                        >
                                          {toDisplayText(
                                            p["Owner Div"] ||
                                              p["Owner Division"],
                                          )}
                                        </td>
                                        <td
                                          className="py-2.5 px-3 text-xs text-slate-600 whitespace-normal break-words align-top text-left min-w-[120px]"
                                          style={{ minWidth: "120px" }}
                                        >
                                          {toDisplayText(p["Owner Name"])}
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-650 align-top">
                                          {toDisplayText(
                                            p["PIC Short Name"] ||
                                              p["PIC Name"],
                                          )}
                                        </td>
                                        <td className="py-2.5 px-3 align-top">
                                          <span className="inline-block text-[9px] uppercase tabular-nums font-bold px-1.5 py-0.5 rounded-md border text-blue-700 bg-blue-50/60 border-blue-100 font-sans">
                                            {toDisplayText(rawStatus)}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right align-top">
                                          <div className="max-h-[96px] overflow-y-auto whitespace-pre-wrap break-words text-xs text-slate-600 font-medium pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm ml-auto text-right">
                                            {displayDate}
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 align-top">
                                          <div className="max-h-[110px] overflow-y-auto whitespace-normal break-words text-[11px] leading-relaxed text-slate-600 pr-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm">
                                            {renderChronologicalProgress(
                                              getGlobalProgressUpdate(p),
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {holdByClientVendorList.length === 0 && (
                                    <tr>
                                      <td
                                        colSpan={9}
                                        className="py-6 text-center text-xs text-gray-400 italic"
                                      >
                                        Tidak ada proyek Client/VENDOR Hold pada
                                        rentang saat ini
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {/* Hold by IT */}
                        {holdByItList.length > 0 && (
                          <div>
                            <div className="sticky top-0 z-30 -mx-6 flex h-13 items-center justify-between bg-white px-6 pb-2 select-none">
                              <h4 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider font-display flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                                Hold by IT ({holdByItList.length} Projects)
                              </h4>
                            </div>
                            <div className="border border-gray-150 rounded-2xl overflow-clip shadow-xs">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="[&_th]:sticky [&_th]:top-13 [&_th]:z-20 [&_th]:border-b [&_th]:border-gray-150 [&_th]:bg-gray-50">
                                  <tr className="bg-gray-50 border-b border-gray-150 text-[10px] text-gray-500 font-bold uppercase tracking-wider font-display">
                                    <th className="py-2.5 px-3 text-center w-12">
                                      No
                                    </th>
                                    <th className="py-2.5 px-3">Ticket</th>
                                    <th className="py-2.5 px-3 min-w-[150px]">
                                      Project Name
                                    </th>
                                    <th
                                      className="py-2.5 px-3 text-left min-w-[140px]"
                                      style={{ minWidth: "140px" }}
                                    >
                                      OWNER DIVISION
                                    </th>
                                    <th
                                      className="py-2.5 px-3 text-left min-w-[120px]"
                                      style={{ minWidth: "120px" }}
                                    >
                                      OWNER NAME
                                    </th>
                                    <th className="py-2.5 px-3">PIC Short</th>
                                    <th className="py-2.5 px-3">Last Status</th>
                                    <th className="py-2.5 px-3 text-right">
                                      Target/Realized Date
                                    </th>
                                    <th className="py-2.5 px-3 text-left">
                                      LATEST PHASING LOG
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-101 select-text">
                                  {holdByItList.map((p, idx) => {
                                    const rawStatus = toSourceText(
                                      p["Last Status"],
                                    );
                                    const displayDate =
                                      getProjectDisplayDate(p);

                                    return (
                                      <tr
                                        key={idx}
                                        className="hover:bg-gray-50/55"
                                      >
                                        <td className="py-2.5 px-3 text-center tabular-nums text-[11px] font-bold text-gray-300 align-top">
                                          {idx + 1}
                                        </td>
                                        <td className="py-2.5 px-3 tabular-nums font-bold text-gray-500 align-top">
                                          {toDisplayText(p["Ticket"])}
                                        </td>
                                        <td
                                          className="py-2.5 px-3 font-bold text-gray-800 whitespace-normal break-words align-top"
                                          style={{ minWidth: "150px" }}
                                        >
                                          {toDisplayText(p["Project Name"])}
                                        </td>
                                        <td
                                          className="py-2.5 px-3 text-xs text-slate-600 whitespace-normal break-words align-top text-left min-w-[140px]"
                                          style={{ minWidth: "140px" }}
                                        >
                                          {toDisplayText(
                                            p["Owner Div"] ||
                                              p["Owner Division"],
                                          )}
                                        </td>
                                        <td
                                          className="py-2.5 px-3 text-xs text-slate-600 whitespace-normal break-words align-top text-left min-w-[120px]"
                                          style={{ minWidth: "120px" }}
                                        >
                                          {toDisplayText(p["Owner Name"])}
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-650 align-top">
                                          {toDisplayText(
                                            p["PIC Short Name"] ||
                                              p["PIC Name"],
                                          )}
                                        </td>
                                        <td className="py-2.5 px-3 align-top">
                                          <span className="inline-block text-[9px] uppercase tabular-nums font-bold px-1.5 py-0.5 rounded-md border text-violet-700 bg-violet-50/60 border-violet-100 font-sans">
                                            {toDisplayText(rawStatus)}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right align-top">
                                          <div className="max-h-[96px] overflow-y-auto whitespace-pre-wrap break-words text-xs text-slate-600 font-medium pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm ml-auto text-right">
                                            {displayDate}
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 align-top">
                                          <div className="max-h-[110px] overflow-y-auto whitespace-normal break-words text-[11px] leading-relaxed text-slate-600 pr-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm">
                                            {renderChronologicalProgress(
                                              getGlobalProgressUpdate(p),
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {holdByItList.length === 0 && (
                                    <tr>
                                      <td
                                        colSpan={9}
                                        className="py-6 text-center text-xs text-gray-400 italic"
                                      >
                                        Tidak ada proyek dengan Last Status Hold
                                        By IT pada data terbaru
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : key === "uat" ? (
                    // UAT table view with new columns & formatting
                    <div className="m-6 min-h-0 flex-1 overflow-auto rounded-2xl border border-gray-150 shadow-xs">
                      <table className="w-full min-w-[1120px] text-left text-xs border-collapse">
                        <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:border-b [&_th]:border-gray-150 [&_th]:bg-gray-50">
                          <tr className="bg-gray-50 border-b border-gray-150 text-[10.5px] text-gray-405 font-bold uppercase tracking-wider font-display">
                            <th className="py-3 px-3 text-center w-12">No</th>
                            <th className="py-3 px-3">Ticket</th>
                            <th className="py-3 px-3 min-w-[155px]">
                              Project Name
                            </th>
                            <th
                              className="py-3 px-3 text-left min-w-[140px]"
                              style={{ minWidth: "140px" }}
                            >
                              OWNER DIVISION
                            </th>
                            <th
                              className="py-3 px-3 text-left min-w-[120px]"
                              style={{ minWidth: "120px" }}
                            >
                              OWNER NAME
                            </th>
                            <th className="py-3 px-3">PIC Short</th>
                            <th className="min-w-[130px] py-3 px-3">
                              Last Status
                            </th>
                            <th className="py-3 px-3 text-left min-w-[160px]">
                              Target/Realized Date
                            </th>
                            <th className="py-3 px-3 text-left">
                              LATEST PHASING LOG
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-105 select-text">
                          {pList.map((p, idx) => {
                            const stampColor = getStatusBadgeClass(
                              p["Last Status"],
                            );

                            const ticketText = toSourceText(p["Ticket"]);
                            const projectNameText = toSourceText(
                              p["Project Name"],
                            );
                            const picShortText = toSourceText(
                              p["PIC Short Name"] || p["PIC Name"],
                            );
                            const rawStatus = toSourceText(p["Last Status"]);
                            const displayDate = getProjectDisplayDate(p);

                            return (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50/10 transition-colors"
                              >
                                <td className="py-3 px-3 text-center tabular-nums text-[11px] font-bold text-gray-300 align-top">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-3 tabular-nums font-bold text-gray-500 text-[11px] align-top">
                                  {toDisplayText(ticketText)}
                                </td>
                                <td
                                  className="py-3 px-3 text-gray-800 font-bold whitespace-normal break-words align-top"
                                  style={{ minWidth: "155px" }}
                                >
                                  {toDisplayText(projectNameText)}
                                </td>
                                <td
                                  className="py-3 px-3 text-xs text-slate-600 whitespace-normal break-words align-top text-left min-w-[140px]"
                                  style={{ minWidth: "140px" }}
                                >
                                  {toDisplayText(
                                    p["Owner Div"] || p["Owner Division"],
                                  )}
                                </td>
                                <td
                                  className="py-3 px-3 text-xs text-slate-600 whitespace-normal break-words align-top text-left min-w-[120px]"
                                  style={{ minWidth: "120px" }}
                                >
                                  {toDisplayText(p["Owner Name"])}
                                </td>
                                <td className="py-3 px-3 text-gray-650 align-top">
                                  {toDisplayText(picShortText)}
                                </td>
                                <td className="py-3 px-3 align-top">
                                  <span
                                    className={`inline-flex items-center whitespace-nowrap leading-none text-[10px] uppercase tabular-nums font-bold px-2 py-0.5 rounded-full border ${stampColor} font-sans`}
                                  >
                                    {toDisplayText(rawStatus)}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-xs font-semibold text-slate-600 break-words leading-relaxed text-left min-w-[160px] whitespace-pre-line align-top">
                                  {displayDate}
                                </td>
                                <td className="py-3 px-3 align-top">
                                  <div className="max-h-[110px] overflow-y-auto whitespace-normal break-words text-[11px] leading-relaxed text-slate-600 pr-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm">
                                    {renderChronologicalProgress(
                                      getGlobalProgressUpdate(p),
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {pList.length === 0 && (
                            <tr>
                              <td
                                colSpan={9}
                                className="py-12 text-center text-xs text-gray-400 font-sans italic"
                              >
                                Tidak ada proyek yang sesuai dengan kriteria
                                pada rentang periode terpilih.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    // Unified table view for all other cards
                    <div className="m-6 min-h-0 flex-1 overflow-auto rounded-2xl border border-gray-150 shadow-xs">
                      <table className="w-full min-w-[1120px] text-left text-xs border-collapse">
                        <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:border-b [&_th]:border-gray-150 [&_th]:bg-gray-50">
                          <tr className="bg-gray-50 border-b border-gray-150 text-[10.5px] text-gray-405 font-bold uppercase tracking-wider font-display">
                            <th className="py-3 px-3 text-center w-12">No</th>
                            <th className="py-3 px-3">Ticket</th>
                            <th className="py-3 px-3 min-w-[155px]">
                              Project Name
                            </th>
                            <th
                              className="py-3 px-3 text-left min-w-[140px]"
                              style={{ minWidth: "140px" }}
                            >
                              OWNER DIVISION
                            </th>
                            <th
                              className="py-3 px-3 text-left min-w-[120px]"
                              style={{ minWidth: "120px" }}
                            >
                              OWNER NAME
                            </th>
                            <th className="py-3 px-3">PIC Short</th>
                            <th className="min-w-[130px] py-3 px-3">
                              Last Status
                            </th>
                            <th
                              className={`min-w-[160px] py-3 px-3 ${key === "queue" ? "text-left" : "text-right"}`}
                            >
                              Target/Realized Date
                            </th>
                            <th className="py-3 px-3 text-left">
                              LATEST PHASING LOG
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-105 select-text">
                          {pList.map((p, idx) => {
                            const stampColor = getStatusBadgeClass(
                              p["Last Status"],
                            );

                            const ticketText = toSourceText(p["Ticket"]);
                            const projectNameText = toSourceText(
                              p["Project Name"],
                            );
                            const picShortText = toSourceText(
                              p["PIC Short Name"] || p["PIC Name"],
                            );
                            const rawStatus = toSourceText(p["Last Status"]);
                            const dateNotesText = getProjectDisplayDate(p);

                            return (
                              <tr
                                key={p.notion_page_id || idx}
                                className="hover:bg-gray-50/10 transition-colors"
                              >
                                <td className="py-3 px-3 text-center tabular-nums text-[11px] font-bold text-gray-300 align-top">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-3 tabular-nums font-bold text-gray-500 text-[11px] align-top">
                                  {toDisplayText(ticketText)}
                                </td>
                                <td
                                  className="py-3 px-3 text-gray-800 font-bold whitespace-normal break-words align-top"
                                  style={{ minWidth: "155px" }}
                                >
                                  {toDisplayText(projectNameText)}
                                </td>
                                <td
                                  className="py-3 px-3 text-xs text-slate-600 whitespace-normal break-words align-top text-left min-w-[140px]"
                                  style={{ minWidth: "140px" }}
                                >
                                  {toDisplayText(
                                    p["Owner Div"] || p["Owner Division"],
                                  )}
                                </td>
                                <td
                                  className="py-3 px-3 text-xs text-slate-600 whitespace-normal break-words align-top text-left min-w-[120px]"
                                  style={{ minWidth: "120px" }}
                                >
                                  {toDisplayText(p["Owner Name"])}
                                </td>
                                <td className="py-3 px-3 text-gray-650 align-top">
                                  {toDisplayText(picShortText)}
                                </td>
                                <td className="py-3 px-3 align-top">
                                  <span
                                    className={`inline-flex items-center whitespace-nowrap leading-none text-[10px] uppercase tabular-nums font-bold px-2 py-0.5 rounded-full border ${stampColor} font-sans`}
                                  >
                                    {toDisplayText(rawStatus)}
                                  </span>
                                </td>
                                <td
                                  className={
                                    key === "queue"
                                      ? "py-3 px-3 whitespace-normal break-words text-xs font-medium text-slate-600 max-w-[280px] align-top text-left"
                                      : "py-3 px-3 text-right align-top"
                                  }
                                >
                                  {key === "queue" ? (
                                    dateNotesText
                                  ) : (
                                    <div className="max-h-[96px] overflow-y-auto whitespace-pre-wrap break-words text-xs text-slate-600 font-medium pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm ml-auto text-right">
                                      {dateNotesText}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3 align-top">
                                  <div className="max-h-[110px] overflow-y-auto whitespace-normal break-words text-[11px] leading-relaxed text-slate-600 pr-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm">
                                    {renderChronologicalProgress(
                                      getGlobalProgressUpdate(p),
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {pList.length === 0 && (
                            <tr>
                              <td
                                colSpan={9}
                                className="py-12 text-center text-xs text-gray-400 font-sans italic"
                              >
                                Tidak ada proyek yang sesuai dengan kriteria
                                pada rentang periode terpilih.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Tutup Detail
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* RENDER DYNAMIC DRILL-DOWN MODALS - MILESTONE SLA PIPELINE */}
      {activeModal &&
        activeModal.type === "milestone_sla" &&
        activeModal.stageName &&
        (() => {
          const stageName = activeModal.stageName as SlaStageName;
          const stageSummary = stageSlaSummary.find(
            (summary) => summary.stage === stageName,
          );
          if (!stageSummary) return null;

          const achievedStageList = stageSummary.achievedProjects;
          const missedStageList = stageSummary.notAchievedProjects;

          const totalEvaluated = stageSummary.evaluated;
          const hasData = totalEvaluated > 0;
          const pctAch = stageSummary.pct;
          const rawPctAch = stageSummary.rawPct;

          const statusLabel = !hasData
            ? "Tidak Ada Data"
            : pctAch === null
              ? "Belum Dievaluasi"
              : pctAch < SLA_TARGET_PERCENTAGE
                ? "Not Achieved"
                : "Achieved";
          const badgeColor =
            !hasData || pctAch === null
              ? "text-slate-700 bg-slate-50 border-slate-200"
              : pctAch < SLA_TARGET_PERCENTAGE
                ? "text-rose-700 bg-rose-50 border-rose-100"
                : "text-emerald-700 bg-emerald-50 border-emerald-100";

          return (
            <div
              className="fixed inset-0 z-2000 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
              {...modalBackdropProps}
            >
              <div
                className="flex w-full max-w-7xl min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200"
                style={{ maxHeight: "min(760px, 92vh)" }}
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/55">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 font-display">
                      {activeModal.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      Tahap <strong>{stageSummary.stage}</strong> · tahun{" "}
                      <strong>{selectedPeriodLabel}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-105 rounded-xl transition-colors cursor-pointer text-sm"
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>

                {/* High level summary badge row */}
                <div className="px-6 py-4 bg-slate-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 select-none">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Evaluasi SLA ({selectedPeriodLabel}):
                    </span>
                    <span className="text-sm font-extrabold text-gray-900 tabular-nums bg-white border border-gray-150 rounded-xl px-3 py-1 shadow-2xs">
                      {totalEvaluated} data {stageSummary.yearField} ={" "}
                      {selectedPeriodLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Persentase ({stageSummary.slaField} = Achieved):
                    </span>
                    <span
                      className={`text-sm font-extrabold tabular-nums rounded-xl px-3 py-1 border flex items-center gap-1.5 ${badgeColor}`}
                    >
                      {pctAch === null ? "Belum dievaluasi" : `${pctAch}%`} (
                      {statusLabel})
                    </span>
                  </div>
                </div>

                {/* Main divided table list container. Viewport scroll tidak
                    diberi padding supaya baris tidak lewat di atas header
                    yang dibekukan. */}
                <div className="min-h-0 flex-1 overflow-auto">
                  <div className="space-y-6 px-4 pb-4 sm:px-6 sm:pb-6">
                    {/* 1. NOT ACHIEVED / MISSED LIST */}
                    <div>
                      {/* Judul section dan header tabel sama-sama dibekukan.
                          Jarak ke tabel memakai padding, bukan margin, supaya
                          ikut tertutup latar; margin transparan menyisakan celah
                          tempat baris terlihat menyelinap saat digulir. Tinggi
                          total dikunci (h-13) agar offset thead (top-13) presisi. */}
                      <div className="sticky top-0 z-30 -mx-4 flex h-13 items-center justify-between bg-white px-4 pb-2 select-none sm:-mx-6 sm:px-6">
                        <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider font-display flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          Not Achieved / Missed Stage SLA (
                          {missedStageList.length} Projects)
                        </h4>
                      </div>
                      <div className="border border-rose-100 rounded-2xl overflow-clip shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="[&_th]:sticky [&_th]:top-13 [&_th]:z-20 [&_th]:border-b [&_th]:border-rose-100 [&_th]:bg-rose-50">
                            <tr className="bg-rose-50/50 border-b border-rose-100 text-[10px] text-rose-800 font-bold uppercase tracking-wider font-display">
                              <th className="py-2.5 px-3 text-center w-12">
                                No
                              </th>
                              <th className="py-2.5 px-3">Ticket</th>
                              <th className="py-2.5 px-3">Project Name</th>
                              <th className="py-2.5 px-3">Owner</th>
                              <th className="py-2.5 px-3">Division</th>
                              <th className="py-2.5 px-3 font-display font-bold uppercase tracking-wider">
                                PIC Short
                              </th>
                              <th className="py-2.5 px-3 font-display font-bold uppercase tracking-wider">
                                Last Status
                              </th>
                              <th className="py-2.5 px-3 font-display font-bold uppercase tracking-wider">
                                Target/Realized Date
                              </th>
                              <th className="py-2.5 px-3 font-display font-bold uppercase tracking-wider text-left">
                                LATEST PHASING LOG
                              </th>
                              <th
                                className={`py-2.5 px-3 font-display font-bold uppercase tracking-wider ${["FSD", "DEV", "SIT"].includes(stageName.toUpperCase()) ? "text-left" : "text-right"}`}
                              >
                                {stageName.toUpperCase()} FAILURE REASON
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rose-50 select-text bg-rose-50/[0.08]">
                            {missedStageList.map((p, idx) => {
                              const stg = stageName.toUpperCase();
                              const dateVal = getProjectDisplayDate(p);

                              const reasonFieldsByStage: Record<
                                string,
                                string[]
                              > = {
                                FSD: [
                                  "(FSD) Kategori Alasan Terlambat >=2022",
                                  "(FSD) Deskripsi Terlambat >=2022",
                                ],
                                DEV: [
                                  "(Dev) Kategori Alasan Terlambat >=2022",
                                  "(Dev) Deskripsi Terlambat >=2022",
                                ],
                                SIT: [
                                  "(SIT) Kategori Alasan Terlambat >=2022",
                                  "(SIT) Deskripsi Terlambat >=2022",
                                ],
                                UAT: [
                                  "(UAT) Kategori Alasan Terlambat >=2022",
                                  "(UAT) Deskripsi Terlambat >=2022",
                                ],
                                LIVE: [
                                  "(Live) Kategori Alasan Terlambat >=2022",
                                  "(Live) Deskripsi Terlambat >=2022",
                                ],
                              };
                              const failReason = (
                                reasonFieldsByStage[stg] || []
                              )
                                .map((field) => toSourceText(p[field]))
                                .find(Boolean);

                              return (
                                <tr
                                  key={p.notion_page_id || idx}
                                  className="hover:bg-rose-50/20 transition-colors"
                                >
                                  <td className="py-2.5 px-3 text-center tabular-nums text-[11px] font-bold text-rose-300 align-top">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2.5 px-3 tabular-nums font-bold text-gray-500 text-left whitespace-normal break-words">
                                    {toDisplayText(p["Ticket"])}
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-gray-800 whitespace-normal break-words leading-relaxed">
                                    {toDisplayText(p["Project Name"])}
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-700 font-medium whitespace-normal break-words leading-relaxed">
                                    {toDisplayText(p["Owner Name"])}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-normal break-words leading-relaxed">
                                    <span className="inline-block text-[10px] text-gray-600 bg-gray-50 border border-gray-200/60 px-2 py-0.5 rounded-md font-medium">
                                      {toDisplayText(p["Owner Div"])}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-650 whitespace-normal break-words">
                                    {toDisplayText(
                                      p["PIC Short Name"] || p["PIC Name"],
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex flex-col gap-1 items-start">
                                      <span className="inline-block text-[9px] uppercase tabular-nums font-bold px-1.5 py-0.5 rounded-md border text-rose-700 bg-rose-50/50 border-rose-100 whitespace-normal break-words">
                                        {toDisplayText(p["Last Status"])}
                                      </span>
                                      {/* Custom SLA Alert Badge */}
                                      {stg === "FSD" && (
                                        <span className="inline-block text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md text-white bg-rose-600 border border-rose-700">
                                          not achieved SLA
                                        </span>
                                      )}
                                      {stg === "DEV" && (
                                        <span className="inline-block text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md text-white bg-rose-600 border border-rose-700">
                                          not achieved dev
                                        </span>
                                      )}
                                      {stg === "SIT" && (
                                        <span className="inline-block text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md text-white bg-rose-600 border border-rose-700">
                                          not achieved SLA
                                        </span>
                                      )}
                                      {stg === "UAT" && (
                                        <span className="inline-block text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md text-white bg-rose-600 border border-rose-700">
                                          not achieved SLA
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="max-h-[96px] overflow-y-auto whitespace-pre-wrap break-words text-xs text-slate-600 font-medium pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm">
                                      {dateVal}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 align-top">
                                    <div className="max-h-[96px] overflow-y-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-slate-600 pr-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm">
                                      {getGlobalProgressUpdate(p)}
                                    </div>
                                  </td>
                                  <td
                                    className={`py-2.5 px-3 whitespace-normal break-words leading-relaxed max-w-[280px] ${["FSD", "DEV", "SIT"].includes(stg) ? "text-left" : "text-right"}`}
                                  >
                                    <div className="text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-normal break-words">
                                      {toDisplayText(failReason)}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {missedStageList.length === 0 && (
                              <tr>
                                <td
                                  colSpan={10}
                                  className="py-8 text-center text-xs text-gray-500 font-semibold italic"
                                >
                                  {!hasData
                                    ? "Tidak ada data pasangan hasil/tahun SLA tahap ini."
                                    : rawPctAch === 100
                                      ? "Seluruh data tercatat Achieved."
                                      : "Tidak ada hasil Not Achieved pada tahap ini."}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 2. ACHIEVED LIST */}
                    <div>
                      <div className="sticky top-0 z-30 -mx-4 flex h-13 items-center justify-between bg-white px-4 pb-2 select-none sm:-mx-6 sm:px-6">
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-display flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Achieved Stage SLA ({achievedStageList.length}{" "}
                          Projects)
                        </h4>
                      </div>
                      <div className="border border-emerald-100 rounded-2xl overflow-clip shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="[&_th]:sticky [&_th]:top-13 [&_th]:z-20 [&_th]:border-b [&_th]:border-emerald-100 [&_th]:bg-emerald-50">
                            <tr className="bg-emerald-50/30 border-b border-emerald-100 text-[10px] text-emerald-800 font-bold uppercase tracking-wider font-display">
                              <th className="py-2.5 px-4 text-center w-12">
                                No
                              </th>
                              <th className="py-2.5 px-4">Ticket</th>
                              <th className="py-2.5 px-4">Project Name</th>
                              <th className="py-2.5 px-4">Owner</th>
                              <th className="py-2.5 px-4">Division</th>
                              <th className="py-2.5 px-4 font-display font-bold uppercase tracking-wider">
                                PIC Short
                              </th>
                              <th className="py-2.5 px-4 font-display font-bold uppercase tracking-wider">
                                Last Status
                              </th>
                              <th className="py-2.5 px-4 text-right font-display font-bold uppercase tracking-wider">
                                Target/Realized Date
                              </th>
                              <th className="py-2.5 px-4 text-left font-display font-bold uppercase tracking-wider">
                                LATEST PHASING LOG
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-50 select-text bg-white">
                            {achievedStageList.map((p, idx) => {
                              const dateVal = getProjectDisplayDate(p);

                              return (
                                <tr
                                  key={p.notion_page_id || idx}
                                  className="hover:bg-emerald-50/10 transition-colors"
                                >
                                  <td className="py-2.5 px-4 text-center tabular-nums text-[11px] font-bold text-emerald-300 align-top">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2.5 px-4 tabular-nums font-bold text-gray-500 text-left whitespace-normal break-words">
                                    {toDisplayText(p["Ticket"])}
                                  </td>
                                  <td className="py-2.5 px-4 font-semibold text-gray-800 whitespace-normal break-words leading-relaxed">
                                    {toDisplayText(p["Project Name"])}
                                  </td>
                                  <td className="py-2.5 px-4 text-gray-700 font-medium whitespace-normal break-words leading-relaxed">
                                    {toDisplayText(p["Owner Name"])}
                                  </td>
                                  <td className="py-2.5 px-4 whitespace-normal break-words leading-relaxed">
                                    <span className="inline-block text-[10px] text-gray-600 bg-gray-50 border border-gray-200/60 px-2 py-0.5 rounded-md font-medium">
                                      {toDisplayText(p["Owner Div"])}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-gray-650 whitespace-normal break-words">
                                    {toDisplayText(
                                      p["PIC Short Name"] || p["PIC Name"],
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <span className="inline-block text-[9px] uppercase tabular-nums font-bold px-1.5 py-0.5 rounded-md border text-emerald-700 bg-emerald-50/50 border-emerald-100 whitespace-normal break-words">
                                      {toDisplayText(p["Last Status"])}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right">
                                    <div className="max-h-[96px] overflow-y-auto whitespace-pre-wrap break-words text-xs text-slate-600 font-medium pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm ml-auto text-right">
                                      {dateVal}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-4 align-top">
                                    <div className="max-h-[96px] overflow-y-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-slate-600 pr-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 max-w-sm">
                                      {getGlobalProgressUpdate(p)}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {achievedStageList.length === 0 && (
                              <tr>
                                <td
                                  colSpan={9}
                                  className="py-6 text-center text-xs text-gray-400 italic"
                                >
                                  No achieved projects recorded
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Close Stage View
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* RENDER DYNAMIC DRILL-DOWN MODALS - DEV SLA YEAR ON YEAR COMPARISON */}
      {activeModal &&
        activeModal.type === "yoy_comparison" &&
        (() => {
          const previousYearProjects = [
            ...(previousYearSla?.projects ?? []),
          ].sort((a, b) =>
            String(a["Ticket"] ?? "").localeCompare(String(b["Ticket"] ?? "")),
          );

          const selectedYearProjects = [
            ...(selectedYearSla?.projects ?? []),
          ].sort((a, b) =>
            String(a["Ticket"] ?? "").localeCompare(String(b["Ticket"] ?? "")),
          );

          return (
            <div
              className="fixed inset-0 z-2000 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
              {...modalBackdropProps}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="yoy-comparison-title"
                className="flex w-full max-w-5xl min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200"
                style={{ maxHeight: "min(680px, 90vh)" }}
              >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-6 sm:py-5">
                  <div>
                    <h3
                      id="yoy-comparison-title"
                      className="text-base font-extrabold text-gray-900 font-display"
                    >
                      {activeModal.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    aria-label="Tutup perbandingan"
                    onClick={() => setActiveModal(null)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-650 sm:h-8 sm:w-8"
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>

                {/* Side-by-side comparison columns */}
                <div
                  className={`grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden bg-zinc-50/40 p-4 sm:gap-5 sm:p-5 ${
                    yoySlaOverridden.length > 1
                      ? "lg:grid-cols-2"
                      : "lg:grid-cols-1"
                  }`}
                >
                  {previousYearSla && (
                    <YoySlaColumn
                      year={previousYearSla.label}
                      projects={previousYearProjects}
                      achieved={previousYearSla.achieved}
                      notAchieved={previousYearSla.notAchieved}
                      percentage={previousYearSla.pct}
                      tone="amber"
                    />
                  )}

                  {selectedYearSla && (
                    <YoySlaColumn
                      year={selectedYearSla.label}
                      projects={selectedYearProjects}
                      achieved={selectedYearSla.achieved}
                      notAchieved={selectedYearSla.notAchieved}
                      percentage={selectedYearSla.pct}
                      tone="blue"
                    />
                  )}
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-4 py-3 sm:px-6">
                  <span className="text-xs text-zinc-400">
                    Total{" "}
                    {previousYearProjects.length + selectedYearProjects.length}{" "}
                    proyek ditampilkan
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
