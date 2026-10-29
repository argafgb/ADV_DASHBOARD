import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800/80",
        className,
      )}
      {...props}
    />
  );
}

export function FsdBlueprintSkeleton() {
  return (
    <div className="flex flex-col gap-5 select-none font-sans">
      {/* KPI CARDS ROW */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-sm" />
            </div>
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-8 w-16 rounded-sm" />
              <Skeleton className="h-3.5 w-12 rounded-sm" />
            </div>
          </div>
        ))}
      </div>

      {/* ROW 2: DONUT + QUARTER + TOP CONTRIBUTORS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Status Donut */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 lg:col-span-4 flex flex-col gap-4">
          <Skeleton className="h-4 w-32 rounded-sm" />
          <Skeleton className="h-3 w-48 rounded-sm" />
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="h-36 w-36 shrink-0 rounded-full border-22 border-zinc-200 dark:border-zinc-800" />
            <div className="flex flex-col gap-2.5 flex-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full rounded-sm" />
              ))}
            </div>
          </div>
        </div>

        {/* Quarter Distribution */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 lg:col-span-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <Skeleton className="h-4 w-36 rounded-sm" />
              <Skeleton className="h-3 w-52 rounded-sm" />
            </div>
            <Skeleton className="h-4 w-40 rounded-sm" />
          </div>
          <div className="space-y-3.5 mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-8 rounded-sm" />
                <Skeleton className="h-6 flex-1 rounded-md" />
                <Skeleton className="h-4 w-6 rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 lg:col-span-3 flex flex-col gap-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-36 rounded-sm" />
            <Skeleton className="h-3 w-44 rounded-sm" />
          </div>
          <div className="space-y-3 mt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="h-6 w-6 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-24 rounded-sm" />
                    <Skeleton className="h-3.5 w-6 rounded-sm" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: OWNER + WORKLOAD + SCOPE */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Owner */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 lg:col-span-5 flex flex-col gap-4">
          <Skeleton className="h-4 w-36 rounded-sm" />
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-14 rounded-sm" />
                <Skeleton className="h-4 flex-1 rounded-sm" />
                <Skeleton className="h-3.5 w-6 rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Workload */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 lg:col-span-4 flex flex-col gap-4">
          <Skeleton className="h-4 w-36 rounded-sm" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-24 rounded-sm" />
                  <Skeleton className="h-3.5 w-10 rounded-sm" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Scope Composition */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 lg:col-span-3 flex flex-col gap-4">
          <Skeleton className="h-4 w-36 rounded-sm" />
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* DATA TABLE SKELETON */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-32 rounded-sm" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        <div className="space-y-2 mt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
