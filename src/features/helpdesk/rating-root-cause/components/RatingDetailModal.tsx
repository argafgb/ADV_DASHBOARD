"use client";

import { X, Inbox } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useFilters } from "@/context/HelpdeskFilterContext";
import { useQuarterFilter } from "@/features/helpdesk/comparison/hooks/useQuarterFilter";
import { fetchRatingDetailTickets } from "../actions";
import { cn } from "@/lib/utils";
import { StarIcons } from "@/components/charts/StarGlyphs";

import { formatNumber } from "../utils/rating-root-cause-utils";

interface RatingDetailModalProps {
  rating: number | null; // null berarti modal ditutup. 0 berarti No Rating, sisanya berarti dirating.
  totalTickets: number; // total tickets untuk kategori rating spesifik
  onClose: () => void;
}

interface RatingTicketDetail {
  ticketNo: string;
  date: string;
  dispatcher: string;
  division: string;
  subject: string;
  comment: string;
}

export default function RatingDetailModal({
  rating,
  totalTickets,
  onClose,
}: RatingDetailModalProps) {
  const { year, month, dept } = useFilters();
  const { quarter } = useQuarterFilter();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [tickets, setTickets] = useState<RatingTicketDetail[]>([]);
  const [totalCount, setTotalCount] = useState<number>(totalTickets);

  const limit = 5; // Paginasi 5 item per halaman

  // Referensi cache klien untuk paginasi bolak-balik instan
  const cacheRef = useRef<
    Record<number, { tickets: RatingTicketDetail[]; total: number }>
  >({});

  useEffect(() => {
    const ratingVal = rating;
    if (ratingVal === null) return;

    let isMounted = true;

    // Gunakan data dari cache jika halaman ini sudah pernah dimuat
    if (cacheRef.current[currentPage]) {
      const cached = cacheRef.current[currentPage];
      setTickets(cached.tickets);
      setTotalCount(cached.total);
      return;
    }

    async function loadData(activeRating: number) {
      setLoading(true);
      try {
        const result = await fetchRatingDetailTickets({
          rating: activeRating,
          year,
          month,
          dept,
          quarter,
          limit,
          offset: (currentPage - 1) * limit,
        });

        if (isMounted) {
          // Simpan ke cache
          const nextTotal = Number(result.total) || 0;
          cacheRef.current[currentPage] = {
            tickets: result.tickets,
            total: nextTotal,
          };
          setTickets(result.tickets);
          setTotalCount(nextTotal);
        }
      } catch (err) {
        console.error("Gagal memuat detail rating:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData(ratingVal);

    return () => {
      isMounted = false;
    };
  }, [rating, currentPage, year, month, dept, quarter]);

  if (rating === null) return null;

  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Membuat paginasi dinamis (max 5 tombol halaman)
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i,
  );

  // Label rating
  const ratingLabel = rating === 0 ? "No Rating" : `${rating} Bintang`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/45 p-2 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:bg-zinc-950 dark:border dark:border-zinc-800 cursor-default"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-200 px-4 py-4 dark:border-zinc-800 sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1 pr-10 text-left sm:pr-44 sm:text-center">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block dark:text-zinc-500">
              Menampilkan Detail Rating
            </span>

            {rating > 0 && (
              <div className="mt-1 select-none">
                <StarIcons n={rating} size={20} />
              </div>
            )}

            <h2 className="text-2xl font-black text-slate-950 dark:text-zinc-50 mt-1">
              {ratingLabel}
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-450 dark:text-zinc-500">
              {dept === "ALL" ? "Semua Departemen" : dept} ·{" "}
              {month === "ALL"
                ? quarter === "ALL"
                  ? "Sepanjang Tahun"
                  : `Kuartal ${quarter.replace("Q", "")}`
                : `Bulan ${month}`}{" "}
              {year} · {formatNumber(totalCount)} Tiket
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 p-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:right-6 sm:top-6 sm:px-4 sm:py-2"
          >
            <X size={16} />
            <span className="hidden sm:inline">Close Detail View</span>
          </button>
        </div>

        {/* BODY */}
        <div className="min-h-0 overflow-y-auto">
          {!loading && tickets.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-center dark:border-zinc-800 dark:bg-zinc-900">
              <Inbox className="h-10 w-10 text-slate-300" />
              <h4 className="mt-2 text-sm font-bold text-slate-800 dark:text-zinc-200">
                Tidak Ada Tiket
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Tidak ada tiket yang terdaftar untuk rating ini pada periode
                filter terpilih.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="max-h-95 overflow-auto">
                  <table className="min-w-240 w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-zinc-900 dark:text-zinc-400 z-10">
                      <tr>
                        <th className="px-4 py-4 text-left w-16">No</th>
                        <th className="px-4 py-4 text-left w-36">No. Tiket</th>
                        <th className="px-4 py-4 text-left w-32">Tanggal</th>
                        <th className="px-4 py-4 text-left w-48">Dispatcher</th>
                        <th className="px-4 py-4 text-left w-40">Divisi</th>
                        <th className="px-4 py-4 text-left">Judul Tiket</th>
                        <th className="px-4 py-4 text-left">Komentar</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                      {loading
                        ? Array.from({ length: limit }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
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
                                <div className="h-4 w-24 rounded bg-slate-100 dark:bg-zinc-800" />
                              </td>
                              <td className="px-4 py-4.5">
                                <div className="h-4 w-40 rounded bg-slate-100 dark:bg-zinc-800" />
                              </td>
                              <td className="px-4 py-4.5">
                                <div className="h-4 w-48 rounded bg-slate-100 dark:bg-zinc-800" />
                              </td>
                            </tr>
                          ))
                        : tickets.map((ticket, index) => {
                            const rowNo = (currentPage - 1) * limit + index + 1;
                            return (
                              <tr
                                key={ticket.ticketNo}
                                className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 transition-colors"
                              >
                                <td className="px-4 py-4 font-semibold text-slate-500">
                                  {rowNo}
                                </td>

                                <td className="px-4 py-4 font-black text-blue-600 dark:text-blue-400">
                                  {ticket.ticketNo}
                                </td>

                                <td className="px-4 py-4 text-slate-600 dark:text-zinc-355">
                                  {ticket.date}
                                </td>

                                <td className="px-4 py-4 text-slate-650 dark:text-zinc-350 truncate max-w-48">
                                  {ticket.dispatcher}
                                </td>

                                <td className="px-4 py-4 text-slate-600 dark:text-zinc-350">
                                  {ticket.division}
                                </td>

                                <td className="px-4 py-4 text-slate-600 dark:text-zinc-350 max-w-xs truncate">
                                  {ticket.subject}
                                </td>

                                <td className="px-4 py-4 text-slate-550 dark:text-zinc-400 max-w-xs truncate italic">
                                  {ticket.comment}
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PAGINATION FOOTER */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 select-none p-4">
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Menampilkan {formatNumber((currentPage - 1) * limit + 1)}-
                  {formatNumber(Math.min(currentPage * limit, totalCount))} dari{" "}
                  {formatNumber(totalCount)} tiket
                </p>

                <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-bold transition",
                      currentPage === 1
                        ? "border-slate-100 text-slate-300 dark:border-zinc-800 dark:text-zinc-600 cursor-not-allowed"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-405 dark:hover:bg-zinc-800",
                    )}
                  >
                    Previous
                  </button>

                  {pageNumbers.map((page) => (
                    <button
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
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-bold transition",
                      currentPage === totalPages
                        ? "border-slate-100 text-slate-300 dark:border-zinc-800 dark:text-zinc-600 cursor-not-allowed"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-405 dark:hover:bg-zinc-800",
                    )}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
