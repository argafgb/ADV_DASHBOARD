"use client";

import { useState, type MouseEvent } from "react";
import { PieChart } from "lucide-react";
import { DonutChart } from "../charts/donut-chart";
import { FloatingTip } from "../charts/chart-tooltip";
import { Card } from "../Card";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import type { OverviewModel } from "../../utils/build-overview";

/** "Komposisi Program" - donut plus legend, synchronized hover dimming, and clean floating tooltip. */
export function CompositionCard({ donut }: { donut: OverviewModel["donut"] }) {
  const [hot, setHot] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const handleHoverSegment = (index: number | null, e?: MouseEvent) => {
    if (index === null || !e) {
      setHot(null);
    } else {
      setHot({ index, x: e.clientX, y: e.clientY - 12 });
    }
  };

  const isDimmed = hot !== null;

  return (
    <Card title="Program Composition" subtitle="Jumlah program per tipe">
      {donut.total === 0 ? (
        <EmptyState
          icon={PieChart}
          title="Tidak Ada Proporsi Program"
          description="Belum ada program yang tercatat untuk periode ini."
          height={200}
        />
      ) : (
        <div className="flex min-w-0 flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-[18px]">
          {/* Ring Donut */}
          <div className="flex min-w-0 justify-center sm:flex-shrink-0">
            <DonutChart
              segments={donut.segments}
              total={donut.total}
              hoveredIndex={hot?.index ?? null}
              onHoverSegment={handleHoverSegment}
              size={172}
              stroke={24}
            />
          </div>

          {/* Legend List */}
          <div
            className={cn(
              "flex min-w-0 w-full flex-1 flex-col gap-[8px] transition-all duration-150",
              isDimmed && "dd-chart--dim",
            )}
          >
            {donut.legend.map((row, index) => {
              const isHot = hot?.index === index;
              return (
                <div
                  key={row.label}
                  className={cn(
                    "dd-donut__lrow grid min-w-0 grid-cols-[9px_minmax(0,1fr)_auto_36px] items-center gap-[9px] rounded-lg px-2 py-1.5 cursor-pointer transition-all duration-150",
                    isHot ? "is-hot bg-[#F5F7FB] dark:bg-zinc-800/60" : "",
                  )}
                  onMouseEnter={(e) => setHot({ index, x: e.clientX, y: e.clientY - 12 })}
                  onMouseMove={(e) =>
                    setHot((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY - 12 } : null))
                  }
                  onMouseLeave={() => setHot(null)}
                >
                  <span
                    className="h-[9px] w-[9px] rounded-[3px] flex-none"
                    style={{ background: row.color }}
                  />
                  <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-tight text-zinc-700 dark:text-zinc-300">
                    {row.label}
                  </span>
                  <span className="text-right text-[12px] font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {row.value}
                  </span>
                  <span className="text-right text-[11px] font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">
                    {row.percent}%
                  </span>
                </div>
              );
            })}

            {donut.showNote && (
              <div className="mt-1 max-w-full self-start rounded-[12px] bg-blue-50 dark:bg-blue-950/40 px-[10px] py-[4px] text-[11px] leading-snug font-semibold text-blue-700 dark:text-blue-300">
                {donut.note}
              </div>
            )}
          </div>

          {hot !== null && donut.legend[hot.index] && (
            <FloatingTip
              x={hot.x}
              y={hot.y}
              title={donut.legend[hot.index].label}
              rows={[
                {
                  color: donut.legend[hot.index].color,
                  label: "Jumlah",
                  value: `${donut.legend[hot.index].value} program`,
                },
                {
                  label: "Porsi",
                  value: `${donut.legend[hot.index].percent}%`,
                },
              ]}
            />
          )}
        </div>
      )}
    </Card>
  );
}
