import { Card } from "@/components/ui/card";

export function TemuanPerKategoriSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="mb-4">
        <div className="h-5 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-3 w-56 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      <div className="flex flex-col gap-3 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-200 dark:bg-zinc-700"
                style={{ width: `${85 - i * 12}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TrenKategoriChartSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="mb-4">
        <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-3 w-64 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      <div className="relative h-70 w-full overflow-hidden rounded border-b border-l border-zinc-200 dark:border-zinc-800">
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-zinc-100 dark:bg-zinc-800/40 [clip-path:polygon(0_85%,15%_56%,30%_68%,45%_32%,60%_48%,75%_20%,100%_38%,100%_100%,0_100%)]" />
      </div>
    </Card>
  );
}

export function StatusResolusiSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="mb-4">
        <div className="h-5 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-3 w-40 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      <div className="flex flex-col items-stretch gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-5">
        <div className="flex h-42 w-full shrink-0 items-center justify-center min-[400px]:w-36 sm:w-40">
          <div className="h-32 w-32 rounded-full border-12 border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800/60" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function EventLifecycleSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="mb-4">
        <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-3 w-48 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      <div className="flex flex-col items-stretch gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-5">
        <div className="flex h-42 w-full shrink-0 items-center justify-center min-[400px]:w-36 sm:w-40">
          <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-12 border-zinc-200 dark:border-zinc-800">
            <div className="mb-1 h-5 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-10 rounded bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-12 rounded bg-zinc-100 dark:bg-zinc-800/60" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ReplacementNewAssetChartSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="h-5 w-64 max-w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-3 w-52 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="flex h-65 items-end justify-around gap-3 overflow-hidden border-b border-zinc-200 px-4 pt-6 dark:border-zinc-800">
        {[55, 82, 64, 92, 70, 48].map((height, i) => (
          <div
            key={i}
            className="flex h-full flex-1 items-end justify-center gap-1.5"
          >
            <div
              className="w-5 rounded-t bg-zinc-200 dark:bg-zinc-800"
              style={{ height: `${height}%` }}
            />
            <div
              className="w-5 rounded-t bg-zinc-100 dark:bg-zinc-800/60"
              style={{ height: `${Math.max(30, height - 22)}%` }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function StatusResolusiPerCabangSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="mb-4">
        <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-3 w-64 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800/60" />
            </div>
            <div className="h-3.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function FindingTableSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="h-5 w-44 max-w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-3 w-56 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-8 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="overflow-x-auto py-2">
        <div className="min-w-225 space-y-2">
          <div className="h-9 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-11 w-full rounded bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex gap-2">
          <div className="h-8 w-16 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-16 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </Card>
  );
}

export function FindingsDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <TemuanPerKategoriSkeleton />
        <TrenKategoriChartSkeleton />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusResolusiSkeleton />
        <EventLifecycleSkeleton />
      </div>

      <ReplacementNewAssetChartSkeleton />

      <StatusResolusiPerCabangSkeleton />

      <FindingTableSkeleton />
    </div>
  );
}
