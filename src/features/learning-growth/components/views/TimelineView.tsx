"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { TimelineComparison } from "../charts/timeline-swimlane";
import { categoryVisual } from "../../utils/dashboard-config";
import { buildTimeline } from "../../utils/build-timeline";
import { useLearningGrowth } from "../../context/LearningGrowthFilterContext";
import type { CategoryId, EventType } from "../../types/dashboard.types";

type TypeFilter = "all" | EventType;
type CategoryFilter = "all" | CategoryId;

export function TimelineView() {
  const { year, month, data } = useLearningGrowth();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const model = useMemo(() => buildTimeline(data, year, month), [year, month, data]);
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  const filteredYears = model.years.map((timeline) => ({
    ...timeline,
    items: timeline.items.filter(
      (item) =>
        (type === "all" || item.type === type) &&
        (category === "all" || item.category === category) &&
        (!normalizedQuery ||
          `${item.title} ${item.person} ${item.vendor ?? ""}`
            .toLocaleLowerCase("id-ID")
            .includes(normalizedQuery)),
    ),
  }));
  const visibleCount = filteredYears.reduce((sum, timeline) => sum + timeline.items.length, 0);
  const hasFilters = query !== "" || type !== "all" || category !== "all";
  const resetFilters = () => {
    setQuery("");
    setType("all");
    setCategory("all");
  };

  return (
    <div className="flex min-w-0 flex-col gap-[14px] pb-2">
      <section className="dh-fade-up-fast overflow-hidden rounded-[16px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-900 bg-white/80 dark:bg-zinc-800/80 px-3 py-1 text-[10px] font-bold tracking-[0.06em] text-blue-600 dark:text-blue-400 uppercase">
              Planning Workspace
            </div>
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
              Program Schedule
            </h2>
            <p className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
              Pantau waktu pelaksanaan, PIC, dan sebaran agenda dalam satu tampilan.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
            {[
              ["Total agenda", model.total, "text-blue-600 dark:text-blue-400"],
              ["Internal", model.internal, "text-emerald-600 dark:text-emerald-400"],
              ["External", model.external, "text-amber-600 dark:text-amber-400"],
              ["Sertifikasi", model.certifications, "text-rose-600 dark:text-rose-400"],
            ].map(([label, value, color]) => (
              <div
                key={String(label)}
                className="min-w-0 rounded-[11px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 transition-colors duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 sm:min-w-[92px]"
              >
                <div className="text-[10.5px] font-semibold text-zinc-400 dark:text-zinc-500">{label}</div>
                <div className={`mt-0.5 text-[18px] font-extrabold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dh-fade-up dh-delay-05 dh-card-3d rounded-[14px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative w-full min-w-0 flex-1 sm:min-w-[230px]">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari program, PIC, atau vendor..."
              className="h-10 w-full rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 pr-3 pl-9 text-[11.5px] text-zinc-700 dark:text-zinc-300 outline-none transition focus:border-blue-300 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-blue-500/10"
            />
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TypeFilter)}
            className="h-10 min-w-0 flex-1 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 outline-none focus:border-blue-300 sm:flex-none cursor-pointer"
            aria-label="Filter jenis program"
          >
            <option value="all">Semua jenis</option>
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="sertifikasi">Sertifikasi</option>
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as CategoryFilter)}
            className="h-10 min-w-0 flex-1 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 outline-none focus:border-blue-300 sm:max-w-[210px] cursor-pointer"
            aria-label="Filter topik"
          >
            <option value="all">Semua topik</option>
            {model.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-10 rounded-[10px] px-3 text-[11px] font-bold text-blue-600 dark:text-blue-400 transition hover:bg-blue-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Reset
            </button>
          )}
          <span className="w-full rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 sm:ml-auto sm:w-auto">
            {visibleCount} ditampilkan
          </span>
        </div>
      </section>

      <div className="dh-fade-up dh-delay-10 flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
        <span className="text-[10px] font-bold tracking-[0.06em] text-zinc-400 dark:text-zinc-500 uppercase">
          Topik
        </span>
        {model.categories.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: categoryVisual(item.label).dot }}
            />
            {item.label}
          </span>
        ))}
        <span className="w-full text-[10px] text-zinc-400 dark:text-zinc-500 sm:ml-auto sm:w-auto sm:text-right">
          Arahkan kursor ke agenda untuk detail
        </span>
      </div>

      <div className="dh-fade-up dh-delay-14 min-w-0 pb-2">
        <div className="flex min-w-0 flex-col gap-4">
          {visibleCount > 0 ? (
            <TimelineComparison timelines={filteredYears} />
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[14px] border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-center p-6">
              <div className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">Agenda tidak ditemukan</div>
              <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                Ubah kata pencarian atau reset filter aktif.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-[9px] bg-blue-600 px-4 py-2 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
              >
                Reset filter
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="px-1 text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
        Agenda memakai tanggal pelaksanaan tunggal dari data sumber. Tambahkan tanggal selesai untuk
        menampilkan durasi program sebagai rentang Gantt.
      </p>
    </div>
  );
}

export default TimelineView;
