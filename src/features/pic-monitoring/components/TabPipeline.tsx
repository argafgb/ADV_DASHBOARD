"use client";

import React, { useCallback, useMemo, useState } from "react";
import type { DashboardDataset, SanitizedProject } from "../types/types";
import { filterPipelineProjects, type PipelineProjectFilter } from "../utils/parser";
import { Card, ChipRow, Icon, Pill } from "./UI";
import { StackedBar, VBarChart, ThroughputComparisonChart } from "./Charts";
import { TipScope } from "./chart-tooltip";
import { getStatusPalette } from "../utils/status-style";
import { useModalDismiss, backdropDismissProps } from "../utils/use-modal-dismiss";

const PIPELINE_FILTERS = [
  "Total Projects",
  "Completed",
  "Active",
] as const satisfies readonly PipelineProjectFilter[];

function getPipelineFilter(label: string): PipelineProjectFilter | undefined {
  return PIPELINE_FILTERS.find((filter) => filter === label);
}

function displayValue(...values: unknown[]): string {
  const value = values.find(
    (candidate) =>
      candidate !== null &&
      candidate !== undefined &&
      String(candidate).trim() !== "",
  );
  return value === undefined ? "Belum diisi" : String(value);
}

interface TabPipelineProps {
  dataset: DashboardDataset;
  filteredProjects: SanitizedProject[];
  startYear: number;
  endYear: number;
}

export function getPipelineContributorsForYear(
  projects: readonly SanitizedProject[],
  selectedYear: number,
): Record<PipelineProjectFilter, SanitizedProject[]> {
  const selectedYearProjects = projects.filter(
    (project) => project._year === String(selectedYear),
  );

  return {
    "Total Projects": filterPipelineProjects(
      selectedYearProjects,
      "Total Projects",
    ),
    Completed: filterPipelineProjects(selectedYearProjects, "Completed"),
    Active: filterPipelineProjects(selectedYearProjects, "Active"),
  };
}

