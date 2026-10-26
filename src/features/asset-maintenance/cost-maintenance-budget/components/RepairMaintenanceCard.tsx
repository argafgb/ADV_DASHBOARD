"use client";

import ChartCard from "@/components/shared/ChartCard";
import { cn } from "@/lib/utils";
import type { RepairMaintenanceSummary } from "../types/cost.types";

interface RepairMaintenanceCardProps {
  summary?: RepairMaintenanceSummary;
  className?: string;
}

const EMPTY_SUMMARY: RepairMaintenanceSummary = {
  ownAdv: 0,
  ownWisesa: 0,
  ownerTotals: [],
  sumGroups: [],
  sumCats: [],
};

export default function RepairMaintenanceCard({
  summary = EMPTY_SUMMARY,
  className,
}: RepairMaintenanceCardProps) {
  const { ownAdv, ownWisesa, ownerTotals, sumGroups, sumCats } = summary;

  return (
    <ChartCard
      title="Repair and Maintenance"
      subtitle="Semua cabang digabung · Sewa 100% Wisesa · Repair dibagi Wisesa / ADV"
      className={className}
      contentClassName="flex-1 flex flex-col justify-between min-h-0"
      action={
        <div className="flex flex-wrap items-center gap-3">
          {/* Unit Badges */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              ADV {ownAdv} unit
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Wisesa {ownWisesa} unit
            </span>
          </div>

          {/* Owner Total Cards */}
          <div className="flex items-center gap-2">
            {ownerTotals.map((o) => (
              <div
                key={o.label}
                className={cn(
                  "min-w-32 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/60",
                  o.label === "WISESA"
                    ? "border-l-4 border-l-blue-600"
                    : "border-l-4 border-l-amber-500",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-sm",
                      o.label === "WISESA" ? "bg-blue-600" : "bg-amber-500",
                    )}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {o.label}
                  </span>
                </div>
                <div className="mt-0.5 text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  {o.totalFmt}
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="grid gap-3.5 lg:grid-cols-2 flex-1 min-h-0 h-full">
        {/* Left Column: SEWA & REPAIR Cards */}
        <div className="flex flex-col gap-3 justify-between h-full">
          {sumGroups.map((g) => (
            <div
              key={g.label}
              className="flex-1 flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {g.label}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400">
                    {g.sharePct}
                  </span>
                </div>

                <div className="mt-1 text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {g.totalFmt}
                </div>
              </div>

              <div>
                {/* Progress bar */}
                <div className="mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  {g.owners.map((o) => (
                    <div
                      key={o.label}
                      style={{ width: o.pct }}
                      className={cn(
                        "h-full transition-all duration-300",
                        o.label === "Wisesa" ? "bg-blue-600" : "bg-amber-500",
                      )}
                    />
                  ))}
                </div>

                {/* Owner details */}
                <div className="mt-2 space-y-1">
                  {g.owners.map((o) => (
                    <div
                      key={o.label}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-sm",
                          o.label === "Wisesa" ? "bg-blue-600" : "bg-amber-500",
                        )}
                      />
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {o.label}
                      </span>
                      <span className="ml-auto font-bold text-zinc-800 dark:text-zinc-200">
                        {o.valueFmt}
                      </span>
                      <span className="w-12 text-right font-medium text-zinc-400">
                        {o.pct}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Workstation, Peripheral, Infrastruktur Cards */}
        <div className="flex flex-col gap-3 justify-between h-full">
          {sumCats.map((c) => (
            <div
              key={c.label}
              className="flex-1 flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {c.label}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      {c.totalFmt}
                    </span>
                    <span className="text-[10.5px] font-semibold text-zinc-400">
                      {c.sewaShare}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {/* Stacked bar: Sewa vs Repair */}
                <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    style={{ width: c.sewaBar }}
                    className="h-full bg-blue-600 transition-all duration-300"
                    title="Sewa"
                  />
                  <div
                    style={{ width: c.repairBar }}
                    className="h-full bg-blue-300 dark:bg-blue-400 transition-all duration-300"
                    title="Repair"
                  />
                </div>

                {/* Sewa & Repair details */}
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-blue-600" />
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Sewa
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {c.sewaFmt}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-blue-300 dark:bg-blue-400" />
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Repair
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {c.repairFmt}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
