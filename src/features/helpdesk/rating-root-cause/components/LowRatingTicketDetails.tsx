"use client";

import { useState, useTransition } from "react";
import { Star, Loader2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import type { LowRatingTicket, TicketRatingFilter } from "../types/ticketRating.types";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { fetchLowRatingTicketsAction } from "../actions/ticketRatingActions";
import { validateRatingPeriod } from "../utils/ratingPeriod";

export default function LowRatingTicketDetails({ tickets: initialTickets, filters, periodLabel }: { tickets: LowRatingTicket[]; filters: TicketRatingFilter; periodLabel: string }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedPeriod, setAppliedPeriod] = useState(periodLabel);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [support, setSupport] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const supports = [...new Set(tickets.map(ticket => ticket.support))].sort();
  const query = search.trim().toLocaleLowerCase();
  const count1 = tickets.filter(ticket => ticket.rating === 1).length;
  const count2 = tickets.filter(ticket => ticket.rating === 2).length;
  const filtered = tickets.filter(ticket =>
    (ratingFilter === "ALL" ? (ticket.rating === 1 || ticket.rating === 2) : ticket.rating === Number(ratingFilter)) &&
    (support === "ALL" || ticket.support === support) &&
    (!query || [ticket.ticketNo, ticket.support, ticket.department, ticket.branch, ticket.subject, ticket.notes, ticket.resolution].some(value => value.toLocaleLowerCase().includes(query)))
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * 10;
  const dctCount = filtered.filter(ticket => ticket.department === "DCT Support").length;
  const itCount = filtered.filter(ticket => ticket.department === "IT Support").length;
  const currentDept = filters.dept ?? "ALL";
  const deptSummary = currentDept === "ALL" 
    ? `All Department (${dctCount} DCT Support, ${itCount} IT Support)` 
    : currentDept === "IT Support" 
      ? `${itCount} IT Support` 
      : `${dctCount} DCT Support`;

  const applyFilters = () => {
    const validation = validateRatingPeriod(startDate, endDate);
    if (validation) { setError(validation); return; }
    setError("");
    startTransition(async () => {
      try {
        const result = await fetchLowRatingTicketsAction({ ...filters, dept: currentDept, startDate, endDate });
        setTickets(result);
        setAppliedPeriod(startDate && endDate ? `${startDate} s.d. ${endDate}` : periodLabel);
        setSupport("ALL");
        setRatingFilter("ALL");
        setSearch("");
        setPage(1);
      } catch {
        setError("Gagal memuat detail rating. Silakan coba lagi.");
      }
    });
  };
  return (
    <section className="space-y-4 rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
      <div>
        <h3 className="text-lg font-bold">Detail Ticket Rating 1 & 2</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} tiket: {count1} rating 1 · {count2} rating 2 pada periode {appliedPeriod} ({deptSummary}). Buka detail untuk melihat keterangan tiket dan penyelesaiannya.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-44 flex-col gap-1 text-xs font-medium"><span>Tanggal mulai</span><DatePicker value={startDate} onChange={setStartDate} disabled={pending} className="h-10 rounded-xl" /></div>
        <div className="flex min-w-44 flex-col gap-1 text-xs font-medium"><span>Tanggal selesai</span><DatePicker value={endDate} onChange={setEndDate} disabled={pending} className="h-10 rounded-xl" /></div>
        <button type="button" onClick={applyFilters} disabled={pending} className="h-10 self-end rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">Terapkan Filter</button>
      </div>
      <p className="text-xs text-muted-foreground">Pilih kedua tanggal untuk periode khusus, termasuk lintas tahun. Kosongkan keduanya untuk memakai periode halaman.</p>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-36 flex-col gap-1 text-xs font-medium"><span id="rating-star-filter-label">Rating</span>
          <Select value={ratingFilter} onValueChange={value => { if (value) setRatingFilter(value); setPage(1); }} disabled={pending}>
            <SelectTrigger aria-labelledby="rating-star-filter-label" className="h-10 rounded-xl"><SelectValue>{ratingFilter === "ALL" ? "Rating 1 & 2" : `Rating ${ratingFilter}`}</SelectValue></SelectTrigger>
            <SelectContent className="rounded-xl duration-200">
              <SelectItem value="ALL">Rating 1 &amp; 2</SelectItem>
              <SelectItem value="1">Rating 1</SelectItem>
              <SelectItem value="2">Rating 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-48 flex-col gap-1 text-xs font-medium"><span id="rating-support-label">Petugas Support</span>
          <Select value={support} onValueChange={value => { if (value) setSupport(value); setPage(1); }} disabled={pending}>
            <SelectTrigger aria-labelledby="rating-support-label" className="h-10 rounded-xl"><SelectValue>{support === "ALL" ? "Semua Support" : support}</SelectValue></SelectTrigger>
            <SelectContent className="rounded-xl duration-200"><SelectItem value="ALL">Semua Support</SelectItem>{supports.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-medium">Cari tiket
          <input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Nomor tiket, cabang, tim, atau keterangan..." className="rounded-lg border bg-background p-2 text-sm" />
        </label>
      </div>
      {pending ? <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Memuat tiket rating 1 &amp; 2...</div> : filtered.length === 0 ? <EmptyState icon={Star} title="Tidak Ada Tiket Rating 1 & 2" description="Tidak ada tiket yang cocok dengan filter yang dipilih." /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-muted-foreground"><tr>
                <th className="p-3">Tiket / Tanggal</th><th className="p-3">Rating</th><th className="p-3">Support / Tim</th><th className="p-3">Cabang</th><th className="p-3">Keterangan Detail</th>
              </tr></thead>
              <tbody className="divide-y">
                {filtered.slice(start, start + 10).map((ticket, index) => (
                  <tr key={`${ticket.ticketNo}-${index}`} className="align-top">
                    <td className="p-3 font-semibold">{ticket.ticketNo}<div className="mt-1 whitespace-nowrap text-xs font-normal text-muted-foreground">{ticket.date}</div></td>
                    <td className="p-3"><span className="whitespace-nowrap font-semibold text-amber-600">{ticket.rating} ★</span></td>
                    <td className="p-3">{ticket.support}<div className="mt-1 text-xs text-muted-foreground">{ticket.department}</div></td>
                    <td className="p-3">{ticket.branch}</td>
                    <td className="min-w-64 max-w-lg p-3">
                      <p className="break-words font-medium">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Status: {ticket.status}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold text-blue-600">Lihat detail tiket</summary>
                        <dl className="mt-3 space-y-2 rounded-lg bg-muted/50 p-3">
                          <dt className="font-semibold">Keterangan status</dt><dd className="whitespace-pre-wrap break-words">{ticket.notes}</dd>
                          <dt className="font-semibold">Penyelesaian / Solusi IT</dt><dd className="whitespace-pre-wrap break-words">{ticket.resolution}</dd>
                        </dl>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>Menampilkan {start + 1}–{Math.min(start + 10, filtered.length)} dari {filtered.length} tiket</span>
            <div className="flex items-center gap-3">
              <button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button>
              <span>{currentPage} / {pages}</span>
              <button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Selanjutnya</button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
