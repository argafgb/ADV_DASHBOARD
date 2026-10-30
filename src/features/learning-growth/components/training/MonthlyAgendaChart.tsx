"use client";

import { AnimatedValue } from "../ui/animated-value";
import { MONTHS_LONG } from "../../utils/dashboard-config";
import { useCountUp } from "../../hooks/useCountUp";
import type { MonthGroup } from "../../utils/build-training";
import { useTooltip } from "../../context/tooltip-provider";

const INTERNAL = {
  label: "Internal",
  solid: "#1D4ED8",
  grad: "#2563EB",
};
const EXTERNAL = {
  label: "External",
  solid: "#EA580C",
  grad: "#EA580C",
};

function Bar({
  group,
  max,
  mirror,
  year,
  month,
}: {
  group?: MonthGroup;
  max: number;
  mirror?: boolean;
  year: string;
  month: number;
}) {
  const { bind } = useTooltip();
  const internal = group?.internalCount ?? 0;
  const external = group?.externalCount ?? 0;
  const total = internal + external;
  const displayedTotal = useCountUp(total);
  const animatedScale = total > 0 ? displayedTotal / total : 0;
  if (total === 0) {
    const today = new Date();
    const numericYear = Number(year);
    const isFuture =
      numericYear > today.getFullYear() ||
      (numericYear === today.getFullYear() && month > today.getMonth());
    return (
      <div
        className={`flex h-[20px] items-center ${mirror ? "justify-end" : ""}`}
        {...bind(`${MONTHS_LONG[month]} ${year}`, [
          isFuture ? "Belum ada agenda dijadwalkan" : "Tidak ada agenda pada bulan ini",
        ])}
      >
        <span
          aria-hidden
          className={`h-[14px] w-[14px] rounded-[5px] bg-[#EEF1F6] dark:bg-zinc-800 border border-[#E5E7EB] dark:border-zinc-700 ${isFuture ? "opacity-60" : ""}`}
        />
      </div>
    );
  }
  const width = (count: number) => `${(count / max) * 100}%`;
  const tipLines = (group?.items ?? []).map(
    (item) =>
      `${item.dateChip} · ${item.title} (${item.isExternal ? `External · ${item.vendor}` : "Internal"})`,
  );

  return (
    <div
      className={`flex items-center gap-2 ${mirror ? "flex-row-reverse" : ""}`}
      {...bind(group?.label ?? "", tipLines)}
    >
      <div className={`flex h-[20px] flex-1 items-center ${mirror ? "justify-end" : ""}`}>
        <div
          className={`flex h-full w-full overflow-hidden rounded-[6px] ${mirror ? "flex-row-reverse" : ""}`}
        >
          <div
            className={`flex h-full transition-[width] duration-500 ease-out ${mirror ? "flex-row-reverse justify-start ml-auto" : ""}`}
            style={{ width: width(total * animatedScale), minWidth: displayedTotal > 0 ? 20 : 0 }}
          >
            {internal > 0 && (
              <div
                className="flex h-full items-center justify-center"
                style={{
                  width: `${(internal / total) * 100}%`,
                  minWidth: 16,
                  background: INTERNAL.grad,
                }}
              >
                <span className="text-[10px] font-bold text-white">
                  <AnimatedValue value={internal} />
                </span>
              </div>
            )}
            {external > 0 && (
              <div
                className="flex h-full items-center justify-center"
                style={{
                  width: `${(external / total) * 100}%`,
                  minWidth: 16,
                  background: EXTERNAL.grad,
                }}
              >
                <span className="text-[10px] font-bold text-white">
                  <AnimatedValue value={external} />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <span className="w-[14px] text-center text-[11.5px] font-extrabold text-zinc-900 dark:text-zinc-50">
        {displayedTotal}
      </span>
    </div>
  );
}

/**
 * Butterfly comparison: months in the center spine, 2025 bars grow left,
 * 2026 bars grow right. Counts & composition only - schedule lives on Timeline.
 */
export function MonthlyAgendaChart({ groups }: { groups: MonthGroup[] }) {
  const years = [...new Set(groups.map((group) => group.key.slice(0, 4)))].sort();
  const hasInternal = groups.some((group) => group.internalCount > 0);
  const hasExternal = groups.some((group) => group.externalCount > 0);
  const cell = (year: string, month: number) =>
    groups.find((group) => group.key === `${year}-${month}`);
  const max = Math.max(2, ...groups.map((group) => group.items.length));
  const [left, right] = years.length > 1 ? [years[0]!, years[1]!] : [null, years[0]!];

  const yearTotal = (year: string | null) =>
    year ? groups.filter((g) => g.key.startsWith(year)).reduce((s, g) => s + g.items.length, 0) : 0;

  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar">
      <div className="flex min-w-[560px] flex-col gap-2 sm:min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)] items-center rounded-[10px] bg-blue-50/50 dark:bg-zinc-800/40 px-3 py-2">
          <div className="flex items-center justify-end gap-2">
            {left && (
              <>
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                  <AnimatedValue value={yearTotal(left)} /> agenda
                </span>
                <span className="rounded-[6px] bg-blue-600 px-2 py-[2px] text-[11px] font-extrabold text-white">
                  {left}
                </span>
              </>
            )}
          </div>
          <div className="text-center text-[9.5px] font-bold tracking-[0.08em] text-zinc-400 dark:text-zinc-500 uppercase">
            Bulan
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-[6px] bg-blue-600 px-2 py-[2px] text-[11px] font-extrabold text-white">
              {right}
            </span>
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
              <AnimatedValue value={yearTotal(right)} /> agenda
            </span>
          </div>
        </div>

        {MONTHS_LONG.map((monthName, month) => {
          const leftGroup = left ? cell(left, month) : undefined;
          const rightGroup = right ? cell(right, month) : undefined;
          const empty = (!leftGroup || leftGroup.empty) && (!rightGroup || rightGroup.empty);
          return (
            <div
              key={monthName}
              className={`grid grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)] items-start rounded-[9px] px-3 py-1.5 transition-colors hover:bg-blue-50/30 dark:hover:bg-zinc-800/50 ${
                month % 2 === 0 ? "bg-zinc-50/50 dark:bg-zinc-900/50" : ""
              }`}
            >
              <div className="min-w-0 pt-[2px]">
                {left && <Bar group={leftGroup} max={max} mirror year={left} month={month} />}
              </div>
              <div className="flex justify-center pt-[3px]">
                <span
                  className={`text-[10.5px] font-extrabold tracking-[0.02em] uppercase ${
                    empty ? "text-zinc-400/60 dark:text-zinc-500/60" : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {monthName.slice(0, 3)}
                </span>
              </div>
              <div className="min-w-0 pt-[2px]">
                <Bar group={rightGroup} max={max} year={right!} month={month} />
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-zinc-200 dark:border-zinc-800 pt-2 text-[10.5px] font-bold">
          {hasInternal && (
            <span className="inline-flex items-center gap-1.5" style={{ color: INTERNAL.solid }}>
              <span
                className="h-[8px] w-[8px] rounded-[2px]"
                style={{ background: INTERNAL.solid }}
              />
              Internal
            </span>
          )}
          {hasExternal && (
            <span className="inline-flex items-center gap-1.5" style={{ color: EXTERNAL.solid }}>
              <span
                className="h-[8px] w-[8px] rounded-[2px]"
                style={{ background: EXTERNAL.solid }}
              />
              External
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400">
            <span
              aria-hidden
              className="h-[10px] w-[10px] rounded-[3px] bg-[#EEF1F6] dark:bg-zinc-800 border border-[#E5E7EB] dark:border-zinc-700"
            />
            Tidak ada agenda
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400">
            <span
              aria-hidden
              className="h-[10px] w-[10px] rounded-[3px] bg-[#EEF1F6] dark:bg-zinc-800 border border-[#E5E7EB] dark:border-zinc-700 opacity-60"
            />
            Belum dijadwalkan
          </span>
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
            Angka = jumlah agenda · detail jadwal &amp; PIC di halaman Timeline
          </span>
        </div>
      </div>
    </div>
  );
}
