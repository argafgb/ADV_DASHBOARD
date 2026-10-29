"use client";

import { useMemo } from "react";
import type {
  ActionITQueryResultRow,
  RootCauseChartMode,
} from "../types/rootCause.types";

import { formatNumber } from "../utils/rating-root-cause-utils";

function getActionITColor(name: string): string {
  const norm = name.trim().toLowerCase();
  switch (norm) {
    case "adjust features":
      return "#155dfc"; // Vibrant Blue
    case "ui update":
    case "on review it":
      return "#d97706"; // Amber / Orange
    case "feature addition":
      return "#059669"; // Emerald Green
    case "software update":
      return "#7c3aed"; // Violet / Purple
    case "no action needed":
    case "no action":
    default:
      return "#94a3b8"; // Slate Gray
  }
}

interface ActionITSectionProps {
  data: ActionITQueryResultRow[];
  department: string;
  periodLabel?: string;
  deptLabel?: string;
  chartMode?: RootCauseChartMode;
}

export default function ActionITSection({
  data,
  department,
  periodLabel,
  deptLabel,
  chartMode = "bar",
}: ActionITSectionProps) {
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  const formattedItems = useMemo(() => {
    return data.map((item) => {
      const percentage = total > 0 ? (item.count / total) * 100 : 0;
      return {
        ...item,
        percentage,
        color: getActionITColor(item.name),
      };
    });
  }, [data, total]);

  // Generate SVG Donut slices
  const donutSlices = useMemo(() => {
    if (total === 0) return [];
    let cumulativePercent = 0;
    const radius = 68;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;

    return formattedItems.map((item) => {
      const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((cumulativePercent / 100) * circumference);
      cumulativePercent += item.percentage;

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
        radius,
        strokeWidth,
      };
    });
  }, [formattedItems, total]);

  const isBarMode = chartMode === "bar";
  const displayPeriod = periodLabel || "Mar-Apr 2026";
  const displayDept = deptLabel || department;

  return (
    <section className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 select-none transition-all duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-950 dark:text-zinc-50">
          Action IT
        </h2>
        <p className="mt-1 text-xs text-slate-400 dark:text-zinc-400 font-medium">
          Status tindak lanjut · {displayPeriod} · {displayDept}
        </p>
      </div>

      {total === 0 ? (
        <div className="flex flex-1 min-h-55 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/50 my-4">
          <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">
            Data Action IT belum tersedia
          </p>
        </div>
      ) : (
        <div
          className={
            isBarMode
              ? "mt-4 flex flex-1 flex-col sm:flex-row items-center justify-between gap-6"
              : "mt-4 flex flex-1 flex-col items-center justify-center space-y-5"
          }
        >
          {/* DONUT CHART DISPLAY */}
          <div
            className={
              isBarMode
                ? "relative shrink-0 flex items-center justify-center mx-auto sm:mx-0"
                : "relative mx-auto flex items-center justify-center"
            }
          >
            <svg
              viewBox="0 0 180 180"
              className="h-44 w-44 -rotate-90 transform overflow-hidden"
            >
              {/* Background circle track */}
              <circle
                cx="90"
                cy="90"
                r="68"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="24"
                className="dark:stroke-zinc-800"
              />

              {donutSlices.map((slice, i) => (
                <circle
                  key={i}
                  cx="90"
                  cy="90"
                  r={slice.radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={slice.strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  className="transition-all duration-500 ease-out"
                />
              ))}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black tracking-tight text-slate-950 dark:text-zinc-50">
                {formatNumber(total)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                TICKETS
              </span>
            </div>
          </div>

          {/* LEGEND LIST */}
          <div
            className={
              isBarMode
                ? "flex-1 w-full space-y-2.5"
                : "w-full space-y-2.5 pt-2"
            }
          >
            {formattedItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 dark:text-zinc-200">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-zinc-100">
                    {formatNumber(item.count)}
                  </span>
                  <span className="w-12 text-right font-medium text-slate-400 dark:text-zinc-400">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
