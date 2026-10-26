"use client";

import ChartCard from "@/components/shared/ChartCard";
import DonutChart from "@/components/shared/DonutChart";
import { fmt } from "@/lib/utils";
import type { DonutSlice } from "@/types/asset-pm.types";

interface ProporsiBiayaCardProps {
  slices: DonutSlice[];
  total: number;
  className?: string;
}

export default function ProporsiBiayaCard({
  slices,
  total,
  className,
}: ProporsiBiayaCardProps) {
  return (
    <ChartCard
      title="Cost Proportion"
      subtitle="Perbandingan Operational dan Unit"
      className={className}
      contentClassName="flex-1 flex flex-col justify-between min-h-0"
    >
      <div className="flex flex-col justify-between flex-1 h-full">
        {/* Donut Chart */}
        <div className="flex justify-center py-2">
          <div className="relative h-36 w-36">
            <DonutChart slices={slices} height={144} />
          </div>
        </div>

        {/* Total Biaya PM section */}
        <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            TOTAL BIAYA PM
          </div>
          <div className="mt-1 text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            Rp {fmt(total)}
          </div>
        </div>

        {/* Legend List */}
        <div className="mt-3 space-y-2.5">
          {slices.map((s) => (
            <div key={s.label} className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  style={{ backgroundColor: s.color }}
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                />
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {s.label}
                </span>
              </div>
              <div className="pl-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Rp {fmt(s.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
