"use client";

import React from "react";
import { Icon } from "./UI";
import { useHoverTip } from "./chart-tooltip";

export type KpiAccent = "blue" | "indigo" | "emerald" | "rose" | "amber";

const KPI_ACCENTS: Record<
  KpiAccent,
  { chip: string; hover: string; hint: string }
> = {
  blue: {
    chip: "bg-blue-50 text-[#2563EB] border-blue-100",
    hover: "hover:border-blue-200",
    hint: "text-blue-600",
  },
  indigo: {
    chip: "bg-indigo-50 text-[#4F46E5] border-indigo-100",
    hover: "hover:border-indigo-200",
    hint: "text-indigo-600",
  },
  emerald: {
    chip: "bg-emerald-50 text-[#10B981] border-emerald-100",
    hover: "hover:border-emerald-200",
    hint: "text-emerald-600",
  },
  rose: {
    chip: "bg-rose-50 text-[#EF4444] border-rose-100",
    hover: "hover:border-rose-200",
    hint: "text-rose-600",
  },
  amber: {
    chip: "bg-amber-50 text-[#D97706] border-amber-100",
    hover: "hover:border-amber-200",
    hint: "text-amber-600",
  },
};

/**
 * `tone` states what the reading means for the user, not which way the arrow
 * points: "good" is green, "bad" is red, "neutral" is grey. The two are kept
 * apart because a falling number is not always bad news.
 */
export type TrendTone = "good" | "bad" | "neutral";

const TREND_TONES: Record<TrendTone, string> = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-100",
  bad: "bg-rose-50 text-rose-700 border-rose-100",
  neutral: "bg-gray-50 text-gray-500 border-gray-200",
};

interface TrendBadgeProps {
  /** Upward triangle when true, downward when false, dash when null. */
  direction: boolean | null;
  tone: TrendTone;
  text: string;
  title?: string;
}

export function TrendBadge({ direction, tone, text, title }: TrendBadgeProps) {
  const { triggerProps, tip } = useHoverTip(title);
  return (
    <span
      {...triggerProps}
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[9.5px] font-bold ${TREND_TONES[tone]}`}
    >
      {direction === null ? (
        <span aria-hidden="true" className="text-[9px] leading-none">
          –
        </span>
      ) : (
        <svg
          viewBox="0 0 8 6"
          aria-hidden="true"
          className={`w-2 h-1.5 shrink-0 fill-current ${direction ? "" : "rotate-180"}`}
        >
          <path d="M4 0 L8 6 L0 6 Z" />
        </svg>
      )}
      {text}
      {tip}
    </span>
  );
}

interface KpiCardProps {
  accent: KpiAccent;
  icon: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
  label: string;
  hint: string;
  footnote?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Shared shell for dashboard KPI cards. The reserved line heights keep the
 * divider and hint rows aligned across a row of cards even when the labels
 * wrap differently.
 */
export function KpiCard({
  accent,
  icon,
  value,
  badge,
  label,
  hint,
  footnote,
  onClick,
  disabled = false,
}: KpiCardProps) {
  const accentStyle = KPI_ACCENTS[accent];
  const interactive = Boolean(onClick) && !disabled;

  return (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      disabled={!interactive}
      aria-disabled={!interactive}
      className={`group flex min-h-[190px] h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-xs outline-none transition-[border-color,box-shadow] duration-200 select-none ${
        interactive
          ? `cursor-pointer hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${accentStyle.hover}`
          : "cursor-default opacity-70"
      }`}
    >
      <span className="flex h-9 shrink-0 items-center justify-between gap-2">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${accentStyle.chip}`}
        >
          <Icon name={icon} className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0 shrink-0">{badge}</span>
      </span>

      <span className="mt-4 block min-h-8 break-words text-[30px] font-extrabold leading-none tracking-tight text-gray-900 font-display">
        {value}
      </span>

      <span className="mt-2 block min-h-8 whitespace-normal break-words text-[11px] font-bold leading-snug text-gray-500 font-sans">
        {label}
      </span>

      <span className="mt-auto block border-t border-gray-100 pt-2.5">
        <span
          className={`flex min-h-4 min-w-0 items-start gap-1 text-[10.5px] font-semibold leading-snug font-sans ${accentStyle.hint}`}
        >
          <span className="min-w-0 flex-1 whitespace-normal break-words">
            {hint}
          </span>
          {interactive ? (
            <Icon
              name="chevron"
              className="mt-0.5 h-2.5 w-2.5 shrink-0 rotate-90 opacity-60 transition-transform group-hover:translate-x-0.5"
            />
          ) : null}
        </span>
        <span className="mt-1 block min-h-[1.4em] whitespace-normal break-words text-[10.5px] font-medium leading-snug text-gray-400 font-sans">
          {footnote}
        </span>
      </span>
    </button>
  );
}
