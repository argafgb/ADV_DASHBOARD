"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  RotateCcw,
  Star,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StarRating from "@/components/shared/StarRating";
import { calculateAssetRatingSummary } from "@/lib/rating-utils";
import EmptyState from "@/components/shared/EmptyState";
import { cn, fmt } from "@/lib/utils";
import type { AssetFilterInput } from "@/types/asset-pm.types";
import type { FeedbackDetailItem } from "../types/overview.types";
import { getOverviewFeedbackDetailsData } from "../services/overviewService";

interface FeedbackDetailModalProps {
  open: boolean;
  onClose: () => void;
  input: AssetFilterInput;
  overallRating: number;
}

const PAGE_SIZE = 10;

type FilterCondition = "ALL" | "PERFECT" | "ISSUES";

function formatTimestamp(ts: string): string {
  if (!ts) return "-";
  const [datePart, timePart] = ts.split(" ");
  if (!datePart) return ts;
  const [y, m, d] = datePart.split("-");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const mIdx = parseInt(m, 10) - 1;
  const time = timePart ? timePart.slice(0, 5) : "";
  return `${parseInt(d, 10)} ${monthNames[mIdx] || m} ${y}${time ? `, ${time}` : ""}`;
}

export default function FeedbackDetailModal({
  open,
  onClose,
  input,
  overallRating,
}: FeedbackDetailModalProps) {
  const [items, setItems] = useState<FeedbackDetailItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState<FilterCondition>("ALL");
  const [page, setPage] = useState(0);

  const isLoading = items === null;
  const currentItems = useMemo(() => items || [], [items]);

  const filterKey = `${input.year}-${input.month}-${input.site}-${input.company}`;
  const lastFetchedKey = useRef<string | null>(null);

  // Fetch feedback records when modal is mounted or input changes
  useEffect(() => {
    if (!open) return;
    if (lastFetchedKey.current === filterKey && items !== null) return;
    lastFetchedKey.current = filterKey;

    let isMounted = true;

    getOverviewFeedbackDetailsData(input)
      .then((data) => {
        if (isMounted) {
          setItems(data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load feedback details:", err);
        if (isMounted) {
          setItems([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, input, filterKey, items]);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Summary statistics from items
  const summary = useMemo(() => {
    return calculateAssetRatingSummary(currentItems);
  }, [currentItems]);

  // Filter and search
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return currentItems.filter((row) => {
      // Condition filter
      if (condition === "PERFECT" && row.scoreStars < 5.0) return false;
      if (condition === "ISSUES" && row.scoreStars >= 5.0) return false;

      // Search match
      if (!q) return true;
      return (
        row.nama.toLowerCase().includes(q) ||
        row.nik.toLowerCase().includes(q) ||
        row.cabang.toLowerCase().includes(q) ||
        row.divisi.toLowerCase().includes(q) ||
        row.barcode.toLowerCase().includes(q)
      );
    });
  }, [currentItems, search, condition]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const startIdx = safePage * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, filteredRows.length);
  const pageRows = filteredRows.slice(startIdx, endIdx);

  if (!open || typeof document === "undefined") return null;

  const displayRating = currentItems.length > 0 ? summary.avgStars : overallRating;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex shrink-0 items-start justify-between border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-950/30">
                <Star size={16} className="fill-amber-400" />
              </span>
              <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Detail Rating & Feedback Aset
              </h3>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Evaluasi kondisi perangkat oleh pengguna pada periode terpilih (Tahun {input.year}
              {input.month !== "ALL" ? ` · Bulan ${input.month}` : ""}
              {input.site !== "ALL" ? ` · Cabang ${input.site}` : ""})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Summary KPI Cards Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            {/* 1. Overall Score Card */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Rating Rata-rata
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {displayRating.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-zinc-400">/5.0</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <StarRating value={displayRating} size={15} />
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {summary.satisfactionPct}%
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Dari {fmt(currentItems.length)} responden
              </p>
            </div>

            {/* 2. Performa Pilar */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                🚀 Performa
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {summary.breakdown.performaStars.toFixed(2)}
                </span>
                <span className="text-xs text-zinc-400">★</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${summary.breakdown.performaPct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                {summary.breakdown.performaPct}% menyatakan lancar
              </p>
            </div>

            {/* 3. Aplikasi Pilar */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                💻 Aplikasi
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {summary.breakdown.aplikasiStars.toFixed(2)}
                </span>
                <span className="text-xs text-zinc-400">★</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${summary.breakdown.aplikasiPct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                {summary.breakdown.aplikasiPct}% aplikasi berfungsi baik
              </p>
            </div>

            {/* 4. Baterai Pilar */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                🔋 Baterai
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {summary.breakdown.bateraiStars.toFixed(2)}
                </span>
                <span className="text-xs text-zinc-400">★</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${summary.breakdown.bateraiPct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                {summary.breakdown.bateraiPct}% baterai sehat
              </p>
            </div>
          </div>

          {/* Table Toolbar Controls */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between flex-wrap pt-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Cari nama, NIK, cabang, barcode..."
                className="h-8 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCondition("ALL");
                  setPage(0);
                }}
                className={cn(
                  "cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors border",
                  condition === "ALL"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                )}
              >
                Semua ({currentItems.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setCondition("PERFECT");
                  setPage(0);
                }}
                className={cn(
                  "cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors border",
                  condition === "PERFECT"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                )}
              >
                5 Bintang ({currentItems.filter((i) => i.scoreStars >= 5).length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setCondition("ISSUES");
                  setPage(0);
                }}
                className={cn(
                  "cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors border",
                  condition === "ISSUES"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                )}
              >
                Ada Kendala ({currentItems.filter((i) => i.scoreStars < 5).length})
              </button>

              {(search || condition !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCondition("ALL");
                    setPage(0);
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Responses Table View */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            {isLoading ? (
              <div className="p-8 space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-9 w-full rounded-md bg-zinc-100 dark:bg-zinc-800"
                  />
                ))}
              </div>
            ) : filteredRows.length === 0 ? (
              <EmptyState
                icon={HelpCircle}
                title="Tidak Ada Data Respon"
                description={
                  search || condition !== "ALL"
                    ? "Tidak ada feedback yang sesuai dengan kata kunci atau filter terpilih."
                    : "Belum ada respon evaluasi feedback untuk periode ini."
                }
                height={180}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/40">
                      <th className="py-2.5 pl-4 pr-2">Tanggal</th>
                      <th className="py-2.5 px-3">Responden</th>
                      <th className="py-2.5 px-3">Cabang / Divisi</th>
                      <th className="py-2.5 px-3">Barcode</th>
                      <th className="py-2.5 px-2 text-center">Performa</th>
                      <th className="py-2.5 px-2 text-center">Aplikasi</th>
                      <th className="py-2.5 px-2 text-center">Baterai</th>
                      <th className="py-2.5 pr-4 pl-3 text-right">Skor Bintang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {pageRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="py-2.5 pl-4 pr-2 whitespace-nowrap tabular-nums text-zinc-500 dark:text-zinc-400">
                          {formatTimestamp(row.recordTimestamp)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                            {row.nama}
                          </div>
                          <div className="text-[10.5px] font-mono text-zinc-400">
                            NIK: {row.nik}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-medium text-zinc-700 dark:text-zinc-300">
                            {row.cabang}
                          </div>
                          <div className="text-[10.5px] text-zinc-400">
                            {row.divisi}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-xs text-zinc-600 dark:text-zinc-400">
                          {row.barcode}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {row.performaOk === "Ya" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                              <CheckCircle2 size={11} /> Ya
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                              <XCircle size={11} /> Kendala
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {row.aplikasiOk === "Ya" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                              <CheckCircle2 size={11} /> Ya
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                              <XCircle size={11} /> Kendala
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {row.bateraiOk === "Ya" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                              <CheckCircle2 size={11} /> Ya
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                              <XCircle size={11} /> Kendala
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 pl-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <StarRating value={row.scoreStars} size={13} />
                            <span className="font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
                              {row.scoreStars.toFixed(2)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {filteredRows.length > 0 && (
            <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-500">
              <div>
                Menampilkan {startIdx + 1}–{endIdx} dari{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {fmt(filteredRows.length)}
                </span>{" "}
                respon
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <ChevronLeft size={13} />
                  <span>Prev</span>
                </button>

                <span className="px-2 font-medium">
                  {safePage + 1} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
