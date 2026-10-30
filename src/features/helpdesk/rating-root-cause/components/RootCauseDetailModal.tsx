"use client";

import { X, Inbox, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { RootCauseItem } from "../types/rootCause.types";
import { useFilters } from "@/context/HelpdeskFilterContext";
import { useQuarterFilter } from "@/features/helpdesk/comparison/hooks/useQuarterFilter";
import {
  fetchRootCauseDivisionSummary,
  fetchRootCauseDetailTickets,
} from "../actions";
import { cn } from "@/lib/utils";
import { formatNumber, formatActionIT } from "../utils/rating-root-cause-utils";
import { useSidebar } from "@/hooks/useSidebar";
import { useStore } from "@/hooks/useStore";

interface RootCauseDetailModalProps {
  item: RootCauseItem | null;
  onClose: () => void;
}

interface TicketDetail {
  ticketNo: string;
  date: string;
  branchName: string;
  divisi: string;
  divisionName?: string;
  judulTicket: string;
  ticketTitle?: string;
  inputter: string;
  actionIT: string;
  detailActionIT: string;
}

interface DivisionSummary {
  division_name: string;
  ticket_count: number;
  percentage: number;
}

const HIDDEN_DIVISIONS = ["LAINNYA", "TBD", "UNKNOWN", "OTHER", "OTHERS", "-"];

function normalizeDivisionName(name: string): string {
  return name.trim().toUpperCase();
}

function isHiddenDivision(value: string) {
  return HIDDEN_DIVISIONS.includes(normalizeDivisionName(value));
}

function getActionITBadgeStyle(actionIT: string) {
  const normalized = formatActionIT(actionIT).toLowerCase();

  switch (normalized) {
    case "adjust features":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
    case "feature addition":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "software update":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
    case "ui update":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    case "on review it":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800";
    case "no action needed":
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700";
  }
}

export default function RootCauseDetailModal({
  item,
  onClose,
}: RootCauseDetailModalProps) {
  const { year, month, dept } = useFilters();
  const { quarter } = useQuarterFilter();

  const [selectedDivision, setSelectedDivision] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [divisions, setDivisions] = useState<DivisionSummary[]>([]);
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [expandedTicketNo, setExpandedTicketNo] = useState<string | null>(null);

  const limit = 10;

  const cacheRef = useRef<
    Record<string, { tickets: TicketDetail[]; total: number }>
  >({});
  const divisionsCacheRef = useRef<Record<string, DivisionSummary[]>>({});

  const visibleDivisions = useMemo(
    () => divisions.filter((div) => !isHiddenDivision(div.division_name)),
    [divisions],
  );

  const displayTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;
    const q = searchQuery.toLowerCase().trim();
    return tickets.filter(
      (t) =>
        t.ticketNo?.toLowerCase().includes(q) ||
        t.branchName?.toLowerCase().includes(q) ||
        (t.divisi || t.divisionName || "")?.toLowerCase().includes(q) ||
        (t.judulTicket || t.ticketTitle || "")?.toLowerCase().includes(q) ||
        t.inputter?.toLowerCase().includes(q) ||
        t.actionIT?.toLowerCase().includes(q),
    );
  }, [tickets, searchQuery]);

  const currentFilterKey = `${item?.name}_${year}_${month}_${dept}_${quarter}`;

  const [prevFilterKey, setPrevFilterKey] = useState(currentFilterKey);
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
    setSelectedDivision("ALL");
    setSearchQuery("");
    setExpandedTicketNo(null);
  }

  useEffect(() => {
    if (!item) return;

    const activeItem = item;
    let isMounted = true;
    const cacheKey = `${currentFilterKey}_${selectedDivision}_${currentPage}`;
    const cachedDivisions = divisionsCacheRef.current[currentFilterKey];
    const cachedTickets = cacheRef.current[cacheKey];

    if (cachedDivisions && cachedTickets) {
      setDivisions(cachedDivisions);
      setTickets(cachedTickets.tickets);
      setTotalTickets(cachedTickets.total);
      return;
    }

    async function loadData() {
      setLoading(true);

      try {
        const fetchDivisionsPromise = cachedDivisions
          ? Promise.resolve(cachedDivisions)
          : fetchRootCauseDivisionSummary({
              type_temuan: activeItem.name,
              year,
              month,
              dept: activeItem.department,
              quarter,
            });

        const [divSummary, ticketResult] = await Promise.all([
          fetchDivisionsPromise,
          fetchRootCauseDetailTickets({
            type_temuan: activeItem.name,
            year,
            month,
            dept: activeItem.department,
            quarter,
            group_problem: selectedDivision,
            limit,
            offset: (currentPage - 1) * limit,
          }),
        ]);

        if (!isMounted) return;

        divisionsCacheRef.current[currentFilterKey] = divSummary;
        cacheRef.current[cacheKey] = {
          tickets: ticketResult.tickets,
          total: ticketResult.total,
        };

        setDivisions(divSummary);
        setTickets(ticketResult.tickets);
        setTotalTickets(ticketResult.total);
      } catch (err) {
        console.error("Gagal memuat detail root cause:", err);

        if (!isMounted) return;

        setDivisions([]);
        setTickets([]);
        setTotalTickets(0);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [item, selectedDivision, currentPage, year, month, quarter, currentFilterKey]);

  const handleSelectDivision = (div: string) => {
    if (isHiddenDivision(div)) return;

    setSelectedDivision(div);
    setCurrentPage(1);
  };

  const sidebar = useStore(useSidebar, (x) => x);
  const isOpen = sidebar?.getOpenState() ?? true;
  const isDisabled = sidebar?.settings?.disabled ?? false;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item || !mounted || typeof document === "undefined") return null;

  const totalPages = Math.ceil(totalTickets / limit) || 1;

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index,
  );

  const startRow = totalTickets === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endRow = Math.min(currentPage * limit, totalTickets);

  const maxDivisionCount = Math.max(
    ...visibleDivisions.map((d) => d.ticket_count),
    1,
  );

  return createPortal(
    <div
      className={cn(
        "root-cause-detail-view fixed top-14 bottom-0 right-0 left-0 z-30 flex flex-col overflow-hidden bg-white font-sans shadow-md animate-in fade-in transition-[left] ease-in-out duration-300 dark:bg-zinc-950",
        !isDisabled && (isOpen ? "lg:left-64" : "lg:left-22.5"),
      )}
    >
      {/* HEADER */}
      <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <h2 className="text-xl font-black uppercase text-slate-950 dark:text-zinc-50">
            {item.name}
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-zinc-400">
            {selectedDivision === "ALL" ? "ALL" : selectedDivision} ·{" "}
            {formatNumber(totalTickets)} Tiket
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <X size={16} />
          Close Detail View
        </button>
      </div>

      {/* BODY CONTENT */}
      <div className="flex flex-1 flex-col min-h-0 p-4 overflow-hidden">
        {/* DIVISION BAR CHART DISTRIBUTION */}
        <div className="shrink-0 select-none">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              DISTRIBUSI DIVISI
            </h3>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {selectedDivision !== "ALL"
                ? `Filter: ${selectedDivision} · klik lagi untuk reset`
                : "Klik divisi untuk memfilter tabel"}
            </span>
          </div>

          <div className="division-distribution-scroll shrink-0 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {/* ALL DIVISIONS ROW */}
            <button
              type="button"
              onClick={() => handleSelectDivision("ALL")}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border px-3.5 py-2 text-left transition-all duration-200 cursor-pointer",
                selectedDivision === "ALL"
                  ? "border-transparent bg-blue-50/80 dark:bg-blue-950/50 shadow-2xs"
                  : "border-transparent bg-slate-50/70 hover:bg-slate-100 dark:bg-zinc-850 dark:hover:bg-zinc-800",
              )}
            >
              <span
                className={cn(
                  "w-40 shrink-0 truncate text-xs uppercase transition-colors",
                  selectedDivision === "ALL"
                    ? "text-blue-600 dark:text-blue-400 font-extrabold"
                    : "text-slate-700 dark:text-zinc-200 font-black",
                )}
              >
                ALL DIVISIONS
              </span>

              <div className="relative flex-1 h-3.5 rounded-full bg-slate-200/70 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#155dfc] transition-all duration-500 ease-out"
                  style={{ width: "100%" }}
                />
              </div>

              <span
                className={cn(
                  "w-12 shrink-0 text-right text-xs transition-colors",
                  selectedDivision === "ALL"
                    ? "text-blue-600 dark:text-blue-400 font-extrabold"
                    : "text-slate-900 dark:text-zinc-100 font-black",
                )}
              >
                {formatNumber(item.tickets)}
              </span>

              <span
                className={cn(
                  "w-14 shrink-0 text-right text-xs transition-colors",
                  selectedDivision === "ALL"
                    ? "text-blue-500 dark:text-blue-400 font-bold"
                    : "text-slate-400 dark:text-zinc-400 font-semibold",
                )}
              >
                100%
              </span>
            </button>

            {loading && divisions.length === 0
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border border-transparent bg-slate-50 px-3.5 py-2 animate-pulse dark:bg-zinc-850"
                  >
                    <div className="h-3 w-36 rounded bg-slate-200 dark:bg-zinc-800" />
                    <div className="h-3.5 flex-1 rounded-full bg-slate-200 dark:bg-zinc-800" />
                    <div className="h-3 w-10 rounded bg-slate-200 dark:bg-zinc-800" />
                    <div className="h-3 w-12 rounded bg-slate-200 dark:bg-zinc-800" />
                  </div>
                ))
              : visibleDivisions.map((div) => {
                  const isSelected = selectedDivision === div.division_name;
                  const barWidth =
                    maxDivisionCount > 0
                      ? (div.ticket_count / maxDivisionCount) * 100
                      : 0;

                  return (
                    <button
                      type="button"
                      key={div.division_name}
                      onClick={() => handleSelectDivision(div.division_name)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-xl border px-3.5 py-2 text-left transition-all duration-200 cursor-pointer",
                        isSelected
                          ? "border-transparent bg-blue-50/80 dark:bg-blue-950/50 shadow-2xs"
                          : "border-transparent bg-slate-50/70 hover:bg-slate-100 dark:bg-zinc-850 dark:hover:bg-zinc-800",
                      )}
                    >
                      <span
                        className={cn(
                          "w-40 shrink-0 truncate text-xs uppercase transition-colors",
                          isSelected
                            ? "text-blue-600 dark:text-blue-400 font-extrabold"
                            : "text-slate-700 dark:text-zinc-200 font-black",
                        )}
                      >
                        {div.division_name}
                      </span>

                      <div className="relative flex-1 h-3.5 rounded-full bg-slate-200/70 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#155dfc] transition-all duration-500 ease-out"
                          style={{ width: `${Math.max(barWidth, 2)}%` }}
                        />
                      </div>

                      <span
                        className={cn(
                          "w-12 shrink-0 text-right text-xs transition-colors",
                          isSelected
                            ? "text-blue-600 dark:text-blue-400 font-extrabold"
                            : "text-slate-900 dark:text-zinc-100 font-black",
                        )}
                      >
                        {formatNumber(div.ticket_count)}
                      </span>

                      <span
                        className={cn(
                          "w-14 shrink-0 text-right text-xs transition-colors",
                          isSelected
                            ? "text-blue-500 dark:text-blue-400 font-bold"
                            : "text-slate-400 dark:text-zinc-400 font-semibold",
                        )}
                      >
                        {div.percentage.toFixed(1)}%
                      </span>
                    </button>
                  );
                })}
          </div>
        </div>

        {/* SEARCH BOX */}
        <div className="relative mt-4 shrink-0">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor tiket, nama, atau divisi..."
            className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-11 pr-4 text-xs font-medium text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>

        {/* TICKET LIST TABLE & PAGINATION */}
        {!loading && displayTickets.length === 0 ? (
          <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-center dark:border-zinc-800 dark:bg-zinc-900">
            <Inbox className="h-10 w-10 text-slate-300" />

            <h4 className="mt-2 text-sm font-bold text-slate-800 dark:text-zinc-200">
              Tidak Ada Tiket
            </h4>

            <p className="mt-1 text-xs text-slate-400">
              Tidak ada tiket yang terdaftar untuk kata kunci atau divisi ini.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-1 flex-col min-h-0 overflow-hidden">
            <div className="ticket-table-scroll min-h-0 flex-1 overflow-auto overscroll-contain rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full min-w-[1500px] text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="w-16 px-4 py-4 text-left">No</th>
                    <th className="w-36 px-4 py-4 text-left">No. Tiket</th>
                    <th className="w-44 px-4 py-4 text-left">Tanggal</th>
                    <th className="w-44 px-4 py-4 text-left">Cabang</th>
                    <th className="w-40 px-4 py-4 text-left">Divisi</th>
                    <th className="min-w-55 max-w-md px-4 py-4 text-left">
                      Judul Tiket
                    </th>
                    <th className="w-36 px-4 py-4 text-left">Inputter</th>
                    <th className="w-44 px-4 py-4 text-left">Action IT</th>
                    <th className="w-40 px-4 py-4 text-left">
                      Detail Action IT
                    </th>
                    <th className="w-12 px-2 py-4 text-center" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                  {loading
                    ? Array.from({ length: limit }).map((_, index) => (
                        <tr key={index} className="animate-pulse">
                          <td className="px-4 py-4.5">
                            <div className="h-4 w-6 rounded bg-slate-100 dark:bg-zinc-800" />
                          </td>
                          <td className="px-4 py-4.5">
                            <div className="h-4 w-28 rounded bg-slate-100 dark:bg-zinc-800" />
                          </td>
                          <td className="px-4 py-4.5">
                            <div className="h-4 w-20 rounded bg-slate-100 dark:bg-zinc-800" />
                          </td>
                          <td className="px-4 py-4.5">
                            <div className="h-4 w-32 rounded bg-slate-100 dark:bg-zinc-800" />
                          </td>
                          <td className="px-4 py-4.5">
                            <div className="h-4 w-32 rounded bg-slate-100 dark:bg-zinc-800" />
                          </td>
                          <td className="px-4 py-4.5">
                            <div className="h-4 w-48 rounded bg-slate-100 dark:bg-zinc-800" />
                          </td>
                          <td className="px-4 py-4.5">
                            <div className="h-4 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
                          </td>
                          <td className="px-4 py-4.5">
                            <div className="h-4 w-32 rounded bg-slate-100 dark:bg-zinc-800" />
                          </td>
                          <td className="px-4 py-4.5">
                            <div className="h-4 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
                          </td>
                          <td className="px-2 py-4.5">
                            <div className="h-4 w-4 rounded bg-slate-100 dark:bg-zinc-800 mx-auto" />
                          </td>
                        </tr>
                      ))
                    : displayTickets.map((ticket, index) => {
                        const rowNo = (currentPage - 1) * limit + index + 1;
                        const isExpanded = expandedTicketNo === ticket.ticketNo;
                        const rawDetail = ticket.detailActionIT?.trim() ?? "";
                        const hasDetail =
                          rawDetail !== "" &&
                          rawDetail !== "-" &&
                          rawDetail.toLowerCase() !== "no detail yet" &&
                          rawDetail.toLowerCase() !== "no detail action yet";

                        return (
                          <Fragment key={`${ticket.ticketNo}-${rowNo}`}>
                            <tr
                              onClick={() => {
                                if (!hasDetail) return;
                                setExpandedTicketNo((prev) =>
                                  prev === ticket.ticketNo
                                    ? null
                                    : ticket.ticketNo,
                                );
                              }}
                              className={cn(
                                "transition-colors select-none",
                                hasDetail
                                  ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-800/60"
                                  : "cursor-default",
                                isExpanded &&
                                  "bg-blue-50/30 dark:bg-blue-950/20",
                              )}
                            >
                              <td className="px-4 py-4 font-semibold text-slate-500">
                                {rowNo}
                              </td>

                              <td className="px-4 py-4 font-black text-blue-600 dark:text-blue-400">
                                {ticket.ticketNo}
                              </td>

                              <td className="px-4 py-4 text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                                {ticket.date}
                              </td>

                              <td className="max-w-44 truncate px-4 py-4 text-slate-600 dark:text-zinc-300">
                                {ticket.branchName || "-"}
                              </td>

                              <td className="px-4 py-4 text-slate-600 dark:text-zinc-300">
                                {ticket.divisi}
                              </td>

                              <td className="min-w-55 max-w-md whitespace-normal wrap-break-word px-4 py-4 text-slate-600 dark:text-zinc-300">
                                {ticket.judulTicket}
                              </td>

                              <td className="px-4 py-4 text-slate-600 dark:text-zinc-300">
                                {ticket.inputter || "-"}
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap border shadow-2xs",
                                    getActionITBadgeStyle(ticket.actionIT),
                                  )}
                                >
                                  {formatActionIT(ticket.actionIT)}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                {hasDetail ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                    Lihat Detail
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                                    No Detail Yet
                                  </span>
                                )}
                              </td>

                              <td className="px-2 py-4 text-center text-slate-400 dark:text-zinc-500">
                                {hasDetail ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedTicketNo((prev) =>
                                        prev === ticket.ticketNo
                                          ? null
                                          : ticket.ticketNo,
                                      );
                                    }}
                                    className="inline-flex items-center justify-center rounded-lg p-1.5 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp
                                        size={16}
                                        className="text-blue-600 dark:text-blue-400"
                                      />
                                    ) : (
                                      <ChevronDown size={16} />
                                    )}
                                  </button>
                                ) : null}
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50/80 dark:bg-zinc-900/60 transition-colors">
                                <td colSpan={10} className="p-4 sm:p-5">
                                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 space-y-3 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                      <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                                        Detail Action IT
                                      </span>
                                    </div>

                                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/50">
                                      <p className="text-sm leading-relaxed font-normal text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">
                                        {ticket.detailActionIT || "-"}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            <div className="mt-4 flex shrink-0 select-none flex-wrap items-center justify-between gap-4 pt-1">
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Menampilkan {formatNumber(startRow)}–{formatNumber(endRow)} dari{" "}
                {formatNumber(totalTickets)} tiket
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-bold transition",
                    currentPage === 1
                      ? "cursor-not-allowed border-slate-100 text-slate-300 dark:border-zinc-800 dark:text-zinc-600"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
                  )}
                >
                  Previous
                </button>

                {pageNumbers.map((page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "h-10 w-10 rounded-lg border text-sm font-bold transition",
                      page === currentPage
                        ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-bold transition",
                    currentPage === totalPages
                      ? "cursor-not-allowed border-slate-100 text-slate-300 dark:border-zinc-800 dark:text-zinc-600"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
