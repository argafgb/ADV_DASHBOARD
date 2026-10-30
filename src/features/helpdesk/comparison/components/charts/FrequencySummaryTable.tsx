"use client";

import { useState, useEffect, useTransition, useCallback, Fragment } from "react";
import {
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  Building2,
  Ticket,
  Loader2,
  RotateCw,
} from "lucide-react";
import { comparisonPeriodLabel } from "../../utils/comparisonPeriod";
import { INDONESIAN_MONTH_NAMES } from "@/lib/helpdesk/month-filter";
import type {
  TicketMonthlyComparison,
  MonthlyCategoryComparison,
  MonthlyAppMenuComparison,
  AppMenuFieldIssueDetail,
} from "../../types/comparison.types";
import type { SlaTrendComparison } from "@/features/helpdesk/sla-performance/types/slaPerformance.types";
import {
  fetchAppMenuFieldIssuesAction,
  syncAppMenuFieldIssuesAction,
} from "../../actions/summaryTableActions";
import {
  paginateSummary,
  calculateGrowthPercentage,
  type PaginatedResult,
} from "../../utils/summaryTableUtils";
import AppMenuIssueDetailModal from "../AppMenuIssueDetailModal";

interface FrequencySummaryTableProps {
  title: string;
  data:
    | TicketMonthlyComparison[]
    | SlaTrendComparison[]
    | MonthlyCategoryComparison[]
    | MonthlyAppMenuComparison[];
  selectedYear: number;
  type?: "frequency" | "sla" | "perProblem" | "appMenu";
  dept?: string;
  month?: string;
  quarter?: string;
}

const ITEMS_PER_PAGE = 12;
type SummaryRow =
  | TicketMonthlyComparison
  | SlaTrendComparison
  | MonthlyCategoryComparison
  | MonthlyAppMenuComparison;

function SummaryTableRowsSkeleton({ columns }: { columns: number }) {
  return Array.from({ length: 6 }).map((_, row) => (
    <tr key={row} className="animate-pulse">
      {Array.from({ length: columns }).map((__, column) => (
        <td key={column} className="py-3">
          <div
            className={`h-4 rounded bg-slate-100 dark:bg-zinc-800 ${
              column === 0 ? "w-20" : "ml-auto w-16"
            }`}
          />
        </td>
      ))}
    </tr>
  ));
}

