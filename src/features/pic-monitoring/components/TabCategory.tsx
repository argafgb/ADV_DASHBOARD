"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import type { DashboardDataset, SanitizedProject } from "../types/types";
import { Card, Icon } from "./UI";
import { PieChart } from "./Charts";
import { KpiCard, TrendBadge } from "./KpiCard";
import { HoverTip, TipScope, type TipContent } from "./chart-tooltip";
import { statusGroupOf } from "../utils/parser";
import { getStatusGroupPalette, getStatusPalette } from "../utils/status-style";
import {
  ACTIVE_STATUS_GROUPS,
  buildDevSlaLeaderboard,
  getCategoryDivision,
  getDevOverSlaDays,
  getProjectType,
  groupActiveProjectsByStatus,
  groupProjectsBy,
  selectActiveBreakdownProjects,
  selectCategoryModalProjects,
  selectDevSlaLeaderboardProjects,
} from "../utils/category-selectors";
import type { CategoryModal } from "../types/category";
import {
  evaluateAllStageSlas,
  isMatchingSlaYear,
  isStageRealizedInMonths,
  isValidSlaResult,
} from "../utils/sla-policy";
import { formatPeriodLabel, monthWindowOf } from "../utils/period-filter";
import { getSlaEvaluationPool } from "../utils/project-normalization";
import { useModalDismiss, backdropDismissProps } from "../utils/use-modal-dismiss";

interface TabCategoryProps {
  dataset: DashboardDataset;
  rawProjects?: SanitizedProject[];
  filteredProjects?: SanitizedProject[];
  slaProjects?: SanitizedProject[];
  startYear?: number;
  endYear?: number;
  /** Pilihan chip Bulan: "ALL", "3", atau "3-5". */
  month?: string;
  onUploadFile?: (file: File) => void;
}

const EXCLUDED_DIVISION = "WISESA";

/** Baris kartu Active by Type/Division yang membuka popup daftar proyek. */
const ACTIVE_ROW_BUTTON_CLASS =
  "group flex min-h-8 w-full cursor-pointer items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500";

function isExcludedDivision(project: SanitizedProject): boolean {
  return getCategoryDivision(project).toUpperCase() === EXCLUDED_DIVISION;
}

export function filterCategoryDivisionScope(
  projects: readonly SanitizedProject[],
): SanitizedProject[] {
  return projects.filter((project) => !isExcludedDivision(project));
}

/** Porsi satu desimal, sama dengan persentase di legenda Status Distribution. */
function formatShare(value: number, total: number): string {
  return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";
}

/** Tooltip standar untuk daftar batang: jumlah proyek dan porsinya. */
function countTip(
  items: readonly { label: string; value: number; color?: string }[],
  label: string,
  valueLabel: string,
): TipContent | null {
  const item = items.find((candidate) => candidate.label === label);
  if (!item) return null;
  const total = items.reduce((sum, candidate) => sum + candidate.value, 0);
  return {
    title: item.label,
    rows: [
      { color: item.color ?? "#2563EB", label: valueLabel, value: item.value },
      { label: "Porsi", value: formatShare(item.value, total) },
    ],
  };
}

function displaySourceValue(
  value: unknown,
  emptyLabel = "Belum diisi",
): string {
  const text = String(value ?? "").trim();
  return text || emptyLabel;
}

/**
 * Warna tingkat prioritas mengikuti `priorityColors` di parser: High merah,
 * Medium kuning, Low hijau. Isian lain dari Notion (IT, Lanjutan 2020, dll.)
 * bukan tingkat prioritas, jadi tampil netral tanpa titik warna.
 */
const PRIORITY_LEVEL_STYLE: Readonly<
  Record<string, { pill: string; dot: string }>
> = {
  high: {
    pill: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  medium: {
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

function PriorityBadge({ value }: { value: unknown }) {
  const label = String(value ?? "").trim();
  if (!label) {
    return (
      <span className="text-[11px] font-semibold text-gray-400">
        Belum diisi
      </span>
    );
  }

  const level = PRIORITY_LEVEL_STYLE[label.toLowerCase()];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-extrabold leading-snug ${
        level?.pill ?? "bg-gray-50 text-gray-600 border-gray-200"
      }`}
    >
      {level && (
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${level.dot}`} />
      )}
      {label}
    </span>
  );
}

