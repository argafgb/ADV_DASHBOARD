"use client";

import { useState } from "react";

export interface SourceField {
  /** Label yang dibaca user, mis. "Ditemukan" */
  label: string;
  /** Nama kolom/properti sumbernya di Notion, mis. "Periode (Year + Month)" */
  field: string;
  /** Cara angka dihitung dari kolom tersebut */
  rule: string;
}

interface SourceHintProps {
  fields: SourceField[];
  /** Catatan tambahan, mis. kualitas data yang perlu diwaspadai */
  notes?: string[];
}

/**
 * Ikon info kecil di header kartu. Isinya menjelaskan setiap angka pada kartu
 * berasal dari properti Notion yang mana dan dihitung dengan aturan apa,
 * supaya angka di dashboard selalu bisa ditelusuri balik ke sumbernya.
 */
export default function SourceHint({ fields, notes }: SourceHintProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Sumber data"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-[9px] font-bold text-zinc-400 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-zinc-600 dark:text-zinc-500"
      >
        i
      </button>

      {open && (
        <span className="absolute left-1/2 top-6 z-50 w-72 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <span className="mb-2 block text-[11px] font-bold text-zinc-900 dark:text-zinc-50">
            Sumber data · Notion
          </span>
          <span className="flex flex-col gap-2">
            {fields.map((f) => (
              <span key={f.label} className="block">
                <span className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                  {f.label}
                </span>
                <span className="block text-[10.5px] text-zinc-500 dark:text-zinc-400">
                  Properti{" "}
                  <span className="rounded bg-zinc-100 px-1 py-px tabular-nums text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {f.field}
                  </span>
                </span>
                <span className="block text-[10.5px] text-zinc-500 dark:text-zinc-400">
                  {f.rule}
                </span>
              </span>
            ))}
          </span>
          {notes && notes.length > 0 && (
            <span className="mt-2 block border-t border-zinc-100 pt-2 dark:border-zinc-800">
              {notes.map((n) => (
                <span
                  key={n}
                  className="block text-[10.5px] text-amber-600 dark:text-amber-400"
                >
                  {n}
                </span>
              ))}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
