"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import SourceHint from "@/components/ui/SourceHint";
import { MonthBar, SevLegendItem } from "../types/issuesData";
import { fmtId } from "../utils/issuesDataUtils";

interface FindingsPerMonthCardProps {
  bars: MonthBar[];
  legend: SevLegendItem[];
  /** Tahun yang ditampilkan kartu ini */
  year: number;
  /** Kartu pembanding tahun lalu tampil lebih redup */
  variant?: "current" | "previous";
}

export default function FindingsPerMonthCard({
  bars,
  legend,
  year,
  variant = "current",
}: FindingsPerMonthCardProps) {
  const isPrev = variant === "previous";
  const [tipIdx, setTipIdx] = useState<number | null>(null);

  return (
    <Card className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 font-sans select-none">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0">
          <h3
            className={`flex items-center gap-2 text-sm font-bold ${
              isPrev
                ? "text-zinc-500 dark:text-zinc-400"
                : "text-zinc-900 dark:text-zinc-50"
            }`}
          >
            Findings per month
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold font-display ${
                isPrev
                  ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  : "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
              }`}
            >
              {year}
            </span>
            <SourceHint
              fields={[
                {
                  label: "Tinggi batang tiap bulan",
                  field: "Periode (Year + Month)",
                  rule: `Jumlah record Notion yang Periode-nya bertahun ${year}, dikelompokkan menurut bulan Periode (bukan tanggal temuan).`,
                },
                {
                  label: "Warna & angka legenda",
                  field: "Severity",
                  rule: "Tiap batang dipecah menurut nilai Severity; angka di legenda adalah total record per Severity pada tahun ini.",
                },
              ]}
              notes={[
                isPrev
                  ? "Skala tinggi batang dikunci sama dengan kartu tahun berjalan agar bisa dibandingkan langsung."
                  : "Batang mengikuti filter aktif (severity, tipe, status, dan pencarian) di halaman ini.",
                "Record tanpa Periode tidak masuk grafik mana pun.",
              ]}
            />
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            {isPrev
              ? "Periode yang sama tahun lalu sebagai pembanding"
              : "Jumlah temuan tiap bulan dipecah menurut tingkat temuan · arahkan kursor ke batang untuk rinciannya"}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-4 pt-0.5">
          {legend.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-zinc-500 dark:text-zinc-400"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
              <span className="font-bold text-zinc-700 dark:text-zinc-300 font-display">
                {fmtId(s.n)}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3.5 flex h-52 items-end gap-3">
        {bars.map((c, i) => {
          const showTip = tipIdx === i && c.total > 0;
          const tx =
            i <= 1
              ? "translateX(-14%)"
              : i >= 10
                ? "translateX(-86%)"
                : "translateX(-50%)";
          return (
            <div
              key={c.label}
              onMouseEnter={() => setTipIdx(i)}
              onMouseLeave={() => setTipIdx(null)}
              className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              {showTip && (
                <div
                  className="absolute bottom-6.5 left-1/2 z-40 w-52 rounded-[10px] border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  style={{ transform: tx }}
                >
                  <div className="mb-2 text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50">
                    {c.tipTitle}
                  </div>
                  <div className="grid grid-cols-[9px_1fr_auto_auto] items-center gap-x-2 gap-y-1.5">
                    {c.rows.map((s) => (
                      <React.Fragment key={s.label}>
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{
                            backgroundColor: s.color,
                            opacity: s.dim ? 0.4 : 1,
                          }}
                        />
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {s.label}
                        </span>
                        <span className="text-right text-[11px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                          {fmtId(s.n)}
                        </span>
                        <span className="min-w-7 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
                          {s.pct}%
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              <span className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 font-display">
                {c.total ? fmtId(c.total) : ""}
              </span>
              <div
                className="flex w-full max-w-18 flex-col justify-end overflow-hidden rounded-t-[5px]"
                style={{ height: `${c.h}px` }}
              >
                {c.segs.map((s, j) => (
                  <div
                    key={j}
                    className="w-full"
                    style={{ backgroundColor: s.color, height: `${s.h}px` }}
                  />
                ))}
              </div>
              <span
                className={`text-[10.5px] ${
                  tipIdx === i
                    ? "font-bold text-zinc-600 dark:text-zinc-300"
                    : "font-medium text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {c.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
