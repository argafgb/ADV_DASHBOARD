"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

export default function TicketReopenCard({
  reopened,
  total,
  percentage,
  period,
  onClick,
}: {
  reopened: number;
  total: number;
  percentage: number;
  period: string;
  onClick?: () => void;
}) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [animatedReopened, setAnimatedReopened] = useState(0);
  const [animatedTotal, setAnimatedTotal] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 850;
    let animationId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress * (2 - progress); // ease-out quad

      setAnimatedPercent(ease * percentage);
      setAnimatedReopened(ease * reopened);
      setAnimatedTotal(ease * total);

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
  }, [percentage, reopened, total]);
  return (
    <Card
      className={`box-border flex flex-col p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm justify-between min-h-75 ${onClick ? "cursor-pointer transition-colors hover:border-blue-400 dark:hover:border-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Lihat detail ${formatNumber(reopened)} tiket re-open` : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase leading-[1.3] tracking-[0.06em] text-zinc-500 dark:text-zinc-400">
          Ticket Re-Open
        </span>
        <span className="whitespace-nowrap text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
          {period}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center py-2">
        <div className="text-center font-sans text-[50px] font-extrabold leading-none text-zinc-950 dark:text-zinc-50 [font-variant-numeric:tabular-nums]">
          {animatedPercent.toFixed(2)}%
        </div>
      </div>

      <div className="flex justify-between gap-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-zinc-500 dark:text-zinc-400">
            Re-Opened
          </span>
          <span className="font-sans text-[34px] font-bold text-zinc-950 dark:text-zinc-50 [font-variant-numeric:tabular-nums]">
            {formatNumber(Math.round(animatedReopened))}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-zinc-500 dark:text-zinc-400">
            Total
          </span>
          <span className="font-sans text-[34px] font-bold text-zinc-950 dark:text-zinc-50 [font-variant-numeric:tabular-nums]">
            {formatNumber(Math.round(animatedTotal))}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function TicketReopenCardSkeleton() {
  return (
    <Card className="box-border flex flex-col p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm animate-pulse select-none min-h-75 justify-between">
      <div className="flex items-start justify-between gap-2">
        <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="flex flex-1 items-center justify-center py-2">
        <div className="h-12 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="flex justify-between gap-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <div>
          <div className="h-3 w-16 rounded bg-zinc-250 dark:bg-zinc-800" />
          <div className="mt-2 h-8 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div>
          <div className="h-3 w-12 rounded bg-zinc-250 dark:bg-zinc-800" />
          <div className="mt-2 h-8 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </Card>
  );
}
