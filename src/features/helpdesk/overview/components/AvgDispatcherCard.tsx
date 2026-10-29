"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

export default function AvgDispatcherCard({
  seconds,
  period,
}: {
  seconds: number;
  formatted: string;
  period: string;
}) {
  const [animatedSeconds, setAnimatedSeconds] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 850;
    let animationId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress * (2 - progress); // ease-out quad
      setAnimatedSeconds(ease * seconds);

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
  }, [seconds]);

  const m = Math.floor(animatedSeconds / 60);
  const s = Math.round(animatedSeconds % 60);
  const line1 = `${m}m`;
  const line2 = `${s}s`;

  return (
    <Card className="box-border flex flex-col p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm justify-between min-h-75">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase leading-[1.3] tracking-[0.06em] text-zinc-500 dark:text-zinc-400">
          Avg Dispatcher
        </span>
        <span className="whitespace-nowrap text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
          {period}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center py-2">
        <div className="flex flex-col leading-none">
          <span className="text-center font-sans text-[44px] font-extrabold text-zinc-950 dark:text-zinc-50 [font-variant-numeric:tabular-nums]">
            {line1}
          </span>
          <span className="text-center font-sans text-[44px] font-extrabold text-zinc-950 dark:text-zinc-50 [font-variant-numeric:tabular-nums]">
            {line2}
          </span>
        </div>
        <span className="mt-3 text-center text-xs font-normal text-zinc-500 dark:text-zinc-400">
          Rata-rata waktu hingga penugasan
        </span>
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-center text-xs dark:border-blue-900 dark:bg-blue-950/30">
          <p className="font-semibold text-blue-700 dark:text-blue-300">Batas respons: maksimal 10 menit / tiket</p>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Dihitung sejak tiket masuk hingga ditugaskan ke dispatcher. Lebih dari 10 menit melewati SLA.</p>
        </div>
      </div>
    </Card>
  );
}

export function AvgDispatcherCardSkeleton() {
  return (
    <Card className="box-border flex flex-col p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm animate-pulse select-none min-h-75 justify-between">
      <div className="flex items-start justify-between gap-2">
        <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="flex flex-1 flex-col justify-center py-2 items-center">
        <div className="flex flex-col gap-2 items-center w-full">
          <div className="h-10 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="mt-3.5 h-3 w-36 rounded bg-zinc-150 dark:bg-zinc-800/80" />
      </div>
    </Card>
  );
}
