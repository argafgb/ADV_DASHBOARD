"use client";

import { FsdPicWorkload } from "../types/fsdBlueprint.types";
import {
  formatTitleCase,
  STATUS_CONFIG,
  STATUS_DISPLAY_ORDER,
} from "../utils/fsdCalculations";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";

interface FsdWorkloadCardProps {
  workloads: FsdPicWorkload[];
  onSelectPic?: (picName: string) => void;
}

export function FsdWorkloadCard({
  workloads,
  onSelectPic,
}: FsdWorkloadCardProps) {
  const maxTotal = Math.max(1, ...workloads.map((d) => d.total));
  const totalAll = workloads.reduce((acc, curr) => acc + curr.total, 0);

  if (totalAll === 0) {
    return (
      <div className="flex h-full min-h-75 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            DCT IT Workload
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Beban kerja personil
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Tidak Ada Data Personil"
            description="Tidak ada data workload personil pada filter ini."
            icon={Users}
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
            DCT IT Workload
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {workloads.length} personil · diurutkan dari beban terbanyak
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400"
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

      <div className="mt-2 flex flex-1 flex-col gap-2 max-h-65 overflow-y-auto pr-1">
        {workloads.map((item) => {
          const outerWidthPct = (item.total / maxTotal) * 100;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelectPic?.(item.name)}
              className="flex flex-col gap-1.5 rounded-lg p-1.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer"
              title={`Klik untuk filter tabel ke ${item.name}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatTitleCase(item.name)}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {item.done} done
                  </span>
                  <span className="w-6 text-right font-display text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {item.total}
                  </span>
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden dark:bg-zinc-800">
                <div
                  className="flex h-full rounded-full overflow-hidden transition-all duration-500"
                  style={{ width: `${Math.max(outerWidthPct, 4)}%` }}
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
