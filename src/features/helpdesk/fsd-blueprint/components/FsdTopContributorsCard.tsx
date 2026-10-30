"use client";

import { FsdPicWorkload } from "../types/fsdBlueprint.types";
import {
  formatTitleCase,
  STATUS_CONFIG,
  STATUS_DISPLAY_ORDER,
} from "../utils/fsdCalculations";
import { EmptyState } from "@/components/shared/EmptyState";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface FsdTopContributorsCardProps {
  workloads: FsdPicWorkload[];
  onSelectPic?: (picName: string) => void;
}

export function FsdTopContributorsCard({
  workloads,
  onSelectPic,
}: FsdTopContributorsCardProps) {
  const top3 = workloads.slice(0, 3);
  const maxTotal = top3.length > 0 ? top3[0].total : 1;

  if (top3.length === 0) {
    return (
      <div className="flex h-full min-h-75 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Top 3 Contributors
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Pembuat FSD blueprint terbanyak
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Tidak Ada Kontributor"
            description="Tidak ada data kontributor pada filter ini."
            icon={Award}
          />
        </div>
      </div>
    );
  }

  const rankBadges = [
    "bg-blue-600 text-white dark:bg-blue-500",
    "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
  ];

  const statuses = STATUS_DISPLAY_ORDER;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70">
      <div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Top 3 Contributors
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Pembuat FSD blueprint terbanyak
        </p>
      </div>

      <div className="mt-4 flex flex-1 flex-col justify-center gap-3">
        {top3.map((item, idx) => {
          const outerWidthPct = (item.total / maxTotal) * 100;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelectPic?.(item.name)}
              className="group flex items-center gap-3 rounded-xl p-2 text-left transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer"
              title={`Klik untuk filter tabel ke ${item.name}`}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold shadow-2xs",
                  rankBadges[idx] ||
                    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                )}
              >
                {idx + 1}
              </span>

              <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {formatTitleCase(item.name)}
                  </span>
                  <span className="font-display text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {item.total}{" "}
                    <span className="text-[10px] font-normal text-zinc-400">
                      ({item.done} done)
                    </span>
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden dark:bg-zinc-800">
                  <div
                    className="flex h-full rounded-full overflow-hidden transition-all duration-500"
                    style={{ width: `${Math.max(outerWidthPct, 6)}%` }}
                  >
                    {statuses.map((st) => {
                      const count = item[st];
                      if (count <= 0) return null;
                      const segPct = (count / item.total) * 100;
                      return (
                        <div
                          key={st}
                          title={`${item.name} — ${st}: ${count}`}
                          className="h-full min-w-0.75"
                          style={{
                            width: `${segPct}%`,
                            backgroundColor: STATUS_CONFIG[st].bar,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
