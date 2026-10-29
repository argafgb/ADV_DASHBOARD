"use client";

import React, { useState } from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { useHoverTip } from "@/features/network-performance/context/TooltipLayer";
import type { CategoryDonutItem } from "../types/asset.types";

interface AssetCategoryDonutChartProps {
  categoryDonut: CategoryDonutItem[];
  total: number;
}

export function AssetCategoryDonutChart({
  categoryDonut,
  total,
}: AssetCategoryDonutChartProps) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const size = 170;
  const thick = 26;
  const r = (size - thick) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;

  const validSlices = categoryDonut.filter((d) => d.count > 0);
  const slicesWithOffsets = validSlices.reduce<
    Array<{ slice: (typeof validSlices)[0]; len: number; offset: number }>
  >((acc, d) => {
    const len = (d.count / Math.max(1, total)) * C;
    const prev = acc[acc.length - 1];
    const offset = prev ? prev.offset + prev.len : 0;
    acc.push({ slice: d, len, offset });
    return acc;
  }, []);

  return (
    <Card className="h-full min-w-0 border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
          Komposisi kategori
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-3.5">
          Porsi tiap kategori dari transaksi terpilih
        </p>

        {total === 0 ? (
          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            <EmptyState
              icon={PieChartIcon}
              title="Tidak Ada Proporsi Kategori"
              description="Tidak ada data kategori yang sesuai dengan filter saat ini."
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-4 min-h-[220px]">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              style={{ width: size, height: size }}
              className="block shrink-0 select-none"
            >
              {/* Background Track */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="currentColor"
                className="text-zinc-100 dark:text-zinc-800/80"
                strokeWidth={thick}
              />

              {/* Segment Slices */}
              {slicesWithOffsets.map(({ slice: d, len, offset }, i) => {
                const isHovered = hoveredIndex === i;

                return (
                  <circle
                    key={d.categoryKey}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={isHovered ? thick + 5 : thick}
                    strokeDasharray={`${len} ${C - len}`}
                    strokeDashoffset={-offset}
                    transform={`rotate(-90 ${cx} ${cy})`}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={(e) => {
                      setHoveredIndex(i);
                      tipEnter(
                        e,
                        {
                          title: d.name,
                          primary: `${d.count} unit`,
                          secondary: `(${Math.round((d.count / Math.max(1, total)) * 100)}% dari ${total} transaksi)`,
                          meta: `Kategori ${d.name}`,
                          tone: "blue",
                        },
                        "none",
                      );
                    }}
                    onMouseMove={tipMove}
                    onMouseLeave={() => {
                      setHoveredIndex(null);
                      tipLeave();
                    }}
                  />
                );
              })}

              {/* Center Counter */}
              <text
                x={cx}
                y={cy - 2}
                textAnchor="middle"
                fontSize={26}
                fontWeight={800}
                className="fill-zinc-900 dark:fill-zinc-50 font-display"
              >
                {total}
              </text>
              <text
                x={cx}
                y={cy + 17}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                className="fill-zinc-400 dark:fill-zinc-500 font-sans"
              >
                transaksi
              </text>
            </svg>
          </div>
        )}
      </div>

      {/* Legend with percentages */}
      <div className="flex flex-wrap items-center justify-center gap-3.5 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
        {categoryDonut.map((d) => (
          <span
            key={d.categoryKey}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400"
          >
            <i
              className="w-2.5 h-2.5 rounded-xs shrink-0"
              style={{ background: d.color }}
            />
            {d.name} {d.pct}%
          </span>
        ))}
      </div>
    </Card>
  );
}
