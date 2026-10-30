/**
 * Skeleton per rute dashboard.
 *
 * Bentuknya meniru susunan kartu halaman aslinya supaya layout tidak melompat
 * saat data tiba. Dipakai dua sisi: `Suspense fallback` di tiap `page.tsx`
 * dan `connection-state.tsx` (saat seluruh shell belum siap).
 */

const card =
  "min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900";
const block = "rounded bg-zinc-200 dark:bg-zinc-800";

function HeaderBlock() {
  return (
    <div className="space-y-2">
      <div className={`h-6 w-44 ${block}`} />
      <div className={`h-3 w-96 max-w-full ${block}`} />
    </div>
  );
}

function KpiRow({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <section key={i} className={`${card} min-h-32`}>
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 ${block}`} />
            <div className={`h-3 w-24 ${block}`} />
          </div>
          <div className={`mt-5 h-7 w-20 ${block}`} />
          <div className={`mt-3 h-3 w-32 ${block}`} />
        </section>
      ))}
    </div>
  );
}

function DonutCard() {
  return (
    <section className={card}>
      <div className={`h-4 w-36 ${block}`} />
      <div className={`mt-2 h-3 w-56 ${block}`} />
      <div className="mt-6 flex items-center justify-center gap-7">
        <div className="h-36 w-36 shrink-0 rounded-full border-[22px] border-zinc-200 dark:border-zinc-800" />
        <div className="w-44 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`h-4 w-full ${block}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BarsCard({ rows = 6 }: { rows?: number }) {
  return (
    <section className={card}>
      <div className={`h-4 w-36 ${block}`} />
      <div className={`mt-2 h-3 w-56 ${block}`} />
      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-3">
            <div className={`h-3 ${block}`} />
            <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/60">
              <div className="h-full rounded-full bg-zinc-300 dark:bg-zinc-700" style={{ width: `${92 - i * 12}%` }} />
            </div>
            <div className={`h-3 ${block}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ColumnsCard({ height = "h-64" }: { height?: string }) {
  return (
    <section className={card}>
      <div className={`h-4 w-36 ${block}`} />
      <div className={`mt-2 h-3 w-56 ${block}`} />
      <div className={`mt-6 flex ${height} items-end gap-4`}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex h-full flex-1 items-end justify-center">
            <div className="w-full max-w-11 rounded-t bg-zinc-300 dark:bg-zinc-700" style={{ height: `${20 + ((i * 17) % 70)}%` }} />
          </div>
        ))}
      </div>
    </section>
  );
}

function TableCard({ rows = 12 }: { rows?: number }) {
  return (
    <section className={card}>
      <div className="flex flex-wrap items-center gap-3">
        <div className={`h-4 w-36 ${block}`} />
        <div className={`h-9 min-w-52 flex-1 ${block}`} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`h-9 w-28 ${block}`} />
        ))}
      </div>
      <div className={`mt-4 h-8 w-full ${block}`} />
      <div className="mt-2 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
        ))}
      </div>
    </section>
  );
}

/** Overview: 3 KPI → volume bulanan + komposisi status → volume & result */
export function ItrOverviewSkeleton() {
  return (
    <div className="space-y-3.5">
      <HeaderBlock />
      <KpiRow count={3} />
      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ColumnsCard />
        <DonutCard />
      </div>
      <BarsCard rows={6} />
    </div>
  );
}

/** Repair tickets: 5 KPI → 2 donut → status per item + beban PIC → repair bulanan → tabel */
export function ItrRepairTicketsSkeleton() {
  return (
    <div className="space-y-3.5">
      <HeaderBlock />
      <KpiRow count={5} />
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <DonutCard />
        <DonutCard />
      </div>
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <BarsCard rows={6} />
        <BarsCard rows={6} />
      </div>
      <ColumnsCard height="h-56" />
      <TableCard />
    </div>
  );
}

/** Golden Unit: 5 KPI → donut + hasil per item → unit per PIC → tabel */
export function ItrGoldenUnitSkeleton() {
  return (
    <div className="space-y-3.5">
      <HeaderBlock />
      <KpiRow count={5} />
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <DonutCard />
        <BarsCard rows={6} />
      </div>
      <ColumnsCard height="h-56" />
      <TableCard />
    </div>
  );
}
