"use client";

import { FsdQuarterRow } from "../types/fsdBlueprint.types";
import { STATUS_CONFIG, STATUS_DISPLAY_ORDER } from "../utils/fsdCalculations";
import { EmptyState } from "@/components/shared/EmptyState";
import { CalendarRange } from "lucide-react";

interface FsdQuarterDistributionCardProps {
  quarterData: FsdQuarterRow[];
}

export function FsdQuarterDistributionCard({
  quarterData,
}: FsdQuarterDistributionCardProps) {
  const maxTotal = Math.max(1, ...quarterData.map((d) => d.total));
  const totalAll = quarterData.reduce((acc, curr) => acc + curr.total, 0);

  if (totalAll === 0) {
    return (
      <div className="flex h-full min-h-[300px] flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Blueprint by Quarter
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Distribusi status di tiap quartal target
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Tidak Ada Data Quartal"
            description="Tidak ditemukan data distribusi quartal pada filter ini."
            icon={CalendarRange}
          />
        </div>
      </div>
    );
  }

  const statuses = STATUS_DISPLAY_ORDER;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Blueprint by Quarter
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Distribusi status di tiap quartal target
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {statuses.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400"
            >
              <span
                className="h-2 w-2 rounded-xs"
                style={{ backgroundColor: STATUS_CONFIG[status].bar }}
              />
              {status}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-1 flex-col justify-center gap-3.5">
        {quarterData.map((row) => {
          const rowTotal = row.total;
          const outerWidthPct = (rowTotal / maxTotal) * 100;

          return (
            <div key={row.quartal} className="flex items-center gap-3">
              <span className="w-8 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {row.quartal}
              </span>

              <div className="relative flex-1 h-6 rounded-md bg-zinc-100 overflow-hidden dark:bg-zinc-800/80">
                {rowTotal > 0 ? (
                  <div
                    className="flex h-full rounded-md overflow-hidden transition-all duration-500"
                    style={{ width: `${Math.max(outerWidthPct, 4)}%` }}
                  >
                    {statuses.map((st) => {
                      const count = row[st];
                      if (count <= 0) return null;
                      const segPct = (count / rowTotal) * 100;
                      return (
                        <div
                          key={st}
                          title={`${row.quartal} — ${st}: ${count} (${Math.round(
                            segPct,
                          )}%)`}
                          className="h-full min-w-[4px] transition-all duration-300 hover:brightness-110"
                          style={{
                            width: `${segPct}%`,
                            backgroundColor: STATUS_CONFIG[st].bar,
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] text-zinc-400">
                    0
                  </div>
                )}
              </div>

              <span className="w-8 text-right font-display text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {rowTotal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
