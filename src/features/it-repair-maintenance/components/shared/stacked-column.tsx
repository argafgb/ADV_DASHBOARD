"use client";

import { niceScale, useMeasuredWidth } from "./axis";
import { TrendingUp } from "lucide-react";
import { TipRows, useChartTooltip } from "./chart-tooltip";
import { EmptyState } from "./empty-state";
import type { ChartSeries } from "@/features/it-repair-maintenance/types/it-repair.types";

/**
 * `StackedColumn` design system: kolom bertumpuk per periode dengan kedua
 * garis sumbu, tick y bergaris putus, label x, total di atas kolom, tooltip
 * rincian per seri, dan legenda di tengah bawah.
 */
export function StackedColumn({
  categories,
  series,
  height = 300,
  barWidth = 46,
  showTotals = true,
  legend = true,
  onColumnClick,
}: {
  categories: string[];
  series: ChartSeries[];
  height?: number;
  barWidth?: number;
  showTotals?: boolean;
  legend?: boolean;
  onColumnClick?: (index: number) => void;
}) {
  if (!categories || categories.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Tidak Ada Data Kolom"
        message="Belum ada data untuk ditampilkan pada grafik kolom."
        height={height}
      />
    );
  }

  const tip = useChartTooltip();
  const [wrapRef, W] = useMeasuredWidth<HTMLDivElement>(900);
  const totals = categories.map((_, i) => series.reduce((a, s) => a + (s.data[i] || 0), 0));
  const { ticks, top } = niceScale(Math.max(1, ...totals), 4);
  const PL = 44;
  const PR = 16;
  const PT = 26;
  const PB = 34;
  const band = (W - PL - PR) / Math.max(categories.length, 1);
  const y = (v: number) => PT + (1 - v / top) * (height - PT - PB);
  const bw = Math.min(barWidth, band * 0.62);

  return (
    <div className="dd-chart" ref={wrapRef}>
      <svg className="dd-scol" width="100%" height={height} viewBox={`0 0 ${W} ${height}`}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="dd-chart__gridDash" x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} />
            <text className="dd-chart__axis" x={PL - 10} y={y(v) + 3.5} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <line className="dd-chart__axisline" x1={PL} x2={PL} y1={PT - 10} y2={y(0)} />
        <line className="dd-chart__axisline" x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} />
        <g className={tip.active ? "dd-chart--dim" : undefined}>
          {categories.map((cat, ci) => {
            const cx = PL + band * ci + band / 2;
            const total = totals[ci];
            let acc = 0;
            const rows = series.map((s) => ({ color: s.color, label: s.label, value: s.data[ci] || 0 }));
            return (
              <g
                key={cat}
                className={onColumnClick ? "dd-clickable" : undefined}
                onMouseEnter={(e) =>
                  tip.show(e, <TipRows title={cat} rows={[...rows, { label: "Total", value: total }]} />, cat)
                }
                onMouseMove={tip.move}
                onMouseLeave={tip.hide}
                onClick={onColumnClick ? () => onColumnClick(ci) : undefined}
              >
                <rect x={cx - band / 2} y={PT - 10} width={band} height={height - PT - PB + 10} fill="transparent" />
                {series.map((s) => {
                  const v = s.data[ci] || 0;
                  if (!v) return null;
                  const h = (v / top) * (height - PT - PB);
                  acc += h;
                  return (
                    <rect
                      key={s.key}
                      className={"dd-mark" + tip.hotClass(cat)}
                      x={cx - bw / 2}
                      y={y(0) - acc}
                      width={bw}
                      height={h}
                      fill={s.color}
                    />
                  );
                })}
                {showTotals && total > 0 && (
                  <text className="dd-chart__barval" x={cx} y={y(total) - 8} textAnchor="middle">
                    {total}
                  </text>
                )}
                <text className="dd-scol__xlabel" x={cx} y={height - 11} textAnchor="middle">
                  {cat}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {legend && (
        <div className="dd-chart__legend dd-scol__legend">
          {series.map((s) => (
            <span key={s.key} className="dd-chart__legenditem">
              <span className="dd-chart__dot dd-chart__dot--round" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      {tip.node}
    </div>
  );
}
