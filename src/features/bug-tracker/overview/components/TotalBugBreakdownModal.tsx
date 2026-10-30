"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { fmt } from "@/lib/utils";
import { BugBreakdownData, SimpleStatus } from "../types/overviewTypes";

interface TotalBugBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: BugBreakdownData;
  onContributorClick?: (name: string) => void;
  onOpenIssuesData?: () => void;
}

const STAGE_CARD_COLORS = ["#2563EB", "#f59e0b"];

const STATUS_PILL_CLASS: Record<SimpleStatus, string> = {
  Done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  "On Progress":
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  Open: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

const STATUS_BAR_COLORS: Record<SimpleStatus, string> = {
  Done: "#10b981",
  "On Progress": "#f59e0b",
  Open: "#6b7280",
};

const SEV_CHIP_CLASS: Record<string, string> = {
  Critical: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
  Major: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  Minor: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
};

function initialsOf(name: string): string {
  return (
    String(name || "")
      .split(/[\s/]+/)
      .filter(Boolean)
      .map((x) => x[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "-"
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
      {children}
    </h4>
  );
}

export default function TotalBugBreakdownModal({
  isOpen,
  onClose,
  data,
  onContributorClick,
  onOpenIssuesData,
}: TotalBugBreakdownModalProps) {
  if (!isOpen || !data) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 font-sans animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Header */}
        <div className="flex items-start gap-3.5 border-b border-zinc-100 px-6 pb-4 pt-5 dark:border-zinc-800">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertTriangle size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50">
              Bug breakdown
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
              Rincian {fmt(data.totalBugs)} temuan bug
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tahap penemuan */}
        <div className="px-6 pt-4">
          <SectionLabel>Tahap penemuan</SectionLabel>
          <div className="mt-2.5 grid grid-cols-2 gap-3">
            {data.stageCards.map((k, idx) => (
              <div
                key={k.label}
                className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-800/40"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        STAGE_CARD_COLORS[idx % STAGE_CARD_COLORS.length],
                    }}
                  />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {k.label}
                  </span>
                  <span className="ml-auto text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50 font-display">
                    {fmt(k.count)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${k.pct}%`,
                      backgroundColor:
                        STAGE_CARD_COLORS[idx % STAGE_CARD_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two columns: severity/status + contributors */}
        <div className="grid grid-cols-1 gap-6 px-6 py-4 sm:grid-cols-2">
          <div>
            <SectionLabel>Tingkat prioritas</SectionLabel>
            <div className="mt-2.5 flex flex-col gap-2">
              {data.severityRows.map((s) => (
                <div
                  key={s.label}
                  className="grid grid-cols-[4.5rem_1fr_2.25rem] items-center gap-2.5"
                >
                  <span className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
                    {s.label}
                  </span>
                  <span className="block h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <span
                      className="block h-full rounded-full transition-all"
                      style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                    />
                  </span>
                  <span className="text-right text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                    {fmt(s.count)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <SectionLabel>Status penanganan</SectionLabel>
            </div>
            <div className="mt-2.5 flex flex-col gap-2">
              {data.statusRows.map((s) => (
                <div
                  key={s.label}
                  className="grid grid-cols-[6rem_1fr_2.25rem] items-center gap-2.5"
                >
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-center text-[10.5px] font-bold ${STATUS_PILL_CLASS[s.label]}`}
                  >
                    {s.label}
                  </span>
                  <span className="block h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <span
                      className="block h-full rounded-full transition-all"
                      style={{
                        width: `${s.pct}%`,
                        backgroundColor: STATUS_BAR_COLORS[s.label],
                      }}
                    />
                  </span>
                  <span className="text-right text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                    {fmt(s.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Kontributor terbesar</SectionLabel>
            <div className="mt-2.5 flex flex-col gap-2">
              {data.topContributors.length > 0 ? (
                data.topContributors.map((dev) => (
                  <button
                    key={dev.name}
                    onClick={() => onContributorClick?.(dev.name)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2 text-left transition hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:border-blue-900"
                  >
                    <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-display">
                      {initialsOf(dev.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-zinc-800 dark:text-zinc-100">
                        {dev.name}
                      </span>
                      <span className="block text-[10.5px] text-zinc-400 dark:text-zinc-500">
                        {fmt(dev.bugCount)} bug · {fmt(dev.criticalCount)}{" "}
                        critical
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1">
                      {dev.chips.map((c) => (
                        <span
                          key={c.label}
                          className={`min-w-6.5 rounded-md px-1.5 py-0.5 text-center text-[10.5px] font-bold ${
                            SEV_CHIP_CLASS[c.label] || SEV_CHIP_CLASS.Minor
                          }`}
                        >
                          {fmt(c.count)}
                        </span>
                      ))}
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-xs italic text-zinc-400 dark:text-zinc-500">
                  Tidak ada kontributor pada filter aktif
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-start gap-3 border-t border-zinc-100 px-6 py-4 sm:flex-row sm:items-center dark:border-zinc-800">
          <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
            {data.totalBugs > 0
              ? `Persentase dihitung dari ${fmt(data.totalBugs)} bug pada filter aktif`
              : "Tidak ada bug pada filter aktif"}
          </span>
          <span className="flex items-center gap-2 sm:ml-auto">
            <button
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Tutup
            </button>
            <button
              onClick={onOpenIssuesData}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
            >
              Buka Issues data
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
