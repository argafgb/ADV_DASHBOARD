"use client";

import { Card } from "@/components/ui/card";

export default function OverviewSkeleton() {
  return (
    <div className="w-full space-y-4 font-sans select-none">
      {/* Row 1: Overall System Uptime & Overall System Downtime */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Overall System Uptime Skeleton */}
        <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-3">
            <div className="h-9 w-28 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-zinc-100/70 p-3 dark:bg-zinc-800/40 space-y-2"
              >
                <div className="h-3 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-2.5 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            ))}
          </div>
        </Card>

        {/* Overall System Downtime Skeleton */}
        <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-3">
            <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-zinc-100/70 p-3 dark:bg-zinc-800/40 space-y-2"
              >
                <div className="h-3 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-7 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 2: Incidents Breakdown & Recent Incidents */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Incidents Breakdown Skeleton */}
        <div className="lg:col-span-3">
          <Card className="h-full rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
              <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="mt-3">
              <div className="h-9 w-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="mt-6 space-y-3.5">
              <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3.5 w-6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                  <div className="h-1.5 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Incidents Skeleton */}
        <div className="lg:col-span-2">
          <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 space-y-1.5">
              <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-44 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5 py-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-14 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                  <div className="h-3.5 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 3: Uptime Trend Chart Skeleton */}
      <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="space-y-1.5">
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="mt-4 h-72 w-full overflow-hidden border-b border-l border-zinc-200 sm:h-75 dark:border-zinc-700">
          <svg
            className="h-full w-full"
            viewBox="0 0 600 200"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M0 148 L55 120 L110 132 L165 92 L220 106 L275 72 L330 86 L385 58 L440 74 L495 44 L550 60 L600 38 L600 200 L0 200 Z"
              className="animate-pulse fill-zinc-100 dark:fill-zinc-800/50"
            />
            <path
              d="M0 148 L55 120 L110 132 L165 92 L220 106 L275 72 L330 86 L385 58 L440 74 L495 44 L550 60 L600 38"
              fill="none"
              className="stroke-zinc-300 dark:stroke-zinc-700"
              strokeWidth="5"
            />
          </svg>
        </div>
      </Card>
    </div>
  );
}
