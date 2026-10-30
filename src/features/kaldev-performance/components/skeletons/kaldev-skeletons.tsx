/**
 * Skeleton per rute dashboard.
 *
 * File ini sengaja dibuat mengikuti pola repo dashboard lain: bentuk skeleton
 * meniru susunan kartu pada halaman aslinya supaya layout tidak melompat saat
 * data tiba. Dipakai dua sisi:
 * - `Suspense fallback` di tiap `page.tsx` (saat data sedang diambil).
 * - `connection-state.tsx` (saat seluruh shell belum siap).
 */

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

/** Overview: exact skeleton dari artefak desain Kaldev finishing (is.ringkasanLoading) */
export function KaldevOverviewSkeleton() {
  return (
    <div style={{ display: "grid", gap: 15 }}>
      <div
        style={{
          display: "grid",
          gap: 15,
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 208px), 1fr))",
        }}
      >
        <div
          style={{
            height: 116,
            borderRadius: 14,
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            animation: "kdpulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 116,
            borderRadius: 14,
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            animation: "kdpulse 1.4s ease-in-out .15s infinite",
          }}
        />
        <div
          style={{
            height: 116,
            borderRadius: 14,
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            animation: "kdpulse 1.4s ease-in-out .3s infinite",
          }}
        />
        <div
          style={{
            height: 116,
            borderRadius: 14,
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            animation: "kdpulse 1.4s ease-in-out .45s infinite",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: 15,
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
        }}
      >
        <div
          style={{
            height: 288,
            borderRadius: 14,
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            animation: "kdpulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 288,
            borderRadius: 14,
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            animation: "kdpulse 1.4s ease-in-out .2s infinite",
          }}
        />
      </div>

      <div
        style={{
          font: "400 12px/1.5 var(--dd-font-sans)",
          color: "var(--text-placeholder)",
        }}
      >
        Memuat proyek untuk periode terpilih…
      </div>
    </div>
  );
}

/** Action required: baris tab → tabel dengan pencarian */
export function KaldevActionRequiredSkeleton() {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`h-9 w-36 ${block}`} />
        ))}
      </div>
      <TableSkeleton rows={8} controls={1} />
    </div>
  );
}

/** Project register: tab status → toolbar → papan kanban lima lajur */
export function KaldevProjectRegisterSkeleton() {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={`h-9 w-28 ${block}`} />
        ))}
      </div>
      <section className={card}>
        <div className="flex flex-wrap gap-2">
          <div className={`h-9 min-w-52 flex-1 ${block}`} />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={`h-9 w-28 ${block}`} />
          ))}
        </div>
      </section>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, lane) => (
          <section key={lane} className={card}>
            <div className={`h-4 w-24 ${block}`} />
            <div className="mt-4">
              <Rows count={4} height="h-24" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Team performance: kartu selesai per developer → tab → tabel */
export function KaldevTeamPerformanceSkeleton() {
  return (
    <div className="space-y-3.5">
      <section className={card}>
        <HeaderBlock />
        <div className="mt-4">
          <HorizontalRanking count={12} />
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={`h-9 w-36 ${block}`} />
        ))}
      </div>
      <TableSkeleton rows={12} controls={1} />
    </div>
  );
}
