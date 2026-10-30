"use client";

import { Card } from "@/components/ui/card";

export default function OverviewSkeleton() {
  return (
    <div className="w-full space-y-6">
      {/* Banner Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="h-5 w-36 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-7 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="h-10 w-36 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800 self-start md:self-auto" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-3.5 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </Card>
        ))}
      </div>

      {/* Rules Section Skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-3 space-y-1.5">
                <div className="h-3.5 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3.5 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
