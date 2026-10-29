"use client";

import {
  FileText,
  CheckCircle2,
  Loader2,
  Clock,
  CircleDashed,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { BlueprintStatus, FsdKpiSummary } from "../types/fsdBlueprint.types";
import { cn } from "@/lib/utils";

interface FsdKpiGridProps {
  kpis: FsdKpiSummary;
  onSelectStatus?: (status: BlueprintStatus | "all") => void;
}

export function FsdKpiGrid({ kpis, onSelectStatus }: FsdKpiGridProps) {
  const cards = [
    {
      key: "all" as const,
      label: "Total Blueprint",
      value: kpis.total,
      sub: `${kpis.totalModules} module`,
      subColor: "text-zinc-500 dark:text-zinc-400",
      icon: FileText,
      tint: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      borderHover: "hover:border-blue-300 dark:hover:border-blue-800",
    },
    {
      key: "Done" as const,
      label: "Done",
      value: kpis.doneCount,
      sub: `${kpis.donePercentage}%`,
      subColor: "text-emerald-600 dark:text-emerald-400",
      icon: CheckCircle2,
      tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      borderHover: "hover:border-emerald-300 dark:hover:border-emerald-800",
    },
    {
      key: "SLA Blueprint" as const,
      label: "SLA Blueprint",
      value: kpis.slaCount,
      sub: `${kpis.slaPercentage}%`,
      subColor: "text-red-600 dark:text-red-400",
      icon: AlertTriangle,
      tint: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
      borderHover: "hover:border-red-300 dark:hover:border-red-800",
    },
    {
      key: "On Progress" as const,
      label: "On Progress",
      value: kpis.onProgressCount,
      sub: `${kpis.onProgressPercentage}%`,
      subColor: "text-blue-600 dark:text-blue-400",
      icon: Loader2,
      tint: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      borderHover: "hover:border-blue-300 dark:hover:border-blue-800",
    },
    {
      key: "On Queue" as const,
      label: "On Queue",
      value: kpis.onQueueCount,
      sub: `${kpis.onQueuePercentage}%`,
      subColor: "text-amber-600 dark:text-amber-400",
      icon: Clock,
      tint: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      borderHover: "hover:border-amber-300 dark:hover:border-amber-800",
    },
    {
      key: "Not Started" as const,
      label: "Not Started",
      value: kpis.notStartedCount,
      sub: `${kpis.notStartedPercentage}%`,
      subColor: "text-zinc-500 dark:text-zinc-400",
      icon: CircleDashed,
      tint: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      borderHover: "hover:border-zinc-400 dark:hover:border-zinc-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            onClick={() => onSelectStatus?.(card.key)}
            title="Klik untuk melihat daftar dokumen"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectStatus?.(card.key);
              }
            }}
            className={cn(
              "group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all duration-200 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/70",
              "hover:shadow-md hover:-translate-y-0.5",
              card.borderHover,
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
                    card.tint,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {card.label}
                </span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-zinc-500" />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {card.value}
              </span>
              <span className={cn("text-xs font-semibold", card.subColor)}>
                {card.sub}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
