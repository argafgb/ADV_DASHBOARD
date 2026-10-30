"use client";

import { niceScale, useMeasuredWidth } from "./axis";
import { BarChart3 } from "lucide-react";
import { TipRows, useChartTooltip } from "./chart-tooltip";
import { EmptyState } from "./empty-state";
import type { ChartSeries } from "@/features/it-repair-maintenance/types/it-repair.types";

/**
 * `GroupedBar` design system: batang per kategori (satu atau dua seri
 * berdampingan) dengan kedua garis sumbu, tick y, gridline horizontal, dan
 * nilai di atas batang.
 */
export function GroupedBar({
  categories,
  series,
  height = 240,
  barWidth = 20,
  showValues = true,
  onBarClick,
}: {
  categories: string[];
  series: ChartSeries[];
  height?: number;
  barWidth?: number;
  showValues?: boolean;
  onBarClick?: (category: string) => void;
}) {
  if (!categories || categories.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Tidak Ada Data Grafik"
        message="Belum ada data untuk ditampilkan pada grafik batang."
        height={height}
      />
    );
  }

  const tip = useChartTooltip();
  const [wrapRef, W] = useMeasuredWidth<HTMLDivElement>(640);
  const PL = 38;
  const PR = 12;
  const PT = 18;
  const PB = 30;
  const { ticks, top } = niceScale(Math.max(1, ...series.flatMap((s) => s.data)), 4);
  const band = (W - PL - PR) / Math.max(categories.length, 1);
  const y = (v: number) => PT + (1 - v / top) * (height - PT - PB);
  const groupW = series.length * barWidth + (series.length - 1) * 5;

  return (
    <div className="dd-chart" ref={wrapRef}>
      <div className="dd-chart__legend" style={{ marginBottom: 12 }}>
        {series.map((s) => (
          <span key={s.label} className="dd-chart__legenditem">
            <span className="dd-chart__dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg className="dd-gbar" width="100%" height={height} viewBox={`0 0 ${W} ${height}`}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="dd-chart__grid" x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} />
            <text className="dd-chart__axis" x={PL - 9} y={y(v) + 3.5} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <line className="dd-chart__axisline" x1={PL} x2={PL} y1={PT - 6} y2={y(0)} />
        <line className="dd-chart__axisline" x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} />
        <g className={tip.active ? "dd-chart--dim" : undefined}>
          {categories.map((cat, ci) => {
            const cx = PL + band * ci + band / 2;
            return (
              <g key={cat}>
                {series.map((s, si) => {
                  const v = s.data[ci] || 0;
                  const bx = cx - groupW / 2 + si * (barWidth + 5);
                  const bh = Math.max(y(0) - y(v), 0);
                  return (
                    <g key={s.label}>
                      <rect
                        className={["dd-mark" + tip.hotClass(cat), onBarClick ? "dd-clickable" : ""].filter(Boolean).join(" ")}
                        x={bx}
                        y={y(v)}
                        width={barWidth}
                        height={bh}
                        rx={4}
                        fill={s.color}
                        onMouseEnter={(e) =>
                          tip.show(
                            e,
                            <TipRows title={cat} rows={series.map((x) => ({ color: x.color, label: x.label, value: x.data[ci] || 0 }))} />,
                            cat,
                          )
                        }
                        onMouseMove={tip.move}
                        onMouseLeave={tip.hide}
                        onClick={onBarClick ? () => onBarClick(cat) : undefined}
                      />
                      {showValues && v > 0 && (
                        <text className="dd-chart__barval" x={bx + barWidth / 2} y={y(v) - 6} textAnchor="middle">
                          {v}
                        </text>
                      )}
                    </g>
                  );
                })}
                <text className="dd-gbar__xlabel" x={cx} y={height - 10} textAnchor="middle">
                  {cat}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {tip.node}
    </div>
  );
}
