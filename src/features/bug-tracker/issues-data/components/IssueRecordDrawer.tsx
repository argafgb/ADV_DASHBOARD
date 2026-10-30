"use client";

import React from "react";
import { X, Clock, ExternalLink, Image as ImageIcon } from "lucide-react";
import { IssueItem } from "../types/issuesData";
import {
  buildIssueDetail,
  formatShortDate,
  initialsOf,
  fmtId,
} from "../utils/issuesDataUtils";
import {
  SEV_PILL_CLASS,
  STATUS_PILL_CLASS,
  ROLE_PILL_CLASS,
  TYPE_PILL_CLASS,
  DAY_TONE_CLASS,
} from "./pillStyles";

interface IssueRecordDrawerProps {
  item: IssueItem | null;
  allItems: IssueItem[];
  onClose: () => void;
}

function SectionLabelEl({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
      {children}
    </div>
  );
}

const ALIGN_CLASS = {
  start: "items-start text-left",
  center: "items-center text-center",
  end: "items-end text-right",
} as const;

export default function IssueRecordDrawer({
  item,
  allItems,
  onClose,
}: IssueRecordDrawerProps) {
  if (!item) return null;

  const d = buildIssueDetail(item, allItems);
  const flagOk = d.flag === "Lengkap";
  const fsdLabel =
    item.fsd === "Ya"
      ? "Ya"
      : item.fsd === "Tidak"
        ? "Tidak"
        : "Belum ditandai";
  const fsdCls =
    item.fsd === "Ya"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400"
      : item.fsd === "Tidak"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400"
        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 rounded-t-2xl border-b border-zinc-100 bg-zinc-50 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div className="min-w-0">
            <div className="truncate text-[17px] font-bold text-zinc-900 dark:text-zinc-50">
              {item.name || item.project}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 tabular-nums">
                {d.noLabel}
              </span>
              {item.name && (
                <span className="max-w-60 truncate rounded-full bg-zinc-200/70 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {item.project}
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TYPE_PILL_CLASS[item.type]}`}
              >
                {item.type === "Bug"
                  ? "Bug"
                  : item.type === "CR"
                    ? "Change request"
                    : "Belum diklasifikasi"}
              </span>
              <span className="rounded-full bg-zinc-200/70 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {item.stage}
              </span>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {item.screenshotUrl && (
              <a
                href={item.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7.5 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <ImageIcon className="h-3.25 w-3.25" />
                Lampiran
              </a>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7.5 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <ExternalLink className="h-3.25 w-3.25" />
                Buka di Notion
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200/70 dark:text-zinc-500 dark:hover:bg-zinc-700"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-3 px-6 py-4.5 md:grid-cols-4">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Severity
            </div>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${SEV_PILL_CLASS[item.sev]}`}
            >
              {item.sev === "Unclassified" ? "Belum diklasifikasi" : item.sev}
            </span>
            <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              bobot {fmtId(item.weight)} poin
            </div>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Handling time
            </div>
            <div
              className={`text-[22px] font-extrabold leading-none font-display ${DAY_TONE_CLASS[d.daysTone]}`}
            >
              {d.daysBig}
            </div>
            <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              {d.daysNote}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Status
            </div>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_PILL_CLASS[item.status]}`}
            >
              {item.status}
            </span>
            <div className="mt-1.5 truncate text-[10px] text-zinc-400 dark:text-zinc-500">
              PIC: {item.statusPic}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Data quality
            </div>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                flagOk
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400"
              }`}
            >
              {d.flag}
            </span>
            <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              {d.flagNote}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-6 pb-5.5 pt-1 md:grid-cols-[1.45fr_1fr]">
          {/* Left column */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Lifecycle */}
            <div>
              <SectionLabelEl>Lifecycle</SectionLabelEl>
              <div className="relative pt-1.5">
                <div className="absolute left-0 right-0 top-2.75 h-0.5 bg-zinc-200 dark:bg-zinc-700" />
                <div
                  className="absolute left-0 top-2.75 h-0.5 bg-blue-600"
                  style={{ width: d.progress }}
                />
                <div className="relative grid grid-cols-4">
                  {d.stages.map((st) => (
                    <div
                      key={st.name}
                      className={`flex flex-col ${ALIGN_CLASS[st.align]}`}
                    >
                      <span
                        className={`box-border h-3 w-3 rounded-full border-2 shadow-[0_0_0_2px_white] dark:shadow-[0_0_0_2px_rgb(24_24_27)] ${
                          st.filled
                            ? "border-blue-600 bg-blue-600"
                            : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                        }`}
                      />
                      <span className="mt-2 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                        {st.name}
                      </span>
                      <span
                        className={`mt-0.5 text-xs font-bold ${
                          st.filled
                            ? "text-zinc-700 dark:text-zinc-300"
                            : "text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {st.date}
                      </span>
                      <span className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                        {st.gap}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                  {d.duration}
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <SectionLabelEl>Temuan / remarks</SectionLabelEl>
              <div className="min-h-19 rounded-lg border border-zinc-100 bg-zinc-50/60 px-4 py-3.5 text-[13px] leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300">
                {item.remarks}
              </div>
            </div>

            {/* Dev response */}
            <div>
              <SectionLabelEl>Response developer</SectionLabelEl>
              <div className="text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                {item.resp || "Belum ada catatan dari developer."}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-100 pt-2.5 text-[11.5px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.25 w-3.25" />
                  Diinput{" "}
                  {item.timeInput ? formatShortDate(item.timeInput) : "-"}
                </span>
                {item.timeEdit && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.25 w-3.25" />
                    Terakhir diubah {formatShortDate(item.timeEdit)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* People */}
            <div>
              <SectionLabelEl>People</SectionLabelEl>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center gap-2.75">
                  <span
                    className={`inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full text-xs font-bold font-display ${ROLE_PILL_CLASS.Developer}`}
                  >
                    {initialsOf(item.dev)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-zinc-900 dark:text-zinc-50">
                      {item.dev}
                    </span>
                    <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">
                      {fmtId(d.devLoad)} temuan pada periode ini
                    </span>
                  </span>
                  <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Developer
                  </span>
                </div>
                <div className="my-3 h-px bg-zinc-100 dark:bg-zinc-800" />
                <div className="flex items-center gap-2.75">
                  <span
                    className={`inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full text-xs font-bold font-display ${
                      ROLE_PILL_CLASS[item.section] ||
                      ROLE_PILL_CLASS["PIC Project"]
                    }`}
                  >
                    {initialsOf(item.pic)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-zinc-900 dark:text-zinc-50">
                      {item.pic}
                    </span>
                    <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">
                      {fmtId(d.picLoad)} temuan pada periode ini
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[9.5px] font-bold uppercase tracking-wider ${
                      item.section === "Bizdev"
                        ? "text-amber-600 dark:text-amber-400"
                        : item.section === "PIC Project"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {item.section}
                  </span>
                </div>
              </div>
            </div>

            {/* Classification */}
            <div>
              <SectionLabelEl>Classification</SectionLabelEl>
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-3.5 gap-y-2.25">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Tahap pengujian
                </span>
                <span className="text-right">
                  <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {item.stage}
                  </span>
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Penemu
                </span>
                <span className="text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      ROLE_PILL_CLASS[item.section] ||
                      ROLE_PILL_CLASS["PIC Project"]
                    }`}
                  >
                    {item.section}
                  </span>
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Included in FSD
                </span>
                <span className="text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${fsdCls}`}
                  >
                    {fsdLabel}
                  </span>
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Status PIC
                </span>
                <span className="text-right">
                  <span className="inline-block max-w-full truncate rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {item.statusPic}
                  </span>
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Periode
                </span>
                <span className="text-right text-xs text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {d.periodLabel}
                  {item.quarter ? ` · Q${item.quarter}` : ""}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  SIT realized
                </span>
                <span className="text-right text-xs text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {item.sitRealized ? formatShortDate(item.sitRealized) : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
            Data bersumber dari pencatatan KPI bug · hanya dapat dibaca
          </span>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
