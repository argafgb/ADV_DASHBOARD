"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { fmt } from "@/lib/utils";
import { PersonDetailData, MatrixRole } from "../types/overviewTypes";

interface PersonDetailModalProps {
  person: PersonDetailData | null;
  isOpen: boolean;
  onClose: () => void;
  onViewRecords?: (name: string) => void;
}

const ROLE_BADGE_CLASS: Record<MatrixRole, string> = {
  Developer:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  "PIC Project":
    "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  Bizdev:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
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

export default function PersonDetailModal({
  person,
  isOpen,
  onClose,
  onViewRecords,
}: PersonDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !person || !mounted || typeof document === "undefined") return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const badgeClass =
    ROLE_BADGE_CLASS[person.role] || ROLE_BADGE_CLASS.Developer;

  const tiles = [
    {
      label: "Total temuan",
      value: fmt(person.findings),
      note: "pada periode terpilih",
    },
    {
      label: "Penalty Score",
      value: fmt(person.penalty),
      note: "akumulasi bobot severity",
    },
    {
      label: "Avg. handling",
      value: person.avgDays === null ? "-" : fmt(person.avgDays),
      note:
        person.avgDays === null ? "tanggal belum lengkap" : "hari per temuan",
    },
  ];

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 font-sans backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold font-display ${badgeClass}`}
          >
            {initialsOf(person.name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-bold text-zinc-900 dark:text-zinc-50">
              {person.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${badgeClass}`}
              >
                {person.role}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {fmt(person.findings)} temuan · {fmt(person.projectCount)}{" "}
                project
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tiles */}
        <div className="grid grid-cols-1 gap-3 px-6 pt-4 sm:grid-cols-3">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-800/40"
            >
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {t.label}
              </div>
              <div className="text-[21px] font-extrabold leading-none text-zinc-900 dark:text-zinc-50 font-display">
                {t.value}
              </div>
              <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                {t.note}
              </div>
            </div>
          ))}
        </div>

        {/* Severity mix + Top projects */}
        <div className="grid grid-cols-1 gap-6 px-6 py-5 sm:grid-cols-2">
          <div>
            <SectionLabel>Severity mix</SectionLabel>
            <div className="mt-2.5 flex flex-col gap-2">
              {person.sevMix.map((s) => (
                <div
                  key={s.label}
                  className="grid grid-cols-[4.25rem_1fr_2rem] items-center gap-2.5"
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
          </div>

          <div>
            <SectionLabel>Project terbanyak</SectionLabel>
            <div className="mt-2.5 flex flex-col gap-1.5">
              {person.topProjects.length > 0 ? (
                person.topProjects.map((p) => (
                  <div key={p.name} className="flex items-center gap-2.5">
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-zinc-700 dark:text-zinc-300">
                      {p.name}
                    </span>
                    <span className="shrink-0 text-[11px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                      {fmt(p.count)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs italic text-zinc-400 dark:text-zinc-500">
                  Tidak ada project tercatat
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-start gap-3 border-t border-zinc-100 px-6 py-4 sm:flex-row sm:items-center dark:border-zinc-800">
          <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
            {fmt(person.doneCount)} dari {fmt(person.findings)} temuan sudah
            selesai
          </span>
          <span className="flex items-center gap-2 sm:ml-auto">
            <button
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Tutup
            </button>
            <button
              onClick={() => onViewRecords?.(person.name)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
            >
              Lihat recordnya
            </button>
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
