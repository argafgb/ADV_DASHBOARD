"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { AnimatedBar, AnimatedValue } from "../ui/animated-value";
import { Card } from "../Card";
import { FloatingTip } from "../charts/chart-tooltip";
import { YEAR_COLORS } from "../../utils/dashboard-config";
import { YearLegend } from "./YearLegend";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import type { OverviewModel } from "../../utils/build-overview";

/** "Kompetensi per Kategori" - per-category bars with clean solid tracks (#EEF1F6), hover dimming, and unified tooltip. */
export function CategoryCard({ categories }: { categories: OverviewModel["categories"] }) {
  const [hot, setHot] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const isDimmed = hot !== null;

  return (
    <Card title="Competency by Category" subtitle="Jumlah program per topik kompetensi">
      {categories.rows.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Tidak Ada Data Kategori"
          description="Belum ada data program kompetensi untuk periode ini."
          height={200}
        />
      ) : (
        <>
          {categories.showBoth && (
            <YearLegend
              items={categories.years.map((year, index) => ({
                label: year,
                color: index === 0 ? YEAR_COLORS.current : YEAR_COLORS.prev,
              }))}
            />
          )}

          <div
            className={cn(
              "flex flex-col gap-1 transition-all duration-150",
              isDimmed && "dd-chart--dim",
            )}
          >
            {categories.rows.map((row, rowIndex) => {
              const isHot = hot?.index === rowIndex;
              return (
                <div
                  key={row.label}
                  className={cn(
                    "dd-chart-row grid min-w-0 grid-cols-[minmax(90px,0.8fr)_minmax(100px,1.2fr)] items-center gap-3 py-[6px] px-2 rounded-lg cursor-pointer transition-all duration-150 sm:grid-cols-[150px_minmax(0,1fr)]",
                    isHot ? "is-hot bg-[#F5F7FB] dark:bg-zinc-800/60" : "",
                  )}
                  onMouseEnter={(e) => setHot({ index: rowIndex, x: e.clientX, y: e.clientY - 12 })}
                  onMouseMove={(e) =>
                    setHot((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY - 12 } : null))
                  }
                  onMouseLeave={() => setHot(null)}
                >
                  <div className="flex min-w-0 items-center">
                    <span className="min-w-0 break-words text-[11px] leading-tight font-semibold text-zinc-700 dark:text-zinc-300 sm:text-[12px]">
                      {row.label}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                    {row.bars.map((bar, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {/* Track solid abu-abu terang standar, tanpa arsir */}
                        <div className="h-[9px] flex-1 overflow-hidden rounded-full bg-[#EEF1F6] dark:bg-zinc-800">
                          <AnimatedBar value={bar.value} width={bar.width} color={bar.color} />
                        </div>
                        <span className="w-4 text-right text-[11px] font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                          <AnimatedValue value={bar.value} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {hot !== null && categories.rows[hot.index] && (
            <FloatingTip
              x={hot.x}
              y={hot.y}
              title={categories.rows[hot.index].tipTitle}
              rows={categories.rows[hot.index].tipLines.map((line, index) => ({
                label: categories.showBoth ? categories.years[index] ?? "Tahun" : "Jumlah",
                value: line.includes(":") ? line.split(":")[1]!.trim() : line,
                color: categories.showBoth
                  ? index === 0
                    ? YEAR_COLORS.current
                    : YEAR_COLORS.prev
                  : YEAR_COLORS.current,
              }))}
            />
          )}
        </>
      )}
    </Card>
  );
}
