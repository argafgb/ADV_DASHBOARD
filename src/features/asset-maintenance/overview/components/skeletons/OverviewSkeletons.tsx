import { Card } from "@/components/ui/card";

export function KpiCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <div className="h-8 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
    </Card>
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  const columns =
    count === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";

  return (
    <div className={`grid grid-cols-1 gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function GrowthChartSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <div className="h-5 w-52 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1.5 h-3 w-40 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="h-8 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="flex h-64 items-end justify-around gap-4 border-b border-zinc-200 px-4 pt-6 dark:border-zinc-800">
        {[48, 72, 58, 88, 68, 94].map((height, index) => (
          <div
            key={index}
            className="flex h-full flex-1 items-end justify-center"
          >
            <div
              className="w-full max-w-12 rounded-t bg-zinc-200 dark:bg-zinc-800"
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function RatingsCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="flex items-center justify-between gap-2">
        <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-6 w-14 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <div className="h-8 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-6 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="mt-3 h-3 w-40 rounded bg-zinc-100 dark:bg-zinc-800/60" />
    </Card>
  );
}

export function DonutCardSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="mb-4">
        <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      <div className="flex flex-1 items-center justify-center py-4">
        <div className="h-36 w-36 rounded-full border-8 border-zinc-200 dark:border-zinc-800" />
      </div>
      <div className="mt-4 flex justify-around">
        <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </Card>
  );
}

export function MonthlyTrendChartSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse h-full min-h-75">
      <div className="mb-4">
        <div className="h-5 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      <div className="relative mt-auto h-72 overflow-hidden border-b border-l border-zinc-200 dark:border-zinc-800">
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-zinc-100 dark:bg-zinc-800/40 [clip-path:polygon(0_78%,16%_58%,32%_72%,48%_32%,64%_48%,80%_18%,100%_38%,100%_100%,0_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 border-t-2 border-zinc-300 dark:border-zinc-700 [clip-path:polygon(0_78%,16%_58%,32%_72%,48%_32%,64%_48%,80%_18%,100%_38%,100%_42%,80%_22%,64%_52%,48%_36%,32%_76%,16%_62%,0_82%)]" />
      </div>
    </Card>
  );
}

export function Top5CabangSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse h-full min-h-65">
      <div className="mb-4">
        <div className="h-5 w-52 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1 h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      <div className="space-y-3 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div
              className="h-5 rounded bg-zinc-200 dark:bg-zinc-800"
              style={{ width: `${80 - i * 12}%` }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function KomposisiPerangkatSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse h-full min-h-65">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-4 mt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3.5 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-3.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function OverviewDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <KpiGridSkeleton count={4} />
        <GrowthChartSkeleton />
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 animate-pulse">
          <div className="h-4 w-52 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-80 max-w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <RatingsCardSkeleton />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DonutCardSkeleton />
        <DonutCardSkeleton />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <DonutCardSkeleton />
        <div className="lg:col-span-2">
          <MonthlyTrendChartSkeleton />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Top5CabangSkeleton />
        <KomposisiPerangkatSkeleton />
      </div>
      <JadwalPmSkeleton />
    </div>
  );
}

export function JadwalPmSkeleton() {
  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-1">
          <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-48 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800"
          >
            <div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-6 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </Card>
  );
}