export function TabCategory({
  dataset,
  rawProjects,
  filteredProjects = [],
  slaProjects,
  startYear,
  endYear,
  month = "ALL",
  onUploadFile,
}: TabCategoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<CategoryModal | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const closeActiveModal = useCallback(() => {
    setActiveModal(null);
    setSelectedDivision(null);
    setSelectedType(null);
  }, [setActiveModal, setSelectedDivision, setSelectedType]);
  useModalDismiss(activeModal !== null, closeActiveModal);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download logic for dynamic active JSON database
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
    link.download = `ADV_Category_Database_${dataset.report.date.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // WISESA is an internal requester grouping and must not contribute to the
  // Category & Division figures. Keep the shared operational/Internal IT
  // filtering unchanged; this exclusion is local to this tab's division scope.
  const tabProjects = useMemo(
    () => filterCategoryDivisionScope(filteredProjects),
    [filteredProjects],
  );
  const slaSelectedYear = String(endYear ?? startYear ?? "").trim();
  // Filter Bulan hanya menyentuh card SLA (Overall SLA, Low SLA Division, dan
  // leaderboard); card distribusi tetap membaca seluruh proyek operasional.
  const monthWindow = useMemo(() => monthWindowOf(month), [month]);
  const slaPeriod = useMemo(
    () => ({ year: slaSelectedYear, months: monthWindow }),
    [monthWindow, slaSelectedYear],
  );
  const slaPeriodLabel = formatPeriodLabel(slaSelectedYear, monthWindow);
  // SLA visuals mirror Notion's `Type Project: Not Internal IT` filter and the
  // same division scope used by the cards and requested-division drill-down.
  const slaEvaluationProjects = useMemo(
    () =>
      filterCategoryDivisionScope(
        getSlaEvaluationPool(slaProjects ?? rawProjects ?? []),
      ),
    [rawProjects, slaProjects],
  );

  // Recalculating classifications/categories based on tabProjects
  const computedCategories = useMemo(() => {
    const typeMap: Record<string, number> = {};
    tabProjects.forEach((p) => {
      const val = String(p["Type Project"] ?? "").trim();
      if (!val) return;
      typeMap[val] = (typeMap[val] || 0) + 1;
    });
    return Object.keys(typeMap)
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
  }, [tabProjects]);

  // Recalculating state distribution for status pie chart based on tabProjects
  const computedStatusPie = useMemo(() => {
    const statusPieMap: Record<string, number> = {};
    tabProjects.forEach((p) => {
      const val = String(p["Last Status"] ?? "").trim();
      if (!val) return;
      statusPieMap[val] = (statusPieMap[val] || 0) + 1;
    });
    return Object.keys(statusPieMap)
      .map((k) => ({
        label: k,
        value: statusPieMap[k],
        color: getStatusPalette(k).hex,
      }))
      .sort((a, b) => b.value - a.value);
  }, [tabProjects]);

  // Active Projects
  const computedActiveProjects = useMemo(() => {
    return tabProjects.filter((p) =>
      ACTIVE_STATUS_GROUPS.includes(statusGroupOf(p["Last Status"])),
    );
  }, [tabProjects]);

  // Active by Type
  const computedActiveByType = useMemo(() => {
    const activeTypeMap: Record<string, number> = {};
    computedActiveProjects.forEach((p) => {
      const type = getProjectType(p);
      if (type) activeTypeMap[type] = (activeTypeMap[type] || 0) + 1;
    });
    return Object.keys(activeTypeMap)
      .map((k) => ({ label: k, value: activeTypeMap[k] }))
      .sort((a, b) => b.value - a.value);
  }, [computedActiveProjects]);

  const computedActiveByDivision = useMemo(() => {
    const activeDivMap: Record<string, number> = {};
    computedActiveProjects.forEach((p) => {
      const div = getCategoryDivision(p);
      if (div) activeDivMap[div] = (activeDivMap[div] || 0) + 1;
    });
    return Object.keys(activeDivMap)
      .map((k) => ({ label: k, value: activeDivMap[k] }))
      .sort((a, b) => b.value - a.value);
  }, [computedActiveProjects]);

  const computedDivisions = useMemo(() => {
    const divCountMap: Record<string, number> = {};
    tabProjects.forEach((p) => {
      const div = getCategoryDivision(p);
      if (div) divCountMap[div] = (divCountMap[div] || 0) + 1;
    });
    return Object.keys(divCountMap)
      .map((k) => ({
        label: k,
        value: divCountMap[k],
        color: "#2563EB",
      }))
      .sort((a, b) => b.value - a.value);
  }, [tabProjects]);

  // DEV SLA leaderboard follows DEV SLA YEAR on the business pool.
  const devSlaLeaderboardProjects = useMemo(
    () =>
      selectDevSlaLeaderboardProjects({
        rawProjects: slaEvaluationProjects,
        slaSelectedYear,
        slaMonths: monthWindow,
      }),
    [monthWindow, slaEvaluationProjects, slaSelectedYear],
  );

  const computedLeaderboard = useMemo(
    () => buildDevSlaLeaderboard(devSlaLeaderboardProjects),
    [devSlaLeaderboardProjects],
  );

  const averageYearLabel = slaSelectedYear
    ? `Overall SLA (${slaPeriodLabel})`
    : "Overall SLA";

  const overallSlaEvaluation = useMemo(() => {
    const stageEvaluations = evaluateAllStageSlas(
      slaEvaluationProjects,
      slaPeriod,
    );
    const contributors = stageEvaluations.reduce(
      (total, evaluation) => total + evaluation.contributors,
      0,
    );
    const achieved = stageEvaluations.reduce(
      (total, evaluation) => total + evaluation.achieved,
      0,
    );
    const notAchieved = stageEvaluations.reduce(
      (total, evaluation) => total + evaluation.notAchieved,
      0,
    );

    return {
      contributors,
      notAchieved: contributors === 0 ? null : notAchieved,
      percentage: contributors === 0 ? null : (achieved / contributors) * 100,
    };
  }, [slaEvaluationProjects, slaPeriod]);

  // Largest category/division, shown as supporting context on the KPI cards.
  const topCategory = computedCategories[0] ?? null;
  const topDivision = computedDivisions[0] ?? null;

  // Division with lowest SLA
  const lowestSlaDiv = useMemo(
    () =>
      computedLeaderboard.length > 0
        ? computedLeaderboard[computedLeaderboard.length - 1]
        : null,
    [computedLeaderboard],
  );

  // Search Query Filters helper
  const filteredCategories = useMemo(() => {
    return searchQuery.trim() === ""
      ? computedCategories
      : computedCategories.filter((c) =>
          c.label.toLowerCase().includes(searchQuery.toLowerCase()),
        );
  }, [computedCategories, searchQuery]);

  const filteredStatusPie = useMemo(() => {
    return searchQuery.trim() === ""
      ? computedStatusPie
      : computedStatusPie.filter((s) =>
          s.label.toLowerCase().includes(searchQuery.toLowerCase()),
        );
  }, [computedStatusPie, searchQuery]);

  const filteredActiveByType = useMemo(() => {
    return searchQuery.trim() === ""
      ? computedActiveByType
      : computedActiveByType.filter((item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()),
        );
  }, [computedActiveByType, searchQuery]);

  const filteredActiveByDivision = useMemo(() => {
    return searchQuery.trim() === ""
      ? computedActiveByDivision
      : computedActiveByDivision.filter((item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()),
        );
  }, [computedActiveByDivision, searchQuery]);

  const filteredDivisions = useMemo(() => {
    return searchQuery.trim() === ""
      ? computedDivisions
      : computedDivisions.filter((d) =>
          d.label.toLowerCase().includes(searchQuery.toLowerCase()),
        );
  }, [computedDivisions, searchQuery]);

  const filteredLeaderboard = useMemo(() => {
    return searchQuery.trim() === ""
      ? computedLeaderboard
      : computedLeaderboard.filter((item) =>
          item.division.toLowerCase().includes(searchQuery.toLowerCase()),
        );
  }, [computedLeaderboard, searchQuery]);

  const modalProjects = useMemo(() => {
    if (activeModal === "low_sla" || activeModal === "leaderboard_division") {
      const division = String(
        activeModal === "low_sla" ? lowestSlaDiv?.division : selectedDivision,
      ).trim();

      if (!division) return [];

      return devSlaLeaderboardProjects.filter(
        (project) => getCategoryDivision(project) === division,
      );
    }

    // Isi popup sama persis dengan proyek yang dihitung pada baris kartu.
    if (activeModal === "active_division" || activeModal === "active_type") {
      const label =
        activeModal === "active_division" ? selectedDivision : selectedType;
      if (!label) return [];

      return selectActiveBreakdownProjects(
        computedActiveProjects,
        activeModal === "active_division" ? "division" : "type",
        label,
      );
    }

    return selectCategoryModalProjects({
      activeModal,
      tabProjects,
      rawProjects: slaEvaluationProjects,
      selectedDivision,
      lowestSlaDivision: lowestSlaDiv?.division ?? "",
      slaSelectedYear,
      slaMonths: monthWindow,
    });
  }, [
    activeModal,
    computedActiveProjects,
    devSlaLeaderboardProjects,
    lowestSlaDiv?.division,
    monthWindow,
    selectedDivision,
    selectedType,
    slaEvaluationProjects,
    slaSelectedYear,
    tabProjects,
  ]);

  const groupedClassificationData = useMemo(
    () =>
      activeModal === "classification"
        ? groupProjectsBy(modalProjects, (project) =>
            String(project["Type Project"] ?? "").trim(),
          )
        : null,
    [activeModal, modalProjects],
  );

  const groupedRequestedData = useMemo(
    () =>
      activeModal === "requested"
        ? groupProjectsBy(modalProjects, getCategoryDivision)
        : null,
    [activeModal, modalProjects],
  );

  const showActiveDetails =
    activeModal === "active_division" || activeModal === "active_type";

  const groupedActiveData = useMemo(
    () =>
      showActiveDetails ? groupActiveProjectsByStatus(modalProjects) : null,
    [modalProjects, showActiveDetails],
  );

  const showDevSlaDetails =
    activeModal === "low_sla" || activeModal === "leaderboard_division";

  return (
    <div className="space-y-6">
      {/* Dynamic Header Block with responsive filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-xl font-extrabold font-display text-gray-900 tracking-tight">
            Category & Division Classification
          </h1>
          <p className="text-xs text-gray-400 font-medium font-sans mt-1.5 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Laporan mingguan periode {dataset.report.date} •{" "}
            {tabProjects.length} proyek terdaftar
          </p>
        </div>

        {/* Dynamic Search block and JSON download/upload triggers */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Interactive Search Bar */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Icon name="search" className="w-3.5 h-3.5 pointer-events-none" />
            </div>
            <input
              type="text"
              placeholder="Cari nama proyek atau divisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-xs font-medium text-gray-800 shadow-xs outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-2 flex w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Actions controllers */}
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
                className="p-2.5 h-9.5 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-905 border border-gray-200 rounded-xl flex items-center justify-center cursor-pointer transition-colors hover:shadow-xs shadow-xs"
              >
                <Icon name="upload" className="w-4 h-4" />
              </button>
            </HoverTip>
            <HoverTip content="Unduh Data Aktif" className="inline-flex">
              <button
                onClick={handleDownloadJSON}
                disabled={!rawProjects?.length}
                aria-label="Unduh Data Aktif"
                className="p-2.5 h-9.5 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-905 border border-gray-200 rounded-xl flex items-center justify-center cursor-pointer transition-colors hover:shadow-xs shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon name="download" className="w-4 h-4" />
              </button>
            </HoverTip>
          </div>
        </div>
      </div>

      {/* 4 Professional Clickable KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
        {/* Metric Card 1: Project Classification */}
        <KpiCard
          accent="blue"
          icon="clock"
          onClick={() => setActiveModal("classification")}
          value={computedCategories.length}
          badge={
            topCategory ? (
              <TrendBadge
                direction={true}
                tone="neutral"
                text={`${topCategory.value} terbanyak`}
                title={`Kategori terbanyak: ${topCategory.label} (${topCategory.value} proyek)`}
              />
            ) : undefined
          }
          label="Project Classification"
          hint={`${tabProjects.length} proyek (semua tahun)`}
          footnote={topCategory ? `Terbanyak: ${topCategory.label}` : undefined}
        />

        {/* Metric Card 2: Requested Division */}
        <KpiCard
          accent="indigo"
          icon="layers"
          onClick={() => setActiveModal("requested")}
          value={computedDivisions.length}
          badge={
            topDivision ? (
              <TrendBadge
                direction={true}
                tone="neutral"
                text={`${topDivision.value} terbanyak`}
                title={`Divisi paling banyak mengajukan: ${topDivision.label} (${topDivision.value} proyek)`}
              />
            ) : undefined
          }
          label="Requested Division"
          hint={`${computedDivisions.length} divisi mengajukan proyek`}
          footnote={topDivision ? `Terbanyak: ${topDivision.label}` : undefined}
        />

        {/* Metric Card 3: Dynamic Average Year SLA % */}
        <KpiCard
          accent="emerald"
          icon="check"
          onClick={() => setActiveModal("average")}
          value={
            overallSlaEvaluation.percentage === null
              ? "Belum dievaluasi"
              : `${Math.round(overallSlaEvaluation.percentage)}%`
          }
          badge={
            overallSlaEvaluation.notAchieved === null ? undefined : (
              <TrendBadge
                direction={
                  overallSlaEvaluation.notAchieved === 0 ? null : false
                }
                tone={overallSlaEvaluation.notAchieved === 0 ? "good" : "bad"}
                text={`${overallSlaEvaluation.notAchieved} Not Achieved`}
                title={`${overallSlaEvaluation.notAchieved} dari ${overallSlaEvaluation.contributors} evaluasi bernilai Not Achieved`}
              />
            )
          }
          label={averageYearLabel}
          hint={`${overallSlaEvaluation.contributors} evaluasi pada ${slaPeriodLabel}`}
        />

        {/* Metric Card 4: Low SLA Division */}
        <KpiCard
          accent="amber"
          icon="warn"
          disabled={!lowestSlaDiv}
          onClick={() => {
            if (!lowestSlaDiv) return;
            setSelectedDivision(lowestSlaDiv.division);
            setActiveModal("low_sla");
          }}
          value={lowestSlaDiv ? `${lowestSlaDiv.sla}%` : "Belum dievaluasi"}
          badge={
            lowestSlaDiv ? (
              <TrendBadge
                direction={lowestSlaDiv.not === 0 ? null : false}
                tone={lowestSlaDiv.not === 0 ? "good" : "bad"}
                text={`${lowestSlaDiv.not} Not Achieved`}
                title={`${lowestSlaDiv.division}: ${lowestSlaDiv.not} dari ${lowestSlaDiv.evaluated} evaluasi DEV bernilai Not Achieved`}
              />
            ) : undefined
          }
          label="Low SLA Division"
          hint={lowestSlaDiv ? lowestSlaDiv.division : "Belum ada data DEV SLA"}
          footnote={
            lowestSlaDiv
              ? `${lowestSlaDiv.evaluated} evaluasi DEV SLA ${slaPeriodLabel}`
              : undefined
          }
        />
      </div>

      {/* Row Block 1: Projects by Category & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Projects by Category card */}
        <Card
          title="Projects by Category"
          sub={`Semua tahun · ${computedCategories.length} kategori`}
          padding="p-6"
        >
          <TipScope
            className="space-y-4 select-none"
            getTip={(label) => countTip(computedCategories, label, "Proyek")}
          >
            {filteredCategories.map((cat, idx) => {
              const maxCat = Math.max(
                ...computedCategories.map((c) => c.value),
                1,
              );
              const barWidthPct = (cat.value / maxCat) * 100;
              return (
                <div
                  key={idx}
                  data-tip={cat.label}
                  className="flex items-center gap-4 justify-between"
                >
                  <span className="w-24 min-w-0 text-[12.5px] font-semibold text-gray-650 truncate font-sans sm:w-36">
                    {cat.label}
                  </span>
                  <div className="flex-1 h-3.5 bg-gray-50 border border-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${barWidthPct}%`,
                        backgroundColor: cat.color || "#2563EB",
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-[12.5px] font-bold text-gray-800 tabular-nums">
                    {cat.value}
                  </span>
                </div>
              );
            })}
            {filteredCategories.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400 font-sans">
                Tidak ada data kategori yang cocok dengan pencarian Anda.
              </div>
            )}
          </TipScope>
        </Card>

        {/* Status Distribution dynamic chart & list card */}
        <Card
          title="Status Distribution"
          sub={`${filteredStatusPie.reduce((acc, item) => acc + item.value, 0)} proyek (semua tahun)`}
          padding="p-6"
        >
          <TipScope
            className="flex flex-col sm:flex-row items-center gap-6 justify-center h-full"
            getTip={(label) => countTip(filteredStatusPie, label, "Proyek")}
          >
            <div className="flex-shrink-0">
              <PieChart segments={filteredStatusPie} size={150} />
            </div>

            <div className="space-y-2 flex-1 w-full select-none divide-y divide-gray-50/50">
              {filteredStatusPie.map((sp, idx) => {
                const totalCount = filteredStatusPie.reduce(
                  (acc, item) => acc + item.value,
                  0,
                );
                const pct = totalCount > 0 ? (sp.value / totalCount) * 100 : 0;
                return (
                  <div
                    key={idx}
                    data-tip={sp.label}
                    className="flex items-center justify-between text-[12.5px] pt-2 first:pt-0"
                  >
                    <span className="flex items-center gap-2 font-bold text-gray-500 truncate max-w-[130px]">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sp.color }}
                      />
                      {sp.label}
                    </span>
                    <div className="flex items-baseline gap-1.5 flex-shrink-0">
                      <strong className="text-gray-900 font-extrabold font-sans text-xs">
                        {sp.value}
                      </strong>
                      <span className="text-[10px] text-gray-400 font-semibold tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredStatusPie.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-400 font-sans">
                  Tidak ada data status yang cocok dengan pencarian.
                </div>
              )}
            </div>
          </TipScope>
        </Card>
      </div>

      {/* Row Block 2: 2-column mix - "Priority Mix" section completely removed and others expanded */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column 1: Active by Type */}
        <Card
          title="Active by Type"
          sub="Hanya proyek aktif · Klik baris untuk detail"
          padding="p-5"
        >
          <TipScope
            className="space-y-3.5 select-none animate-fade-in pr-0.5"
            getTip={(label) =>
              countTip(computedActiveByType, label, "Proyek aktif")
            }
          >
            {filteredActiveByType.map((item) => {
              const maxVal = Math.max(
                ...computedActiveByType.map((i) => i.value),
                1,
              );
              const pct = (item.value / maxVal) * 100;
              return (
                <button
                  key={item.label}
                  type="button"
                  data-tip={item.label}
                  onClick={() => {
                    setSelectedType(item.label);
                    setActiveModal("active_type");
                  }}
                  className={ACTIVE_ROW_BUTTON_CLASS}
                >
                  <span className="w-32 shrink-0 whitespace-normal break-words font-sans text-[12px] font-bold leading-snug text-gray-650 transition-colors group-hover:text-blue-700 sm:w-48 lg:w-44 xl:w-52">
                    {item.label}
                  </span>
                  <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-50">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right tabular-nums text-[12.5px] font-extrabold text-gray-900">
                    {item.value}
                  </span>
                </button>
              );
            })}
            {filteredActiveByType.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400 font-sans">
                Target filter tidak ditemukan.
              </div>
            )}
          </TipScope>
        </Card>

        {/* Column 2: Active by Division */}
        <Card
          title="Active by Division"
          sub="Hanya proyek aktif · Klik baris untuk detail"
          padding="p-5"
        >
          <TipScope
            className="space-y-3.5 select-none animate-fade-in max-h-[290px] overflow-y-auto pr-1"
            getTip={(label) =>
              countTip(computedActiveByDivision, label, "Proyek aktif")
            }
          >
            {filteredActiveByDivision.slice(0, 10).map((item) => {
              const maxVal = Math.max(
                ...computedActiveByDivision.map((i) => i.value),
                1,
              );
              const pct = (item.value / maxVal) * 100;
              return (
                <button
                  key={item.label}
                  type="button"
                  data-tip={item.label}
                  onClick={() => {
                    setSelectedDivision(item.label);
                    setActiveModal("active_division");
                  }}
                  className={ACTIVE_ROW_BUTTON_CLASS}
                >
                  <span className="w-32 shrink-0 whitespace-normal break-words font-sans text-[12px] font-bold leading-snug text-gray-650 transition-colors group-hover:text-blue-700 sm:w-48 lg:w-44 xl:w-52">
                    {item.label}
                  </span>
                  <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-50">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right tabular-nums text-[12.5px] font-extrabold text-gray-900">
                    {item.value}
                  </span>
                </button>
              );
            })}
            {filteredActiveByDivision.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400 font-sans">
                Target filter divisi tidak ditemukan.
              </div>
            )}
          </TipScope>
        </Card>
      </div>

      {/* Row Block 3: Requests by Division & Division SLA Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Requests by Division list card */}
        <Card
          title="Requests by Division"
          sub="10 divisi peminta terbanyak (semua tahun)"
          padding="p-6"
        >
          <TipScope
            className="space-y-3.5 select-none animate-fade-in"
            getTip={(label) => countTip(computedDivisions, label, "Proyek")}
          >
            {filteredDivisions.slice(0, 10).map((div) => {
              const maxDiv = Math.max(
                ...computedDivisions.map((d) => d.value),
                1,
              );
              const pct = (div.value / maxDiv) * 100;
              return (
                <div
                  key={div.label}
                  data-tip={div.label}
                  className="flex min-h-11 items-center gap-3 border-b border-gray-50/50 py-1.5 last:border-b-0"
                >
                  <span className="w-32 shrink-0 whitespace-normal break-words font-sans text-[12px] font-bold leading-snug text-gray-650 sm:w-48 lg:w-44 xl:w-52">
                    {div.label}
                  </span>
                  <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full border border-gray-100 bg-gray-50">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right tabular-nums text-[12px] font-bold text-gray-800">
                    {div.value}
                  </span>
                </div>
              );
            })}
            {filteredDivisions.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400 font-sans">
                Tidak ada data divisi peminta yang cocok dengan pencarian Anda.
              </div>
            )}
          </TipScope>
        </Card>

        {/* Division SLA Leaderboard table card */}
        <Card
          title="Division SLA Leaderboard"
          sub={`${slaPeriodLabel || "Belum diisi"} · Klik baris untuk detail`}
          padding="p-0"
        >
          {/* Pada kartu yang sempit, jumlah dievaluasi pindah ke bawah bar Dev
              SLA supaya seluruh isi tabel terlihat tanpa geser ke samping. */}
          <div className="@container overflow-x-auto">
            <table className="w-full min-w-[360px] table-fixed border-collapse text-left font-sans text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-405 font-bold uppercase tracking-wider font-display select-none">
                  <th className="w-10 py-3.5 px-2 text-center">#</th>
                  <th className="py-3.5 px-3">Divisi</th>
                  <th className="w-[32%] py-3.5 px-3">Dev SLA</th>
                  <th className="w-21 whitespace-nowrap py-3.5 px-2 text-center">
                    Over SLA
                  </th>
                  <th className="hidden w-25 py-3.5 px-3 text-center @xl:table-cell">
                    Dievaluasi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/60">
                {filteredLeaderboard.map((row, idx) => {
                  let barColor = "#2563EB"; // Blue
                  if (row.sla >= 100) {
                    barColor = "#10B981"; // Green
                  } else if (row.sla >= 92) {
                    barColor = "#2563EB"; // Blue
                  } else if (row.sla >= 90) {
                    barColor = "#D97706"; // Orange
                  } else {
                    barColor = "#EF4444"; // Red
                  }

                  return (
                    <tr
                      key={idx}
                      onClick={() => {
                        setSelectedDivision(row.division);
                        setActiveModal("leaderboard_division");
                      }}
                      className="hover:bg-blue-50/40 transition-all text-gray-750 cursor-pointer select-none group"
                    >
                      {/* Rank badge */}
                      <td className="py-3 px-2 text-center">
                        {idx === 0 ? (
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-[11px] tabular-nums mx-auto group-hover:scale-110 transition-transform">
                            1
                          </div>
                        ) : idx === 1 ? (
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-extrabold text-[11px] tabular-nums mx-auto group-hover:scale-110 transition-transform">
                            2
                          </div>
                        ) : idx === 2 ? (
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-extrabold text-[11px] tabular-nums mx-auto group-hover:scale-110 transition-transform">
                            3
                          </div>
                        ) : (
                          <span className="tabular-nums font-bold text-gray-400 text-xs text-center block">
                            {idx + 1}
                          </span>
                        )}
                      </td>

                      {/* Division Label */}
                      <td className="py-3 px-3">
                        <strong className="block whitespace-normal break-words text-[12.5px] font-bold leading-snug text-gray-800 transition-colors group-hover:text-blue-700">
                          {row.division}
                        </strong>
                      </td>

                      {/* SLA bar row */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${row.sla}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                          <span className="w-10 shrink-0 text-right tabular-nums font-extrabold text-[12.5px] text-gray-850">
                            {row.sla}%
                          </span>
                        </div>
                        <span className="mt-1 block text-[10.5px] font-semibold text-gray-400 @xl:hidden">
                          {row.evaluated} dievaluasi
                        </span>
                      </td>

                      {/* Over SLA: jumlah proyek Not Achieved dan total harinya */}
                      <td className="py-3 px-2 text-center">
                        {row.not > 0 ? (
                          <>
                            <span className="block whitespace-nowrap text-[12px] font-extrabold leading-tight text-[#B91C1C]">
                              {row.not} proyek
                            </span>
                            {row.overSlaDays !== null && (
                              <span className="mt-0.5 block whitespace-nowrap text-[11px] font-bold leading-tight text-rose-600">
                                {row.overSlaDays} hari
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="tabular-nums font-bold text-gray-300 text-[12px]">
                            0
                          </span>
                        )}
                      </td>

                      {/* Evaluated total logs */}
                      <td className="hidden py-3 px-3 text-center text-gray-450 tabular-nums text-[12px] font-bold @xl:table-cell">
                        {row.evaluated}
                      </td>
                    </tr>
                  );
                })}
                {filteredLeaderboard.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-xs text-gray-400 font-sans"
                    >
                      Leaderboard target tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Responsive interactive drill-down pop-up modals */}
      {activeModal && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
          {/* Backdrop blur effect */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
            {...backdropDismissProps(closeActiveModal)}
          />

          {/* Modal Content container */}
          <div className="z-10 flex w-full max-w-5xl max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200 leading-normal">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/50 px-4 py-4 select-none sm:items-center sm:px-6 sm:py-5">
              <div>
                <h3 className="text-base font-extrabold font-display text-gray-900 tracking-tight flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-600 text-white tabular-nums text-[10px] rounded-sm uppercase font-extrabold">
                    Audit
                  </span>
                  {activeModal === "classification" &&
                    "Project Classification Detail"}
                  {activeModal === "requested" && "Requested Division Listing"}
                  {activeModal === "average" && `${averageYearLabel} Details`}
                  {activeModal === "low_sla" &&
                    `Low SLA Division: ${lowestSlaDiv?.division ?? "Belum dievaluasi"}`}
                  {activeModal === "leaderboard_division" &&
                    `Projects for Division: ${selectedDivision}`}
                  {activeModal === "active_division" &&
                    `Active Projects: ${selectedDivision}`}
                  {activeModal === "active_type" &&
                    `Active Projects: ${selectedType}`}
                </h3>
              </div>
              <button
                onClick={closeActiveModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer text-xs font-bold tabular-nums"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Table body with strict anti-truncation layouts */}
            <div className="flex-1 overflow-y-auto p-3 max-h-[58vh] sm:p-6">
              {activeModal === "average" && (
                <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10.5px] font-medium leading-relaxed text-emerald-800">
                  {overallSlaEvaluation.contributors} evaluasi tahap dari{" "}
                  {modalProjects.length} proyek pada {slaPeriodLabel}.
                </div>
              )}

              {/* Classification Top Summary badges */}
              {activeModal === "classification" &&
                groupedClassificationData && (
                  <div className="flex flex-wrap gap-2 mb-5 select-none text-xs">
                    {(
                      Object.entries(groupedClassificationData) as [
                        string,
                        SanitizedProject[],
                      ][]
                    ).map(([gName, list]) => (
                      <span
                        key={gName}
                        className="font-semibold text-gray-750 bg-slate-50 px-3 py-1.5 rounded-xl border border-gray-150 inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <strong className="text-blue-600 font-extrabold">
                          {gName}:
                        </strong>
                        <span className="tabular-nums font-black text-gray-900 bg-white px-1.5 py-0.5 rounded-md border border-gray-100">
                          {list.length}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

              {/* Active project count per status group */}
              {groupedActiveData && (
                <div className="flex flex-wrap gap-2 mb-5 select-none text-xs">
                  {groupedActiveData.map(([gName, list]) => (
                    <span
                      key={gName}
                      className="font-semibold text-gray-750 bg-slate-50 px-3 py-1.5 rounded-xl border border-gray-150 inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <strong className="text-blue-600 font-extrabold">
                        {gName}:
                      </strong>
                      <span className="tabular-nums font-black text-gray-900 bg-white px-1.5 py-0.5 rounded-md border border-gray-100">
                        {list.length}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {/* Requested Division Top Summary cards */}
              {activeModal === "requested" && groupedRequestedData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mb-5 select-none">
                  {(
                    Object.entries(groupedRequestedData) as [
                      string,
                      SanitizedProject[],
                    ][]
                  ).map(([gName, list]) => (
                    <div
                      key={gName}
                      className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs whitespace-normal break-words shadow-2xs"
                    >
                      <span className="font-bold text-gray-700 whitespace-normal break-words leading-tight max-w-[75%]">
                        {gName}
                      </span>
                      <span className="tabular-nums font-extrabold bg-blue-105 text-blue-800 px-2.5 py-1 rounded-lg text-xs flex-shrink-0">
                        {list.length}{" "}
                        {list.length === 1 ? "Project" : "Projects"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {modalProjects.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400 font-semibold font-sans">
                  Tidak ada record proyek pada kategori atau divisi terpilih
                  untuk periode ini.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-xs">
                  <table className="w-full text-left text-[11.5px] border-collapse font-sans">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-[10px] text-gray-500 font-bold uppercase tracking-wider font-display select-none">
                        <th className="py-3 px-4 text-center w-12 whitespace-normal break-words">
                          No
                        </th>
                        <th className="py-3 px-3 w-28 whitespace-normal break-words">
                          Ticket
                        </th>
                        <th className="py-3 px-3 whitespace-normal break-words min-w-[200px]">
                          Project Name
                        </th>
                        {/* Popup per divisi tidak mengulang divisi di tiap baris. */}
                        {!showDevSlaDetails && (
                          <th className="py-3 px-3 whitespace-normal break-words min-w-[150px]">
                            {activeModal === "average"
                              ? "Evaluated Gate SLAs"
                              : activeModal === "active_division"
                                ? "Type Project"
                                : "Owner Div"}
                          </th>
                        )}
                        {showActiveDetails && (
                          <th className="py-3 px-3 whitespace-normal break-words min-w-[150px]">
                            PIC
                          </th>
                        )}
                        <th className="py-3 px-3 w-32 whitespace-normal break-words">
                          Last Status
                        </th>
                        {activeModal !== "average" && (
                          <th className="py-3 px-3 min-w-[136px] text-center whitespace-normal break-words">
                            Priority
                          </th>
                        )}
                        {showDevSlaDetails && (
                          <>
                            <th className="py-3 px-3 w-36 whitespace-normal break-words">
                              DEV SLA
                            </th>
                            <th className="py-3 px-3 whitespace-normal break-words min-w-[280px]">
                              DEV Delay Reason (Source)
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {(() => {
                        let runningNo = 1;

                        const renderRow = (p: SanitizedProject) => {
                          const sGroup = statusGroupOf(p["Last Status"]);
                          const statusColor =
                            getStatusGroupPalette(sGroup).pill;

                          const devSlaStatus = String(
                            p["DEV SLA"] ?? "",
                          ).trim();
                          const devSlaColor =
                            devSlaStatus === "Achieved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : devSlaStatus === "Not Achieved"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-gray-50 text-gray-600 border-gray-200";
                          const devDelayCategory = displaySourceValue(
                            p["(Dev) Kategori Alasan Terlambat >=2022"],
                          );
                          const devDelayDescription = displaySourceValue(
                            p["(Dev) Deskripsi Terlambat >=2022"],
                          );
                          const devOverSlaDays = getDevOverSlaDays(p);

                          return (
                            <tr
                              key={`${p.notion_page_id || p["Ticket"] || "pt"}-${runningNo}`}
                              className="hover:bg-gray-50/50 transition-colors text-gray-700"
                            >
                              <td className="py-3 px-4 text-center tabular-nums font-bold text-gray-400 whitespace-normal break-words">
                                {runningNo++}
                              </td>
                              <td className="py-3 px-3 tabular-nums font-semibold text-gray-500 whitespace-normal break-words">
                                {displaySourceValue(p["Ticket"])}
                              </td>
                              <td className="py-3 px-3 font-bold text-gray-900 whitespace-normal break-words leading-relaxed select-text">
                                {displaySourceValue(p["Project Name"])}
                              </td>
                              {!showDevSlaDetails && (
                                <td className="py-3 px-3 whitespace-normal break-words">
                                  {activeModal === "average" ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {(
                                        [
                                          ["FSD", "FSD SLA", "FSD SLA YEAR"],
                                          ["DEV", "DEV SLA", "DEV SLA YEAR"],
                                          ["SIT", "SIT SLA", "SIT SLA YEAR"],
                                          ["UAT", "UAT SLA", "UAT SLA YEAR"],
                                          ["LIVE", "Live SLA", "LIVE SLA YEAR"],
                                        ] as const
                                      ).map(([label, slaField, yearField]) => {
                                        const value = p[slaField];
                                        if (
                                          !isMatchingSlaYear(
                                            p[yearField],
                                            slaSelectedYear,
                                          ) ||
                                          !isValidSlaResult(value) ||
                                          !isStageRealizedInMonths(
                                            p,
                                            label,
                                            slaSelectedYear,
                                            monthWindow,
                                          )
                                        ) {
                                          return null;
                                        }

                                        const isAchieved = value === "Achieved";
                                        const displayValue = value;
                                        return (
                                          <HoverTip
                                            key={slaField}
                                            content={`${label} SLA ${slaPeriodLabel}: ${displayValue}`}
                                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm border uppercase leading-none ${
                                              isAchieved
                                                ? "bg-emerald-50 text-emerald-800 border-emerald-100/50"
                                                : "bg-rose-50 text-rose-800 border-rose-100/50"
                                            }`}
                                          >
                                            {label}: {displayValue}
                                          </HoverTip>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span className="font-semibold text-gray-650 whitespace-normal break-words">
                                      {displaySourceValue(
                                        activeModal === "active_division"
                                          ? p["Type Project"]
                                          : getCategoryDivision(p),
                                      )}
                                    </span>
                                  )}
                                </td>
                              )}
                              {showActiveDetails && (
                                <td className="py-3 px-3 whitespace-normal break-words font-semibold text-gray-650">
                                  {displaySourceValue(p["PIC Name"])}
                                </td>
                              )}
                              <td className="py-3 px-3 whitespace-normal break-words">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border uppercase leading-none inline-block ${statusColor}`}
                                >
                                  {displaySourceValue(p["Last Status"])}
                                </span>
                              </td>
                              {activeModal !== "average" && (
                                <td className="py-3 px-3 text-center whitespace-normal break-words">
                                  <PriorityBadge value={p["Prioritas Mgmt"]} />
                                </td>
                              )}
                              {showDevSlaDetails && (
                                <>
                                  <td className="py-3 px-3 whitespace-normal break-words">
                                    <span
                                      className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${devSlaColor}`}
                                    >
                                      {displaySourceValue(
                                        devSlaStatus,
                                        "Belum dievaluasi",
                                      )}
                                    </span>
                                    {devOverSlaDays !== null && (
                                      <span className="mt-1.5 block whitespace-nowrap text-[10.5px] font-extrabold text-rose-700">
                                        Over SLA {devOverSlaDays} hari
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 whitespace-normal break-words font-medium text-gray-650 leading-relaxed select-text">
                                    <div className="space-y-1.5">
                                      <p>
                                        <strong className="font-bold text-gray-700">
                                          (Dev) Kategori Alasan Terlambat
                                          &gt;=2022:
                                        </strong>{" "}
                                        {devDelayCategory}
                                      </p>
                                      <p>
                                        <strong className="font-bold text-gray-700">
                                          (Dev) Deskripsi Terlambat &gt;=2022:
                                        </strong>{" "}
                                        {devDelayDescription}
                                      </p>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        };

                        if (
                          activeModal === "classification" &&
                          groupedClassificationData
                        ) {
                          return (
                            Object.entries(groupedClassificationData) as [
                              string,
                              SanitizedProject[],
                            ][]
                          ).map(([groupName, list]) => (
                            <React.Fragment key={groupName}>
                              <tr className="bg-blue-50/20 border-y border-blue-100/60 font-sans select-none">
                                <td
                                  colSpan={6}
                                  className="py-2.5 px-4 font-extrabold text-xs text-blue-900 whitespace-normal break-words tracking-tight uppercase leading-none"
                                >
                                  {groupName}{" "}
                                  <span className="text-blue-600 tabular-nums font-extrabold">
                                    ({list.length}{" "}
                                    {list.length === 1 ? "Project" : "Projects"}
                                    )
                                  </span>
                                </td>
                              </tr>
                              {list.map((p) => renderRow(p))}
                            </React.Fragment>
                          ));
                        }

                        if (
                          activeModal === "requested" &&
                          groupedRequestedData
                        ) {
                          return (
                            Object.entries(groupedRequestedData) as [
                              string,
                              SanitizedProject[],
                            ][]
                          ).map(([groupName, list]) => (
                            <React.Fragment key={groupName}>
                              <tr className="bg-indigo-50/20 border-y border-indigo-100/60 font-sans select-none">
                                <td
                                  colSpan={6}
                                  className="py-2.5 px-4 font-black text-xs text-indigo-900 whitespace-normal break-words tracking-tight uppercase leading-none"
                                >
                                  {groupName}{" "}
                                  <span className="text-indigo-600 tabular-nums font-extrabold">
                                    ({list.length}{" "}
                                    {list.length === 1 ? "Project" : "Projects"}
                                    )
                                  </span>
                                </td>
                              </tr>
                              {list.map((p) => renderRow(p))}
                            </React.Fragment>
                          ));
                        }

                        if (groupedActiveData) {
                          return groupedActiveData.map(([groupName, list]) => (
                            <React.Fragment key={groupName}>
                              <tr className="bg-blue-50/20 border-y border-blue-100/60 font-sans select-none">
                                <td
                                  colSpan={7}
                                  className="py-2.5 px-4 font-extrabold text-xs text-blue-900 whitespace-normal break-words tracking-tight uppercase leading-none"
                                >
                                  {groupName}{" "}
                                  <span className="text-blue-600 tabular-nums font-extrabold">
                                    ({list.length}{" "}
                                    {list.length === 1 ? "Project" : "Projects"}
                                    )
                                  </span>
                                </td>
                              </tr>
                              {list.map((p) => renderRow(p))}
                            </React.Fragment>
                          ));
                        }

                        return modalProjects.map((p) => renderRow(p));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end select-none">
              <button
                onClick={closeActiveModal}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
