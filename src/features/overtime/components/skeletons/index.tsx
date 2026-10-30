import React from "react";

const card =
  "min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900";
const block = "rounded bg-zinc-200 dark:bg-zinc-800";

function HeaderBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-2">
      <div className={`${compact ? "h-4 w-36" : "h-5 w-52"} ${block}`} />
      <div className={`h-3 w-80 max-w-full ${block}`} />
    </div>
  );
}

function Rows({
  count = 5,
  height = "h-10",
}: {
  count?: number;
  height?: string;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${height} rounded-lg bg-zinc-100 dark:bg-zinc-800/60`}
        />
      ))}
    </div>
  );
}

function VerticalBars({ grouped = false }: { grouped?: boolean }) {
  return (
    <div className="flex h-52 min-w-0 items-end gap-3">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="flex h-full min-w-0 flex-1 items-end justify-center gap-1"
        >
          <div
            className="w-full max-w-8 rounded-t bg-zinc-300 dark:bg-zinc-700"
            style={{ height: `${24 + ((index * 13) % 68)}%` }}
          />
          {grouped && (
            <div
              className="w-full max-w-8 rounded-t bg-zinc-200 dark:bg-zinc-800"
              style={{ height: `${18 + ((index * 9) % 58)}%` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function AreaChartShape() {
  return (
    <svg
      className="h-48 w-full min-w-0"
      viewBox="0 0 800 190"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 168 C90 156 118 130 190 137 S310 112 385 102 S520 78 610 64 S720 39 800 24 L800 190 L0 190 Z"
        className="fill-zinc-100 dark:fill-zinc-800/60"
      />
      <path
        d="M0 168 C90 156 118 130 190 137 S310 112 385 102 S520 78 610 64 S720 39 800 24"
        fill="none"
        className="stroke-zinc-300 dark:stroke-zinc-700"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M0 178 C110 168 180 153 250 148 S400 130 500 114 S650 91 800 73"
        fill="none"
        className="stroke-zinc-200 dark:stroke-zinc-800"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DonutShape() {
  return (
    <div className="h-26 w-26 shrink-0 rounded-full border-18 border-zinc-200 dark:border-zinc-800" />
  );
}

function HorizontalRanking({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(5rem,1fr)_4.375rem_2rem] items-center gap-2"
        >
          <div className={`h-3 ${block}`} />
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/60">
            <div
              className="h-full rounded-full bg-zinc-300 dark:bg-zinc-700"
              style={{ width: `${96 - index * 7}%` }}
            />
          </div>
          <div className={`h-3 ${block}`} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({
  rows = 7,
  controls = 4,
}: {
  rows?: number;
  controls?: number;
}) {
  return (
    <section className={card}>
      <HeaderBlock />
      <div className="mt-4 flex flex-wrap gap-2">
        <div className={`h-9 min-w-52 flex-1 ${block}`} />
        {Array.from({ length: controls }).map((_, index) => (
          <div key={index} className={`h-9 w-24 ${block}`} />
        ))}
      </div>
      <div className={`mt-4 h-7 w-full ${block}`} />
      <div className="mt-2">
        <Rows count={rows} />
      </div>
    </section>
  );
}

export function OvertimeOverviewSkeleton() {
  return (
    <div className="space-y-3.5">
      <section className={`${card} min-h-16`}>
        <div className={`h-4 w-64 ${block}`} />
      </section>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <section key={index} className={`${card} min-h-27.5`}>
            <div className="flex items-start justify-between">
              <div className={`h-3 w-24 ${block}`} />
              <div className={`h-8 w-8 ${block}`} />
            </div>
            <div className={`mt-5 h-7 w-24 ${block}`} />
            <div className={`mt-3 h-3 w-32 ${block}`} />
          </section>
        ))}
      </div>

      {Array.from({ length: 2 }).map((_, index) => (
        <section key={index} className={card}>
          <HeaderBlock compact />
          <div className="mt-3">
            <AreaChartShape />
          </div>
        </section>
      ))}

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        <section className={card}>
          <HeaderBlock compact />
          <div className="mt-4">
            <VerticalBars grouped />
          </div>
        </section>
        <section className={card}>
          <HeaderBlock compact />
          <div className="mt-4 flex items-center gap-5">
            <DonutShape />
            <div className="min-w-0 flex-1">
              <Rows count={4} height="h-5" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function OvertimeOrganizationSkeleton() {
  return (
    <div className="space-y-3.5">
      <section className={card}>
        <HeaderBlock />
        <div className="mt-6 grid grid-cols-1 gap-5 min-[760px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] min-[1040px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex items-center gap-4">
            <DonutShape />
            <div className="min-w-0 flex-1">
              <Rows count={2} height="h-8" />
            </div>
          </div>
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-zinc-200 bg-[#FAFBFC] p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <div className={`h-3 w-28 ${block}`} />
              <div className={`mt-3 h-5 w-32 ${block}`} />
              <div className={`mt-2 h-3 w-40 max-w-full ${block}`} />
              <div className={`mt-4 h-7 w-24 ${block}`} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <section className={card}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <HeaderBlock compact />
            <div className={`h-8 w-24 ${block}`} />
          </div>
          <div className="mt-5">
            <HorizontalRanking count={5} />
          </div>
        </section>
        <section className={card}>
          <HeaderBlock compact />
          <div className="mt-4">
            <VerticalBars />
          </div>
        </section>
      </div>

      <section className={card}>
        <HeaderBlock compact />
        <div className="mt-4 h-64 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
      </section>
    </div>
  );
}

export function OvertimeEmployeeComplianceSkeleton() {
  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_1.2fr]">
        <section className={card}>
          <HeaderBlock compact />
          <div className="mt-4 flex items-center gap-5">
            <DonutShape />
            <div className="min-w-0 flex-1">
              <Rows count={4} height="h-5" />
            </div>
          </div>
        </section>
        <section className={card}>
          <HeaderBlock compact />
          <div className="mt-4 grid grid-cols-[4rem_repeat(5,1fr)] gap-1.5">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className={`h-7 ${block}`} />
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <section className={card}>
          <HeaderBlock compact />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-24 rounded-lg ${block}`} />
            ))}
          </div>
        </section>
        <section className={card}>
          <HeaderBlock compact />
          <div className="mt-4">
            <Rows count={4} height="h-12" />
          </div>
        </section>
      </div>

      <TableSkeleton rows={8} controls={3} />
    </div>
  );
}
