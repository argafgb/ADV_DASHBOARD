import { useEffect, useState } from "react";
import { X, FileX2 } from "lucide-react";
import { fetchOverSlaDetailTickets } from "../actions";
import type { OverSlaTicketDetail } from "../services/leaderboardService";
import EmptyState from "@/components/shared/EmptyState";

interface DetailTicketsModalProps {
  name: string;
  type: "RESPONSE" | "RESOLVED";
  ticketList: string[];
  onClose: () => void;
}

export default function DetailTicketsModal({
  name,
  type,
  ticketList,
  onClose,
}: DetailTicketsModalProps) {
  const [modalTickets, setModalTickets] = useState<OverSlaTicketDetail[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadTickets() {
      setModalLoading(true);
      try {
        const res = await fetchOverSlaDetailTickets(ticketList);
        if (isMounted) {
          setModalTickets(res);
        }
      } catch (err) {
        console.error("Gagal memuat detail tiket OverSLA:", err);
      } finally {
        if (isMounted) {
          setModalLoading(false);
        }
      }
    }

    loadTickets();
    return () => {
      isMounted = false;
    };
  }, [ticketList]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-2 backdrop-blur-xs transition-opacity sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl overflow-hidden shadow-xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:p-5">
          <div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 font-display">
              Detail Tiket OverSLA · {name}
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              Kategori: {type} · Total {ticketList.length} Tiket
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Table Area */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          {modalLoading ? (
            <div className="overflow-x-auto animate-pulse" aria-label="Memuat detail tiket">
              <table className="min-w-160 w-full border-collapse text-left text-xs">
                <thead><tr className="border-b border-zinc-200 dark:border-zinc-800">{Array.from({ length: 5 }).map((_, index) => <th key={index} className="py-2 pr-4"><div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" /></th>)}</tr></thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">{Array.from({ length: 6 }).map((_, row) => <tr key={row}>{[28, 24, 24, 40, 20].map((width, column) => <td key={column} className="py-3 pr-4"><div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800" style={{ width }} /></td>)}</tr>)}</tbody>
              </table>
            </div>
          ) : modalTickets.length === 0 ? (
            <EmptyState
              icon={FileX2}
              title="Detail Tiket Tidak Ditemukan"
              description="Tidak ada detail tiket untuk nomor tiket yang dipilih"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-160 w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold">
                    <th className="py-2 pr-4">No. Tiket</th>
                    <th className="py-2 pr-4">Tanggal Masuk</th>
                    <th className="py-2 pr-4">Grup Problem</th>
                    <th className="py-2 pr-4">Subjek</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-700 dark:text-zinc-300">
                  {modalTickets.map((t) => (
                    <tr
                      key={t.ticketNo}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    >
                      <td className="py-2.5 pr-4 font-bold text-blue-600 dark:text-blue-400">
                        {t.ticketNo}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        {t.date}
                      </td>
                      <td className="py-2.5 pr-4">{t.division}</td>
                      <td
                        className="py-2.5 pr-4 max-w-45 truncate"
                        title={t.subject}
                      >
                        {t.subject}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        <span className="inline-flex rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
