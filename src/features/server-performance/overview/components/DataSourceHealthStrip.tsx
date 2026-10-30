"use client";

import { Card } from "@/components/ui/card";
import { DataSourceItem } from "../types/overviewTypes";
import { Database, RefreshCw } from "lucide-react";

interface DataSourceHealthStripProps {
  sources: DataSourceItem[];
}

export default function DataSourceHealthStrip({ sources }: DataSourceHealthStripProps) {
  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Database size={16} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
              Data Source Connectivity
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Status langsung untuk pemantauan eksternal & umpan log
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {sources.map((src, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40"
            >
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: src.dotColor }}
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {src.name}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {src.txt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
