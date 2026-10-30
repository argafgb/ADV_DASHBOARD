"use client";

import { Sparkles } from "lucide-react";

import { useProjectData } from "../context/ProjectDataContext";

/** Compact badge showing how many records are loaded (Overview header only). */
export function DataToolbar() {
  const { isCustomLoaded, rawProjects } = useProjectData();

  if (!isCustomLoaded) {
    return (
      <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
        Menampilkan data utama
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 whitespace-nowrap select-none">
      <Sparkles size={12} className="text-emerald-600 shrink-0" />
      <span>
        <strong className="font-extrabold">{rawProjects.length}</strong> record
        dimuat
      </span>
    </span>
  );
}
