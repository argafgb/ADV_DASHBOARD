"use client";

import { Card } from "@/components/ui/card";
import { DeltaInfo, SystemDowntimeBreakdown } from "../types/overviewTypes";
import { Clock, TrendingDown, TrendingUp } from "lucide-react";

interface OverallDowntimeCardProps {
  downtimeMinutes: number;
  delta: DeltaInfo;
  periodLabel: string;
  systems: SystemDowntimeBreakdown[];
}

export default function OverallDowntimeCard({
  downtimeMinutes,
  delta,
  periodLabel,
  systems,
}: OverallDowntimeCardProps) {
  const isPositive = delta.tone === "green";
  const DeltaIcon = delta.isUp ? TrendingUp : TrendingDown;

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-rose-100 p-2 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <Clock size={18} />
          </span>
          <div>
            <h3 className="font-sans text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Overall System Downtime
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Total downtime lintas sistem · {periodLabel}
            </p>
          </div>
        </div>

        {/* Delta Chip */}
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
              isPositive
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
            }`}
          >
            <DeltaIcon size={12} />
            <span>{delta.value}</span>
          </span>
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
            ({delta.basis})
          </span>
        </div>
      </div>

      {/* Main Downtime Big Metric */}
      <div className="mt-3">
        <span className="text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-500 font-display">
          {downtimeMinutes}m
        </span>
      </div>

      {/* Sub-grid of 4 Systems */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {systems.map((sys) => (
          <div
            key={sys.key}
            className="rounded-lg bg-zinc-50/70 p-3 dark:bg-zinc-800/40"
          >
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              {sys.name}
            </span>
            <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-display">
              {sys.downtime}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
