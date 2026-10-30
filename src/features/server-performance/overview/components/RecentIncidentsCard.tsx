"use client";

import { Card } from "@/components/ui/card";
import { RecentIncidentDisplay } from "../types/overviewTypes";

interface RecentIncidentsCardProps {
  incidents: RecentIncidentDisplay[];
  periodLabel: string;
}

export default function RecentIncidentsCard({
  incidents,
  periodLabel,
}: RecentIncidentsCardProps) {
  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <h3 className="font-sans text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Recent Incidents
        </h3>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Insiden terbaru di DCT & Cencon
        </p>
      </div>

      <div className="max-h-75 overflow-y-auto mt-4 divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {incidents.length > 0 ? (
          incidents.map((inc, idx) => (
            <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-white"
                  style={{ backgroundColor: inc.sysColor }}
                >
                  {inc.sysLabel}
                </span>
                <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                  {inc.down}
                </span>
              </div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {inc.kendala || inc.issue}
              </p>
            </div>
          ))
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-zinc-400">
            Belum ada insiden terbaru yang tercatat pada periode ini.
          </div>
        )}
      </div>
    </Card>
  );
}
