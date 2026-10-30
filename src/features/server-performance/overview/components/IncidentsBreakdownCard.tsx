"use client";

import { Card } from "@/components/ui/card";
import { DeltaInfo, RootCauseItem } from "../types/overviewTypes";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

interface IncidentsBreakdownCardProps {
  totalIncidents: number;
  delta: DeltaInfo;
  periodLabel: string;
  causes: RootCauseItem[];
}

const BAR_COLORS: Record<string, string> = {
  critical: "bg-rose-500",
  high: "bg-amber-500",
  medium: "bg-amber-500",
  low: "bg-slate-400 dark:bg-slate-600",
};

export default function IncidentsBreakdownCard({
  totalIncidents,
  delta,
  periodLabel,
  causes,
}: IncidentsBreakdownCardProps) {
  const isPositive = delta.tone === "green";
  const DeltaIcon = delta.isUp ? TrendingUp : TrendingDown;

  return (
    <Card className="h-full rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertTriangle size={18} />
          </span>
          <div>
            <h3 className="font-sans text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Incidents this period
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {periodLabel} · ketuk untuk detail
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

      {/* Main Big Count */}
      <div className="mt-3">
        <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          {totalIncidents}
        </span>
      </div>

      {/* Breakdown By Cause Section */}
      <div className="mt-6">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          BREAKDOWN BY CAUSE
        </h4>

        <div className="mt-3 space-y-3.5">
          {causes.length > 0 ? (
            causes.map((c, idx) => {
              const barColor = BAR_COLORS[c.severity] || BAR_COLORS.low;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1 pr-2">
                      {c.label}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 font-display">
                      {c.count}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${Math.max(c.percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-20 items-center justify-center text-xs text-zinc-400">
              Tidak ada insiden pada periode ini.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
