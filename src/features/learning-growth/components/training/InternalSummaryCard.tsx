"use client";

import { AnimatedBar, AnimatedValue } from "../ui/animated-value";
import { Card } from "../Card";
import type { TrainingModel } from "../../utils/build-training";
import { useTooltip } from "../../context/tooltip-provider";

/** "Ringkasan Internal" - totals plus per-narasumber breakdown of sharing sessions. */
export function InternalSummaryCard({ internal }: { internal: TrainingModel["internal"] }) {
  const { bind } = useTooltip();
  return (
    <Card title="Internal Summary" subtitle="Sesi sharing oleh tim">
      <div className="flex flex-col gap-[10px] pt-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] text-zinc-500 dark:text-zinc-400">Total sesi</span>
          <span className="text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50">
            <AnimatedValue value={internal.count} />
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] text-zinc-500 dark:text-zinc-400">Total Narasumber</span>
          <span className="text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50">
            <AnimatedValue value={internal.narasumber} />
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-[10px]">
          <span className="flex-shrink-0 text-[12px] text-zinc-500 dark:text-zinc-400">Kategori terbanyak</span>
          <span className="text-right text-[12px] font-bold text-zinc-700 dark:text-zinc-300">{internal.topCategory}</span>
        </div>
        <div className="mt-1 flex flex-col gap-[6px] border-t border-zinc-200 dark:border-zinc-800 pt-[10px]">
          {internal.people.map((person) => (
            <div key={person.name} className="flex items-center gap-[8px]">
              <span className="w-[112px] flex-shrink-0 break-words text-[11.5px] font-semibold text-zinc-700 dark:text-zinc-300">
                {person.name}
              </span>
              <div
                className="h-[7px] flex-1 overflow-hidden rounded-full bg-[#EEF1F6] dark:bg-zinc-800"
                {...bind(
                  `${person.name} · ${person.count} sesi`,
                  person.sessions.length ? person.sessions : ["Belum ada sesi"],
                )}
              >
                <AnimatedBar value={person.count} width={person.width} color="#2563EB" />
              </div>
              <span className="w-3 text-right text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50">
                <AnimatedValue value={person.count} />
              </span>
            </div>
          ))}
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {internal.more > 0 && `dan ${internal.more} narasumber lainnya · `}
            Narasumber dengan &gt;1 sesi menjelaskan selisih total sesi vs total narasumber ·
            arahkan kursor pada bar untuk daftar sesi
          </div>
        </div>
      </div>
    </Card>
  );
}
