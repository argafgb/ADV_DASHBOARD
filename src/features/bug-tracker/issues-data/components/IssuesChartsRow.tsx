"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import SourceHint from "@/components/ui/SourceHint";
import { SeverityDonutData, HeatmapRow } from "../types/issuesData";
import { fmtId } from "../utils/issuesDataUtils";

interface IssuesChartsRowProps {
  donut: SeverityDonutData;
  heatmap: HeatmapRow[];
}

const HM_COLS = ["Crit", "Maj", "Min", "Rec", "Triv"];

export default function IssuesChartsRow({
  donut,
  heatmap,
}: IssuesChartsRowProps) {
  const gradient =
    donut.total > 0
      ? `conic-gradient(${donut.segs
          .map((s) => `${s.color} ${s.from}% ${s.to}%`)
          .join(", ")})`
      : undefined;

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_1.2fr] font-sans select-none">
      {/* Severity composition donut */}
      <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Severity composition
          <SourceHint
            fields={[
              {
                label: "Proporsi donut",
                field: "Severity",
                rule: "Tiap irisan menunjukkan jumlah record menurut Severity setelah filter aktif diterapkan.",
              },
            ]}
            notes={[
              "Angka di tengah = total record yang lolos semua filter (termasuk pencarian teks).",
            ]}
          />
        </h3>
        <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
          Proporsi tingkat prioritas
        </p>

        <div className="flex flex-1 items-center gap-5 py-3">
          <div
            className="flex h-26 w-26 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
            style={gradient ? { background: gradient } : undefined}
          >
            <div className="flex h-17 w-17 flex-col items-center justify-center rounded-full bg-white dark:bg-zinc-900">
              <span className="text-[19px] font-extrabold leading-none text-zinc-900 dark:text-zinc-50 font-display">
                {fmtId(donut.total)}
              </span>
              <span className="mt-0.5 text-[9.5px] text-zinc-400 dark:text-zinc-500">
                record
              </span>
            </div>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-[9px_1fr_auto] items-center gap-x-2 gap-y-1.5">
            {donut.segs.map((s) => (
              <React.Fragment key={s.key}>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="whitespace-nowrap text-[11.5px] text-zinc-500 dark:text-zinc-400">
                  {s.label}
                </span>
                <span className="text-right text-[11.5px] font-bold text-zinc-700 dark:text-zinc-300">
                  {fmtId(s.n)}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </Card>

      {/* Severity heatmap */}
      <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Severity heatmap
          <SourceHint
            fields={[
              {
                label: "Baris (developer)",
                field: "Dev Name",
                rule: "6 developer dengan jumlah temuan terbanyak pada filter aktif.",
              },
              {
                label: "Kolom (severity)",
                field: "Severity",
                rule: "Jumlah record per developer per Severity; intensitas warna relatif terhadap nilai tertinggi di tabel.",
              },
            ]}
            notes={[
              "Tabel ini mengikuti semua filter aktif (tipe, severity, status, tahap, dan pencarian).",
            ]}
          />
        </h3>
        <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
          Konsentrasi temuan per developer
        </p>

        <div className="mt-2.5 grid grid-cols-[6rem_repeat(5,1fr)] items-center gap-1">
          <span />
          {HM_COLS.map((c) => (
            <span
              key={c}
              className="text-center text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="mt-1 flex flex-col gap-1">
          {heatmap.length > 0 ? (
            heatmap.map((r) => (
              <div
                key={r.name}
                className="grid grid-cols-[6rem_repeat(5,1fr)] items-center gap-1"
              >
                <span className="truncate text-[11px] text-zinc-600 dark:text-zinc-300">
                  {r.name}
                </span>
                {r.cells.map((c, i) => (
                  <span
                    key={i}
                    className={`inline-flex h-5 items-center justify-center rounded text-[10.5px] font-bold font-display ${
                      c.n === 0
                        ? "bg-zinc-50 dark:bg-zinc-800/60"
                        : c.t > 0.5
                          ? "text-white"
                          : "text-zinc-600 dark:text-zinc-300"
                    }`}
                    style={
                      c.n
                        ? {
                            backgroundColor: `rgba(37,99,235,${(0.1 + c.t * 0.72).toFixed(2)})`,
                          }
                        : undefined
                    }
                  >
                    {c.n ? fmtId(c.n) : ""}
                  </span>
                ))}
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs italic text-zinc-400 dark:text-zinc-500">
              Tidak ada data developer pada filter ini
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
