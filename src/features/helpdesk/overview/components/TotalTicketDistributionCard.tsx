"use client";

import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { TotalTicketDistribution } from "../types/totalTicket.types";
import { fmt } from "@/lib/utils";
import YoYLine from "./YoYLine";
import { cn } from "@/lib/utils";

export default function TotalTicketDistributionCard({
  d,
  period,
  year,
}: {
  d: TotalTicketDistribution;
  period: string;
  year?: string | number;
}) {
  const isNegative = d.growthPercentage < 0;
  const absGrowth = Math.abs(d.growthPercentage);
  const ArrowIcon = isNegative ? TrendingDown : TrendingUp;
  const statusLabel = isNegative ? "Reduction" : "Increase";

  // Less tickets is a good thing (green), more tickets is a warning/bad thing (red)
  const growthColorClass = isNegative
    ? "text-emerald-600 dark:text-emerald-450"
    : "text-rose-600 dark:text-rose-450";

  const badgeClass = isNegative
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40"
    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/40";

  return (
    <Card className="box-border flex p-4.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
      <div
        className="flex flex-col justify-center gap-2.25 border-r border-zinc-200 dark:border-zinc-800 pr-4.5"
        style={{ flex: "0 0 35%" }}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-center text-[11px] font-bold uppercase tracking-[0.06em] text-zinc-400 dark:text-zinc-500">
            Total Tickets
          </span>
          <span className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            {period}
          </span>
        </div>
        <span className="text-center font-display text-[40px] font-extrabold leading-none text-zinc-900 dark:text-zinc-50 [font-variant-numeric:tabular-nums]">
          {fmt(d.totalTickets)}
        </span>
        <span
          className={cn(
            "inline-flex items-center justify-center gap-1 text-center text-xs font-semibold",
            growthColorClass,
          )}
        >
          <ArrowIcon className="h-3.5 w-3.5" />
          {absGrowth.toFixed(2)}% dibanding tahun sebelumnya
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col pl-4.5">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
            Ticket Comparison YoY
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.75 py-0.75 text-[11px] font-semibold transition-colors",
              badgeClass,
            )}
          >
            {statusLabel}: <ArrowIcon className="h-3 w-3" />
            {fmt(absGrowth)}%
          </span>
        </div>
        <div className="flex min-h-0 flex-1 items-center">
          <YoYLine
            prev={d.prevYearCount}
            cur={d.currentYearCount}
            year={year}
          />
        </div>
      </div>
    </Card>
  );
}

export function TotalTicketDistributionCardSkeleton() {
  return (
    <Card className="box-border flex p-4.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm animate-pulse select-none min-h-35.5">
      <div
        className="flex flex-col justify-center gap-2.5 border-r border-zinc-200 dark:border-zinc-800 pr-4.5 items-center"
        style={{ flex: "0 0 35%" }}
      >
        <div className="flex flex-col gap-1.5 items-center w-full">
          <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-9 w-18 rounded bg-zinc-200 dark:bg-zinc-800 mt-1" />
        <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col pl-4.5 justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4.5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="flex-1 flex items-center mt-3">
          <div className="h-10 w-full rounded bg-zinc-150 dark:bg-zinc-800/80" />
        </div>
      </div>
    </Card>
  );
}
