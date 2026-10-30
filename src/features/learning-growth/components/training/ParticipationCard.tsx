"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AnimatedBar, AnimatedValue } from "../ui/animated-value";
import { Card } from "../Card";
import type { TrainingModel } from "../../utils/build-training";
import { useTooltip } from "../../context/tooltip-provider";

/**
 * "Partisipasi Peserta" - per-person attendance counts straight from the
 * peserta column. Shows every participant in a desktop-height card while the
 * list scrolls internally, keeping the right column aligned with the chart.
 */
export function ParticipationCard({
  participation,
}: {
  participation: TrainingModel["participation"];
}) {
  const { bind } = useTooltip();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().normalize("NFKC").toLocaleUpperCase("id-ID");
  const filteredPeople = useMemo(
    () =>
      normalizedQuery
        ? participation.people.filter((person) =>
            person.name.normalize("NFKC").toLocaleUpperCase("id-ID").includes(normalizedQuery),
          )
        : participation.people,
    [normalizedQuery, participation.people],
  );

  return (
    <Card
      title="Participant Engagement"
      subtitle="Keikutsertaan per orang"
      className="flex min-h-0 flex-col xl:h-[420px] xl:flex-none"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-[10px] pt-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] text-zinc-500 dark:text-zinc-400">Total peserta</span>
          <span className="text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50">
            <AnimatedValue value={participation.total} />
          </span>
        </div>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari peserta..."
            aria-label="Cari peserta"
            className="h-9 w-full rounded-[9px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 pr-9 pl-9 text-[11.5px] font-semibold text-zinc-800 dark:text-zinc-200 outline-none transition placeholder:font-normal placeholder:text-zinc-400 focus:border-blue-300 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-blue-500/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Hapus pencarian peserta"
              className="absolute top-1/2 right-2.5 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:outline-none cursor-pointer"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          )}
        </div>
        <div className="dh-scroll mt-1 flex min-h-[180px] max-h-[320px] flex-col gap-[6px] overflow-y-auto overscroll-contain border-t border-zinc-200 dark:border-zinc-800 pt-[10px] pr-1 sm:max-h-[360px] xl:min-h-0 xl:max-h-none xl:flex-1">
          {filteredPeople.length > 0 ? (
            filteredPeople.map((person) => (
              <div key={person.name} className="flex items-center gap-[8px]">
                <span className="w-[112px] flex-shrink-0 break-words text-[11.5px] font-semibold text-zinc-700 dark:text-zinc-300">
                  {person.name}
                </span>
                <div
                  className="h-[7px] flex-1 overflow-hidden rounded-full bg-[#EEF1F6] dark:bg-zinc-800"
                  {...bind(`${person.name} · ${person.count} sesi`, person.sessions)}
                >
                  <AnimatedBar value={person.count} width={person.width} color="#EA580C" />
                </div>
                <span className="w-3 text-right text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50">
                  <AnimatedValue value={person.count} />
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-[11px] text-zinc-400">
              Peserta dengan nama “{query.trim()}” tidak ditemukan.
            </div>
          )}
        </div>
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
          {normalizedQuery
            ? `${filteredPeople.length} hasil ditemukan`
            : "gulir untuk melihat semua · arahkan kursor pada bar untuk daftar sesi"}
        </div>
      </div>
    </Card>
  );
}
