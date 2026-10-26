export function WarrantyKpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse"
        >
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-2.5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="mt-3 h-8 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-2 h-2.5 w-36 rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function WarrantyChartsSkeleton() {
  return (
    <div className="space-y-4">
      <WarrantyKpiSkeleton />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
          <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-1 h-3 w-64 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-6 h-72 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="lg:col-span-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
          <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-1 h-3 w-56 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-6 h-72 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
        <div className="h-4 w-52 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-1 h-3 w-72 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="mt-6 h-80 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
    </div>
  );
}
