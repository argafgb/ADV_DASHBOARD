"use client";

import { Fragment, type CSSProperties } from "react";

import { GridLines, XAxis, niceScale } from "./axis";
import { BarChart3 } from "lucide-react";
import { TipRows, useChartTooltip } from "./chart-tooltip";
import { EmptyState } from "./empty-state";
import type { StackedRow } from "@/features/it-repair-maintenance/types/it-repair.types";

export interface StackedSeries {
  key: string;
  label: string;
  color: string;
}

/**
 * `StackedBar` design system: distribusi status/hasil per kategori. Label
 * kategori = sumbu y, skala nilai = sumbu x dengan tick dan gridline di
 * belakang batang; semua batang digambar pada skala yang sama. Tiap baris
 * dirender berurutan (label, batang, total) persis seperti desain.
 */
export function StackedBar({
  rows,
  series,
  catWidth = 86,
  onSegmentClick,
  legend = true,
  axisLabel,
}: {
  rows: StackedRow[];
  series: StackedSeries[];
  catWidth?: number;
  onSegmentClick?: (row: StackedRow, s: StackedSeries) => void;
  legend?: boolean;
  axisLabel?: string | null;
}) {
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Tidak Ada Data"
        message="Belum ada data untuk kategori ini pada periode aktif."
        height={220}
      />
    );
  }

  const tip = useChartTooltip();
  const totals = rows.map((r) => series.reduce((a, s) => a + (r.values[s.key] || 0), 0));
  const { ticks, top } = niceScale(Math.max(1, ...totals), 4);

  return (
    <div className="dd-chart">
      {legend && (
        <div className="dd-chart__legend" style={{ marginBottom: 14 }}>
          {series.map((s) => (
            <span key={s.key} className="dd-chart__legenditem">
              <span className="dd-chart__dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div
        className={["dd-hbar", tip.active ? "dd-chart--dim" : ""].filter(Boolean).join(" ")}
        style={{ "--cat-w": `${catWidth}px` } as CSSProperties}
      >
        <GridLines ticks={ticks} top={top} rows={rows.length} />
        {rows.map((row, ri) => {
          const total = totals[ri];
          return (
            <Fragment key={row.label}>
              <span className="dd-chart__cat dd-hbar__ylabel" style={{ gridRow: ri + 1 }} title={row.label}>
                {row.label}
              </span>
              <div className="dd-hbar__plot" style={{ gridRow: ri + 1 }}>
                <div className="dd-sbar__track" style={{ width: `${(total / top) * 100}%` }}>
                  {series.map((s) => {
                    const v = row.values[s.key] || 0;
                    if (!v) return null;
                    return (
                      <div
                        key={s.key}
                        className={["dd-seg-part" + tip.hotClass(row.label), onSegmentClick ? "dd-clickable" : ""]
                          .filter(Boolean)
                          .join(" ")}
                        style={{ width: `${(v / (total || 1)) * 100}%`, background: s.color }}
                        title={onSegmentClick ? "Klik untuk melihat detail" : undefined}
                        onMouseEnter={(e) =>
                          tip.show(
                            e,
                            <TipRows
                              title={row.label}
                              rows={[
                                ...series.map((x) => ({ color: x.color, label: x.label, value: row.values[x.key] || 0 })),
                                { label: "Total", value: total },
                              ]}
                            />,
                            row.label,
                          )
                        }
                        onMouseMove={tip.move}
                        onMouseLeave={tip.hide}
                        onClick={onSegmentClick ? () => onSegmentClick(row, s) : undefined}
                      />
                    );
                  })}
                </div>
              </div>
              <span className="dd-chart__value dd-hbar__val" style={{ gridRow: ri + 1 }}>
                {total}
              </span>
            </Fragment>
          );
        })}
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
