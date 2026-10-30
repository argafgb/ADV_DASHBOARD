"use client";

import { MONTHS_LONG } from "../../utils/dashboard-config";
import type { TimelineItem, TimelineYear } from "../../utils/build-timeline";
import { useTooltip } from "../../context/tooltip-provider";

const TYPE_COLORS: Record<TimelineItem["type"], { fg: string; bg: string }> = {
  internal: { fg: "#1D4ED8", bg: "#EFF6FF" },
  external: { fg: "#EA580C", bg: "#FFF7ED" },
  sertifikasi: { fg: "#059669", bg: "#ECFDF5" },
};

function AgendaCard({ item }: { item: TimelineItem }) {
  const { bind } = useTooltip();
  const colors = TYPE_COLORS[item.type];
  const details = [
    item.dateLabel,
    `${item.personLabel}: ${item.person}`,
    item.categoryLabel,
    ...(item.vendor ? [`Vendor: ${item.vendor}`] : []),
  ];

  return (
    <button
      type="button"
      {...bind(item.title, details)}
      className="min-w-[150px] max-w-[236px] flex-[1_1_190px] cursor-default rounded-[10px] border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-left transition-colors duration-150 hover:border-zinc-300 dark:hover:border-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      style={{ borderLeft: `3.5px solid ${colors.fg}`, background: colors.bg }}
      aria-label={`${item.title}, ${item.dateLabel}`}
    >
      <div
        className="text-[10px] font-bold tracking-[0.04em] uppercase"
        style={{ color: colors.fg }}
      >
        {item.dateLabel}
      </div>
      <div className="mt-[2px] truncate text-[12px] font-bold text-zinc-900 dark:text-zinc-900">{item.title}</div>
      <div className="mt-[2px] truncate text-[10.5px] text-zinc-600 dark:text-zinc-600">
        {item.typeLabel} · {item.person}
      </div>
    </button>
  );
}

function Lane({ items, reverse }: { items: TimelineItem[]; reverse?: boolean }) {
  return (
    <div
      className={`flex min-h-[86px] flex-wrap content-center items-center gap-2.5 px-4 py-2 ${
        reverse ? "flex-row-reverse" : ""
      }`}
    >
      {items.map((item) => (
        <AgendaCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function YearHeader({ timeline, alignRight }: { timeline: TimelineYear; alignRight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-4 ${alignRight ? "justify-end" : ""}`}>
      <span className="text-[26px] font-extrabold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
        {timeline.year}
      </span>
      <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
        {timeline.items.length} agenda
      </span>
    </div>
  );
}

/**
 * Side-by-side comparison with a central month spine: the older year grows left,
 * the selected year right. Collapses to a single column when the selected year
 * has no predecessor in the data, so no empty "0 agenda" lane is ever drawn.
 */
export function TimelineComparison({ timelines }: { timelines: TimelineYear[] }) {
  const left = timelines.length > 1 ? timelines[0] : undefined;
  const right = timelines.length > 1 ? timelines[1]! : timelines[0];
  const monthItems = (timeline: TimelineYear | undefined, month: number) =>
    timeline?.items.filter((item) => Number(item.date.slice(5, 7)) - 1 === month) ?? [];
  const gridClass = left
    ? "grid grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)]"
    : "grid grid-cols-[96px_minmax(0,1fr)]";

  if (!right) return null;

  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar">
      <section className="dh-card-3d min-w-[760px] overflow-hidden rounded-[14px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className={`${gridClass} border-b border-zinc-200 dark:border-zinc-800 bg-blue-50/50 dark:bg-zinc-800/40`}>
          {left && <YearHeader timeline={left} alignRight />}
          <div className="flex items-center justify-center text-[9.5px] font-bold tracking-[0.08em] text-zinc-400 dark:text-zinc-500 uppercase">
            Bulan
          </div>
          <YearHeader timeline={right} />
        </div>

        <div className="relative">
          <div
            className={`pointer-events-none absolute inset-y-0 z-0 w-px bg-blue-200 dark:bg-blue-900 ${
              left ? "left-1/2 -translate-x-1/2" : "left-[48px]"
            }`}
          />
          {MONTHS_LONG.map((monthName, index) => {
            const leftItems = monthItems(left, index);
            const rightItems = monthItems(right, index);
            const active = leftItems.length + rightItems.length > 0;
            return (
              <div
                key={monthName}
                className={`${gridClass} transition-colors hover:bg-blue-50/30 dark:hover:bg-zinc-800/50 ${
                  index % 2 === 0 ? "bg-zinc-50/50 dark:bg-zinc-900/50" : "bg-white dark:bg-zinc-900"
                }`}
              >
                {left && <Lane items={leftItems} reverse />}
                <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                  <span
                    className={`flex h-[38px] w-[38px] items-center justify-center rounded-full text-[10px] font-bold ${
                      active
                        ? "border border-blue-600 bg-blue-600 text-white"
                        : "bg-[#EEF1F6] dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700"
                    }`}
                    title={monthName}
                  >
                    {monthName.slice(0, 3)}
                  </span>
                  {active && (
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-[2px] text-[10px] font-bold whitespace-nowrap text-blue-600 dark:text-blue-400">
                      {left ? `${leftItems.length} · ${rightItems.length}` : rightItems.length}
                    </span>
                  )}
                </div>
                <Lane items={rightItems} />
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-zinc-200 dark:border-zinc-800 bg-blue-50/50 dark:bg-zinc-800/40 px-5 py-2">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-400">
            <span className="h-[10px] w-[10px] rounded-full border border-blue-600 bg-blue-600" />
            Ada agenda
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-400">
            <span
              aria-hidden
              className="h-[10px] w-[10px] rounded-full bg-[#EEF1F6] dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600"
            />
            Tidak ada agenda
          </span>
        </div>
      </section>
    </div>
  );
}
