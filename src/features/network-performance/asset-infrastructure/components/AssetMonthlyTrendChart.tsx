"use client";

import React, { useEffect, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { useHoverTip } from "@/features/network-performance/context/TooltipLayer";
import type { MonthlyCategoryTrend } from "../types/asset.types";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "../utils/assetFormatters";

interface AssetMonthlyTrendChartProps {
  monthlyTrends: MonthlyCategoryTrend[];
}

const CATEGORIES: ("Router" | "Switch" | "AP")[] = ["Router", "Switch", "AP"];

export function AssetMonthlyTrendChart({
  monthlyTrends,
}: AssetMonthlyTrendChartProps) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(680);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect?.width) {
        setContainerWidth(Math.round(entry.contentRect.width));
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const totalUnits = monthlyTrends.reduce((acc, curr) => acc + curr.total, 0);

  // Dynamic responsive SVG dimensions that adapt to exact container width
  const W = Math.max(320, containerWidth);
  const H = 220;
  const padL = 32;
  const padR = 12;
  const padT = 16;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const rawMax = Math.max(1, ...monthlyTrends.map((d) => d.total));
  const step = Math.max(1, Math.ceil(rawMax / 4));
  const yMax = step * 4;
  const yv = (v: number) => padT + plotH - (v / yMax) * plotH;

  const slot = plotW / Math.max(1, monthlyTrends.length);
  const bw = Math.min(48, Math.max(16, slot * 0.45));

  return (
    <Card className="h-full min-w-0 border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
          Tren bulanan per kategori
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-3.5">
          Jumlah unit per bulan · Jan–Agu 2026
        </p>

        {totalUnits === 0 ? (
          <div className="flex-1 min-h-[200px] flex items-center justify-center">
            <EmptyState
              icon={BarChart3}
              title="Data Grafik Tidak Ditemukan"
              description="Tidak ada transaksi pada filter yang dipilih."
            />
          </div>
        ) : (
          <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center w-full overflow-hidden min-h-[200px]"
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              style={{ width: "100%", height: H }}
              className="block select-none"
            >
              {/* Y Gridlines and labels */}
              {Array.from({ length: 5 }, (_, i) => {
                const v = i * step;
                const y = yv(v);
                return (
                  <g key={`grid-${i}`}>
                    <line
                      x1={padL}
                      x2={W - padR}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      className="text-zinc-100 dark:text-zinc-800/80"
                      strokeWidth={1}
                    />
                    <text
                      x={padL - 6}
                      y={y + 3}
                      textAnchor="end"
                      fontSize={10}
                      className="fill-zinc-400 dark:fill-zinc-500 font-sans"
                    >
                      {v}
                    </text>
                  </g>
                );
              })}

              {/* Monthly Stacked Bars */}
              {monthlyTrends.map((d, i) => {
                const x = padL + slot * i + (slot - bw) / 2;
                let yTop = padT + plotH;

                return (
                  <g key={d.monthKey}>
                    {CATEGORIES.map((cat) => {
                      const count = d[cat];
                      if (!count) return null;
                      const barH = (count / yMax) * plotH;
                      yTop -= barH;

                      return (
                        <rect
                          key={d.monthKey + cat}
                          x={x}
                          y={yTop}
                          width={bw}
                          height={Math.max(1, barH - 1)}
                          rx={2}
                          fill={CATEGORY_COLORS[cat]}
                          className="cursor-pointer transition-opacity hover:opacity-85"
                          onMouseEnter={(e) =>
                            tipEnter(
                              e,
                              {
                                title: `${CATEGORY_LABELS[cat]} · ${d.monthLabel} 2026`,
                                primary: `${count} unit`,
                                secondary: `(${count} dari ${d.total} transaksi bulan ini)`,
                                meta: `Total ${d.monthLabel}: ${d.total} transaksi`,
                                tone: "blue",
                              },
                              "rect",
                            )
                          }
                          onMouseMove={tipMove}
                          onMouseLeave={tipLeave}
                        />
                      );
                    })}

                    {/* Month Label */}
                    <text
                      x={padL + slot * i + slot / 2}
                      y={H - 6}
                      textAnchor="middle"
                      fontSize={10.5}
                      className="fill-zinc-400 dark:fill-zinc-500 font-sans"
                    >
                      {d.monthLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
        {CATEGORIES.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400"
          >
            <i
              className="w-2.5 h-2.5 rounded-xs shrink-0"
              style={{ background: CATEGORY_COLORS[cat] }}
            />
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>
    </Card>
  );
}
