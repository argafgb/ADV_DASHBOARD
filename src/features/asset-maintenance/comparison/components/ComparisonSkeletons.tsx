import { Card } from "@/components/ui/card";

const CARD =
  "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse";

function CardHeader() {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <div className="h-5 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-1.5 h-3 w-72 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      <div className="h-7 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

/** Skeleton for the asset-age series bar chart. */
export function UsiaAsetSkeleton() {
  return (
    <Card className={CARD}>
      <CardHeader />
      <div className="flex h-[280px] items-end gap-3 px-2">
        {[45, 60, 80, 100, 90, 70, 50].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-zinc-100 dark:bg-zinc-800/50"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </Card>
  );
}

/** Skeleton for the RnM grouped-column chart (2025 vs 2026). */
export function RnmPerCabangSkeleton() {
  return (
    <Card className={CARD}>
      <CardHeader />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="h-8 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-40 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      <div className="flex h-72 items-end gap-2 px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-1 items-end justify-center gap-1">
            <div
              className="w-2.5 rounded-t bg-zinc-100 dark:bg-zinc-800/50"
              style={{ height: `${30 + ((i * 13) % 55)}%` }}
            />
            <div
              className="w-2.5 rounded-t bg-zinc-200 dark:bg-zinc-800"
              style={{ height: `${45 + ((i * 17) % 50)}%` }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Skeleton for the two-column finding-category comparison. */
export function KategoriTemuanSkeleton() {
  return (
    <Card className={CARD}>
      <CardHeader />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-3">
            <div className="h-3.5 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div
                    className="h-5 rounded bg-zinc-100 dark:bg-zinc-800/50"
                    style={{ width: `${85 - i * 12}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
