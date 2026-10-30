"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";

import { IconArrowRight, IconChevronRight, IconClose } from "../shared/icons";
import type { SlaSummary } from "../../types/kaldev.types";

/**
 * `SlaCard` design system: persentase pencapaian, target, batang progres,
 * verdict, dan dua statistik (Achieved / Not achieved). Klik "Not achieved"
 * membuka daftar proyek yang melewati target via body portal modal.
 */
export function SlaCard({ sla, registerHref }: { sla: SlaSummary; registerHref: string }) {
  const [open, setOpen] = useState(false);
  const tone = sla.achieved ? "green" : "red";

  return (
    <section className="dd-sla" style={{ position: "relative" }}>
      <div className="dd-sla__top">
        <span className="dd-sla__label">Pencapaian SLA</span>
        <span className="dd-sla__period">{sla.periodLabel}</span>
      </div>
      <div className="dd-sla__value">{sla.pctLabel}</div>
      <div className="dd-sla__target">
        Target SLA: <span>{sla.target}%</span>
      </div>
      <div className="dd-sla__track">
        <div
          className={`dd-sla__fill dd-sla__fill--${tone}`}
          style={{ width: `${Math.max(0, Math.min(100, sla.pct))}%`, minWidth: 4 }}
        />
      </div>
      <span className={`dd-sla__verdict dd-sla__verdict--${tone}`}>
        {sla.achieved ? "Achieved" : "Not achieved"}
      </span>
      <div className="dd-sla__foot">
        <div className="dd-sla__stat">
          <span className="dd-sla__statlabel">Achieved</span>
          <span className="dd-sla__statval dd-sla__statval--green">{sla.achievedCount}</span>
        </div>
        <div className="dd-sla__statwrap">
          <button
            type="button"
            className={`dd-sla__stat dd-sla__stat--btn${open ? " is-open" : ""}`}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="dd-sla__statlabel dd-sla__statlabel--link">Not achieved</span>
            <span className="dd-sla__statval dd-sla__statval--red">
              {sla.notAchievedCount}
              <span className="dd-sla__statarrow">
                <IconChevronRight />
              </span>
            </span>
          </button>
        </div>
      </div>

      {open && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={sla.breachTitle}
          className="kaldev-scope fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 transition-opacity animate-in fade-in-0 duration-150"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">{sla.breachTitle}</span>
              <button
                type="button"
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Tutup"
                onClick={() => setOpen(false)}
              >
                <IconClose />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 p-2">
              {sla.breaches.map((b, i) => (
                <div key={`${b.label}-${i}`} className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate" title={b.label}>
                      {b.label}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{b.detail}</span>
                  </div>
                  <span className="shrink-0 font-semibold text-xs text-red-600 dark:text-red-400 tabular-nums">{b.value}</span>
                </div>
              ))}
              {sla.breaches.length === 0 && (
                <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Tidak ada proyek yang melewati target pada periode ini.
                </div>
              )}
            </div>
            <Link
              href={registerHref}
              className="flex items-center justify-center gap-2 py-3 px-4 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-colors"
              onClick={() => setOpen(false)}
              scroll={false}
            >
              Lihat di Project register
              <span style={{ display: "inline-flex", width: 13, height: 13 }}>
                <IconArrowRight />
              </span>
            </Link>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
