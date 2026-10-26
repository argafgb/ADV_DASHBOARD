"use client";

import ProgressBar from "@/components/ui/ProgressBar";
import { C, fmt } from "@/lib/utils";
import type { BarDatum } from "@/types/asset-pm.types";

interface BarListProps {
  items: BarDatum[];
  /** Custom value formatter (defaults to id-ID number). */
  valueFormatter?: (value: number) => string;
  /** Default bar color when a datum has no `color`. */
  color?: string;
  height?: number;
}

/**
 * Horizontal ranked bar list built on the shared `ProgressBar`. Bars are
 * scaled to the largest value in the set. Used for Top-N and breakdown cards.
 */
export default function BarList({
  items,
  valueFormatter = fmt,
  color = C.accent,
  height = 8,
}: BarListProps) {
  const max = items.reduce((m, it) => Math.max(m, it.value), 0);

  return (
    <div className="space-y-3">
      {items.map((it) => {
        const pct = max > 0 ? (it.value / max) * 100 : 0;
        return (
          <div key={it.label} className="space-y-1">
            <div className="flex min-w-0 items-start justify-between gap-3 text-xs">
              <span
                className="min-w-0 break-words font-medium leading-snug text-zinc-700 dark:text-zinc-300"
                title={it.label}
              >
                {it.label}
              </span>
              <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100">
                {valueFormatter(it.value)}
              </span>
            </div>
            <ProgressBar
              width={`${pct}%`}
              color={it.color ?? color}
              height={height}
            />
            {/* Optional sub-items breakdown legend (disabled)
            it.subItems && it.subItems.length > 0 && (
              <div className="mt-1.5 rounded-lg border border-zinc-100 bg-zinc-50/50 p-2 text-[11px] text-zinc-600 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-400 space-y-1">
                <div className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase text-[10px] tracking-wider">
                  Rincian Kategori {it.label}:
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {it.subItems.map((sub) => (
                    <span key={sub.label} className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                      <span>{sub.label}:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {valueFormatter(sub.value)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )
            */}
          </div>
        );
      })}
    </div>
  );
}
