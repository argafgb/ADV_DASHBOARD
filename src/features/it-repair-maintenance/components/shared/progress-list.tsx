"use client";

import { Fragment, type CSSProperties } from "react";

import { GridLines, XAxis, niceScale } from "./axis";
import { Users } from "lucide-react";
import { TipRows, useChartTooltip } from "./chart-tooltip";
import { EmptyState } from "./empty-state";
import type { WorkloadRow } from "@/features/it-repair-maintenance/types/it-repair.types";

/**
 * `ProgressList` design system: batang selesai/sisa per orang pada skala
 * bersama, dengan meta "selesai/total" di kanan. Tiap baris dirender
 * berurutan (label, batang, meta) persis seperti desain.
 */
export function ProgressList({
  rows,
  doneColor = "var(--chart-green)",
  restColor = "var(--chart-blue-primary)",
  doneLabel = "Done",
  restLabel = "On progress",
  catWidth = 116,
  axisLabel,
}: {
  rows: WorkloadRow[];
  doneColor?: string;
  restColor?: string;
  doneLabel?: string;
  restLabel?: string;
  catWidth?: number;
  axisLabel?: string | null;
}) {
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Tidak Ada Data Beban Kerja"
        message="Belum ada data beban kerja PIC pada periode aktif."
        height={220}
      />
    );
  }

  const tip = useChartTooltip();
  const totals = rows.map((r) => (r.done || 0) + (r.rest || 0));
  const { ticks, top } = niceScale(Math.max(1, ...totals), 4);

  return (
    <div className="dd-chart">
      <div
        className={["dd-hbar", tip.active ? "dd-chart--dim" : ""].filter(Boolean).join(" ")}
        style={{ "--cat-w": `${catWidth}px`, "--val-w": "52px" } as CSSProperties}
      >
        <GridLines ticks={ticks} top={top} rows={rows.length} />
        {rows.map((r, i) => (
          <Fragment key={r.label}>
            <span className="dd-chart__cat dd-hbar__ylabel" style={{ gridRow: i + 1 }} title={r.label}>
              {r.label}
            </span>
            <div
              className="dd-hbar__plot"
              style={{ gridRow: i + 1 }}
              onMouseEnter={(e) =>
                tip.show(
                  e,
                  <TipRows
                    title={r.label}
                    rows={[
                      { color: doneColor, label: doneLabel, value: r.done || 0 },
                      { color: restColor, label: restLabel, value: r.rest || 0 },
                      { label: "Total", value: totals[i] },
                    ]}
                  />,
                  r.label,
                )
              }
              onMouseMove={tip.move}
              onMouseLeave={tip.hide}
            >
              <div className="dd-plist__track" style={{ width: `${(totals[i] / top) * 100}%`, minWidth: totals[i] === 0 ? "4px" : undefined }}>
                <div
                  className={"dd-seg-part" + tip.hotClass(r.label)}
                  style={{ width: `${((r.done || 0) / (totals[i] || 1)) * 100}%`, background: doneColor }}
                />
                <div
                  className={"dd-seg-part" + tip.hotClass(r.label)}
                  style={{ width: `${((r.rest || 0) / (totals[i] || 1)) * 100}%`, background: restColor }}
                />
              </div>
            </div>
            <span className="dd-plist__meta dd-hbar__val" style={{ gridRow: i + 1 }}>
              {(r.done || 0) + "/" + totals[i]}
            </span>
          </Fragment>
        ))}
        <XAxis ticks={ticks} top={top} row={rows.length + 1} />
        {axisLabel && (
          <div className="dd-hbar__axistitle" style={{ gridRow: rows.length + 2 }}>
            {axisLabel}
          </div>
        )}
      </div>
      {tip.node}
    </div>
  );
}
