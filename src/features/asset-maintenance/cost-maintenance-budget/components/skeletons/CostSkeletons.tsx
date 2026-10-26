import { Card } from "@/components/ui/card";

export function ProporsiBiayaSkeleton() {
  return (
    <Card className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse h-95 min-h-0">
      <div className="mb-2">
        <div className="h-5 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-3.5 w-28 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>

      {/* Donut Circle */}
      <div className="flex flex-1 items-center justify-center py-2">
        <div className="relative flex items-center justify-center h-44 w-44 rounded-full border-12 border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="h-6 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
        </div>
      </div>

      {/* Donut Legend */}
      <div className="mt-2 flex justify-around border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3.5 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3.5 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </Card>
  );
}

export function BiayaPerSiteBarsSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse h-95 min-h-0">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-3.5 w-36 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        {/* Tab options skeleton */}
        <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div className="h-6 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-6 w-12 rounded bg-transparent" />
          <div className="h-6 w-12 rounded bg-transparent" />
        </div>
      </div>

      {/* Search Bar skeleton */}
      <div className="mb-3 h-8 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/40" />

      {/* Bar list items */}
      <div className="space-y-3.5 flex-1 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3.5 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CostBySiteTableSkeleton() {
  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse space-y-4">
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="h-5 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-3.5 w-56 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-44 rounded-lg bg-zinc-100 dark:bg-zinc-800/40" />
          <div className="h-9 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800/40" />
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto">
        <div className="w-full space-y-2">
          {/* Header Row */}
          <div className="flex justify-between border-b border-zinc-200 pb-2.5 dark:border-zinc-800">
            <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Table Data Rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800/50"
            >
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="h-3.5 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex gap-2">
          <div className="h-8 w-16 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-16 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </Card>
  );
}

export function MonthlyCostComparisonSkeleton() {
  return (
    <Card className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm animate-pulse dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-5 w-64 max-w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3.5 w-80 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800/40"
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="h-9 bg-zinc-200/70 dark:bg-zinc-800" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-6 gap-4 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800/60"
          >
            {Array.from({ length: 6 }).map((__, cell) => (
              <div
                key={cell}
                className="h-3.5 rounded bg-zinc-100 dark:bg-zinc-800/50"
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CostDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4 xl:col-span-3">
          <ProporsiBiayaSkeleton />
        </div>
        <div className="lg:col-span-8 xl:col-span-9">
          <RepairMaintenanceSkeleton />
        </div>
      </div>
      <CostBySiteTableSkeleton />
      <MonthlyCostComparisonSkeleton />
    </div>
  );
}

export function RepairMaintenanceSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse min-h-95">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-3.5 w-64 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 flex-1">
        <div className="space-y-3">
          <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800/40"
            />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-4 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800/40"
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
