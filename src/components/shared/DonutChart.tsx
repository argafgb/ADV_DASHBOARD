"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { cn, fmt, fmtCompact } from "@/lib/utils";
import { RechartsTip } from "@/components/chart-tooltip";
import type { DonutSlice } from "@/types/asset-pm.types";

interface DonutChartProps {
  slices: DonutSlice[];
  height?: number;
  /** Big value rendered in the donut hole. */
  centerValue?: string;
  centerLabel?: string;
  /** Render the center value verbatim, skipping compact number formatting. */
  rawCenterValue?: boolean;
  /** Extra classes for the center value (e.g. an accent color). */
  centerValueClassName?: string;
}

/** Donut/pie chart with an optional center label overlay. */
export default function DonutChart({
  slices,
  height = 200,
  centerValue,
  centerLabel,
  rawCenterValue = false,
  centerValueClassName,
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <div
      className="relative isolate z-0 w-full min-w-0 overflow-hidden"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={2}
            stroke="none"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {slices.map((s, index) => (
              <Cell
                key={s.label}
                fill={s.color}
                fillOpacity={
                  activeIndex === null || activeIndex === index ? 1 : 0.45
                }
                style={{ transition: "fill-opacity 0.15s ease" }}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const slice = payload[0]?.payload as DonutSlice;
              if (!slice) return null;
              const pct =
                total > 0
                  ? `${Math.round((slice.value / total) * 100)}%`
                  : "0%";
              return (
                <RechartsTip
                  title={slice.label}
                  rows={[
                    {
                      color: slice.color,
                      label: "Jumlah",
                      value: `${fmt(slice.value)} (${pct})`,
                    },
                  ]}
                />
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          <span
            className={cn(
              "text-xl font-black text-zinc-900 dark:text-zinc-50",
              centerValueClassName,
            )}
          >
            {rawCenterValue ? centerValue : fmtCompact(centerValue)}
          </span>
          {centerLabel && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
