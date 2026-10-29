"use client";

import { Card } from "@/components/ui/card";
import { CheckIcon, StarIcon, AlertTriangle } from "lucide-react";
import { StarGlyphs } from "@/components/charts/StarGlyphs";
import ProgressBar from "@/components/ui/ProgressBar";
import type { RatingsDistribution } from "../types/ratingDistribution.types";
import { fmt } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Card 2: Ratings Distribution with Rating SLA status.
 */
export default function RatingsDistributionCard({
  d,
}: {
  d?: RatingsDistribution;
}) {
  // Provide safe fallback in case data is undefined
  const dataObj = d || {
    rating: 0,
    distTotal: 0,
    dist: [
      { stars: 5, count: 0 },
      { stars: 4, count: 0 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 },
      { stars: 0, count: 0 },
    ],
  };

  // Find the maximum count among all rating stars to define the progress scale
  const maxDist = Math.max(...(dataObj.dist || []).map((x) => x.count), 0);

  // SLA threshold reference for CSAT rating is 4.8
  const isAchieved = dataObj.rating >= 4.8;
  const statusBadgeClass = isAchieved
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40"
    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/40";

  return (
    <Card className="box-border flex flex-col p-4.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.75">
          <span className="inline-flex text-[#F59E0B]">
            <StarIcon size={16} fill="#F59E0B" />
          </span>
          <span className="text-sm font-bold tracking-[-0.01em] text-zinc-900 dark:text-zinc-50">
            Ratings Distribution
          </span>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
          Total tiket: {fmt(dataObj.distTotal)}
        </span>
      </div>

      <div className="mb-3.5 mt-3.25 flex items-center justify-between gap-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-3.5 py-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-zinc-400 dark:text-zinc-500">
            Rating SLA
          </span>
          <span className="font-display text-[22px] font-bold text-zinc-900 dark:text-zinc-50 [font-variant-numeric:tabular-nums]">
            {dataObj.rating.toFixed(2)} / 5.00
          </span>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1.25 whitespace-nowrap rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-colors",
            statusBadgeClass,
          )}
        >
          {isAchieved ? (
            <CheckIcon size={12} strokeWidth={2.6} />
          ) : (
            <AlertTriangle size={12} strokeWidth={2.6} />
          )}
          <span>4.8 {isAchieved ? "Achieved" : "Not Achieved"}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.75 justify-center">
        {(dataObj.dist || []).map((x) => {
          const isNo = x.stars === 0;
          return (
            <div key={x.stars} className="flex h-5 items-center gap-2.5">
              <span className="flex w-15.5 shrink-0 items-center">
                <StarGlyphs n={x.stars} />
              </span>

              <ProgressBar
                width={maxDist > 0 ? (x.count / maxDist) * 100 + "%" : "0%"}
                // color={
                //   x.stars === 5 ? "#F59E0B" : isNo ? "transparent" : "#9CA3AF"
                // }
                color={isNo ? "transparent" : "#F59E0B"}
                height={9}
                extraStyle={
                  isNo
                    ? {
                        border: "1.5px dashed #DC2626",
                        boxSizing: "border-box",
                      }
                    : undefined
                }
              />

              <span className="w-8 text-right text-xs font-bold text-zinc-900 dark:text-zinc-50 [font-variant-numeric:tabular-nums]">
                {fmt(x.count)}
              </span>
              <span
                className="w-11.5 text-right text-[11px] [font-variant-numeric:tabular-nums]"
                style={{
                  color: isNo
                    ? "var(--color-destructive, #f43f5e)"
                    : "var(--color-muted-foreground, #71717a)",
                }}
              >
                (
                {dataObj.distTotal > 0
                  ? ((x.count / dataObj.distTotal) * 100).toFixed(1)
                  : "0.0"}
                %)
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2.75 text-[11px] italic text-zinc-400 dark:text-zinc-500 font-medium">
        Total dari Bintang 5 sampai Bintang 1 + No Rating ={" "}
        {fmt(dataObj.distTotal)} tiket
      </div>
    </Card>
  );
}

export function RatingsDistributionCardSkeleton() {
  return (
    <Card className="box-border flex flex-col p-4.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm animate-pulse select-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.75">
          <div className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mb-3.5 mt-3.25 flex items-center justify-between gap-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-3.5 py-2.5">
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-6 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-7 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 justify-center py-1">
        {[5, 4, 3, 2, 1, 0].map((star) => (
          <div key={star} className="flex h-5 items-center gap-2.5">
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-2.5 flex-1 rounded-full bg-zinc-150 dark:bg-zinc-850" />
            <div className="h-3.5 w-8 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3.5 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>

      <div className="mt-3.5 h-3 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
    </Card>
  );
}
