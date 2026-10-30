"use client";

import React, { useCallback, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type { DashboardDataset, RawProject, SanitizedProject } from "../types/types";
import { Card, Icon, Pill } from "./UI";
import { PieChart, GroupedBarChart } from "./Charts";
import { KpiCard, TrendBadge } from "./KpiCard";
import { HoverTip, TipScope } from "./chart-tooltip";

import {
  SLA_STAGE_DEFINITIONS,
  evaluateAllStageSlas,
  evaluateStageSla,
  isEvaluatedInSlaPeriod,
  selectMultiStageFailures,
  type SlaStage,
  type SlaStageEvidence,
} from "../utils/sla-policy";
import { formatPeriodLabel, monthWindowOf } from "../utils/period-filter";
import { getSlaEvaluationPool } from "../utils/project-normalization";
import { useModalDismiss, backdropDismissProps } from "../utils/use-modal-dismiss";

const EMPTY_DISPLAY_VALUES = new Set([
  "\u2014",
  "unknown",
  "belum ada informasi",
]);

function displayOnlyText(...values: unknown[]): string {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    const text = String(value).trim();
    if (!text || EMPTY_DISPLAY_VALUES.has(text.toLowerCase())) continue;

    return text;
  }

  return "Belum diisi";
}

function displaySlaResult(value: unknown): string {
  return value === "Achieved" || value === "Not Achieved"
    ? value
    : "Belum dievaluasi";
}

const SLA_STAGE_LONG_NAMES: Readonly<Record<string, string>> = {
  FSD: "FSD",
  DEV: "Development",
  SIT: "SIT",
  UAT: "UAT",
  LIVE: "Live",
};

function formatShare(value: number, total: number): string {
  return total > 0 ? `${Math.round((value / total) * 100)}%` : "0%";
}

function rootCauseColor(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("planning")) return "#2063F5";
  if (normalized.includes("bug") || normalized.includes("fixing")) {
    return "#F59E0B";
  }
  if (normalized.includes("scope")) return "#06B6D4";
  if (normalized.includes("resource")) return "#10B981";
  if (normalized.includes("vendor")) return "#EC4899";
  return "#64748B";
}

