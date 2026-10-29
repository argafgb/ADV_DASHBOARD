import { Card } from "@/components/ui/card";

const pulse = "animate-pulse rounded bg-zinc-200 dark:bg-zinc-800";
const card =
  "min-w-0 border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900";

function Block({ className }: { className: string }) {
  return <div className={`${pulse} ${className}`} />;
}

function CardHeading() {
  return (
    <div className="min-w-0 space-y-2">
      <Block className="h-4 w-44 max-w-full" />
      <Block className="h-3 w-64 max-w-full" />
    </div>
  );
}

function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index} className={card}>
          <div className="flex items-center justify-between gap-3">
            <Block className="h-4 w-32 max-w-[70%]" />
            <Block className="h-10 w-10 shrink-0 rounded-lg" />
          </div>
          <Block className="mt-5 h-9 w-24" />
          <Block className="mt-3 h-3 w-3/4" />
        </Card>
      ))}
    </div>
  );
}

function LineChartCard({ height = "h-62.5" }: { height?: string }) {
  return (
    <Card className={card}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <CardHeading />
        <div className="flex gap-3">
          <Block className="h-3 w-14" />
          <Block className="h-3 w-14" />
          <Block className="h-3 w-20" />
        </div>
      </div>
      <div
        className={`mt-4 overflow-hidden border-b border-l border-zinc-200 dark:border-zinc-700 ${height}`}
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 150 L55 118 L110 132 L165 92 L220 108 L275 70 L330 88 L385 55 L440 78 L495 42 L550 62 L600 35 L600 200 L0 200 Z"
            className="fill-zinc-100 dark:fill-zinc-800/60"
          />
          <path
            d="M0 150 L55 118 L110 132 L165 92 L220 108 L275 70 L330 88 L385 55 L440 78 L495 42 L550 62 L600 35"
            fill="none"
            className="stroke-zinc-300 dark:stroke-zinc-700"
            strokeWidth="5"
          />
        </svg>
      </div>
    </Card>
  );
}

function HorizontalBarChart() {
  return (
    <Card className={card}>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <CardHeading />
        <div className="flex gap-3">
          <Block className="h-3 w-14" />
          <Block className="h-3 w-14" />
        </div>
      </div>
      <div className="mt-4 h-82.5 overflow-hidden border-b border-l border-zinc-200 p-3 dark:border-zinc-700">
        <div className="flex h-full items-end gap-3">
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} className="flex h-full flex-1 items-end gap-1">
              <Block className="w-1/2 rounded-t" />
              <div
                className={`${pulse} w-1/2 rounded-t opacity-70`}
                style={{ height: `${32 + (i % 6) * 9}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function DonutCard() {
  return (
    <Card className={card}>
      <CardHeading />
      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
        <div className="h-42 w-42 shrink-0 rounded-full border-24 border-zinc-200 dark:border-zinc-800" />
        <div className="grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Block key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </Card>
  );
}

function ListCard({ rows = 5 }: { rows?: number }) {
  return (
    <Card className={card}>
      <CardHeading />
      <div className="mt-5 space-y-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between gap-3">
              <Block className="h-3 w-36 max-w-[70%]" />
              <Block className="h-3 w-14" />
            </div>
            <Block className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function TableCard({ rows = 7 }: { rows?: number }) {
  return (
    <Card className={`${card} overflow-hidden p-0`}>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Block className="h-3 w-24 max-w-full" />
              <Block className="h-7 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Block className="h-9 w-48" />
          <Block className="h-9 w-28" />
          <Block className="h-9 w-32" />
        </div>
      </div>
      <div className="overflow-x-auto border-t border-zinc-200 dark:border-zinc-800">
        <div className="min-w-180">
          <Block className="h-10 w-full rounded-none" />
          {Array.from({ length: rows }, (_, row) => (
            <div
              key={row}
              className="grid grid-cols-7 gap-4 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              {Array.from({ length: 7 }, (_, col) => (
                <Block key={col} className="h-3 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function MapCard({ causes = false }: { causes?: boolean }) {
  return (
    <Card className={card}>
      <CardHeading />
      <Block className="mt-4 h-95 w-full rounded-lg" />
      {causes && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Block key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
    </Card>
  );
}

function HeatmapCard() {
  return (
    <Card className={card}>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <CardHeading />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Block key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      <div className="mt-4 max-h-130 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        {Array.from({ length: 12 }, (_, row) => (
          <div
            key={row}
            className="flex gap-1 border-b border-zinc-200 p-1 last:border-0 dark:border-zinc-800"
          >
            <Block className="h-5 w-28 shrink-0" />
            {Array.from({ length: 24 }, (_, col) => (
              <Block key={col} className="h-5 min-w-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

const routeHeadings = {
  overview: ["Overview", "Ringkasan performa jaringan."],
  sla: ["SLA by Site", "SLA setiap cabang dibandingkan dengan target kinerja."],
  isp: ["ISP & Bandwidth", "Kontrak vendor & utilisasi bandwidth."],
  downtime: ["Downtime Under SLA", "Insiden jaringan di bawah target SLA."],
} as const;

function PageHeader({ route }: { route: keyof typeof routeHeadings }) {
  const [title, description] = routeHeadings[route];
  return (
    <header className="mb-6">
      <div
        className="h-7 w-64 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
        aria-label={title}
      />
      <div
        className="mt-2 h-3 w-80 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
        aria-label={description}
      />
    </header>
  );
}

export function NetworkPageSkeleton({
  route,
  includeHeader = false,
}: {
  route: "overview" | "sla" | "isp" | "downtime";
  includeHeader?: boolean;
}) {
  const content = (() => {
    if (route === "overview")
      return (
        <div
          className="space-y-4"
          role="status"
          aria-label="Loading network overview"
        >
          <KpiCards />
          <LineChartCard />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ListCard />
            <ListCard />
          </div>
          <MapCard />
        </div>
      );
    if (route === "sla")
      return (
        <div
          className="space-y-4"
          role="status"
          aria-label="Loading SLA performance"
        >
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-start">
            <div className="w-full space-y-3 md:w-69 md:shrink-0">
              <Card className={`${card} h-48.5`}>
                <CardHeading />
                <Block className="mt-6 h-10 w-24" />
                <Block className="mt-5 h-4 w-32" />
              </Card>
              <Card className={`${card} h-46.75`}>
                <CardHeading />
                <Block className="mt-6 h-10 w-24" />
                <Block className="mt-5 h-4 w-32" />
              </Card>
            </div>
            <div className="min-w-0 flex-1">
              <HorizontalBarChart />
            </div>
          </div>
          <HeatmapCard />
          <MapCard />
        </div>
      );
    if (route === "isp")
      return (
        <div
          className="space-y-4"
          role="status"
          aria-label="Loading ISP and bandwidth"
        >
          <Block className="h-9 w-56" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DonutCard />
            <ListCard />
          </div>
          <ListCard rows={8} />
          <ListCard rows={4} />
          <TableCard />
        </div>
      );
    return (
      <div
        className="space-y-4"
        role="status"
        aria-label="Loading downtime incidents"
      >
        <TableCard />
        <MapCard causes />
      </div>
    );
  })();

  return (
    <div className="w-full min-w-0">
      {includeHeader && <PageHeader route={route} />}
      {content}
    </div>
  );
}