export function TabPipeline({
  dataset,
  filteredProjects: globalBaseProjects,
  startYear,
  endYear,
}: TabPipelineProps) {
  const { pipelineChips, projectsByYear, onQueue, throughput, depth } = dataset;
  const selectedYear = endYear ?? startYear;
  const selectedYearLabel = String(selectedYear);
  const previousYearLabel = Number.isFinite(selectedYear)
    ? String(selectedYear - 1)
    : (depth[0]?.year ?? selectedYearLabel);
  const comparisonYears = new Set([previousYearLabel, selectedYearLabel]);
  const comparisonProjectsByYear = projectsByYear.filter(({ year }) =>
    comparisonYears.has(year),
  );
  const comparisonDepth = depth.filter(({ year }) => comparisonYears.has(year));

  const pipelineContributors = useMemo(
    () => getPipelineContributorsForYear(globalBaseProjects, selectedYear),
    [globalBaseProjects, selectedYear],
  );
  const scopedPipelineChips = pipelineChips.map((chip) => {
    const filter = getPipelineFilter(chip.label);
    return filter
      ? { ...chip, value: pipelineContributors[filter].length }
      : chip;
  });

  const depthMax =
    Math.max(
      ...comparisonDepth.map((item) => item.completed + item.inflight),
      10,
    ) * 1.1;

  // Set up pagination for queue
  const [queuePage, setQueuePage] = useState(1);
  const queuePageSize = 5;
  const totalQueueItems = onQueue.top.length;
  const totalQueuePages = Math.ceil(totalQueueItems / queuePageSize) || 1;
  const currentQueuePage = Math.min(queuePage, totalQueuePages);
  const currentQueueItems = onQueue.top.slice(
    (currentQueuePage - 1) * queuePageSize,
    currentQueuePage * queuePageSize,
  );

  // Set up modal state
  const [activeModal, setActiveModal] = useState<PipelineProjectFilter | null>(
    null,
  );
  const closeActiveModal = useCallback(
    () => setActiveModal(null),
    [setActiveModal],
  );
  useModalDismiss(activeModal !== null, closeActiveModal);

  const modalProjects = activeModal ? pipelineContributors[activeModal] : [];

  return (
    <div className="space-y-6">
      {/* Overview Stat Chips with clickable interaction details */}
      <ChipRow
        chips={scopedPipelineChips}
        activeFilter={activeModal || undefined}
        onFilterChange={(label) => {
          const filter = getPipelineFilter(label);
          if (filter) setActiveModal(filter);
        }}
      />

      {/* Row 1: Completion Rate full-width */}
      <Card
        title="Completion Rate (Go-Live Throughput)"
        sub="Realisasi go-live per bulan"
        padding="p-5"
      >
        <div className="mt-2">
          <ThroughputComparisonChart
            data={throughput.comparison || []}
            height={300}
            previousYearLabel={previousYearLabel}
            selectedYearLabel={selectedYearLabel}
          />
        </div>
        {/* Legend order mirrors the bars: previous year on the left. */}
        <div className="border-t border-gray-50 pt-3 mt-3.5 flex flex-wrap items-center gap-4 text-xs text-gray-400 font-sans">
          <span className="flex items-center gap-1.5 font-medium text-gray-500">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB] inline-block" />{" "}
            {previousYearLabel} Completed Projects
          </span>
          <span className="flex items-center gap-1.5 font-medium text-gray-500">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B] inline-block" />{" "}
            {selectedYearLabel} Completed Projects
          </span>
        </div>
      </Card>

      {/* Row 2: Queue di kiri, Volume + Disposition + Depth di kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Queue Management */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <Card
            title="Queue"
            sub="Backlog intake terverifikasi yang masih menunggu diproses"
            rightElement={
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg tabular-nums">
                {onQueue.total} in queue
              </span>
            }
            padding="p-4.5"
            className="flex-1"
          >
            {/* Dynamic Status Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4 select-none">
              {onQueue.types.map((tp, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-100/50 p-2.5 rounded-xl text-center"
                >
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                    {tp.label}
                  </span>
                  <span className="text-xl font-bold tabular-nums tracking-tight block mt-0.5 text-amber-600">
                    {tp.value}
                  </span>
                </div>
              ))}
            </div>

            {/* List on queue projects */}
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 font-display">
              Top Priority In Queue
            </h4>
            <div className="divide-y divide-gray-55 flex-1 flex flex-col justify-between">
              <div className="space-y-0.5 min-h-[195px]">
                {currentQueueItems.map((p, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between border-b border-gray-50 last:border-none"
                  >
                    <span className="text-[11.5px] font-semibold text-gray-800 truncate pr-2 flex-1">
                      {displayValue(p.name)}
                    </span>
                    <div className="flex-shrink-0">
                      <Pill label={displayValue(p.status)} status={p.status} />
                    </div>
                  </div>
                ))}
                {currentQueueItems.length === 0 && (
                  <div className="py-12 text-center text-xs text-gray-400">
                    Tidak ada proyek dalam antrean.
                  </div>
                )}
              </div>

              {/* Minimalist Pagination controls inside queue card */}
              {totalQueuePages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 font-sans">
                  <span>
                    Page <strong>{currentQueuePage}</strong> of{" "}
                    <strong>{totalQueuePages}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={currentQueuePage === 1}
                      onClick={() =>
                        setQueuePage(Math.max(1, currentQueuePage - 1))
                      }
                      className="px-2.5 py-1 bg-white border border-gray-250 hover:bg-gray-50 text-[11px] font-bold rounded-lg cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed select-none"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentQueuePage === totalQueuePages}
                      onClick={() =>
                        setQueuePage(
                          Math.min(totalQueuePages, currentQueuePage + 1),
                        )
                      }
                      className="px-2.5 py-1 bg-white border border-gray-250 hover:bg-gray-50 text-[11px] font-bold rounded-lg cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed select-none"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Volume + Depth */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Delivery Volume Year-on-Year */}
          <Card
            title={`Project Volume (${previousYearLabel}–${selectedYearLabel})`}
            sub="Jumlah proyek diajukan per tahun"
            padding="p-5"
          >
            <VBarChart
              data={comparisonProjectsByYear}
              height={190}
              seriesLabel="Proyek diajukan"
            />
          </Card>

          {/* Depth Card */}
          <Card
            title={`Delivery Depth (${previousYearLabel}–${selectedYearLabel})`}
            sub="Selesai dan masih aktif per tahun Project diajukan"
            padding="p-5"
            className="flex-1"
          >
            <TipScope
              className="space-y-4 mt-2"
              getTip={(year) => {
                const item = comparisonDepth.find(
                  (depthItem) => depthItem.year === year,
                );
                if (!item) return null;
                return {
                  title: `Tahun ${item.year}`,
                  rows: [
                    {
                      color: "#2563EB",
                      label: "Selesai",
                      value: item.completed,
                    },
                    { color: "#FBBF24", label: "Aktif", value: item.inflight },
                    { label: "Total", value: item.completed + item.inflight },
                  ],
                };
              }}
            >
              {comparisonDepth.map((item) => (
                <StackedBar
                  key={item.year}
                  year={item.year}
                  completed={item.completed}
                  inflight={item.inflight}
                  max={depthMax}
                />
              ))}
            </TipScope>
            <div className="border-t border-gray-50 pt-2.5 mt-4 flex flex-wrap items-center gap-4 text-[10.5px] font-semibold tracking-wide text-gray-500 uppercase font-display">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-blue-600 block" />{" "}
                Selesai
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-amber-400 block" /> Aktif
              </span>
            </div>
            <div className="pt-2.5 text-[11px] text-gray-400 font-sans italic leading-relaxed">
              Selesai = status Live. Aktif = proyek yang masih berjalan di tahap
              mana pun (antrian, proses, UAT, monitoring, hold, atau change
              request).
            </div>
          </Card>
        </div>
      </div>

      {/* Dynamic Pop-up Modal with absolute backdrop focus */}
      {activeModal && (
        <div
          className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          {...backdropDismissProps(closeActiveModal)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pipeline-detail-title"
            className="flex w-full max-w-6xl max-h-[80vh] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 px-4 py-4 sm:items-center sm:px-6 sm:py-5">
              <div>
                <h3
                  id="pipeline-detail-title"
                  className="text-base font-bold text-gray-900 font-display"
                >
                  Rincian Proyek {activeModal}
                </h3>
                <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                  Menampilkan {modalProjects.length} proyek sesuai kategori dan
                  rentang filter yang sedang aktif
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup rincian proyek"
                onClick={() => setActiveModal(null)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-650 sm:h-8 sm:w-8"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            {/* Content Table */}
            <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
              {modalProjects.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-sans">
                  Tidak ada data project yang sesuai dengan kategori ini.
                </div>
              ) : (
                <table className="min-w-205 w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display">
                      <th className="py-2.5 px-3">Ticket</th>
                      <th className="py-2.5 px-3">Project Name</th>
                      <th className="py-2.5 px-3">Owner Div</th>
                      <th className="py-2.5 px-3">PIC Name</th>
                      <th className="min-w-24 py-2.5 px-3 text-center">
                        Period
                      </th>
                      <th className="min-w-32 py-2.5 px-3 text-right">
                        Last Status
                      </th>
                      <th className="py-2.5 px-3 text-right font-display">
                        Milestone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {modalProjects.map((p, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-55/20 transition-colors"
                      >
                        <td className="py-3 px-3 tabular-nums font-bold text-gray-500">
                          {displayValue(p["Ticket"])}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-900 pr-4">
                          {displayValue(p["Project Name"])}
                        </td>
                        <td className="py-3 px-3 font-medium text-gray-600">
                          {displayValue(p["Owner Div"])}
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {displayValue(p["PIC Short Name"], p["PIC Name"])}
                        </td>
                        <td className="whitespace-nowrap py-3 px-3 text-center tabular-nums text-gray-500">
                          {displayValue(p["Period"])}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusPalette(p["Last Status"]).pill}`}
                          >
                            {displayValue(p["Last Status"])}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            {displayValue(p["Milestone"])}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-4 py-3 sm:px-6">
              <span className="text-xs text-zinc-400">
                Total {modalProjects.length} proyek
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
      )}
    </div>
  );
}
