"use client";

import { Card } from "@/components/ui/card";
import { DeltaInfo, SystemSlaBreakdown } from "../types/overviewTypes";
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface OverallUptimeCardProps {
  sla: number;
  delta: DeltaInfo;
  periodLabel: string;
  systems: SystemSlaBreakdown[];
  targetSla?: number;
}

export default function OverallUptimeCard({
  sla,
  delta,
  periodLabel,
  systems,
  targetSla = 99.6,
}: OverallUptimeCardProps) {
  const isPositiveDelta = delta.tone === "green";
  const DeltaIcon = delta.isUp ? TrendingUp : TrendingDown;

  const isMainMet = sla >= targetSla;
  const mainTextColor = isMainMet
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";
  const mainIconBg = isMainMet
    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
    : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400";

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={`rounded-full p-2 ${mainIconBg}`}>
            {isMainMet ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          </span>
          <div>
            <h3 className="font-sans text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Overall System Uptime
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Rata-rata SLA lintas sistem · {periodLabel}
            </p>
          </div>
        </div>

        {/* Delta Chip */}
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
              isPositiveDelta
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

      {/* Main SLA Big Metric */}
      <div className="mt-3">
        <span className={`text-4xl font-extrabold tracking-tight ${mainTextColor} font-display`}>
          {sla.toFixed(2)}%
        </span>
      </div>

      {/* Sub-grid of 4 Systems */}
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {systems.map((sys) => {
          const sysVal = parseFloat(sys.sla);
          const isSysMet = !isNaN(sysVal) ? sysVal >= targetSla : true;
          const sysTextColor = isSysMet
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400";
          const sysStatusLabel = isSysMet ? "Achieved" : "Below Target";
          const sysDotBg = isSysMet ? "bg-emerald-500" : "bg-rose-500";
          const sysStatusTextColor = isSysMet
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400";

          return (
            <div
              key={sys.key}
              className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-800/40"
            >
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                {sys.name}
              </span>
              <div className={`mt-1 text-lg font-extrabold ${sysTextColor} font-display`}>
                {sys.sla}
              </div>
              <div className={`mt-1 flex items-center gap-1 text-[10px] font-medium ${sysStatusTextColor}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sysDotBg}`} />
                <span>{sysStatusLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
