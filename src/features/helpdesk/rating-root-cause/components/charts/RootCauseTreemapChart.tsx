"use client";

import { useState } from "react";
import type { RootCauseItem } from "../../types/rootCause.types";

type TooltipState = {
  x: number;
  y: number;
  item: RootCauseItem;
} | null;

const COLOR_MAP: Record<string, string> = {
  violet: "#6D28D9",
  red: "#EF4444",
  cyan: "#06B6D4",
  amber: "#F59E0B",
  emerald: "#10B981",
  blue: "#2563EB",
};

function getColor(color: string) {
  return COLOR_MAP[color] ?? color;
}

import { formatNumber } from "../../utils/rating-root-cause-utils";

function percent(value: number, total: number) {
  if (!total) return "0.0";
  return ((value / total) * 100).toFixed(1);
}

function textColor(color: string) {
  if (color === "amber" || color === "emerald") return "text-slate-950";
  return "text-white";
}

function TreemapTooltip({
  tooltip,
  total,
}: {
  tooltip: Exclude<TooltipState, null>;
  total: number;
}) {
  const item = tooltip.item;
  const color = getColor(item.color);

  return (
    <div
      className="pointer-events-none fixed z-30 w-65 rounded-xl bg-slate-950 px-4 py-3 text-white shadow-2xl"
      style={{
        left: tooltip.x + 16,
        top: tooltip.y + 16,
      }}
    >
      <div className="text-sm font-black uppercase">{item.name}</div>

      <div className="mt-3 space-y-2">
        {(item.children ?? []).slice(0, 3).map((child) => (
          <div
            key={child.name}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="truncate">{child.name}</span>
            </div>

            <span className="shrink-0 font-black">
              {formatNumber(child.tickets)} (
              {percent(child.tickets, item.tickets)}%)
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-white/15 pt-2 text-xs text-slate-300">
        Total: {formatNumber(item.tickets)} tickets (
        {percent(item.tickets, total)}% of all tickets)
      </div>
    </div>
  );
}

function Block({
  item,
  className = "",
  onHover,
}: {
  item: RootCauseItem;
  className?: string;
  onHover: (tooltip: TooltipState) => void;
}) {
  return (
    <button
      type="button"
      onMouseMove={(event) =>
        onHover({
          x: event.clientX,
          y: event.clientY,
          item,
        })
      }
      className={[
        "relative overflow-hidden rounded-lg p-4 text-left transition hover:brightness-95",
        className,
      ].join(" ")}
      style={{
        backgroundColor: getColor(item.color),
      }}
    >
      <div
        className={[
          "absolute left-4 top-4 max-w-[85%] uppercase leading-tight",
          textColor(item.color),
        ].join(" ")}
      >
        <div className="text-xl font-black tracking-tight">{item.name}</div>
        <div className="mt-1 text-2xl font-black">
          {formatNumber(item.tickets)}
        </div>
      </div>
    </button>
  );
}

export default function RootCauseTreemapChart({
  data,
}: {
  data: RootCauseItem[];
  department?: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const total = data.reduce((sum, item) => sum + item.tickets, 0);
  const items = [...data].sort((a, b) => b.tickets - a.tickets);

  if (items.length === 0) return null;

  const isDctLayout = items.length >= 5;
  const isItLayout = items.length === 3;

  return (
    <div
      className="relative h-105 overflow-hidden rounded-xl"
      onMouseLeave={() => setTooltip(null)}
    >
      {isDctLayout && (
        <div className="grid h-full grid-cols-[44%_56%] gap-1">
          <Block item={items[0]} onHover={setTooltip} />

          <div className="grid h-full grid-rows-[38%_62%] gap-1">
            <Block item={items[1]} onHover={setTooltip} />

            <div className="grid h-full grid-cols-[48%_52%] gap-1">
              <Block item={items[2]} onHover={setTooltip} />

              <div className="grid h-full grid-rows-[62%_38%] gap-1">
                <Block item={items[3]} onHover={setTooltip} />
                <Block item={items[4]} onHover={setTooltip} />
              </div>
            </div>
          </div>
        </div>
      )}

      {isItLayout && (
        <div className="grid h-full grid-cols-[45%_55%] gap-1">
          <Block item={items[0]} onHover={setTooltip} />

          <div className="grid h-full grid-rows-[62%_38%] gap-1">
            <Block item={items[1]} onHover={setTooltip} />
            <Block item={items[2]} onHover={setTooltip} />
          </div>
        </div>
      )}

      {!isDctLayout && !isItLayout && (
        <div className="grid h-full grid-cols-2 gap-1">
          {items.map((item) => (
            <Block key={item.name} item={item} onHover={setTooltip} />
          ))}
        </div>
      )}

      {tooltip && <TreemapTooltip tooltip={tooltip} total={total} />}
    </div>
  );
}