export default function FrequencySummaryTable({
  title,
  data,
  selectedYear,
  type = "frequency",
  dept = "ALL",
  month = "ALL",
  quarter = "ALL",
}: FrequencySummaryTableProps) {
  const prevYear = selectedYear - 1;
  const periodLabel = comparisonPeriodLabel(month, quarter);
  const [page, setPage] = useState<number>(1);
  const [paginatedResult, setPaginatedResult] =
    useState<PaginatedResult<SummaryRow> | null>(null);
  const [isPending, startTransition] = useTransition();

  // AppMenu Field Issue Drilldown States
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [subRowYear, setSubRowYear] = useState<number>(selectedYear);
  const [issueDataCache, setIssueDataCache] = useState<
    Record<string, AppMenuFieldIssueDetail>
  >({});
  const [loadingRowKey, setLoadingRowKey] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<MonthlyAppMenuComparison | null>(null);
  const [modalDetail, setModalDetail] = useState<AppMenuFieldIssueDetail | null>(
    null,
  );
  const [modalLoading, setModalLoading] = useState(false);

  // Reset pagination & expanded row after the selected dataset changes.
  useEffect(() => {
    queueMicrotask(() => {
      setPage(1);
      setExpandedRowKey(null);
      setIssueDataCache({});
      setRowErrors({});
    });
  }, [data, selectedYear, type, dept, month, quarter]);

  // Paginate table rows locally; the card title and table header stay mounted.
  useEffect(() => {
    startTransition(() => {
      const res = paginateSummary<SummaryRow>(
        data,
        page,
        ITEMS_PER_PAGE,
      );
      setPaginatedResult(res);
    });
  }, [page, data]);

  const fetchIssuesForAppMenu = useCallback(
    async (
      item: MonthlyAppMenuComparison,
      targetYear: number,
      bypassCache = false,
    ): Promise<AppMenuFieldIssueDetail> => {
      const rowKey = `${item.month}-${item.app}-${item.feature}`;
      const cacheKey = `${rowKey}-${targetYear}-${dept}-${month}-${quarter}`;

      if (
        !bypassCache &&
        issueDataCache[cacheKey] &&
        issueDataCache[cacheKey].totalTickets > 0
      ) {
        return issueDataCache[cacheKey];
      }

      setLoadingRowKey(rowKey);
      setRowErrors((prev) => {
        if (!prev[cacheKey]) return prev;
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });

      try {
        const actionFn = bypassCache
          ? syncAppMenuFieldIssuesAction
          : fetchAppMenuFieldIssuesAction;

        const res = await actionFn({
          year: targetYear,
          month,
          quarter,
          app: item.app,
          feature: item.feature,
          dept,
        });

        if (res && res.totalTickets >= 0) {
          setIssueDataCache((prev) => ({
            ...prev,
            [cacheKey]: res,
          }));
          return res;
        }

        throw new Error("Respon tidak valid dari server");
      } catch (err) {
        console.error("Gagal memuat detail kendala lapangan:", err);
        setRowErrors((prev) => ({ ...prev, [cacheKey]: true }));
        const fallback: AppMenuFieldIssueDetail = {
          month: item.month,
          year: targetYear,
          app: item.app,
          feature: item.feature,
          totalTickets: 0,
          topIssues: [],
          topBranches: [],
          tickets: [],
        };
        return fallback;
      } finally {
        setLoadingRowKey(null);
      }
    },
    [issueDataCache, dept, month, quarter],
  );

  const handleToggleExpand = async (item: MonthlyAppMenuComparison) => {
    const rowKey = `${item.month}-${item.app}-${item.feature}`;
    if (expandedRowKey === rowKey) {
      setExpandedRowKey(null);
      return;
    }

    setExpandedRowKey(rowKey);
    setSubRowYear(selectedYear);
    await fetchIssuesForAppMenu(item, selectedYear);
  };

  const handleSwitchYear = async (
    item: MonthlyAppMenuComparison,
    targetYear: number,
  ) => {
    setSubRowYear(targetYear);
    await fetchIssuesForAppMenu(item, targetYear);
  };

  const handleOpenModal = async (
    item: MonthlyAppMenuComparison,
    targetYear: number,
  ) => {
    setModalItem(item);
    setIsModalOpen(true);
    setModalLoading(true);
    const detail = await fetchIssuesForAppMenu(item, targetYear);
    setModalDetail(detail);
    setModalLoading(false);
  };

  const handleModalYearChange = async (targetYear: number) => {
    if (!modalItem) return;
    setSubRowYear(targetYear);
    setModalLoading(true);
    const detail = await fetchIssuesForAppMenu(modalItem, targetYear);
    setModalDetail(detail);
    setModalLoading(false);
  };

  const handleModalSync = async () => {
    if (!modalItem) return;
    setModalLoading(true);
    const detail = await fetchIssuesForAppMenu(modalItem, subRowYear, true);
    setModalDetail(detail);
    setModalLoading(false);
  };

  const isNoData =
    !data ||
    data.length === 0 ||
    data.every((item) => {
      if (type === "sla") {
        const slaItem = item as SlaTrendComparison;
        return (
          (slaItem.prevYearPercentage === 0 ||
            slaItem.prevYearPercentage === null) &&
          (slaItem.selectedYearPercentage === 0 ||
            slaItem.selectedYearPercentage === null)
        );
      }
      if (type === "appMenu") {
        const appMenuItem = item as MonthlyAppMenuComparison;
        return (
          appMenuItem.ticketsPrevYear === 0 &&
          appMenuItem.ticketsSelectedYear === 0
        );
      }
      const ticketItem = item as
        | TicketMonthlyComparison
        | MonthlyCategoryComparison;
      return (
        ticketItem.ticketsPrevYear === 0 && ticketItem.ticketsSelectedYear === 0
      );
    });

  if (isNoData) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-900">{title}</h3>
        </div>
        <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-8 my-2">
          <svg
            className="h-10 w-10 text-slate-300 mb-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3v16.5c0 .621.504 1.125 1.125 1.125h16.5c.621 0 1.125-.504 1.125-1.125V3M9 9h6M9 13h6M9 17h6"
            />
          </svg>
          <p className="text-sm font-semibold text-slate-500">
            Data Tidak Tersedia
          </p>
          <p className="text-xs text-slate-400 mt-1 text-center">
            Tidak ada data transaksi atau tiket untuk rentang waktu yang dipilih
          </p>
        </div>
      </div>
    );
  }

  const monthNames = INDONESIAN_MONTH_NAMES;

  const totalItems = paginatedResult?.totalItems ?? data.length;
  const totalPages =
    paginatedResult?.totalPages ?? Math.ceil(totalItems / ITEMS_PER_PAGE);
  const currentPage = paginatedResult?.currentPage ?? page;
  const startIndex =
    paginatedResult?.startIndex ??
    (totalItems > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0);
  const endIndex =
    paginatedResult?.endIndex ??
    Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const renderPaginationFooter = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-zinc-800/60 pt-4 text-sm text-slate-500 dark:text-zinc-400">
        <div>
          Menampilkan{" "}
          <span className="font-semibold text-slate-800 dark:text-zinc-200">{startIndex}</span> -{" "}
          <span className="font-semibold text-slate-800 dark:text-zinc-200">{endIndex}</span> dari{" "}
          <span className="font-semibold text-slate-800 dark:text-zinc-200">{totalItems}</span>{" "}
          data
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1 || isPending}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-zinc-300"
          >
            Sebelumnya
          </button>
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 px-2">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages || isPending}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-zinc-300"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    );
  };

  if (type === "sla") {
    const slaData = (paginatedResult?.items ??
      data.slice(0, ITEMS_PER_PAGE)) as SlaTrendComparison[];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-900">{title}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium">
                <th className="text-left py-2 pb-3 font-semibold">Bulan</th>
                <th className="text-right py-2 pb-3 font-semibold">
                  {prevYear} (Tahun Lalu)
                </th>
                <th className="text-right py-2 pb-3 font-semibold">
                  {selectedYear} (Tahun Saat Ini)
                </th>
                <th className="text-right py-2 pb-3 font-semibold">Selisih</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isPending ? (
                <SummaryTableRowsSkeleton columns={4} />
              ) : (
                slaData.map((item) => {
                  const gap = item.percentageGap;
                  const isDecrease = gap !== null && gap < 0;
                  const isIncrease = gap !== null && gap > 0;

                  const gapColor = isIncrease
                    ? "text-emerald-600"
                    : isDecrease
                      ? "text-rose-600"
                      : "text-slate-500";

                  const gapSign = isIncrease ? "+" : "";

                  return (
                    <tr
                      key={item.month}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 font-semibold text-slate-800">
                        {monthNames[item.month - 1] ?? String(item.month)}
                      </td>

                      <td className="py-3 text-right text-slate-600">
                        {item.prevYearPercentage !== null
                          ? `${item.prevYearPercentage.toFixed(2)}%`
                          : "-"}
                      </td>

                      <td className="py-3 text-right font-semibold text-slate-900">
                        {item.selectedYearPercentage !== null
                          ? `${item.selectedYearPercentage.toFixed(2)}%`
                          : "-"}
                      </td>

                      <td className={`py-3 text-right font-bold ${gapColor}`}>
                        {gap === null ? "-" : `${gapSign}${gap.toFixed(2)}%`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {renderPaginationFooter()}
      </div>
    );
  }

  if (type === "perProblem") {
    const probData = (paginatedResult?.items ??
      data.slice(0, ITEMS_PER_PAGE)) as MonthlyCategoryComparison[];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-zinc-50">{title}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-700 dark:text-zinc-300">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium dark:border-zinc-800 dark:text-zinc-500">
                <th className="text-left py-2 pb-3 font-semibold">Bulan</th>
                <th className="text-left py-2 pb-3 font-semibold">Kategori</th>
                <th className="text-right py-2 pb-3 font-semibold">
                  {prevYear} (Tahun Lalu)
                </th>
                <th className="text-right py-2 pb-3 font-semibold">
                  {selectedYear} (Tahun Saat Ini)
                </th>
                <th className="text-right py-2 pb-3 font-semibold">
                  Total Tiket
                </th>
                <th className="text-right py-2 pb-3 font-semibold">
                  Growth (YoY)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {isPending ? (
                <SummaryTableRowsSkeleton columns={6} />
              ) : (
                probData.map((item, idx) => {
                  const prevCount = item.ticketsPrevYear;
                  const currCount = item.ticketsSelectedYear;
                  const total = item.totalTickets;
                  const growth =
                    item.growthPercentage !== null
                      ? item.growthPercentage
                      : calculateGrowthPercentage(prevCount, currCount);

                  const isDecrease = growth !== null && growth < 0;
                  const isIncrease = growth !== null && growth > 0;

                  const growthColor = isDecrease
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : isIncrease
                      ? "text-rose-600 dark:text-rose-400 font-semibold"
                      : "text-slate-500 dark:text-zinc-400 font-semibold";

                  const GrowthIcon = isIncrease
                    ? TrendingUp
                    : isDecrease
                      ? TrendingDown
                      : null;

                  return (
                    <tr
                      key={`${item.month}-${item.category}-${idx}`}
                      className="hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors"
                    >
                      <td className="py-3 font-semibold text-slate-800 dark:text-zinc-200">
                        {item.month === 0
                          ? periodLabel
                          : monthNames[item.month - 1] ?? String(item.month)}
                      </td>

                      <td className="py-3 text-slate-700 dark:text-zinc-300 font-medium">
                        {item.category}
                      </td>

                      <td className="py-3 text-right text-slate-600 dark:text-zinc-400">
                        {prevCount.toLocaleString("id-ID")}
                      </td>

                      <td className="py-3 text-right font-semibold text-slate-900 dark:text-zinc-100">
                        {currCount.toLocaleString("id-ID")}
                      </td>

                      <td className="py-3 text-right font-bold text-slate-900 dark:text-zinc-100">
                        {total.toLocaleString("id-ID")}
                      </td>

                      <td
                        className={`py-3 text-right font-bold ${growthColor}`}
                      >
                        {growth === null ? (
                          "-"
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            {GrowthIcon && (
                              <GrowthIcon className="h-3.5 w-3.5" />
                            )}
                            {Math.abs(growth).toFixed(2)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {renderPaginationFooter()}
      </div>
    );
  }

  if (type === "appMenu") {
    const appMenuData = (paginatedResult?.items ??
      data.slice(0, ITEMS_PER_PAGE)) as MonthlyAppMenuComparison[];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium dark:border-zinc-800 dark:text-zinc-500">
                <th className="text-left py-2 pb-3 font-semibold">Bulan</th>
                <th className="text-left py-2 pb-3 font-semibold">Aplikasi</th>
                <th className="text-left py-2 pb-3 font-semibold">
                  Menu / Fitur
                </th>
                <th className="text-right py-2 pb-3 font-semibold">
                  {prevYear} (Tahun Lalu)
                </th>
                <th className="text-right py-2 pb-3 font-semibold">
                  {selectedYear} (Tahun Saat Ini)
                </th>
                <th className="text-right py-2 pb-3 font-semibold">
                  Growth (YoY)
                </th>
                <th className="text-center py-2 pb-3 font-semibold w-28">
                  Kendala
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {isPending ? (
                <SummaryTableRowsSkeleton columns={7} />
              ) : (
                appMenuData.map((item, idx) => {
                  const prevCount = item.ticketsPrevYear;
                  const currCount = item.ticketsSelectedYear;
                  const growth =
                    item.growthPercentage !== null
                      ? item.growthPercentage
                      : calculateGrowthPercentage(prevCount, currCount);

                  const isDecrease = growth !== null && growth < 0;
                  const isIncrease = growth !== null && growth > 0;

                  const growthColor = isDecrease
                    ? "text-emerald-600 font-semibold dark:text-emerald-400"
                    : isIncrease
                      ? "text-rose-600 font-semibold dark:text-rose-400"
                      : "text-slate-500 font-semibold dark:text-slate-400";

                  const GrowthIcon = isIncrease
                    ? TrendingUp
                    : isDecrease
                      ? TrendingDown
                      : null;

                  const rowKey = `${item.month}-${item.app}-${item.feature}`;
                  const isExpanded = expandedRowKey === rowKey;
                  const cacheKey = `${rowKey}-${subRowYear}-${dept}-${month}-${quarter}`;
                  const currentDetail = issueDataCache[cacheKey];
                  const isRowLoading = loadingRowKey === rowKey;
                  const isRowError = Boolean(rowErrors[cacheKey]);

                  return (
                    <Fragment key={`${rowKey}-${idx}`}>
                      <tr
                        className={`hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors ${
                          isExpanded ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {item.month === 0
                            ? periodLabel
                            : (monthNames[item.month - 1] ?? String(item.month))}
                        </td>

                        <td className="py-3">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {item.app}
                          </span>
                        </td>

                        <td className="py-3 font-medium text-slate-900 dark:text-slate-100">
                          {item.feature}
                        </td>

                        <td className="py-3 text-right text-slate-600 dark:text-slate-400">
                          {prevCount.toLocaleString("id-ID")}
                        </td>

                        <td className="py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {currCount.toLocaleString("id-ID")}
                        </td>

                        <td
                          className={`py-3 text-right font-bold ${growthColor}`}
                        >
                          {growth === null ? (
                            "-"
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              {GrowthIcon && (
                                <GrowthIcon className="h-3.5 w-3.5" />
                              )}
                              {Math.abs(growth).toFixed(2)}%
                            </span>
                          )}
                        </td>

                        <td className="py-3 text-center w-28 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleExpand(item)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isExpanded
                                ? "bg-blue-600 text-white shadow-xs"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200"
                            }`}
                          >
                            <span>{isExpanded ? "Tutup" : "Kendala"}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDED ACCORDION SUB-ROW */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-zinc-900/60 border-y border-slate-200/80 dark:border-zinc-800/80">
                          <td colSpan={7} className="p-4 sm:p-5">
                            <div className="space-y-3.5">
                              {/* SUB-ROW HEADER: TITLE & YEAR SWITCHER */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 dark:border-zinc-800 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="text-xs">
                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                      Kondisi Lapangan: {item.app} · {item.feature}
                                    </span>
                                    <span className="text-slate-500 dark:text-zinc-400 ml-1.5 font-medium">
                                      ({item.month === 0 ? periodLabel : monthNames[item.month - 1]} {subRowYear})
                                    </span>
                                  </div>
                                </div>

                                {/* YEAR SWITCHER TOGGLE & REFRESH */}
                                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                                    Tahun:
                                  </span>
                                  <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-zinc-800 p-0.5 text-xs font-medium">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSwitchYear(item, selectedYear)
                                      }
                                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                        subRowYear === selectedYear
                                          ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                                      }`}
                                    >
                                      {selectedYear} ({item.ticketsSelectedYear} tiket)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSwitchYear(item, prevYear)
                                      }
                                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                        subRowYear === prevYear
                                          ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                                      }`}
                                    >
                                      {prevYear} ({item.ticketsPrevYear} tiket)
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => fetchIssuesForAppMenu(item, subRowYear, true)}
                                    disabled={isRowLoading}
                                    title="Sinkronkan data kendala terbaru"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                                  >
                                    <RotateCw className={`h-3.5 w-3.5 ${isRowLoading ? "animate-spin text-blue-600" : ""}`} />
                                  </button>
                                </div>
                              </div>

                              {/* SUB-ROW BODY */}
                              {isRowLoading ? (
                                <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500 dark:text-zinc-400">
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                  <span>Menganalisis tiket kendala lapangan...</span>
                                </div>
                              ) : isRowError ? (
                                <div className="rounded-lg border border-dashed border-rose-200 dark:border-rose-900/50 p-4 text-center text-xs text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                                  <span>Gagal memuat tiket kendala lapangan untuk <strong>{item.app}</strong> ({item.feature}).</span>
                                  <button
                                    type="button"
                                    onClick={() => fetchIssuesForAppMenu(item, subRowYear)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                                  >
                                    Coba Lagi
                                  </button>
                                </div>
                              ) : !currentDetail ||
                                currentDetail.totalTickets === 0 ? (
                                <div className="rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 p-4 text-center text-xs text-slate-500 dark:text-zinc-400 bg-white/50 dark:bg-zinc-950/40">
                                  Tidak ada tiket kendala yang tercatat untuk{" "}
                                  <strong>{item.app}</strong> (
                                  <strong>{item.feature}</strong>) pada{" "}
                                  {item.month === 0 ? periodLabel : monthNames[item.month - 1]} {subRowYear}.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                                  {/* TOP ISSUES PILLS */}
                                  <div className="lg:col-span-7 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-3.5">
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                      <Ticket className="h-3.5 w-3.5 text-rose-500" />
                                      Top 6 Kendala — Problem Level 2 ({currentDetail.topIssues.length} Jenis)
                                    </div>
                                    <div className="space-y-1.5">
                                      {currentDetail.topIssues
                                        .slice(0, 6)
                                        .map((iss, iIdx) => (
                                          <div
                                            key={iIdx}
                                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-900 text-xs"
                                          >
                                            <span
                                              className="font-medium text-slate-800 dark:text-zinc-200 truncate"
                                              title={iss.problemLevel2}
                                            >
                                              {iss.problemLevel2}
                                            </span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                                                {iss.count} tiket
                                              </span>
                                              <span className="text-[10px] tabular-nums text-slate-400 dark:text-zinc-500">
                                                {iss.percentage}%
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>

                                  {/* TOP BRANCHES & MODAL BUTTON */}
                                  <div className="lg:col-span-5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-3.5 flex flex-col justify-between">
                                    <div>
                                      <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                                        Cabang Paling Sering Terkendala
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {currentDetail.topBranches
                                          .slice(0, 5)
                                          .map((br, bIdx) => (
                                            <span
                                              key={bIdx}
                                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-800"
                                            >
                                              <span>{br.branchName}</span>
                                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                                ({br.count})
                                              </span>
                                            </span>
                                          ))}
                                      </div>
                                    </div>

                                    {/* OPEN FULL MODAL BUTTON */}
                                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-900">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenModal(item, subRowYear)
                                        }
                                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                                      >
                                        <span>
                                          Lihat Seluruh Tiket & Solusi IT (
                                          {currentDetail.totalTickets} Tiket)
                                        </span>
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {renderPaginationFooter()}

        {/* APPMENU ISSUE DETAIL MODAL */}
        <AppMenuIssueDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          detail={modalDetail}
          isLoading={modalLoading}
          selectedYear={selectedYear}
          prevYear={prevYear}
          currentYear={subRowYear}
          onYearChange={handleModalYearChange}
          onSync={handleModalSync}
          ticketCounts={
            modalItem
              ? {
                  [selectedYear]: modalItem.ticketsSelectedYear,
                  [prevYear]: modalItem.ticketsPrevYear,
                }
              : undefined
          }
        />
      </div>
    );
  }

  // Otherwise, render frequency table
  const freqData = (paginatedResult?.items ??
    data.slice(0, ITEMS_PER_PAGE)) as TicketMonthlyComparison[];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-zinc-50">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-700 dark:text-zinc-300">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-medium dark:border-zinc-800 dark:text-zinc-500">
              <th className="text-left py-2 pb-3 font-semibold">Bulan</th>
              <th className="text-right py-2 pb-3 font-semibold">
                {prevYear} (Tahun Lalu)
              </th>
              <th className="text-right py-2 pb-3 font-semibold">
                {selectedYear} (Tahun Saat Ini)
              </th>
              <th className="text-right py-2 pb-3 font-semibold">
                Total Tiket
              </th>
              <th className="text-right py-2 pb-3 font-semibold">
                Growth (YoY)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {isPending ? (
              <SummaryTableRowsSkeleton columns={5} />
            ) : (
              freqData.map((item) => {
                const prevCount = item.ticketsPrevYear;
                const currCount = item.ticketsSelectedYear;
                const total = item.totalTickets;
                const growth =
                  item.growthPercentage !== null
                    ? item.growthPercentage
                    : calculateGrowthPercentage(prevCount, currCount);

                const isDecrease = growth !== null && growth < 0;
                const isIncrease = growth !== null && growth > 0;

                const growthColor = isDecrease
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : isIncrease
                    ? "text-rose-600 dark:text-rose-400 font-semibold"
                    : "text-slate-500 dark:text-zinc-400 font-semibold";

                const GrowthIcon = isIncrease
                  ? TrendingUp
                  : isDecrease
                    ? TrendingDown
                    : null;

                return (
                  <tr
                    key={item.month}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors"
                  >
                    <td className="py-3 font-semibold text-slate-800 dark:text-zinc-200">
                      {monthNames[item.month - 1] ?? String(item.month)}
                    </td>

                    <td className="py-3 text-right text-slate-600 dark:text-zinc-400">
                      {prevCount.toLocaleString("id-ID")}
                    </td>

                    <td className="py-3 text-right font-semibold text-slate-900 dark:text-zinc-100">
                      {currCount.toLocaleString("id-ID")}
                    </td>

                    <td className="py-3 text-right font-bold text-slate-900 dark:text-zinc-100">
                      {total.toLocaleString("id-ID")}
                    </td>

                    <td className={`py-3 text-right font-bold ${growthColor}`}>
                      {growth === null ? (
                        "-"
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          {GrowthIcon && <GrowthIcon className="h-3.5 w-3.5" />}
                          {Math.abs(growth).toFixed(2)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {renderPaginationFooter()}
    </div>
  );
}