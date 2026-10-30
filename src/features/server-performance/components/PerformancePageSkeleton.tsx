import { Card, CardContent, CardHeader } from "@/components/ui/card";

const pulse = "animate-pulse bg-zinc-200 dark:bg-zinc-800";

function Line({ className }: { className: string }) {
  return <div className={`${pulse} rounded ${className}`} />;
}

function ChartPlot({ type, className = "" }: { type: "area" | "bar"; className?: string }) {
  return (
    <div className={`relative overflow-hidden border-b border-l border-zinc-200 dark:border-zinc-700 ${className}`}>
      <div className="absolute inset-0 flex items-end gap-2 px-3 pt-6">
        {Array.from({ length: 12 }, (_, index) =>
          type === "bar" ? (
            <div key={index} className="flex h-full flex-1 items-end gap-1">
              <div className={`${pulse} w-1/2 rounded-t`} style={{ height: `${24 + (index % 5) * 11}%` }} />
              <div className={`${pulse} w-1/2 rounded-t opacity-70`} style={{ height: `${34 + ((index + 2) % 5) * 10}%` }} />
            </div>
          ) : (
            <div key={index} className="relative h-full flex-1">
              <div className={`${pulse} absolute w-full rounded-full`} style={{ bottom: `${28 + (index % 4) * 12}%`, height: 4 }} />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function ChartCard({ type = "area", tall = false, controls = false }: { type?: "area" | "bar"; tall?: boolean; controls?: boolean }) {
  return (
    <Card className="border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <CardHeader className="flex flex-col gap-3 pb-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Line className="h-4 w-40" />
          <Line className="h-3 w-56 max-w-full" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: controls ? 4 : 2 }, (_, index) => <Line key={index} className="h-6 w-16" />)}
        </div>
      </CardHeader>
      <CardContent className="min-w-0 px-2 pt-4 sm:px-4">
        <ChartPlot type={type} className={tall ? "h-72 sm:h-80" : "h-70"} />
      </CardContent>
    </Card>
  );
}

function KpiGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index} className="border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <Line className="h-3 w-36" />
              <Line className="h-10 w-10 rounded-lg" />
            </div>
            <div className="mt-3 flex items-end gap-2"><Line className="h-8 w-20" /><Line className="h-3 w-24" /></div>
            <Line className="mt-2 h-3 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OpenCloseCard() {
  return (
    <Card className="border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <CardHeader className="pb-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="space-y-2"><Line className="h-5 w-44" /><Line className="h-3 w-56" /></div><div className="flex flex-wrap gap-2">{Array.from({ length: 5 }, (_, i) => <Line key={i} className="h-7 w-20" />)}</div></div></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="flex items-center gap-3.5 rounded-2xl border-2 border-zinc-200 p-4 dark:border-zinc-800"><Line className="h-11 w-11 rounded-xl" /><div className="flex-1 space-y-2"><Line className="h-3 w-4/5" /><Line className="h-6 w-14" /></div></div>)}
        </div>
        <ChartPlot type="area" className="h-72 sm:h-75" />
      </CardContent>
    </Card>
  );
}

function IncidentTable() {
  return (
    <Card className="overflow-hidden border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <CardHeader className="pb-3"><Line className="h-4 w-72 max-w-full" /><Line className="h-3 w-3/5" /></CardHeader>
      <CardContent className="overflow-x-auto border-t border-zinc-200 p-0 dark:border-zinc-800">
        <div className="min-w-180">
          <div className={`${pulse} h-10 w-full`} />
          {Array.from({ length: 5 }, (_, row) => <div key={row} className="grid grid-cols-8 gap-4 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">{Array.from({ length: 8 }, (_, col) => <Line key={col} className="h-3 w-full" />)}</div>)}
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformancePageSkeleton({ hasOpenCloseChart = false }: { hasOpenCloseChart?: boolean }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading server performance dashboard">
      <div className="space-y-2"><Line className="h-7 w-56" /><Line className="h-4 w-96 max-w-full" /></div>
      <KpiGrid />
      {hasOpenCloseChart && <OpenCloseCard />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard type="bar" />
        <ChartCard type="area" />
      </div>
      <ChartCard type="area" tall controls />
      <IncidentTable />
    </div>
  );
}
