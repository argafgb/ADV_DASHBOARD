import { Card } from "@/components/ui/card";

const pulse = "animate-pulse rounded bg-zinc-200 dark:bg-zinc-800";
const cardClass =
  "min-w-0 border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900";

function Block({ className }: { className: string }) {
  return <div className={`${pulse} ${className}`} />;
}

export function AssetInfrastructureSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading asset infrastructure"
    >
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <Block className="h-9 w-9 rounded-lg" />
            </div>
            <Block className="h-3 w-28 mb-2" />
            <Block className="h-8 w-20 mb-2" />
            <Block className="h-3 w-24" />
          </Card>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Block className="h-9 w-64 rounded-xl" />
        <Block className="h-9 w-52 rounded-xl" />
        <Block className="h-9 flex-1 min-w-55 rounded-lg" />
      </div>

      {/* 2-Column Analytics Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className={`${cardClass} lg:col-span-7`}>
          <Block className="h-4 w-48 mb-2" />
          <Block className="h-3 w-64 mb-6" />
          <Block className="h-60 w-full" />
          <div className="mt-4 flex gap-4">
            <Block className="h-3 w-16" />
            <Block className="h-3 w-16" />
            <Block className="h-3 w-24" />
          </div>
        </Card>

        <Card className={`${cardClass} lg:col-span-5`}>
          <Block className="h-4 w-40 mb-2" />
          <Block className="h-3 w-56 mb-6" />
          <div className="flex justify-center py-4">
            <div className="h-40 w-40 rounded-full border-20 border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="mt-4 flex justify-center gap-4">
            <Block className="h-3 w-20" />
            <Block className="h-3 w-20" />
            <Block className="h-3 w-24" />
          </div>
        </Card>
      </div>

      {/* Top 12 Branches */}
      <Card className={cardClass}>
        <Block className="h-4 w-60 mb-2" />
        <Block className="h-3 w-72 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Block className="h-3 w-36 shrink-0" />
              <Block className="h-3.5 flex-1 rounded-full" />
              <Block className="h-3 w-8" />
            </div>
          ))}
        </div>
      </Card>

      {/* Detail Table */}
      <Card className={`${cardClass} overflow-hidden p-0`}>
        <div className="p-5">
          <Block className="h-4 w-36 mb-2" />
          <Block className="h-3 w-48" />
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          <Block className="h-10 w-full rounded-none" />
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="grid grid-cols-6 gap-4 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              {Array.from({ length: 6 }, (_, col) => (
                <Block key={col} className="h-3 w-full" />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
