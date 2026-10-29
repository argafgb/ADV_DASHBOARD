"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { X, AlertCircle, Gauge } from "lucide-react";
import type { SlaMetricSummary } from "../types/slaPerformance.types";
import SlaStatusPill from "./SlaStatusPill";

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

export default function SlaMetricCard({
  title,
  metric,
  period,
  variant = "default",
}: {
  title: string;
  metric: SlaMetricSummary;
  period: string;
  variant?: "default" | "primary";
}) {
  const [showPopup, setShowPopup] = useState(false);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 850;
    let animationId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress * (2 - progress); // ease-out quad
      setAnimatedPercent(ease * metric.percentage);

      if (progress < 1) {
        animationId = window.requestAnimationFrame(step);
      }
    };

    animationId = window.requestAnimationFrame(step);
    return () => {
      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }
    };
  }, [metric.percentage]);

  const achieved = metric.percentage >= metric.target;
  const progressWidth = Math.min(Math.max(animatedPercent * 100, 0), 100);
  const hasMissedTickets = metric.missed > 0 && metric.missedTickets;

  return (
    <>
      <Card
        className={cn(
          "flex min-h-70 min-w-0 flex-col justify-between overflow-hidden rounded-xl border p-6 shadow-sm",
          variant === "primary"
            ? "border-blue-700 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-700"
            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {variant === "primary" && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20">
                <Gauge size={17} aria-hidden="true" />
              </span>
            )}
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wide",
                variant === "primary"
                  ? "text-white"
                  : "text-zinc-500 dark:text-zinc-400",
              )}
            >
              {title}
            </span>
          </div>

          <span
            className={cn(
              "text-xs font-semibold",
              variant === "primary"
                ? "text-white"
                : "text-zinc-400 dark:text-zinc-500",
            )}
          >
            {period}
          </span>
        </div>

        <div className="mt-5 min-w-0">
          <h3
            className={cn(
              "font-sans text-3xl font-black tracking-tight lg:text-4xl 2xl:text-5xl",
              variant === "primary"
                ? "text-white"
                : "text-zinc-950 dark:text-zinc-50",
            )}
          >
            {formatPercent(animatedPercent)}
          </h3>

          <p
            className={cn(
              "mt-2 text-sm font-semibold",
              variant === "primary"
                ? achieved
                  ? "text-emerald-100"
                  : "text-red-100"
                : achieved
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
            )}
          >
            Target SLA: {formatPercent(metric.target)}
          </p>

          <div
            className={cn(
              "mt-4 h-2 w-full overflow-hidden rounded-full",
              variant === "primary"
                ? "bg-blue-950/35"
                : "bg-zinc-100 dark:bg-zinc-800",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full",
                achieved ? "bg-emerald-500" : "bg-red-500",
              )}
              style={{ width: `${progressWidth}%` }}
            />
          </div>

          <div
            className={cn("mt-4 w-fit", hasMissedTickets && "cursor-pointer")}
            onClick={hasMissedTickets ? () => setShowPopup(true) : undefined}
          >
            <SlaStatusPill
              achieved={achieved}
              onPrimary={variant === "primary"}
            />
          </div>
        </div>

        <div
          className={cn(
            "mt-5 grid grid-cols-2 border-t pt-4",
            variant === "primary"
              ? "border-white/25"
              : "border-zinc-100 dark:border-zinc-800",
          )}
        >
          <div>
            <p
              className={cn(
                "text-xs font-bold uppercase tracking-wide",
                variant === "primary"
                  ? "text-white"
                  : "text-zinc-500 dark:text-zinc-400",
              )}
            >
              Achieved
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-black",
                variant === "primary"
                  ? "text-emerald-100"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {formatNumber(metric.achieved)}
            </p>
          </div>

          <div>
            {hasMissedTickets ? (
              <button
                onClick={() => setShowPopup(true)}
                className={cn(
                  "flex w-full -m-1 cursor-pointer flex-col items-start rounded p-1 text-left transition-all focus:outline-none",
                  variant === "primary"
                    ? "hover:bg-white/10"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800",
                )}
              >
                <p
                  className={cn(
                    "text-xs font-bold uppercase tracking-wide underline decoration-dotted",
                    variant === "primary"
                      ? "text-red-100 decoration-red-200"
                      : "text-red-600 decoration-red-400 dark:text-red-450",
                  )}
                >
                  Not Achieved
                </p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-black",
                    variant === "primary"
                      ? "text-red-100"
                      : "text-red-600 dark:text-red-455",
                  )}
                >
                  {formatNumber(metric.missed)}
                </p>
              </button>
            ) : (
              <div>
                <p
                  className={cn(
                    "text-xs font-bold uppercase tracking-wide",
                    variant === "primary"
                      ? "text-white"
                      : "text-zinc-500 dark:text-zinc-400",
                  )}
                >
                  Not Achieved
                </p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-black",
                    variant === "primary"
                      ? "text-red-100"
                      : "text-red-600 dark:text-red-450",
                  )}
                >
                  {formatNumber(metric.missed)}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Pop-up Modal untuk Detail Tiket Gagal */}
      {showPopup && hasMissedTickets && (
        <div
          onClick={() => setShowPopup(false)}
          className="fixed inset-0 z-3000 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-110 max-w-[92vw] flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.25)] p-5 animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-rose-500 w-5 h-5" />
                <h3 className="font-sans text-md font-bold text-zinc-900 dark:text-zinc-50">
                  Tiket Gagal SLA
                </h3>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4">
              <p className="font-sans text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
                Berikut daftar nomor tiket {title} yang tidak memenuhi target
                SLA pada periode <strong>{period}</strong>:
              </p>

              <div className="flex flex-wrap gap-2 max-h-55 overflow-y-auto pr-1">
                {metric.missedTickets?.split(",").map((ticket) => {
                  const cleanedTicket = ticket.trim();
                  return (
                    <span
                      key={cleanedTicket}
                      className="tabular-nums text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-rose-50 dark:bg-rose-955/20 border-rose-100 dark:border-rose-950/40 text-rose-600 dark:text-rose-450 select-all"
                    >
                      {cleanedTicket}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPopup(false)}
                className="cursor-pointer font-sans text-xs font-semibold px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg transition-colors shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SlaMetricCardSkeleton() {
  return (
    <Card className="flex min-h-70 flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse select-none">
      <div className="flex items-start justify-between gap-4">
        {/* Title placeholder */}
        <div className="h-3.5 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />

        {/* Period placeholder */}
        <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mt-5">
        {/* Percentage placeholder */}
        <div className="h-10 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />

        {/* Target placeholder */}
        <div className="mt-3.5 h-3.5 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />

        {/* Progress bar placeholder */}
        <div className="mt-4 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />

        {/* Status pill placeholder */}
        <div className="mt-4 h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Footer statistics placeholders */}
      <div className="mt-5 grid grid-cols-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div>
          <div className="h-3 w-16 rounded bg-zinc-250 dark:bg-zinc-800" />
          <div className="mt-2 h-7 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div>
          <div className="h-3 w-16 rounded bg-zinc-250 dark:bg-zinc-800" />
          <div className="mt-2 h-7 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </Card>
  );
}
