"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  AlertCircle,
  Building2,
  Ticket,
  Clock,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCw,
} from "lucide-react";
import type { AppMenuFieldIssueDetail, AppMenuTicketItem } from "../types/comparison.types";
import { INDONESIAN_MONTH_NAMES } from "@/lib/helpdesk/month-filter";
import EmptyState from "@/components/shared/EmptyState";

interface AppMenuIssueDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: AppMenuFieldIssueDetail | null;
  isLoading?: boolean;
  selectedYear?: number;
  prevYear?: number;
  currentYear?: number;
  onYearChange?: (year: number) => void;
  onSync?: () => void;
  ticketCounts?: Record<number, number>;
}

export default function AppMenuIssueDetailModal({
  isOpen,
  onClose,
  detail,
  isLoading = false,
  selectedYear,
  prevYear,
  currentYear,
  onYearChange,
  onSync,
  ticketCounts,
}: AppMenuIssueDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const TICKETS_PER_PAGE = 10;

  // Reset local search, branch, and expanded states when modal opens/changes
  const [prevOpenState, setPrevOpenState] = useState({ isOpen, detail });
  if (prevOpenState.isOpen !== isOpen || prevOpenState.detail !== detail) {
    setPrevOpenState({ isOpen, detail });
    if (isOpen) {
      setSearchQuery("");
      setSelectedBranch("ALL");
      setExpandedRows({});
      setCurrentPage(1);
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleRowExpand = (ticketNo: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [ticketNo]: !prev[ticketNo],
    }));
  };

  // Extract unique branches for branch filter
  const branchList = useMemo(() => {
    if (!detail || !detail.tickets) return [];
    const set = new Set<string>();
    detail.tickets.forEach((t) => {
      if (t.branchName && t.branchName !== "-") {
        set.add(t.branchName);
      }
    });
    return Array.from(set).sort();
  }, [detail]);

  // Filtered tickets based on search query & selected branch
  const filteredTickets = useMemo(() => {
    if (!detail || !detail.tickets) return [];
    const query = searchQuery.trim().toLowerCase();

    return detail.tickets.filter((ticket) => {
      const matchBranch =
        selectedBranch === "ALL" ||
        ticket.branchName.toUpperCase() === selectedBranch.toUpperCase();

      if (!matchBranch) return false;
      if (!query) return true;

      return (
        ticket.ticketNo.toLowerCase().includes(query) ||
        ticket.branchName.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        (ticket.problemLvl2 && ticket.problemLvl2.toLowerCase().includes(query)) ||
        (ticket.resolveReason && ticket.resolveReason.toLowerCase().includes(query)) ||
        (ticket.statusTicketDescs &&
          ticket.statusTicketDescs.toLowerCase().includes(query))
      );
    });
  }, [detail, searchQuery, selectedBranch]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTickets.length / TICKETS_PER_PAGE),
  );
  const paginatedTickets = useMemo(() => {
    const startIdx = (currentPage - 1) * TICKETS_PER_PAGE;
    return filteredTickets.slice(startIdx, startIdx + TICKETS_PER_PAGE);
  }, [filteredTickets, currentPage]);

  const startIndex =
    filteredTickets.length === 0
      ? 0
      : (currentPage - 1) * TICKETS_PER_PAGE + 1;
  const endIndex = Math.min(
    currentPage * TICKETS_PER_PAGE,
    filteredTickets.length,
  );

  if (!isOpen) return null;

  const monthName = detail?.periodLabel ?? (
    detail?.month === 0
      ? "Semua Bulan (All Months)"
      : detail?.month
        ? INDONESIAN_MONTH_NAMES[detail.month - 1] ?? `Bulan ${detail.month}`
        : "-");

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-4 sm:p-5 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {detail?.app ?? "Aplikasi"}
              </span>
              <span className="text-zinc-400 dark:text-zinc-500">/</span>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {detail?.feature ?? "Fitur/Menu"}
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Rincian Tiket & Kendala Lapangan · Periode {monthName} {detail?.year}
              {detail?.totalTickets !== undefined && (
                <span className="ml-1 font-semibold text-zinc-700 dark:text-zinc-300">
                  ({detail.totalTickets} tiket)
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onYearChange && selectedYear && prevYear && (
              <div className="inline-flex items-center rounded-lg bg-zinc-200/80 dark:bg-zinc-800 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => onYearChange(selectedYear)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    (currentYear ?? detail?.year) === selectedYear
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                  }`}
                >
                  {selectedYear}
                  {ticketCounts?.[selectedYear] !== undefined && ` (${ticketCounts[selectedYear]} tiket)`}
                </button>
                <button
                  type="button"
                  onClick={() => onYearChange(prevYear)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    (currentYear ?? detail?.year) === prevYear
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                  }`}
                >
                  {prevYear}
                  {ticketCounts?.[prevYear] !== undefined && ` (${ticketCounts[prevYear]} tiket)`}
                </button>
              </div>
            )}

            {onSync && (
              <button
                type="button"
                onClick={onSync}
                disabled={isLoading}
                title="Sinkronkan data kendala terbaru"
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              aria-label="Tutup modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-4 py-8">
              <div className="h-20 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              <div className="h-64 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
          ) : !detail || detail.totalTickets === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={HelpCircle}
                title="Tidak Ada Kendala Tercatat"
                description={`Tidak ada tiket permasalahan untuk ${detail?.app ?? ""} - ${detail?.feature ?? ""} pada periode ${monthName} ${detail?.year ?? ""}.`}
              />
            </div>
          ) : (
            <>
              {/* SUMMARY STATS TILES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3.5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Total Tiket Kendala
                    </div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {detail.totalTickets.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3.5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Variasi Masalah Unik
                    </div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {detail.topIssues.length} Jenis Masalah
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3.5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Cabang Terdampak
                    </div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {detail.topBranches.length} Cabang
                    </div>
                  </div>
                </div>
              </div>

              {/* TOP ISSUES BREAKDOWN LIST */}
              {detail.topIssues.length > 0 && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                    Top 6 Kendala — Problem Level 2
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {detail.topIssues.slice(0, 6).map((issue, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">
                          {issue.problemLevel2}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50">
                            {issue.count} tiket
                          </span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                            {issue.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEARCH & FILTERS BAR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari no tiket, kendala, cabang..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {branchList.length > 1 && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                      Cabang:
                    </span>
                    <select
                      value={selectedBranch}
                      onChange={(e) => {
                        setSelectedBranch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full sm:w-48 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="ALL">Semua Cabang ({branchList.length})</option>
                      {branchList.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* TICKETS TABLE */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/75 text-zinc-500 dark:text-zinc-400 font-semibold">
                        <th className="py-2.5 px-3">No Tiket</th>
                        <th className="py-2.5 px-3">Cabang</th>
                        <th className="py-2.5 px-3">Kendala Pengguna (Subject)</th>
                        <th className="py-2.5 px-3">Penanganan IT (Resolve Reason)</th>
                        <th className="py-2.5 px-3 text-right">Waktu Input</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {paginatedTickets.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-400">
                            Tidak ada tiket yang sesuai dengan filter pencarian.
                          </td>
                        </tr>
                      ) : (
                        paginatedTickets.map((t: AppMenuTicketItem) => {
                          const isExpanded = !!expandedRows[t.ticketNo];
                          const resolveText = t.resolveReason?.trim() || "-";
                          const isLongResolve = resolveText.length > 70;

                          return (
                            <tr
                              key={t.ticketNo}
                              className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                            >
                              <td className="py-3 px-3 align-top whitespace-nowrap">
                                <span className="tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                                  {t.ticketNo}
                                </span>
                                {t.statusTicketDescs && (
                                  <div className="mt-1">
                                    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                                      <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                                      {t.statusTicketDescs}
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3 align-top whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-medium">
                                  <Building2 className="h-3 w-3 text-zinc-400 shrink-0" />
                                  {t.branchName}
                                </span>
                              </td>

                              <td className="py-3 px-3 align-top">
                                {t.problemLvl2 && (
                                  <div className="mb-1">
                                    <span className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                                      Lvl 2: {t.problemLvl2}
                                    </span>
                                  </div>
                                )}
                                <div className="font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed max-w-sm">
                                  {t.subject}
                                </div>
                              </td>

                              <td className="py-3 px-3 align-top text-zinc-600 dark:text-zinc-300">
                                <div className="max-w-md">
                                  {isLongResolve ? (
                                    <>
                                      <p className="whitespace-pre-line leading-relaxed">
                                        {isExpanded
                                          ? resolveText
                                          : `${resolveText.slice(0, 70)}...`}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => toggleRowExpand(t.ticketNo)}
                                        className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                      >
                                        {isExpanded ? (
                                          <>
                                            Ringkas <ChevronUp className="h-3 w-3" />
                                          </>
                                        ) : (
                                          <>
                                            Lihat Selengkapnya{" "}
                                            <ChevronDown className="h-3 w-3" />
                                          </>
                                        )}
                                      </button>
                                    </>
                                  ) : (
                                    <p className="whitespace-pre-line leading-relaxed">
                                      {resolveText}
                                    </p>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-3 align-top text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                                <div className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-zinc-400" />
                                  <span>{t.timeInput ?? "-"}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* TABLE FOOTER WITH PAGINATION */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span>
                      Menampilkan <strong>{startIndex}</strong> - <strong>{endIndex}</strong> dari{" "}
                      <strong>{filteredTickets.length}</strong> tiket
                    </span>
                    {filteredTickets.length !== detail.tickets.length && (
                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                        Difilter dari {detail.tickets.length}
                      </span>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        Sebelumnya
                      </button>

                      <span className="px-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
