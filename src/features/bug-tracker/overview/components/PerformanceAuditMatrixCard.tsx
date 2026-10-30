"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/shared/EmptyState";
import SourceHint from "@/components/ui/SourceHint";
import { fmt } from "@/lib/utils";
import { FileX2, Search, SearchX, X } from "lucide-react";
import { AuditMatrixRow, SeverityType } from "../types/overviewTypes";

interface PerformanceAuditMatrixCardProps {
  rows: AuditMatrixRow[];
  onRowClick?: (name: string) => void;
  onViewAllClick?: () => void;
}

const SEV_CHIP_ORDER: { key: SeverityType; label: string; cls: string }[] = [
  {
    key: "Critical",
    label: "CRI",
    cls: "bg-rose-50/80 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
  },
  {
    key: "Major",
    label: "MAJ",
    cls: "bg-amber-50/80 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  },
  {
    key: "Minor",
    label: "MIN",
    cls: "bg-blue-50/80 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  },
  {
    key: "Recurring",
    label: "REC",
    cls: "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  {
    key: "Trivia",
    label: "TRI",
    cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
];

const STATUS_TONE_CLASS = {
  red: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400",
  green:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400",
} as const;

function avgClass(avgDays: number | null): string {
  if (avgDays === null) return "text-zinc-400 dark:text-zinc-500";
  if (avgDays > 30) return "text-rose-600 dark:text-rose-400";
  if (avgDays > 14) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

export default function PerformanceAuditMatrixCard({
  rows,
  onRowClick,
  onViewAllClick,
}: PerformanceAuditMatrixCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("id-ID");
  const visibleRows = useMemo(
    () =>
      normalizedQuery
        ? rows.filter((row) =>
            row.name.toLocaleLowerCase("id-ID").includes(normalizedQuery),
          )
        : rows,
    [normalizedQuery, rows],
  );

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 font-sans select-none">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
            Performance audit matrix
            <SourceHint
              fields={[
                {
                  label: "Nama & urutan",
                  field: "Dev Name",
                  rule: 'Record dikelompokkan per Dev Name (record kosong atau "-" dilewati), lalu seluruh developer diurutkan dari skor tertinggi.',
                },
                {
                  label: "Skor",
                  field: "Severity",
                  rule: "Jumlah bobot temuan orang tersebut: Critical 10, Recurring 8, Major 5, Minor 2, Trivia 1.",
                },
                {
                  label: "Selesai",
                  field: "Status Dev",
                  rule: 'Jumlah record yang Status Dev-nya bernilai "Done" (huruf besar/kecil dan catatan tambahan diabaikan).',
                },
                {
                  label: "Rata-rata hari",
                  field: "Discovery Date + Finish Date",
                  rule: "Selisih hari Finish Date dikurangi Discovery Date, dirata-rata. Record tanpa salah satu tanggal atau berselisih negatif tidak ikut dihitung.",
                },
                {
                  label: "Status (Perlu audit / dipantau / terkendali)",
                  field: "Severity",
                  rule: "Penilaian dashboard dari rasio skor terhadap skor tertinggi: min. 70% Perlu audit, min. 40% Perlu dipantau, sisanya Terkendali.",
                },
              ]}
              notes={[
                "Status dan skor adalah hitungan dashboard, bukan kolom yang ada di Notion.",
                "Pencarian hanya menyaring baris yang terlihat dan tidak mengubah skor, peringkat, atau filter dashboard.",
              ]}
            />
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
            Seluruh developer diurutkan dari bobot risiko tertinggi
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-56">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari developer..."
                aria-label="Cari developer pada performance audit matrix"
                autoComplete="off"
                className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-9 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-500 dark:focus:bg-zinc-800 dark:focus:ring-blue-950 select-text"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Hapus pencarian developer"
                  className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onViewAllClick}
              className="h-9 shrink-0 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Lihat semua record
            </button>
          </div>
          <span
            aria-live="polite"
            className="text-[11px] text-zinc-400 dark:text-zinc-500"
          >
            {normalizedQuery
              ? `${fmt(visibleRows.length)} dari ${fmt(rows.length)} developer ditampilkan`
              : `${fmt(rows.length)} developer ditampilkan`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-208">
          {/* Head */}
          <div className="grid grid-cols-[3.25rem_1.25fr_5.75rem_2.1fr_6rem_5.75rem_7.25rem] gap-2.5 border-b border-zinc-100 px-2 pb-2 dark:border-zinc-800">
            {[
              "Rank",
              "Developer",
              "Workload",
              "Severity breakdown",
              "Avg. handling",
              "Penalty score",
              "Status",
            ].map((h) => (
              <span
                key={h}
                className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {visibleRows.length > 0 ? (
            visibleRows.map((row) => (
              <div
                key={row.name}
                onClick={() => onRowClick?.(row.name)}
                className={`grid min-h-10.5 cursor-pointer grid-cols-[3.25rem_1.25fr_5.75rem_2.1fr_6rem_5.75rem_7.25rem] items-center gap-2.5 border-b border-zinc-100 px-2 py-1 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                  row.rank === 1 ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                }`}
              >
                {/* Rank */}
                <span>
                  <span
                    className={`inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg text-xs font-bold font-display ${
                      row.rank <= 3
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {row.rank}
                  </span>
                </span>

                {/* Developer */}
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-zinc-800 dark:text-zinc-100">
                    {row.name}
                  </span>
                  <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">
                    {fmt(row.projectCount)} project · {fmt(row.doneCount)}{" "}
                    selesai
                  </span>
                </span>

                {/* Workload */}
                <span>
                  <span className="block text-sm font-extrabold leading-tight text-zinc-900 dark:text-zinc-50 font-display">
                    {fmt(row.total)}
                  </span>
                  <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">
                    temuan
                  </span>
                </span>

                {/* Severity breakdown */}
                <span className="grid grid-cols-5 gap-1.5">
                  {SEV_CHIP_ORDER.map((c) => {
                    const n = row.sevCounts[c.key] || 0;
                    return (
                      <span
                        key={c.key}
                        className={`flex flex-col items-center gap-px rounded-md py-1 ${c.cls}`}
                        style={{ opacity: n ? 1 : 0.4 }}
                      >
                        <span className="text-xs font-extrabold leading-none font-display">
                          {fmt(n)}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          {c.label}
                        </span>
                      </span>
                    );
                  })}
                </span>

                {/* Avg handling */}
                <span className={`text-xs font-bold ${avgClass(row.avgDays)}`}>
                  {row.avgDays === null ? "-" : `${row.avgDays} hari`}
                </span>

                {/* Penalty score */}
                <span className="text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50 font-display">
                  {fmt(row.score)}
                </span>

                {/* Status */}
                <span>
                  <span
                    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_TONE_CLASS[row.tone]}`}
                  >
                    {row.statusLabel}
                  </span>
                </span>
              </div>
            ))
          ) : (
            <EmptyState
              icon={rows.length === 0 ? FileX2 : SearchX}
              title={
                rows.length === 0
                  ? "Data developer belum tersedia"
                  : "Developer tidak ditemukan"
              }
              description={
                rows.length === 0
                  ? "Belum ada data audit untuk filter periode yang dipilih."
                  : `Tidak ada nama yang cocok dengan “${searchQuery.trim()}”. Coba kata kunci lain.`
              }
              height={160}
              className="py-8"
              action={
                rows.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Hapus pencarian
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
      </div>
    </Card>
  );
}
