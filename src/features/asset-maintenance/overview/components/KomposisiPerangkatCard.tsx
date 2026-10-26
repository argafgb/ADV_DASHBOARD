"use client";

import { Layers } from "lucide-react";
import ChartCard from "@/components/shared/ChartCard";
import EmptyState from "@/components/shared/EmptyState";
import { fmt } from "@/lib/utils";
import type { BarDatum } from "@/types/asset-pm.types";

/**
 * Device composition as a single proportional stacked bar with a legend
 * showing each group's value and its percentage share of the total.
 */
export default function KomposisiPerangkatCard({
  items: propsItems,
}: {
  items?: BarDatum[];
}) {
  const items = propsItems || [];
  const total = items.reduce((sum, it) => sum + it.value, 0);
  const isEmpty = items.length === 0 || total === 0;
  const pct = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  return (
    <ChartCard
      title="Komposisi Perangkat"
      subtitle="Komposisi workstation, infrastruktur, dan periferal"
      className="h-full"
    >
      {isEmpty ? (
        <EmptyState
          icon={Layers}
          title="Komposisi Perangkat Tidak Tersedia"
          description="Rincian proporsi perangkat belum tersedia pada kombinasi filter ini."
          height={180}
        />
      ) : (
        <>
          {/* Proportional stacked bar */}
          <div className="flex h-4 w-full overflow-hidden rounded-full">
            {items.map((it) => (
              <div
                key={it.label}
                style={{ flexGrow: it.value, flexBasis: 0, background: it.color }}
              />
            ))}
          </div>

          {/* Legend with value + % contribution */}
          <ul className="mt-4 space-y-2.5">
            {items.map((it) => (
              <li key={it.label} className="flex items-center gap-3 text-sm">
                <span className="flex flex-1 items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5"
                    style={{ background: it.color }}
                  />
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {it.label}
                  </span>
                </span>
                <span className="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {fmt(it.value)}
                </span>
                <span className="w-12 text-right text-xs font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                  {pct(it.value).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </ChartCard>
  );
}
