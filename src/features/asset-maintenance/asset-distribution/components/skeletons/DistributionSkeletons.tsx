import { Card } from "@/components/ui/card";

export function DevicePerSiteBarsSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse h-full max-h-195">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="h-5 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <div className="h-7 w-12 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-7 w-12 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-7 w-12 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="mb-4 h-9 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/40" />

      <div className="space-y-3.5 flex-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3.5 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3.5 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function BreakdownCardSkeleton({ title }: { title?: string }) {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse max-h-55">
      <div className="mb-3">
        <div className="h-4.5 w-44 rounded bg-zinc-200 dark:bg-zinc-800">
          {title && <span className="sr-only">{title}</span>}
        </div>
        <div className="mt-1 h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>

      <div className="space-y-3 flex-1 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between">
              <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-10 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DistributionDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DevicePerSiteBarsSkeleton />
        <div className="grid gap-4">
          <BreakdownCardSkeleton title="Breakdown workstation" />
          <BreakdownCardSkeleton title="Breakdown infrastructure" />
          <BreakdownCardSkeleton title="Breakdown peripheral" />
        </div>
      </div>
      <InventoryTableSkeleton />
    </div>
  );
}

export function InventoryTableSkeleton() {
  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-3 w-72 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <div className="h-9 min-w-44 flex-1 sm:flex-none rounded-lg bg-zinc-100 dark:bg-zinc-800/40" />
          <div className="h-9 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800/40" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-180 space-y-2">
          {/* Header */}
          <div className="flex justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
            <div className="h-4 w-8 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800/50"
            >
              <div className="h-3.5 w-6 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-18 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3.5 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3.5 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3.5 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
