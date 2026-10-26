"use client";

import { cn, fmt } from "@/lib/utils";
import type { DonutSlice } from "@/types/asset-pm.types";

/** Legend row list rendered next to or beneath a `DonutChart`. */
export default function DonutLegend({
  slices,
  valueFormatter = fmt,
  className = "mt-3",
  showTotal = true,
  showPercent = true,
  markerShape = "circle",
}: {
  slices: DonutSlice[];
  valueFormatter?: (value: number) => string;
  /** Wrapper spacing override (e.g. drop the top margin in row layout). */
  className?: string;
  /** Whether to display the total summary row at the bottom. Default is true. */
  showTotal?: boolean;
  /** Whether to show each slice's share as a percentage. Default is true. */
  showPercent?: boolean;
  /** Marker glyph shape next to each label. Default is a circle. */
  markerShape?: "circle" | "square";
}) {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const markerClass =
    markerShape === "square"
      ? "h-2.5 w-2.5 rounded-[3px]"
      : "h-2.5 w-2.5 rounded-full";

  return (
    <ul className={cn("space-y-2", className)}>
      {slices.map((s) => {
        const pctVal = total > 0 ? (s.value / total) * 100 : 0;
        const pctStr =
          (pctVal % 1 === 0 ? pctVal.toFixed(0) : pctVal.toFixed(1)) + "%";

        return (
          <li
            key={s.label}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <span
                className={cn("inline-block shrink-0", markerClass)}
                style={{ background: s.color }}
              />
              <span className="truncate">{s.label}</span>
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {valueFormatter(s.value)}
              </span>
              {showPercent && (
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                  ({pctStr})
                </span>
              )}
            </div>
          </li>
        );
      })}

      {showTotal && (
        <li className="flex items-center justify-between gap-3 text-xs pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-800 font-bold">
          <span className="text-zinc-700 dark:text-zinc-300">Total</span>
          <span className="text-zinc-900 dark:text-zinc-100">
            {valueFormatter(total)}
          </span>
        </li>
      )}
    </ul>
  );
}
