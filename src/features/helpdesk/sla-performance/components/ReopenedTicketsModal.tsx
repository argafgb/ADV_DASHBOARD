"use client";

import { useEffect, useState } from "react";
import { FileX2, X } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { fetchReopenedTicketDetails } from "../actions";
import type { ReopenedTicketDetail } from "../services/reopenedTicketService";

const PAGE_SIZE = 10;
const FULL_MONTH_NAMES: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  Mei: "May",
  Jun: "June",
  Jul: "July",
  Agu: "August",
  Sep: "September",
  Okt: "October",
  Nov: "November",
  Des: "December",
};

export default function ReopenedTicketsModal({
  filters,
  total,
  period,
  onClose,
}: {
  filters: { year: string; month: string; dept: string };
  total: number;
  period: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState<ReopenedTicketDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const fullPeriod = period.replace(
    /\b(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\b/g,
    (monthName) => FULL_MONTH_NAMES[monthName] ?? monthName,
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchReopenedTicketDetails({ ...filters, page })
      .then((result) => {
        if (active) setTickets(result);
      })
      .catch((reason) => {
        console.error("Gagal memuat detail tiket re-open:", reason);
        if (active) {
          setTickets([]);
          setError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [filters.year, filters.month, filters.dept, page]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-2 backdrop-blur-xs sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="reopened-tickets-title" onClick={(event) => event.stopPropagation()} className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:p-5">
          <div>
            <h2 id="reopened-tickets-title" className="text-base font-bold text-zinc-950 dark:text-zinc-50">Detail Tiket Re-Open</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{fullPeriod} · {total.toLocaleString("id-ID")} tiket</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup detail tiket re-open" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
          {loading ? (
            <div role="status" className="space-y-3 animate-pulse" aria-label="Memuat detail tiket re-open">
              {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-8 rounded bg-zinc-100 dark:bg-zinc-800" />)}
            </div>
          ) : error || tickets.length === 0 ? (
            <EmptyState icon={FileX2} title={error ? "Gagal Memuat Detail Tiket" : "Tidak Ada Tiket Re-Open"} description={error ? "Coba tutup dan buka kembali detail tiket." : "Tidak ada tiket re-open pada periode dan departemen yang dipilih."} />
          ) : (
            <table className="w-full min-w-120 border-collapse text-left text-xs">
              <thead><tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800"><th className="py-2 pr-4">No. Tiket</th><th className="py-2 pr-4">Tanggal Masuk</th><th className="py-2">Departemen</th></tr></thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700 dark:divide-zinc-800 dark:text-zinc-300">
                {tickets.map((ticket, index) => <tr key={`${ticket.ticketNo}-${index}`}><td className="py-3 pr-4 font-semibold text-blue-600 dark:text-blue-400">{ticket.ticketNo}</td><td className="py-3 pr-4 whitespace-nowrap">{ticket.date}</td><td className="py-3">{ticket.department}</td></tr>)}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs dark:border-zinc-800 sm:px-5">
          <button type="button" disabled={page === 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40 dark:border-zinc-700">Sebelumnya</button>
          <span className="text-zinc-500">Halaman {page} dari {totalPages}</span>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40 dark:border-zinc-700">Berikutnya</button>
        </div>}
      </div>
    </div>
  );
}
