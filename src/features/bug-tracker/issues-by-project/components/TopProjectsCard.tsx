"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import SourceHint from "@/components/ui/SourceHint";
import { fmtId } from "@/features/bug-tracker/issues-data/utils/issuesDataUtils";
import { TopProject } from "../types/issuesByProject";

interface TopProjectsCardProps {
  projects: TopProject[];
  onPick: (name: string) => void;
}

export default function TopProjectsCard({
  projects,
  onPick,
}: TopProjectsCardProps) {
  return (
    <Card className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white px-4.5 py-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 font-sans select-none">
      <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
        Top contributing projects
        <SourceHint
          fields={[
            {
              label: "Nama project",
              field: "Project",
              rule: "Nilai properti Project pada tiap record, dikelompokkan apa adanya (tanpa penggabungan nama mirip).",
            },
            {
              label: "Angka di kanan",
              field: "Project",
              rule: "Jumlah record setelah filter aktif diterapkan; panjang batang relatif terhadap project teratas, bukan terhadap total temuan.",
            },
          ]}
          notes={[
            "Hanya 10 project teratas yang ditampilkan; sisanya ada di tabel di bawah.",
            "Klik satu baris untuk memfilter tabel ke project tersebut.",
          ]}
        />
      </h3>
      <p className="mb-2.5 mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
        Sepuluh project dengan temuan terbanyak
      </p>
      <div className="flex max-h-44.5 min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-0.5">
        {projects.map((p) => (
          <div
            key={p.name}
            onClick={() => onPick(p.name)}
            className="grid shrink-0 cursor-pointer grid-cols-[1fr_4.375rem_2.125rem] items-center gap-x-2.5 rounded-[5px] px-0.75 py-0.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
          >
            <span className="truncate whitespace-nowrap text-[11.5px] text-zinc-700 dark:text-zinc-300">
              {p.name}
            </span>
            <span className="block h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <span
                className="block h-full rounded-full bg-blue-600"
                style={{ width: `${p.pct}%` }}
              />
            </span>
            <span className="text-right text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
              {fmtId(p.n)}
            </span>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Tidak ada data pada periode ini.
          </div>
        )}
      </div>
    </Card>
  );
}
