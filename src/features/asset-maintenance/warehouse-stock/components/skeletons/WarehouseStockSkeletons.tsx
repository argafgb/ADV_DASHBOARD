export function WarehouseStockSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Skeletons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-8 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Chart Skeletons */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-3 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-6 flex h-48 items-center justify-center">
            <div className="h-36 w-36 animate-pulse rounded-full border-8 border-zinc-200 dark:border-zinc-800" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-5 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-3 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-6 h-48 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800/50" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-9 w-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-12 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800/40"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
