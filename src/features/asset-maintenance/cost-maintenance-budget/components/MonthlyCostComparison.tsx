"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import ChartCard from "@/components/shared/ChartCard";
import FilterSelect from "@/components/shared/FilterSelect";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useAssetFilters } from "@/hooks/useAssetFilters";
import { cn, fmt } from "@/lib/utils";
import MonthlyCellDetailModal, {
  type MonthlyCellDetailModalData,
} from "./MonthlyCellDetailModal";
import type { MonthlyCostComparisonResult } from "../types/cost.types";

interface MonthlyCostComparisonProps {
  data?: MonthlyCostComparisonResult;
  className?: string;
}

const EMPTY_COMPARISON: MonthlyCostComparisonResult = {
  regions: [],
  months: [],
  rows: [],
};

export default function MonthlyCostComparison({
  data = EMPTY_COMPARISON,
  className,
}: MonthlyCostComparisonProps) {
  const { input } = useAssetFilters();
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [page, setPage] = useState<number>(1);
  const pageSize = 20;
  const [modalData, setModalData] = useState<MonthlyCellDetailModalData | null>(
    null,
  );

  const { regions, months, rows } = data;

  // Options for Region FilterSelect
  const regionOptions = [
    { label: "All Region", value: "all" },
    ...regions.map((r) => ({ label: r.label, value: r.region })),
  ];

  // Filter rows based on region selection and search query
  const filteredRows = rows.filter((r) => {
    if (
      selectedRegion !== "all" &&
      r.region.toLowerCase() !== selectedRegion.toLowerCase()
    ) {
      return false;
    }
    if (
      debouncedSearch.trim() &&
      !r.site.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Filter region cards based on selectedRegion
  const filteredRegions = regions.filter((r) => {
    if (
      selectedRegion !== "all" &&
      r.region.toLowerCase() !== selectedRegion.toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  // Pagination calculation
  const totalCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalCount);

  const handleReset = () => {
    setSelectedRegion("all");
    setSearchQuery("");
    setPage(1);
    setModalData(null);
  };

  return (
    <>
      <ChartCard
        title="Monthly R&M Cost Comparison"
        subtitle="Klik sel untuk melihat jumlah perangkat, sewa, dan repair bulan tersebut"
        className={className}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Region FilterSelect */}
            <FilterSelect
              label="Region"
              value={selectedRegion}
              onValueChange={(val) => {
                setSelectedRegion(val);
                setPage(1);
              }}
              options={regionOptions}
            />

            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <span className="pointer-events-none absolute left-2.5 top-1/2 inline-flex -translate-y-1/2 text-zinc-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari site / unit..."
                aria-label="Cari site / unit"
                className="h-8 w-full sm:w-40 rounded-xl border border-zinc-200 bg-white py-1 pl-8 pr-3 text-xs text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            {/* Reset Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 rounded-xl border-blue-200 bg-blue-50 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
            >
              Reset
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Total Per Region Section */}
          <div className="border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              TOTAL PER REGION
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {filteredRegions.map((g) => (
                <div
                  key={g.region}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {g.label}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400">
                      {g.siteCount} site
                    </span>
                  </div>

                  <div className="mt-1 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    {g.totalFmt}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      style={{ width: g.sewaBar }}
                      className="h-full bg-blue-600 transition-all duration-300"
                    />
                    <div
                      style={{ width: g.repairBar }}
                      className="h-full bg-blue-300 dark:bg-blue-400 transition-all duration-300"
                    />
                  </div>

                  {/* Sewa & Repair summary */}
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Sewa{" "}
                      <b className="font-bold text-zinc-800 dark:text-zinc-200">
                        {g.sewaFmt}
                      </b>
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Repair{" "}
                      <b className="font-bold text-zinc-800 dark:text-zinc-200">
                        {g.repairFmt}
                      </b>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-225 text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold text-zinc-500 uppercase tracking-wider dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <th className="sticky left-0 z-10 bg-zinc-50 px-3.5 py-2.5 text-left dark:bg-zinc-900">
                    SITE / UNIT
                  </th>
                  {months.map((m) => (
                    <th key={m} className="px-3 py-2.5 text-right font-bold">
                      {m}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right font-bold text-blue-600 dark:text-blue-400">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={months.length + 2}
                      className="py-8 text-center text-xs text-zinc-400"
                    >
                      Tidak ada data yang cocok
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((r) => (
                    <tr
                      key={r.site}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="sticky left-0 z-10 bg-white px-3.5 py-2.5 font-bold text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {r.site}
                      </td>
                      {months.map((m) => {
                        const cell = r.cells[m];
                        const hasVal = cell && cell.value > 0;
                        return (
                          <td
                            key={m}
                            onClick={() => {
                              if (hasVal) {
                                setModalData({
                                  site: r.site,
                                  region: r.region,
                                  type:
                                    r.site.toLowerCase().includes("unit") ||
                                    r.site === "IT" ||
                                    r.site === "GA"
                                      ? "Unit kerja"
                                      : "Cabang",
                                  month: m,
                                  total: cell.value,
                                  rowTotal: r.total,
                                });
                              }
                            }}
                            title={
                              hasVal
                                ? `${r.site} (${m}): Rp ${fmt(cell.value)} — Klik untuk lihat rincian`
                                : undefined
                            }
                            className={cn(
                              "px-3 py-2.5 text-right border-l border-zinc-100 dark:border-zinc-800/60 transition-colors",
                              hasVal
                                ? "bg-blue-50/70 dark:bg-blue-950/30 text-zinc-900 dark:text-zinc-100 font-semibold cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                : "text-zinc-300 dark:text-zinc-700",
                            )}
                          >
                            {cell ? cell.text : "-"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-right font-bold text-blue-600 dark:text-blue-400 border-l border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/30">
                        {r.totalText}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800 text-xs">
            <div className="text-zinc-500 dark:text-zinc-400">
              Menampilkan{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {startEntry}
              </span>{" "}
              –{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {endEntry}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {totalCount}
              </span>{" "}
              data
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:disabled:hover:bg-zinc-900 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              <span className="px-2 font-medium text-zinc-600 dark:text-zinc-400">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:disabled:hover:bg-zinc-900 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Popup Modal Detail Biaya R&M Bulan Ini */}
      <MonthlyCellDetailModal
        data={modalData}
        input={input}
        onClose={() => setModalData(null)}
      />
    </>
  );
}