export function buildDevRootCauseData(
  notAchievedProjects: readonly SanitizedProject[],
) {
  const counts: Record<string, number> = {};

  notAchievedProjects.forEach((project) => {
    const sourceCause = project["(Dev) Kategori Alasan Terlambat >=2022"];
    if (sourceCause === null || sourceCause === undefined) return;

    const cause = String(sourceCause).trim();
    if (cause) counts[cause] = (counts[cause] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([label, value]) => ({
      label,
      value,
      color: rootCauseColor(label),
    }))
    .sort((left, right) => right.value - left.value);
}

interface TabSlaProps {
  dataset: DashboardDataset;
  rawProjects?: RawProject[];
  slaProjects?: SanitizedProject[];
  startYear?: number;
  endYear?: number;
  /** Pilihan chip Bulan: "ALL", "3", atau "3-5". */
  month?: string;
  onUploadFile?: (file: File) => void;
}

export function TabSla({
  dataset,
  rawProjects,
  slaProjects,
  startYear = 2026,
  endYear = 2026,
  month = "ALL",
  onUploadFile,
}: TabSlaProps) {
  // SLA charts read the complete database before applying Notion's shared
  // `Type Project: Not Internal IT` rule.
  const masterSlaProjects = useMemo(() => slaProjects ?? [], [slaProjects]);
  // Search filter query
  const [searchQuery, setSearchQuery] = useState("");
  const [delayPage, setDelayPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [drillDownModal, setDrillDownModal] = useState<
    | "avg"
    | "selectedYear"
    | "notAchieved"
    | "multiStage"
    | "yoyPrevious"
    | "yoySelected"
    | null
  >(null);

  const closeDrillDownModal = useCallback(
    () => setDrillDownModal(null),
    [setDrillDownModal],
  );
  useModalDismiss(drillDownModal !== null, closeDrillDownModal);

  const selectedYear = endYear || startYear;
  const previousYear = selectedYear - 1;

  // Filter Bulan mempersempit setiap evaluasi ke bulan Realized Date tahapnya;
  // pembanding YoY memakai rentang bulan yang sama. All Months tetap tahunan.
  const monthWindow = useMemo(() => monthWindowOf(month), [month]);
  const slaPeriod = useMemo(
    () => ({ year: selectedYear, months: monthWindow }),
    [monthWindow, selectedYear],
  );
  const previousSlaPeriod = useMemo(
    () => ({ year: previousYear, months: monthWindow }),
    [monthWindow, previousYear],
  );
  const selectedPeriodLabel = formatPeriodLabel(selectedYear, monthWindow);
  const previousPeriodLabel = formatPeriodLabel(previousYear, monthWindow);
  const devSlaComparisonLabel =
    monthWindow === null ? "DEV SLA Tahunan" : "DEV SLA YoY";

  const slaEvaluationProjects = useMemo(
    () => getSlaEvaluationPool(masterSlaProjects),
    [masterSlaProjects],
  );
  const yoyEvaluationProjects = slaEvaluationProjects;

  const selectedDevEvaluation = useMemo(
    () => evaluateStageSla(slaEvaluationProjects, "DEV", slaPeriod),
    [slaEvaluationProjects, slaPeriod],
  );
  const previousDevEvaluation = useMemo(
    () => evaluateStageSla(yoyEvaluationProjects, "DEV", previousSlaPeriod),
    [previousSlaPeriod, yoyEvaluationProjects],
  );
  const selectedDevYoyEvaluation = useMemo(
    () => evaluateStageSla(yoyEvaluationProjects, "DEV", slaPeriod),
    [slaPeriod, yoyEvaluationProjects],
  );

  const selectedDevContributorProjects =
    selectedDevEvaluation.contributorProjects;
  const previousDevContributorProjects =
    previousDevEvaluation.contributorProjects;
  const selectedDevYoyContributorProjects =
    selectedDevYoyEvaluation.contributorProjects;
  const selectedDevSlaPct =
    selectedDevEvaluation.percentage === null
      ? null
      : Math.round(selectedDevEvaluation.percentage);
  const previousDevSlaPct =
    previousDevEvaluation.percentage === null
      ? null
      : Math.round(previousDevEvaluation.percentage);
  const selectedDevYoySlaPct =
    selectedDevYoyEvaluation.percentage === null
      ? null
      : Math.round(selectedDevYoyEvaluation.percentage);
  const selectedDevNotAchievedProjects =
    selectedDevEvaluation.notAchievedProjects;

  const activeMultiStage = useMemo(
    () =>
      selectMultiStageFailures(slaEvaluationProjects, slaPeriod).map(
        ({ project, failedStages }) => ({
          ...project,
          ticket: displayOnlyText(project["Ticket"]),
          name: displayOnlyText(project["Project Name"]),
          stages: failedStages.map(
            ({ stage }) => [stage, 1] as [string, number],
          ),
          evidence: failedStages,
          year: selectedYear,
          status: displayOnlyText(project["Last Status"]),
          pic: displayOnlyText(project["PIC Short Name"], project["PIC Name"]),
          div: displayOnlyText(project["Owner Div"]),
        }),
      ),
    [selectedYear, slaEvaluationProjects, slaPeriod],
  );

  // Pembanding kartu Multi-Stage: proyek yang punya minimal satu tahap dinilai
  // pada SLA YEAR terpilih. Memakai besar pool mentah akan menyesatkan karena
  // sebagian besar proyek di pool tidak dievaluasi pada tahun tersebut.
  const multiStageScopeCount = useMemo(
    () =>
      slaEvaluationProjects.filter((project) =>
        SLA_STAGE_DEFINITIONS.some((definition) =>
          isEvaluatedInSlaPeriod(project, definition.stage, slaPeriod),
        ),
      ).length,
    [slaEvaluationProjects, slaPeriod],
  );

  const filteredMultiStage = useMemo(() => {
    return searchQuery.trim() === ""
      ? activeMultiStage
      : activeMultiStage.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(p.year).includes(searchQuery),
        );
  }, [activeMultiStage, searchQuery]);

  // Delay stages use the same valid SLA contributor rule as SLA charts.
  const dynamicPhaseDelays = useMemo(() => {
    const stageDelay = (
      project: SanitizedProject,
      stage: SlaStage,
      delay: number | null,
    ): number =>
      isEvaluatedInSlaPeriod(project, stage, slaPeriod) ? delay || 0 : 0;

    return slaEvaluationProjects
      .filter((p) => {
        const fsdLate = stageDelay(p, "FSD", p._lateFSD);
        const devLate = stageDelay(p, "DEV", p._lateDev);
        const sitLate = stageDelay(p, "SIT", p._lateSIT);
        const uatLate = stageDelay(p, "UAT", p._lateUAT);
        const liveLate = stageDelay(p, "LIVE", p._lateLive);
        return fsdLate + devLate + sitLate + uatLate + liveLate > 0;
      })
      .map((p) => {
        const fsdLate = stageDelay(p, "FSD", p._lateFSD);
        const devLate = stageDelay(p, "DEV", p._lateDev);
        const sitLate = stageDelay(p, "SIT", p._lateSIT);
        const uatLate = stageDelay(p, "UAT", p._lateUAT);
        const liveLate = stageDelay(p, "LIVE", p._lateLive);
        const totalDelay = fsdLate + devLate + sitLate + uatLate + liveLate;

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
            const sourceValue = p[reasonFieldByStage[stage]];
            if (sourceValue === null || sourceValue === undefined) return "";

            const value = String(sourceValue);
            return value.trim() ? value : "";
          })
          .filter(Boolean);

        return {
          ticket: displayOnlyText(p["Ticket"]),
          name: displayOnlyText(p["Project Name"]),
          period: displayOnlyText(p["Durasi Project (IT)"], p._period),
          stages,
          reason:
            reasons.length > 0
              ? Array.from(new Set(reasons)).join(" • ")
              : "Belum diisi",
          days: totalDelay,
          status: displayOnlyText(p["Last Status"]),
          pic: displayOnlyText(p["PIC Short Name"], p["PIC Name"]),
          div: displayOnlyText(p["Owner Div"]),
        };
      })
      .sort((a, b) => b.days - a.days)
      .map((item, idx) => ({
        no: idx + 1,
        ...item,
      }));
  }, [slaEvaluationProjects, slaPeriod]);

  const filteredPhaseDelays = useMemo(() => {
    return searchQuery.trim() === ""
      ? dynamicPhaseDelays
      : dynamicPhaseDelays.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.ticket.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.reason.toLowerCase().includes(searchQuery.toLowerCase()),
        );
  }, [dynamicPhaseDelays, searchQuery]);

  // SLA Phase Delay Tracker Pagination
  const pageSize = 5;
  const totalDelayPages = Math.max(
    Math.ceil(filteredPhaseDelays.length / pageSize),
    1,
  );
  const paginatedPhaseDelays = useMemo(() => {
    const sIdx = (delayPage - 1) * pageSize;
    return filteredPhaseDelays.slice(sIdx, sIdx + pageSize);
  }, [filteredPhaseDelays, delayPage]);

  // Recalculate average delay count from active delays table
  const totalDelayedCount = filteredPhaseDelays.length;
  const avgDelayCount =
    totalDelayedCount > 0
      ? Math.round(
          filteredPhaseDelays.reduce((acc, p) => acc + p.days, 0) /
            totalDelayedCount,
        )
      : 0;

  const dynamicSlaStageSummary = useMemo(
    () =>
      evaluateAllStageSlas(slaEvaluationProjects, slaPeriod).map(
        (evaluation) => ({
          ...evaluation,
          pct:
            evaluation.percentage === null
              ? null
              : Math.round(evaluation.percentage),
        }),
      ),
    [slaEvaluationProjects, slaPeriod],
  );

  // Root-cause counts use the exact DEV Not Achieved project set shown by the
  // selected-year SLA summary. Each failed project contributes once.
  const dynamicRootCause = useMemo(
    () => buildDevRootCauseData(selectedDevNotAchievedProjects),
    [selectedDevNotAchievedProjects],
  );

  // YoY compares full business contributors by authoritative DEV SLA YEAR.
  const yoyCompareData = useMemo(
    () =>
      [
        {
          year: String(previousYear),
          label: `DEV SLA · ${previousPeriodLabel}`,
          achieved: previousDevEvaluation.achieved,
          not: previousDevEvaluation.notAchieved,
          projects: previousDevContributorProjects,
        },
        {
          year: String(selectedYear),
          label: `DEV SLA · ${selectedPeriodLabel}`,
          achieved: selectedDevYoyEvaluation.achieved,
          not: selectedDevYoyEvaluation.notAchieved,
          projects: selectedDevYoyContributorProjects,
        },
      ].filter((item) => item.projects.length > 0),
    [
      previousDevContributorProjects,
      previousDevEvaluation.achieved,
      previousDevEvaluation.notAchieved,
      previousPeriodLabel,
      previousYear,
      selectedDevYoyContributorProjects,
      selectedDevYoyEvaluation.achieved,
      selectedDevYoyEvaluation.notAchieved,
      selectedPeriodLabel,
      selectedYear,
    ],
  );

  // File Download Handler
  const handleDownloadJSON = () => {
    if (!rawProjects) return;
    const sourceRows = rawProjects.map(
      (project) => project.cleansed_data ?? project,
    );
    const blob = new Blob([JSON.stringify(sourceRows, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ADV_SLA_Database_${dataset.report.date.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const devSlaYoYDelta =
    selectedDevYoySlaPct === null || previousDevSlaPct === null
      ? null
      : Math.round((selectedDevYoySlaPct - previousDevSlaPct) * 100) / 100;
  const devSlaYoYSign =
    devSlaYoYDelta !== null && devSlaYoYDelta >= 0 ? "+" : "";

  // Share of DEV contributors that missed the SLA, used by the Not Achieved card.
  const devNotAchievedShare =
    selectedDevEvaluation.contributors === 0
      ? null
      : Math.round(
          (selectedDevNotAchievedProjects.length /
            selectedDevEvaluation.contributors) *
            1000,
        ) / 10;

  // Worst project in the multi-stage list: how many stages it missed at once.
  const multiStageWorstCount = activeMultiStage.reduce(
    (worst, project) => Math.max(worst, project.evidence.length),
    0,
  );

  // Dynamic Pop-up Modal selector data helper
  const getModalProjects = () => {
    switch (drillDownModal) {
      case "avg":
        return selectedDevContributorProjects;
      case "selectedYear":
      case "yoySelected":
        return selectedDevYoyContributorProjects;
      case "notAchieved":
        return selectedDevNotAchievedProjects;
      case "multiStage":
        return activeMultiStage;
      case "yoyPrevious":
        return previousDevContributorProjects;
      default:
        return [];
    }
  };

  const isAnnualDevSlaModal =
    drillDownModal === "selectedYear" ||
    drillDownModal === "yoyPrevious" ||
    drillDownModal === "yoySelected";
  const isDevContributorModal = drillDownModal === "avg" || isAnnualDevSlaModal;
  const modalPeriodLabel =
    drillDownModal === "yoyPrevious"
      ? previousPeriodLabel
      : selectedPeriodLabel;

  const modalList = getModalProjects().map((project) => {
    const row = project as Record<string, unknown>;
    const stages = Array.isArray(row.stages)
      ? (row.stages as [string, number][])
      : [];
    const evidence = Array.isArray(row.evidence)
      ? (row.evidence as SlaStageEvidence[])
      : [];
    return {
      key: String(row.notion_page_id ?? row.ticket ?? row.Ticket ?? ""),
      ticket: displayOnlyText(row.Ticket, row.ticket),
      name: displayOnlyText(row["Project Name"], row.name),
      division: displayOnlyText(row["Owner Div"], row.div),
      pic: displayOnlyText(row["PIC Short Name"], row["PIC Name"], row.pic),
      period: displayOnlyText(row.Period, row.period, row.year),
      stages,
      evidence,
      devSla: displaySlaResult(row["DEV SLA"]),
      milestone: displayOnlyText(row.Milestone, row.status),
    };
  });
  const modalEmptyMessage = isDevContributorModal
    ? `Tidak ada data DEV SLA pada ${modalPeriodLabel}.`
    : drillDownModal === "notAchieved"
      ? selectedDevEvaluation.contributors === 0
        ? "Tidak ada data DEV SLA yang dinilai."
        : "Tidak ada proyek dengan DEV SLA Not Achieved."
      : "Tidak ada data untuk ditampilkan.";

  return (
    <div className="space-y-6">
      {/* Dynamic Header Block of SLA View */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-xl font-extrabold font-display text-gray-900 tracking-tight">
            Analisis Performansi SLA
          </h1>
          <p className="text-xs text-gray-400 font-medium font-sans mt-1.5 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Weekly Report Periode {dataset.report.date}
          </p>
        </div>

        {/* Dataset action controllers */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Action Controllers */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0] && onUploadFile) {
                  onUploadFile(e.target.files[0]);
                }
              }}
              accept=".json"
              className="hidden"
            />
            <HoverTip content="Unggah File JSON Kustom" className="inline-flex">
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Unggah File JSON Kustom"
                className="p-2.5 h-9.5 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl flex items-center justify-center cursor-pointer transition-colors hover:shadow-xs shadow-xs"
              >
                <Icon name="upload" className="w-4 h-4" />
              </button>
            </HoverTip>
            <HoverTip content="Unduh Data SLA Business" className="inline-flex">
              <button
                onClick={handleDownloadJSON}
                disabled={!rawProjects?.length}
                aria-label="Unduh Data SLA Business"
                className="p-2.5 h-9.5 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl flex items-center justify-center cursor-pointer transition-colors hover:shadow-xs shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon name="download" className="w-4 h-4" />
              </button>
            </HoverTip>
          </div>
        </div>
      </div>

      {/* 4 Professional KPI Row Cards (All Clickable, uniform height and typography) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
        {/* KPI 1: selected-period DEV SLA */}
        <KpiCard
          accent="blue"
          icon="clock"
          onClick={() => setDrillDownModal("avg")}
          value={
            selectedDevSlaPct === null
              ? "Belum dievaluasi"
              : `${selectedDevSlaPct}%`
          }
          badge={
            selectedDevEvaluation.contributors === 0 ? undefined : (
              <TrendBadge
                direction={selectedDevEvaluation.achieved === 0 ? null : true}
                tone={selectedDevEvaluation.achieved === 0 ? "neutral" : "good"}
                text={`${selectedDevEvaluation.achieved} Achieved`}
                title={`${selectedDevEvaluation.achieved} dari ${selectedDevEvaluation.contributors} data DEV bernilai Achieved`}
              />
            )
          }
          label="Rata-rata DEV SLA"
          hint={
            selectedDevEvaluation.contributors === 0
              ? "Belum dievaluasi"
              : `${selectedDevEvaluation.contributors} proyek dievaluasi`
          }
        />

        {/* KPI 2: annual DEV SLA for the selected SLA year */}
        <KpiCard
          accent="emerald"
          icon="activity"
          onClick={() => setDrillDownModal("selectedYear")}
          value={
            selectedDevYoySlaPct === null
              ? "Belum dievaluasi"
              : `${selectedDevYoySlaPct}%`
          }
          badge={
            devSlaYoYDelta === null ? undefined : (
              <TrendBadge
                direction={devSlaYoYDelta === 0 ? null : devSlaYoYDelta > 0}
                tone={
                  devSlaYoYDelta === 0
                    ? "neutral"
                    : devSlaYoYDelta > 0
                      ? "good"
                      : "bad"
                }
                text={`${devSlaYoYSign}${devSlaYoYDelta}% YoY`}
                title={`${selectedPeriodLabel}: ${selectedDevYoySlaPct}% vs ${previousPeriodLabel}: ${previousDevSlaPct}%`}
              />
            )
          }
          label={devSlaComparisonLabel}
          hint={`${selectedDevYoyEvaluation.contributors} proyek dievaluasi`}
          footnote={
            previousDevSlaPct !== null ? (
              <>
                Dibanding {previousPeriodLabel}:{" "}
                <span className="font-bold text-gray-600">
                  {previousDevSlaPct}%
                </span>
              </>
            ) : undefined
          }
        />

        {/* KPI 3: Total SLA Not Achieved */}
        <KpiCard
          accent="rose"
          icon="warn"
          onClick={() => setDrillDownModal("notAchieved")}
          value={
            selectedDevEvaluation.contributors === 0
              ? "Belum dievaluasi"
              : selectedDevNotAchievedProjects.length
          }
          badge={
            devNotAchievedShare === null ? undefined : (
              <TrendBadge
                direction={devNotAchievedShare === 0 ? null : false}
                tone={devNotAchievedShare === 0 ? "good" : "bad"}
                text={`${devNotAchievedShare}% dari total`}
                title={`${selectedDevNotAchievedProjects.length} dari ${selectedDevEvaluation.contributors} data DEV bernilai Not Achieved`}
              />
            )
          }
          label="DEV Not Achieved"
          hint={
            selectedDevEvaluation.contributors === 0
              ? "Belum dievaluasi"
              : `${selectedDevEvaluation.contributors} proyek dievaluasi`
          }
        />

        {/* KPI 4: Multi-Stage Failures */}
        <KpiCard
          accent="amber"
          icon="layers"
          onClick={() => setDrillDownModal("multiStage")}
          value={activeMultiStage.length}
          badge={
            <TrendBadge
              direction={activeMultiStage.length === 0 ? null : false}
              tone={activeMultiStage.length === 0 ? "good" : "bad"}
              text={`${activeMultiStage.length} dari ${multiStageScopeCount} proyek`}
              title={`${activeMultiStage.length} dari ${multiStageScopeCount} proyek yang punya tahap dinilai`}
            />
          }
          label="Multi-Stage SLA"
          hint={`${multiStageScopeCount} proyek dievaluasi`}
          footnote={
            activeMultiStage.length === 0
              ? "Dihitung dari 5 tahap: FSD, DEV, SIT, UAT, LIVE"
              : `Terparah: ${multiStageWorstCount} dari 5 tahap Not Achieved`
          }
        />
      </div>

      {/* Main Grid: Achievement Progress & Root Causes Delay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SLA Stage Performance Horizontal bars Row Card (Left - Fully linked to dynamic Month range) */}
        <div className="lg:col-span-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card
            title="SLA Stage Performance"
            sub="Ketercapaian SLA setiap tahap"
            padding="p-6"
            className="h-full"
          >
            <TipScope
              className="flex flex-col justify-space-around h-full space-y-4"
              getTip={(stage) => {
                const summary = dynamicSlaStageSummary.find(
                  (item) => item.stage === stage,
                );
                if (!summary) return null;
                return {
                  title: SLA_STAGE_LONG_NAMES[summary.stage] ?? summary.stage,
                  rows: [
                    {
                      color: "#10B981",
                      label: "Achieved",
                      value: summary.achieved,
                    },
                    {
                      color: "#EF4444",
                      label: "Not Achieved",
                      value: summary.notAchieved,
                    },
                    { label: "Dievaluasi", value: summary.contributors },
                  ],
                };
              }}
            >
              {dynamicSlaStageSummary.map((s, idx) => {
                const longName = SLA_STAGE_LONG_NAMES[s.stage] || s.stage;
                const isGreenBar = s.stage === "UAT" || s.stage === "LIVE";

                return (
                  <div
                    key={idx}
                    data-tip={s.stage}
                    className="flex items-center justify-between gap-4 select-none"
                  >
                    {/* Stage Label */}
                    <span className="w-24 text-[13px] font-bold text-gray-500 font-sans">
                      {longName}
                    </span>
                    {/* Progress Bar Container */}
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${s.pct ?? 0}%`,
                          backgroundColor: isGreenBar ? "#10B981" : "#2563EB",
                        }}
                      />
                    </div>
                    {/* Percent Text */}
                    <span className="w-40 text-right text-[12px] font-bold text-gray-900 tabular-nums">
                      {s.pct === null ? "Belum dievaluasi" : `${s.pct}%`}
                      <span className="block mt-0.5 text-[9px] font-medium text-gray-500 font-sans">
                        {s.yearField}: {s.contributors} data
                      </span>
                    </span>
                  </div>
                );
              })}
            </TipScope>
          </Card>
        </div>

        {/* Delay Root Cause Card with solid clean Pie Chart (Right - Fully dynamic & responsive) */}
        <div className="lg:col-span-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card
            title="Delay Root Cause (Faktor Utama)"
            sub="Kategori alasan keterlambatan tahap Dev"
            padding="p-6"
            className="h-full"
          >
            <TipScope
              className="flex flex-col sm:flex-row items-center gap-6 justify-center h-full"
              getTip={(label) => {
                const cause = dynamicRootCause.find(
                  (item) => item.label === label,
                );
                if (!cause) return null;
                const total = dynamicRootCause.reduce(
                  (sum, item) => sum + item.value,
                  0,
                );
                return {
                  title: cause.label,
                  rows: [
                    { color: cause.color, label: "Proyek", value: cause.value },
                    { label: "Porsi", value: formatShare(cause.value, total) },
                  ],
                };
              }}
            >
              {/* Pie Chart Display Area */}
              <div className="flex-shrink-0">
                <PieChart segments={dynamicRootCause} size={150} />
              </div>

              {/* Legend with absolute numbers & percentage shares */}
              <div className="space-y-2.5 flex-1 w-full select-none divide-y divide-gray-50/50">
                {dynamicRootCause.map((rc, idx) => {
                  const totalCauseSum = dynamicRootCause.reduce(
                    (s, p) => s + p.value,
                    0,
                  );

                  return (
                    <div
                      key={idx}
                      data-tip={rc.label}
                      className="flex items-center justify-between text-xs pt-2.5 first:pt-0"
                    >
                      {/* Left: Indicator circle + label */}
                      <span className="flex items-center gap-2 font-bold text-gray-500 truncate max-w-[140px]">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: rc.color }}
                        />
                        {rc.label}
                      </span>
                      {/* Right: absolute count (percentage percent) */}
                      <div className="flex items-baseline gap-1.5 flex-shrink-0">
                        <strong className="text-gray-900 font-extrabold font-sans text-xs">
                          {rc.value}
                        </strong>
                        <span className="text-[10px] text-gray-400 font-semibold tabular-nums">
                          (
                          {totalCauseSum > 0
                            ? Math.round((rc.value / totalCauseSum) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                    </div>
                  );
                })}
                {dynamicRootCause.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-400 font-sans">
                    Tidak ada catatan deviasi DEV untuk periode terpilih.
                  </div>
                )}
              </div>
            </TipScope>
          </Card>
        </div>
      </div>

      {/* Annual comparison is driven only by the authoritative DEV SLA YEAR. */}
      <Card title="DEV SLA Annual YoY Analysis" padding="p-6">
        <div className="space-y-4">
          {/* Padding mengikuti padL/padR GroupedBarChart (48/28 dari viewBox
              1000) supaya tiap kolom jatuh tepat di atas grup batangnya. */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 py-3 pl-[4.8%] pr-[2.8%] text-[10.5px] font-sans">
            <div className="grid gap-2 sm:grid-cols-2">
              {previousDevSlaPct !== null && (
                <div className="sm:col-start-1 sm:text-center">
                  <p className="font-bold text-gray-700">
                    DEV SLA YEAR {previousPeriodLabel}
                  </p>
                  <p className="mt-0.5 text-gray-500">
                    {previousDevSlaPct}% dari{" "}
                    {previousDevEvaluation.contributors} data DEV SLA YEAR{" "}
                    {previousPeriodLabel}
                  </p>
                </div>
              )}
              {selectedDevYoySlaPct !== null && (
                <div className="sm:col-start-2 sm:text-center">
                  <p className="font-bold text-gray-700">
                    DEV SLA YEAR {selectedPeriodLabel}
                  </p>
                  <p className="mt-0.5 text-gray-500">
                    {selectedDevYoySlaPct}% dari{" "}
                    {selectedDevYoyEvaluation.contributors} data DEV SLA YEAR{" "}
                    {selectedPeriodLabel}
                  </p>
                </div>
              )}
            </div>
          </div>
          <GroupedBarChart
            data={yoyCompareData}
            height={330}
            onBarClick={(year) => {
              if (year === String(previousYear))
                setDrillDownModal("yoyPrevious");
              if (year === String(selectedYear))
                setDrillDownModal("yoySelected");
            }}
          />
          {/* Custom Legends & Interactive drill down helpers */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] pt-3.5 border-t border-gray-55/70 select-none">
            <div className="flex items-center gap-4 font-bold text-gray-500 tracking-wide uppercase font-display">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#2563EB] block" /> DEV
                SLA Achieved
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#EF4444] block" /> DEV
                SLA Not Achieved
              </span>
            </div>
            {(previousDevSlaPct !== null || selectedDevYoySlaPct !== null) && (
              <div className="flex items-center gap-2">
                <span className="text-gray-450 italic font-medium">
                  Bilah Grafik Interaktif:
                </span>
                {previousDevSlaPct !== null && (
                  <button
                    onClick={() => setDrillDownModal("yoyPrevious")}
                    className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Detail {previousYear}
                  </button>
                )}
                {selectedDevYoySlaPct !== null && (
                  <button
                    onClick={() => setDrillDownModal("yoySelected")}
                    className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Detail {selectedYear}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Search is placed beside the tables it controls to make its scope explicit. */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-gray-800">
            Filter tabel keterlambatan SLA
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Memfilter kedua tabel di bawah secara langsung tanpa perlu menekan
            Enter.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <label htmlFor="sla-table-search" className="sr-only">
            Cari proyek, tiket, status, tahun, atau penyebab keterlambatan
          </label>
          <div className="relative w-full sm:w-80">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Icon name="search" className="h-3.5 w-3.5" />
            </span>
            <input
              id="sla-table-search"
              type="search"
              placeholder="Cari proyek, tiket, status, atau penyebab..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDelayPage(1);
              }}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-xs font-medium text-gray-800 shadow-xs outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDelayPage(1);
                }}
                className="absolute inset-y-0 right-2 flex w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Hapus pencarian"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            )}
          </div>
          <span
            className="text-[10.5px] font-medium text-gray-500"
            aria-live="polite"
          >
            {filteredMultiStage.length} multi-stage ·{" "}
            {filteredPhaseDelays.length} phase delay
          </span>
        </div>
      </div>

      {/* Tables Section: Multi Stage Failures & Delay Tracker Row (Fully reactive and synchronized) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Multi-Stage Failures Warning Table */}
        <Card
          title="Multi-Stage SLA Failures"
          sub="Proyek dengan hasil Not Achieved pada dua tahap atau lebih"
          rightElement={
            <span className="text-xs tabular-nums font-bold bg-rose-50 border border-rose-100 text-rose-700 px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-inner select-none">
              <Icon
                name="warn"
                className="w-3.5 h-3.5 text-rose-600 animate-pulse"
              />
              {filteredMultiStage.length} warnings
            </span>
          }
          padding="p-0"
        >
          {/* Kolom Tahun selalu sama dengan filter Tahun, jadi pada kartu
              sempit kolom itu disembunyikan agar tabel muat tanpa geser. */}
          <div className="@container overflow-x-auto">
            <table className="w-full min-w-[360px] table-fixed border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display select-none">
                  <th className="py-3 px-4">Nama Proyek</th>
                  <th className="w-40 py-3 px-3 text-center">
                    Tahap & Hasil SLA
                  </th>
                  <th className="hidden w-16 py-3 px-3 text-center @xl:table-cell">
                    Tahun
                  </th>
                  <th className="w-28 py-3 px-3 text-center">Last Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 select-text">
                {filteredMultiStage.map((p, idx) => {
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-55/20 transition-all text-gray-755 font-sans"
                    >
                      <td className="py-3 px-4 whitespace-normal break-words">
                        <p className="font-bold text-gray-800 text-xs whitespace-normal break-words">
                          {p.name}
                        </p>
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <div className="flex flex-col items-center gap-1.5">
                          {p.evidence.map((evidence) => (
                            <div
                              key={evidence.stage}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-rose-100 bg-rose-50 px-2.5 py-1 text-[9.5px] font-bold text-rose-700"
                            >
                              <span className="tabular-nums tracking-wide">
                                {evidence.stage}
                              </span>
                              <span
                                aria-hidden="true"
                                className="h-1 w-1 rounded-full bg-rose-300"
                              />
                              <span className="whitespace-nowrap">
                                {displaySlaResult(evidence.resultValue)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="hidden py-3 px-3 tabular-nums font-bold text-gray-500 text-center text-[11px] @xl:table-cell">
                        {p.year}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Pill label={p.status} status={p.status} />
                      </td>
                    </tr>
                  );
                })}
                {filteredMultiStage.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-xs text-gray-400 font-sans"
                    >
                      Tidak ada data multi-stage SLA delay untuk filter
                      terpilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* SLA Phase Delay Tracker Table (with interactive client side pagination) */}
        <Card
          title="SLA Phase Delay Tracker"
          sub="Analisis deviasi waktu dan gerbang keterlambatan pengembangan per tiket"
          rightElement={
            <div className="flex items-center gap-2 select-none">
              <span className="text-[10px] text-gray-400 tabular-nums hidden sm:inline-block">
                Avg:{" "}
                <strong className="text-gray-755 font-sans">
                  {avgDelayCount} hari
                </strong>
              </span>
              <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block"></div>
              {/* Pagination controls */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-500 tabular-nums">
                  {delayPage}/{totalDelayPages}
                </span>
                <button
                  onClick={() => setDelayPage((p) => Math.max(p - 1, 1))}
                  disabled={delayPage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Halaman sebelumnya"
                >
                  <Icon name="chevron" className="w-3 h-3 rotate-180" />
                </button>
                <button
                  onClick={() =>
                    setDelayPage((p) => Math.min(p + 1, totalDelayPages))
                  }
                  disabled={delayPage >= totalDelayPages}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Halaman berikutnya"
                >
                  <Icon name="chevron" className="w-3 h-3" />
                </button>
              </div>
            </div>
          }
          padding="p-0"
        >
          {/* Kartu ini hanya setengah lebar layar. Tiket ikut di bawah nama
              proyek, dan pada kartu sempit faktor penyebab pindah ke bawah
              nama supaya seluruh isi terlihat tanpa geser ke samping. */}
          <div className="@container overflow-x-auto">
            <table className="w-full min-w-[360px] table-fixed border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display select-none">
                  <th className="w-10 py-3 px-2 text-center">No</th>
                  <th className="py-3 px-3">Nama Proyek</th>
                  <th className="w-21 py-3 px-2 text-center">SLA Delay</th>
                  <th className="w-28 py-3 px-2 text-center">
                    Gerbang Terlambat
                  </th>
                  <th className="hidden w-[30%] py-3 px-3 @xl:table-cell">
                    Faktor Penyebab
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 select-text">
                {paginatedPhaseDelays.map((row, idx) => {
                  const globalRowNo = (delayPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-55/20 transition-all text-gray-750 font-sans"
                    >
                      <td className="py-3 px-2 tabular-nums font-bold text-gray-400 text-center">
                        {globalRowNo}
                      </td>
                      <td className="py-3 px-3 whitespace-normal break-words">
                        <p className="font-bold text-gray-800 text-xs">
                          {row.name}
                        </p>
                        <p className="mt-0.5 tabular-nums text-[11px] font-semibold text-gray-400">
                          {row.ticket}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-gray-600 @xl:hidden">
                          <span className="font-semibold text-gray-400">
                            Penyebab:
                          </span>{" "}
                          {row.reason}
                        </p>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-block whitespace-nowrap rounded-md border border-red-100/60 bg-red-50 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-red-650">
                          {row.days} hari
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col items-center gap-1">
                          {row.stages.map((st, sIdx) => (
                            <span
                              key={sIdx}
                              className="whitespace-nowrap rounded-md border border-rose-100/50 bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold tabular-nums text-rose-600"
                            >
                              {st[0]} · {st[1]} hari
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="hidden py-3 px-3 whitespace-normal break-words font-medium text-gray-600 @xl:table-cell">
                        {row.reason}
                      </td>
                    </tr>
                  );
                })}
                {filteredPhaseDelays.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-xs text-gray-400 font-sans"
                    >
                      Tidak ada proyek dengan deviasi waktu yang cocok dengan
                      pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Full-viewport drill-down dialog rendered outside the dashboard layout. */}
      {drillDownModal &&
        createPortal(
          <div
            className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-900/60 p-2 backdrop-blur-xs animate-in fade-in duration-200 sm:p-4"
            {...backdropDismissProps(closeDrillDownModal)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="sla-drilldown-title"
              aria-describedby="sla-drilldown-description"
              className="flex max-h-[calc(100dvh-1rem)] w-full max-w-7xl min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in zoom-in-95 duration-250 sm:max-h-[90dvh]"
              onMouseDown={(event) => event.stopPropagation()}
            >
              {/* Modal headers */}
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 bg-gray-50/50 px-4 py-4 sm:items-center sm:px-6">
                <div className="min-w-0">
                  <h3
                    id="sla-drilldown-title"
                    className="flex items-start gap-1.5 text-sm font-extrabold text-gray-900 font-display sm:items-center"
                  >
                    <Icon name="grid" className="w-4 h-4 text-blue-600" />
                    {drillDownModal === "avg" && "Rata-rata DEV SLA"}
                    {drillDownModal === "selectedYear" && devSlaComparisonLabel}
                    {drillDownModal === "notAchieved" &&
                      "DEV SLA = Not Achieved"}
                    {drillDownModal === "multiStage" &&
                      "Proyek Not Achieved di 2 Tahap atau Lebih"}
                    {drillDownModal === "yoyPrevious" &&
                      `Rincian ${devSlaComparisonLabel} · SLA YEAR ${previousPeriodLabel}`}
                    {drillDownModal === "yoySelected" &&
                      `Rincian ${devSlaComparisonLabel} · SLA YEAR ${selectedPeriodLabel}`}
                  </h3>
                  <p
                    id="sla-drilldown-description"
                    className="mt-1 text-[11px] text-gray-400 font-sans"
                  >
                    {isDevContributorModal ? (
                      <>
                        Tabel memuat {modalList.length} proyek dengan DEV SLA
                        Achieved atau Not Achieved pada {modalPeriodLabel}.
                      </>
                    ) : drillDownModal === "notAchieved" ? (
                      <>
                        Tabel memuat {modalList.length} dari{" "}
                        {selectedDevEvaluation.contributors} proyek yang
                        dinilai.
                      </>
                    ) : drillDownModal === "multiStage" ? (
                      <>
                        {modalList.length} dari {multiStageScopeCount} proyek
                        yang dinilai bernilai Not Achieved di 2 tahap atau
                        lebih. Dihitung dari 5 tahap: FSD, DEV, SIT, UAT, LIVE.
                      </>
                    ) : (
                      <>
                        Menampilkan {modalList.length} proyek yang memenuhi
                        kriteria.
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Tutup rincian SLA"
                  onClick={() => setDrillDownModal(null)}
                  className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-gray-250 bg-gray-100 px-3 text-xs font-bold text-gray-650 transition-colors hover:bg-gray-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Icon name="x" className="w-3.5 h-3.5" />
                  Tutup
                </button>
              </div>

              {/* The scroll viewport has no padding so rows cannot pass above the sticky header. */}
              <div className="min-h-0 flex-1 overflow-auto select-text">
                {modalList.length === 0 ? (
                  <div className="m-3 py-12 text-center text-xs text-gray-400 font-sans sm:m-5">
                    {modalEmptyMessage}
                  </div>
                ) : (
                  <table className="w-full min-w-[1120px] table-fixed border-separate border-spacing-0 text-left text-xs font-sans">
                    <colgroup>
                      <col style={{ width: 56 }} />
                      <col style={{ width: 105 }} />
                      <col style={{ width: 270 }} />
                      <col style={{ width: 190 }} />
                      <col style={{ width: 115 }} />
                      <col style={{ width: 90 }} />
                      <col style={{ width: 210 }} />
                      <col style={{ width: 110 }} />
                    </colgroup>
                    <thead className="bg-gray-50 shadow-[0_1px_0_rgba(229,231,235,1)] [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:border-b [&_th]:border-gray-100 [&_th]:bg-gray-50">
                      <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 font-display select-none">
                        <th className="px-3 py-3 text-center">No</th>
                        <th className="px-3 py-3">Ticket</th>
                        <th className="px-3 py-3">Project Name</th>
                        <th className="px-3 py-3">Owner Division</th>
                        <th className="px-3 py-3">PIC Short Name</th>
                        <th className="px-3 py-3 text-center">Period</th>
                        {drillDownModal === "multiStage" ? (
                          <th className="px-3 py-3">Tahap Not Achieved</th>
                        ) : (
                          <th className="px-3 py-3 text-center">
                            DEV SLA State
                          </th>
                        )}
                        <th className="px-3 py-3 text-center">Milestone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {modalList.map((p, idx) => {
                        const isAchieved = p.devSla === "Achieved";
                        const isNotAchieved = p.devSla === "Not Achieved";
                        return (
                          <tr
                            key={p.key || idx}
                            className="transition-colors hover:bg-gray-50/70 [&>td]:align-middle"
                          >
                            <td className="px-3 py-3 text-center tabular-nums font-bold text-gray-450">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-3 tabular-nums font-bold text-gray-500 whitespace-nowrap">
                              {p.ticket}
                            </td>
                            <td className="px-3 py-3 pr-4">
                              <span className="block whitespace-normal break-words font-semibold leading-snug text-gray-900">
                                {p.name}
                              </span>
                            </td>
                            <td className="px-3 py-3 font-medium leading-snug text-gray-650 whitespace-normal break-words">
                              {p.division}
                            </td>
                            <td className="px-3 py-3 font-medium leading-snug text-gray-600 whitespace-normal break-words">
                              {p.pic}
                            </td>
                            <td className="px-3 py-3 text-center tabular-nums text-gray-500 whitespace-nowrap">
                              {p.period}
                            </td>
                            {drillDownModal === "multiStage" ? (
                              <td className="px-3 py-3">
                                <div className="flex flex-col items-start gap-1.5">
                                  <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">
                                    {p.evidence.length} dari 5 tahap
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {p.evidence.map((evidence) => (
                                      <HoverTip
                                        key={evidence.stage}
                                        content={`${evidence.stage}: ${displaySlaResult(evidence.resultValue)}`}
                                        className="cursor-help rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700"
                                      >
                                        {evidence.stage}
                                      </HoverTip>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            ) : (
                              <td className="px-3 py-3 text-center whitespace-nowrap">
                                <span
                                  className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                    isAchieved
                                      ? "bg-blue-50 text-blue-700 border-blue-150"
                                      : isNotAchieved
                                        ? "bg-rose-50 text-rose-700 border-rose-150"
                                        : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {p.devSla}
                                </span>
                              </td>
                            )}
                            <td className="px-3 py-3 text-center">
                              <span className="inline-block rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 whitespace-nowrap">
                                {p.milestone}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
