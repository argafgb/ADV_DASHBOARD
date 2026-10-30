"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import SourceHint from "@/components/ui/SourceHint";
import { fmtId } from "@/features/bug-tracker/issues-data/utils/issuesDataUtils";
import { BugCrChartData } from "../types/issuesByProject";

const BUG_COLOR = "#ef4444";
const CR_COLOR = "#2563EB";
const UNCLASSIFIED_COLOR = "#a1a1aa";

interface BugVsCrCardProps {
  data: BugCrChartData;
  /** Tahun yang ditampilkan kartu ini */
  year: number;
  /** Kartu pembanding tahun lalu tampil lebih redup */
  variant?: "current" | "previous";
}

export default function BugVsCrCard({
  data,
  year,
  variant = "current",
}: BugVsCrCardProps) {
  const [tipIdx, setTipIdx] = useState<number | null>(null);
  const isPrev = variant === "previous";

  return (
    <Card className="min-w-0 rounded-xl border border-zinc-200 bg-white px-4.5 pb-4 pt-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 font-sans select-none">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0">
          <h3
            className={`flex items-center gap-2 text-sm font-bold ${
              isPrev
                ? "text-zinc-500 dark:text-zinc-400"
                : "text-zinc-900 dark:text-zinc-50"
            }`}
          >
            Bug vs change request
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
                  label: "Posisi batang (bulan)",
                  field: "Periode (Year + Month)",
                  rule: `Record dengan Periode bertahun ${year}, dikelompokkan menurut bulan Periode.`,
                },
                {
                  label: "Bug vs Change request",
                  field: "Type (Bug/Change Request)",
                  rule: 'Batang merah hanya Type "Bug"; batang biru hanya Type "Change Request". Nilai kosong/tidak dikenal tidak dimasukkan ke keduanya.',
                },
              ]}
              notes={[
                isPrev
                  ? "Skala tinggi batang dikunci sama dengan kartu tahun berjalan agar bisa dibandingkan langsung."
                  : "Record tanpa Type ditampilkan sebagai data belum diklasifikasi dan tidak ditebak dari Type Testing.",
              ]}
            />
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            {isPrev
              ? "Periode yang sama tahun lalu sebagai pembanding"
              : "Perbandingan temuan cacat dan permintaan perubahan per bulan · arahkan kursor ke batang untuk rinciannya"}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-4 pt-0.75">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-zinc-500 dark:text-zinc-400">
            <span
              className="h-2.25 w-2.25 rounded-xs"
              style={{ backgroundColor: BUG_COLOR }}
            />
            Bug
            <span className="font-bold text-zinc-700 dark:text-zinc-300 font-display">
              {fmtId(data.totalBug)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-zinc-500 dark:text-zinc-400">
            <span
              className="h-2.25 w-2.25 rounded-xs"
              style={{ backgroundColor: CR_COLOR }}
            />
            Change request
            <span className="font-bold text-zinc-700 dark:text-zinc-300 font-display">
              {fmtId(data.totalCr)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-zinc-500 dark:text-zinc-400">
            <span
              className="h-2.25 w-2.25 rounded-xs"
              style={{ backgroundColor: UNCLASSIFIED_COLOR }}
            />
            Belum diklasifikasi
            <span className="font-bold text-zinc-700 dark:text-zinc-300 font-display">
              {fmtId(data.totalUnclassified)}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-3.5 flex h-52 items-end gap-3">
        {data.bars.map((c, k) => {
          const showTip = tipIdx === k && c.nb + c.nc + c.nu > 0;
          const tx =
            k <= 1
              ? "translateX(-14%)"
              : k >= 10
                ? "translateX(-86%)"
                : "translateX(-50%)";
          return (
            <div
              key={c.label}
              onMouseEnter={() => setTipIdx(k)}
              onMouseLeave={() => setTipIdx(null)}
              className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              {showTip && (
                <div
                  className="absolute bottom-6.5 left-1/2 z-40 w-49 rounded-[10px] border border-zinc-200 bg-white px-3.25 py-2.75 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  style={{ transform: tx }}
                >
                  <div className="mb-2 text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50">
                    {c.tipTitle}
                  </div>
                  <div className="grid grid-cols-[9px_1fr_auto_auto] items-center gap-x-2 gap-y-1.5">
                    {c.rows.map((s) => (
                      <React.Fragment key={s.label}>
                        <span
                          className="h-2.25 w-2.25 rounded-xs"
                          style={{
                            backgroundColor:
                              s.colorKey === "bug"
                                ? BUG_COLOR
                                : s.colorKey === "cr"
                                  ? CR_COLOR
                                  : UNCLASSIFIED_COLOR,
                            opacity: s.dim ? 0.4 : 1,
                          }}
                        />
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {s.label}
                        </span>
                        <span className="text-right text-[11px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                          {fmtId(s.n)}
                        </span>
                        <span className="min-w-7.5 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
                          {s.pct}%
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex h-full w-full max-w-17.5 items-end justify-center gap-1">
                <span className="flex h-full flex-1 flex-col items-center justify-end gap-0.75">
                  <span
                    className="text-[9.5px] font-bold font-display"
                    style={{ color: BUG_COLOR }}
                  >
                    {c.nb ? fmtId(c.nb) : ""}
                  </span>
                  <span
                    className="w-full rounded-t-sm"
                    style={{ backgroundColor: BUG_COLOR, height: `${c.hb}px` }}
                  />
                </span>
                <span className="flex h-full flex-1 flex-col items-center justify-end gap-0.75">
                  <span
                    className="text-[9.5px] font-bold font-display"
                    style={{ color: CR_COLOR }}
                  >
                    {c.nc ? fmtId(c.nc) : ""}
                  </span>
                  <span
                    className="w-full rounded-t-sm"
                    style={{ backgroundColor: CR_COLOR, height: `${c.hc}px` }}
                  />
                </span>
              </div>
              <span
                className={`text-[10.5px] ${
                  tipIdx === k
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
