import { Card } from "@/components/ui/card";

export function AssetAgeChartSkeleton() {
  return (
    <div
      className="flex h-70 animate-pulse items-end justify-between gap-3 px-4 pb-2 pt-6"
      role="status"
      aria-label="Memuat distribusi usia aset"
    >
      {[40, 65, 85, 100, 75, 55, 35].map((heightPct, i) => (
        <div
          key={i}
          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
        >
          <div
            className="w-full max-w-14 rounded-t bg-zinc-200 dark:bg-zinc-800"
            style={{ height: `${heightPct}%` }}
          />
          <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function UsiaAsetSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      {/* Header */}
      <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="h-5 w-56 max-w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3.5 w-80 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="hidden shrink-0 gap-1 sm:flex">
          <div className="h-7 w-24 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-7 w-24 rounded-md bg-zinc-100 dark:bg-zinc-800/60" />
          <div className="h-7 w-24 rounded-md bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
      </div>

      <AssetAgeChartSkeleton />
    </Card>
  );
}

export function RnmChartSkeleton() {
  return (
    <div
      className="flex h-80 animate-pulse items-end justify-between gap-4 overflow-hidden px-2 pb-2 pt-6"
      role="status"
      aria-label="Memuat perbandingan RnM per cabang"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
        >
          <div
            className="flex w-full items-end justify-center gap-1.5"
            style={{ height: "85%" }}
          >
            <div
              className="w-4 rounded-t bg-zinc-200 dark:bg-zinc-800"
              style={{ height: `${30 + (i % 5) * 12}%` }}
            />
            <div
              className="w-4 rounded-t bg-zinc-200 dark:bg-zinc-800"
              style={{ height: `${40 + (i % 4) * 14}%` }}
            />
          </div>
          <div className="h-3 w-10 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function RnmPerCabangSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      {/* Header */}
      <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="h-5 w-64 max-w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3.5 w-72 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="hidden shrink-0 gap-1 sm:flex">
          <div className="h-7 w-12 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-7 w-12 rounded-md bg-zinc-100 dark:bg-zinc-800/60" />
          <div className="h-7 w-12 rounded-md bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
      </div>

      {/* Category Tabs & Subcategory Placeholder */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
          <div className="h-7 w-12 rounded-md bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-7 w-20 rounded-md bg-zinc-200/60 dark:bg-zinc-800/60" />
          <div className="h-7 w-24 rounded-md bg-zinc-200/60 dark:bg-zinc-800/60" />
          <div className="h-7 w-20 rounded-md bg-zinc-200/60 dark:bg-zinc-800/60" />
        </div>
        <div className="h-7 w-36 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>

      <RnmChartSkeleton />

      {/* Bottom Legend Placeholder */}
      <div className="mt-3 flex gap-5">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
      </div>
    </Card>
  );
}

export function FindingCategoryListSkeleton() {
  return (
    <div
      className="grid animate-pulse grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8"
      role="status"
      aria-label="Memuat perbandingan kategori temuan"
    >
      {[
        [90, 75, 55, 40, 30, 20],
        [85, 70, 60, 45, 35, 25],
      ].map((widths, column) => (
        <div key={column} className="space-y-3">
          <div className="h-4 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-2.5">
            {widths.map((widthPct, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div
                  className="h-3 rounded bg-zinc-200 dark:bg-zinc-800"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function KategoriTemuanSkeleton() {
  return (
    <Card className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      {/* Header */}
      <div className="mb-4 space-y-1.5">
        <div className="h-5 w-72 max-w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3.5 w-64 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>

      <FindingCategoryListSkeleton />
    </Card>
  );
}

export function ComparisonPageSkeleton() {
  return (
    <div className="space-y-4">
      <UsiaAsetSkeleton />
      <RnmPerCabangSkeleton />
      <KategoriTemuanSkeleton />
    </div>
  );
}
