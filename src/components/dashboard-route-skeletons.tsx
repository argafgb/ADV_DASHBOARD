const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";
const block = "rounded bg-zinc-200 dark:bg-zinc-800";

function Rows({ count, height = "h-10" }: { count: number; height?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${height} rounded-lg bg-zinc-100 dark:bg-zinc-800/50`}
        />
      ))}
    </div>
  );
}

function MetricCard() {
  return (
    <div className={`${card} min-h-70 overflow-hidden`}>
      <div className={`h-4 w-28 ${block}`} />
      <div className={`mx-auto mt-12 h-10 w-24 ${block}`} />
      <div className={`mx-auto mt-8 h-3 w-36 ${block}`} />
    </div>
  );
}

function AreaCurve({ height = "h-64" }: { height?: string }) {
  return (
    <svg
      className={`${height} w-full min-w-0 overflow-hidden`}
      viewBox="0 0 800 240"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 194 C70 174 94 92 164 126 S270 202 340 136 S460 52 532 104 S650 178 800 66 L800 240 L0 240 Z"
        className="fill-zinc-100 dark:fill-zinc-800/60"
      />
      <path
        d="M0 194 C70 174 94 92 164 126 S270 202 340 136 S460 52 532 104 S650 178 800 66"
        fill="none"
        className="stroke-zinc-300 dark:stroke-zinc-700"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M0 210 C92 182 118 154 190 166 S302 112 378 146 S500 194 566 124 S690 84 800 118"
        fill="none"
        className="stroke-zinc-200 dark:stroke-zinc-800"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GroupedBars({ horizontal = false }: { horizontal?: boolean }) {
  if (horizontal) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="grid min-w-0 grid-cols-[minmax(72px,120px)_1fr] items-center gap-3"
          >
            <div className={`h-3 ${block}`} />
            <div className="space-y-1">
              <div
                className="h-3 rounded bg-zinc-300 dark:bg-zinc-700"
                style={{ width: `${48 + index * 6}%` }}
              />
              <div
                className="h-3 rounded bg-zinc-200 dark:bg-zinc-800"
                style={{ width: `${72 - index * 4}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex h-72 min-w-0 items-end justify-around gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex h-full min-w-0 flex-1 items-end justify-center gap-1"
        >
          <div
            className="w-1/3 rounded-t bg-zinc-300 dark:bg-zinc-700"
            style={{ height: `${42 + index * 7}%` }}
          />
          <div
            className="w-1/3 rounded-t bg-zinc-200 dark:bg-zinc-800"
            style={{ height: `${76 - index * 5}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function ChartCard({
  height = "h-84",
  shape = "area",
}: {
  height?: string;
  shape?: "area" | "bars" | "horizontal";
}) {
  return (
    <section className={`${card} ${height} min-w-0 overflow-hidden`}>
      <div className={`mb-6 h-5 w-48 max-w-full ${block}`} />
      {shape === "area" ? (
        <AreaCurve />
      ) : shape === "horizontal" ? (
        <GroupedBars horizontal />
      ) : (
        <GroupedBars />
      )}
    </section>
  );
}

export function HelpdeskOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <section>
        <div className={`h-5 w-72 ${block}`} />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, group) => (
            <div key={group} className={`${card} space-y-4`}>
              <div className={`h-4 w-28 ${block}`} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard />
                <MetricCard />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className={`h-5 w-48 ${block}`} />
        <div className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <div className={`${card} h-36`} />
            <div className={`${card} h-36`} />
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard />
            <MetricCard />
            <MetricCard />
            <MetricCard />
          </div>
        </div>
      </section>
    </div>
  );
}

export function HelpdeskSlaPerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard />
        <MetricCard />
        <MetricCard />
        <MetricCard />
      </div>
      <ChartCard height="h-96" shape="area" />
      <ChartCard height="h-96" shape="area" />
      <div className="space-y-4">
        <div className="flex gap-4 border-b border-zinc-200 pb-2 dark:border-zinc-800">
          <div className={`h-6 w-44 ${block}`} />
          <div className={`h-6 w-44 ${block}`} />
        </div>
        <section className={card}>
          <div className={`mb-4 h-5 w-64 max-w-full ${block}`} />
          <div className={`mb-3 h-8 w-full ${block}`} />
          <Rows count={8} />
        </section>
      </div>
    </div>
  );
}

export function HelpdeskComparisonSkeleton() {
  return (
    <div className="space-y-6">
      <section className={`${card} h-20`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`h-4 w-24 ${block}`} />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={`h-8 w-14 ${block}`} />
          ))}
        </div>
      </section>
      <div className={`h-4 w-64 ${block}`} />
      <ChartCard height="h-96" shape="area" />
      <ChartCard height="h-104" shape="bars" />
      <ChartCard height="h-120" shape="horizontal" />
      <div className="flex gap-4 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <div className={`h-6 w-36 ${block}`} />
        <div className={`h-6 w-36 ${block}`} />
      </div>
      <section className={card}>
        <div className={`mb-6 h-5 w-48 ${block}`} />
        <div className={`mb-3 h-6 w-full ${block}`} />
        <Rows count={5} />
      </section>
    </div>
  );
}

export function HelpdeskRatingRootCauseSkeleton() {
  return (
    <div className="space-y-5">
      <section className={`${card} h-20`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`h-4 w-28 ${block}`} />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={`h-9 w-14 ${block}`} />
          ))}
        </div>
      </section>
      <div className="flex gap-4 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <div className={`h-6 w-28 ${block}`} />
        <div className={`h-6 w-36 ${block}`} />
      </div>
      <section className={`${card} space-y-5`}>
        <div className={`h-6 w-48 ${block}`} />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={`${card} h-48 text-center`}>
              <div className="mx-auto h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className={`mx-auto mt-3 h-5 w-36 ${block}`} />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className={`h-12 ${block}`} />
                <div className={`h-12 ${block}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="h-12 bg-zinc-100 p-4 dark:bg-zinc-800/50">
            <div className={`h-4 w-full ${block}`} />
          </div>
          <Rows count={3} height="h-12" />
        </div>
      </section>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <section className={`${card} min-h-96 xl:col-span-3`}>
          <div className="mb-5 flex flex-wrap justify-between gap-4">
            <div className="space-y-2">
              <div className={`h-6 w-64 ${block}`} />
              <div className={`h-4 w-72 ${block}`} />
            </div>
            <div className="flex gap-2">
              <div className={`h-8 w-20 ${block}`} />
              <div className={`h-8 w-20 ${block}`} />
            </div>
          </div>
          <GroupedBars horizontal />
        </section>
        <section className={`${card} min-h-96 xl:col-span-2`}>
          <div className={`h-6 w-28 ${block}`} />
          <div className={`mt-2 h-4 w-56 max-w-full ${block}`} />
          <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row xl:flex-col">
            <div className="h-44 w-44 shrink-0 rounded-full border-18 border-zinc-200 dark:border-zinc-800" />
            <div className="w-full">
              <Rows count={5} height="h-7" />
            </div>
          </div>
        </section>
      </div>
      <section className={card}>
        <div className={`mb-5 h-6 w-48 ${block}`} />
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
          <div className="mx-auto h-95 w-95 max-w-full rounded-full border-8 border-zinc-100 dark:border-zinc-800" />
          <div className="mx-auto h-95 w-95 max-w-full rounded-full border-8 border-zinc-100 dark:border-zinc-800" />
        </div>
      </section>
    </div>
  );
}

export function HelpdeskLeaderboardSkeleton() {
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <div className={`h-7 w-36 ${block}`} />
        <div className={`h-3 w-72 max-w-full ${block}`} />
      </header>
      <div className="flex gap-6 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <div className={`h-5 w-28 ${block}`} />
        <div className={`h-5 w-20 ${block}`} />
        <div className={`h-5 w-24 ${block}`} />
      </div>
      <div className="flex flex-wrap justify-center gap-6 py-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <section
            key={index}
            className="h-80 w-105 max-w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div className="mx-auto h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className={`mx-auto mt-4 h-5 w-52 ${block}`} />
            <div className="mx-auto mt-6 h-24 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className={`mx-auto mt-4 h-6 w-40 ${block}`} />
            <div className="mx-auto mt-4 h-7 w-32 rounded-full bg-zinc-100 dark:bg-zinc-800/50" />
          </section>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <section key={index} className={`${card} min-h-96`}>
            <div className={`mb-5 h-5 w-56 ${block}`} />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Rows count={5} height="h-10" />
              <Rows count={5} height="h-10" />
            </div>
            <div className="mt-4 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          </section>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`${card} min-h-72`}>
          <div className={`mb-4 h-5 w-56 ${block}`} />
          <Rows count={4} height="h-11" />
        </section>
        <section className={`${card} min-h-72`}>
          <div className={`mb-4 h-5 w-48 ${block}`} />
          <Rows count={5} height="h-10" />
        </section>
      </div>
    </div>
  );
}

export function HelpdeskFsdBlueprintSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={`${card} h-28`}>
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 ${block}`} />
              <div className={`h-4 w-24 ${block}`} />
            </div>
            <div className={`mt-4 h-8 w-16 ${block}`} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className={`${card} h-72 lg:col-span-4`}>
          <div className={`h-4 w-32 ${block}`} />
          <div className={`mt-2 h-3 w-48 max-w-full ${block}`} />
          <div className="mt-6 flex items-center justify-center gap-5">
            <div className="h-36 w-36 shrink-0 rounded-full border-22 border-zinc-200 dark:border-zinc-800" />
            <div className="min-w-0 flex-1">
              <Rows count={4} height="h-5" />
            </div>
          </div>
        </section>
        <section className={`${card} h-72 lg:col-span-5`}>
          <div className={`h-4 w-36 ${block}`} />
          <Rows count={4} height="h-9" />
        </section>
        <section className={`${card} h-72 lg:col-span-3`}>
          <div className={`h-4 w-36 ${block}`} />
          <Rows count={3} height="h-12" />
        </section>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className={`${card} h-64 lg:col-span-5`}>
          <Rows count={5} height="h-8" />
        </section>
        <section className={`${card} h-64 lg:col-span-4`}>
          <Rows count={5} height="h-8" />
        </section>
        <section className={`${card} h-64 lg:col-span-3`}>
          <Rows count={2} height="h-16" />
        </section>
      </div>
      <section className={card}>
        <div className="mb-4 flex flex-wrap justify-between gap-3">
          <div className={`h-5 w-32 ${block}`} />
          <div className="flex gap-2">
            <div className={`h-8 w-44 ${block}`} />
            <div className={`h-8 w-24 ${block}`} />
            <div className={`h-8 w-24 ${block}`} />
          </div>
        </div>
        <Rows count={8} height="h-12" />
      </section>
    </div>
  );
}
