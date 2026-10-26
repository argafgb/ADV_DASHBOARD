import { Card } from "@/components/ui/card";

function Block({ className }: { className: string }) {
  return <div className={`rounded bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

export function DeviceRequestsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Memuat Device Requests">
      <Card className="flex flex-row items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-1.5">
          <Block className="h-3.5 w-28" />
          <Block className="h-3 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Block className="h-8 w-32 rounded-xl" />
          <Block className="h-8 w-32 rounded-xl" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-36 rounded-xl bg-blue-200/60 dark:bg-blue-950/40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-36 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <Block className="h-4 w-24" />
            <Block className="mt-4 h-7 w-16" />
            <Block className="mt-4 h-1.5 w-full" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Block className="h-5 w-48" />
            <Block className="mt-1.5 h-3 w-64 max-w-full" />
            <Block className="mt-5 h-56 w-full" />
          </Card>
        ))}
      </div>

      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <Block className="h-5 w-56" />
          <Block className="mt-1.5 h-3 w-72 max-w-full" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 6 }).map((__, r) => (
              <Block key={r} className="h-8 w-full" />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
