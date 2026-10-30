"use client";

import { AnimatedValue } from "../ui/animated-value";
import { Card } from "../Card";
import { useCountUp } from "../../hooks/useCountUp";
import type { TrainingModel } from "../../utils/build-training";
import { useTooltip } from "../../context/tooltip-provider";

const SIZE = 132;
const STROKE = 17;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const GAP = 2.5;

/** "Penyelenggara" - donut of all sessions split by internal team vs vendors. Flat ends, clean gap, solid track. */
export function ProviderMixCard({ mix }: { mix: TrainingModel["mix"] }) {
  const { bind } = useTooltip();
  const animatedTotal = useCountUp(mix.total);
  const activeRows = mix.rows.filter((row) => row.count > 0);

  const segments = activeRows.reduce<{
    rows: Array<(typeof mix.rows)[number] & { dash: number; offset: number }>;
    offset: number;
  }>(
    (result, row, i) => {
      const raw = mix.total ? (row.count / mix.total) * CIRC * (animatedTotal / mix.total) : 0;
      const prev = result.rows[i - 1];
      const offset = prev ? prev.offset + prev.dash + (activeRows.length > 1 ? GAP : 0) : 0;
      const dash = Math.max(0, raw - (activeRows.length > 1 ? GAP : 0));
      result.rows.push({
        ...row,
        dash,
        offset,
      });
      return { rows: result.rows, offset: offset + dash };
    },
    { rows: [], offset: 0 },
  ).rows;

  return (
    <Card title="Training Providers" subtitle="Seluruh sesi menurut pelaksana">
      <div className="flex items-center gap-4 pt-1">
        <div className="relative flex-none" style={{ width: SIZE, height: SIZE }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block h-full w-full overflow-visible">
            {/* Solid gray track */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="#EEF1F6"
              strokeWidth={STROKE}
              className="dark:stroke-zinc-800"
            />
            {segments.map((segment) => (
              <circle
                key={segment.name}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={segment.color}
                strokeWidth={STROKE}
                strokeDasharray={`${segment.dash} ${CIRC - segment.dash}`}
                strokeDashoffset={-segment.offset}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                className="cursor-pointer transition-[stroke-dasharray,stroke-dashoffset] duration-500 ease-out"
                {...bind(segment.name, [
                  `${segment.count} sesi · ${segment.percent}% dari total`,
                  segment.note,
                ])}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] leading-none font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {animatedTotal}
            </span>
            <span className="mt-[2px] text-[10px] font-medium text-zinc-400 dark:text-zinc-500">sesi</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          {mix.rows.map((row) => (
            <div key={row.name} className="flex items-center gap-2">
              <span
                className="mt-[3px] h-[9px] w-[9px] flex-none self-start rounded-[3px]"
                style={{ background: row.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] leading-tight font-medium break-words text-zinc-700 dark:text-zinc-300">
                  {row.name}
                </div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500">{row.note}</div>
              </div>
              <span className="flex-none text-[14px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                <AnimatedValue value={row.count} />
              </span>
              <span className="w-8 flex-none text-right text-[10.5px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                <AnimatedValue value={row.percent} suffix="%" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
