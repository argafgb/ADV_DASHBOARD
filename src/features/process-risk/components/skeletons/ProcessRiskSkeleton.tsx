'use client';

import { usePathname } from 'next/navigation';

const pulse = 'animate-pulse bg-zinc-200 dark:bg-zinc-800';
const card =
  'relative isolate min-w-0 max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900';

function Block({ className = '' }: { className?: string }) {
  return <div className={`${pulse} rounded ${className}`} />;
}

function PageHeaderSkeleton() {
  return (
    <header className="feature-header min-w-0">
      <Block className="h-7 w-48" />
      <Block className="mt-2 h-3 w-full max-w-xl" />
    </header>
  );
}

function Kpis({ count }: { count: number }) {
  return (
    <div className={`dashboard-grid dashboard-grid-${count}`}>
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className={`${card} min-h-32 p-5`}>
          <div className="flex justify-between gap-3">
            <Block className="h-3 w-24" />
            <Block className="h-8 w-8 rounded-lg" />
          </div>
          <Block className="mt-4 h-8 w-20" />
          <Block className="mt-3 h-3 w-4/5" />
        </article>
      ))}
    </div>
  );
}

function Columns() {
  return (
    <div className="flex h-40 items-end gap-2 overflow-hidden pt-4">
      {Array.from({ length: 12 }, (_, index) => (
        <div
          key={index}
          className={`${pulse} min-w-3 flex-1 rounded-t`}
          style={{ height: `${30 + (index % 5) * 13}%` }}
        />
      ))}
    </div>
  );
}

function SectionTitle() {
  return <Block className="mb-3 h-4 w-48" />;
}

export function OverviewSkeleton() {
  return (
    <div className="feature-page">
      <PageHeaderSkeleton />
      <div className="feature-content">
        <Kpis count={5} />
        <section>
          <SectionTitle />
          <div className="dashboard-split dashboard-split-3-2">
            <div className={`${card} p-5`}>
              <Block className="h-3 w-52" />
              <Columns />
            </div>
            <div className={`${card} min-h-56 p-5`}>
              <Block className="h-3 w-40" />
              <div className="mt-4 flex items-center justify-center">
                <Block className="h-36 w-36 rounded-full" />
              </div>
            </div>
          </div>
        </section>
        <section>
          <SectionTitle />
          <div className="dashboard-split dashboard-split-3-2">
            <div className={`${card} min-h-64 space-y-4 p-5`}>
              {Array.from({ length: 7 }, (_, i) => (
                <Block key={i} className="h-6 w-full" />
              ))}
            </div>
            <div className={`${card} min-h-64 space-y-4 p-5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Block key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </section>
        <section>
          <SectionTitle />
          <div className={`${card} min-h-72 p-5`}>
            <div className="chart-scroll">
              <div className="program-heatmap grid grid-cols-[160px_repeat(12,1fr)] gap-2">
                {Array.from({ length: 91 }, (_, i) => (
                  <Block key={i} className="h-5 w-full" />
                ))}
              </div>
            </div>
          </div>
        </section>
        <section>
          <SectionTitle />
          <div className="dashboard-grid dashboard-grid-3">
            {Array.from({ length: 6 }, (_, i) => (
              <article key={i} className={`${card} min-h-28 space-y-3 p-4`}>
                <Block className="h-3 w-2/5" />
                <Block className="h-4 w-4/5" />
                <Block className="h-3 w-full" />
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function DirectorySkeleton() {
  return (
    <div className="feature-page">
      <PageHeaderSkeleton />
      <div className="feature-content">
        <section>
          <SectionTitle />
          <div className={`${card} mb-4 p-4`}>
            <div className="flex flex-wrap gap-2">
              <Block className="h-9 w-full max-w-84" />
              <Block className="h-9 w-36" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Block key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="dashboard-grid dashboard-grid-3">
            {Array.from({ length: 12 }, (_, i) => (
              <article key={i} className={`${card} min-h-60 p-5`}>
                <Block className="h-4 w-2/3" />
                <Block className="mt-2 h-3 w-1/2" />
                <Block className="mt-5 h-8 w-16" />
                <Block className="mt-4 h-12 w-full" />
                <Block className="mt-4 h-3 w-4/5" />
                <Block className="mt-5 h-px w-full" />
                <Block className="mt-4 h-3 w-full" />
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="feature-page">
      <Block className="mb-[10px] h-3 w-44" />
      <PageHeaderSkeleton />
      <div className="feature-content">
        <Kpis count={4} />
        <section>
          <SectionTitle />
          <div className={`${card} min-h-52 p-5`}>
            <Columns />
          </div>
        </section>
        <section>
          <SectionTitle />
          <div className={card}>
            <div className="data-table-scroll">
              <div className="flex flex-wrap gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800">
                <Block className="h-9 w-full max-w-80" />
                {Array.from({ length: 5 }, (_, i) => (
                  <Block key={i} className="h-9 w-24 rounded-full" />
                ))}
              </div>
              <div className="min-w-[900px]">
                {Array.from({ length: 8 }, (_, row) => (
                  <div
                    key={row}
                    className="grid grid-cols-[280px_repeat(12,48px)_140px] gap-2 border-b border-zinc-100 p-3 dark:border-zinc-800"
                  >
                    {Array.from({ length: 14 }, (_, col) => (
                      <Block key={col} className="h-7 w-full" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ProcessRiskRouteSkeleton() {
  const pathname = usePathname();
  const isDirectory = pathname === '/dashboard/process-risk/program' || pathname === '/dashboard/process-risk/program/';
  const isDetail = pathname.startsWith('/dashboard/process-risk/program/');
  return (
    <div role="status" aria-live="polite" aria-label="Loading dashboard">
      {isDirectory ? <DirectorySkeleton /> : isDetail ? <DetailSkeleton /> : <OverviewSkeleton />}
    </div>
  );
}
