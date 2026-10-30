"use client";

import React, { useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface ChartTooltipRow {
  color: string;
  text: string;
}

export interface TipRow {
  color?: string;
  label: ReactNode;
  value: ReactNode;
  ink?: string;
}

/**
 * Baris-baris tooltip standar: dot · label : value.
 */
export function TipRows({ title, rows }: { title?: ReactNode; rows: TipRow[] }) {
  return (
    <>
      {title && <div className="dd-ctip__title">{title}</div>}
      {rows.map((r, i) => (
        <div key={i} className="dd-ctip__row" style={r.ink ? { color: r.ink } : undefined}>
          {r.color && <span className="dd-ctip__dot" style={{ background: r.color }} />}
          <span className="dd-ctip__lab">{r.label}</span>
          <span className="dd-ctip__sep" aria-hidden="true">
            :
          </span>
          <span className="dd-ctip__val">{r.value}</span>
        </div>
      ))}
    </>
  );
}

/**
 * Tooltip melayang yang mengikuti koordinat kursor mouse (viewport px).
 */
export function FloatingTip({
  x,
  y,
  title,
  rows,
}: {
  x: number;
  y: number;
  title?: ReactNode;
  rows: TipRow[];
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="dd-ctip" style={{ left: x, top: y }}>
      <TipRows title={title} rows={rows} />
    </div>,
    document.body,
  );
}

/**
 * Hook bantuan tooltip chart + hover dimming.
 */
export function useChartTooltip() {
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    title?: ReactNode;
    rows: TipRow[];
    key: string | null;
  } | null>(null);

  const show = (e: MouseEvent, title: ReactNode, rows: TipRow[], key: string | null = null) =>
    setTip({ x: e.clientX, y: e.clientY - 12, title, rows, key });

  const move = (e: MouseEvent) =>
    setTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY - 12 } : null));

  const hide = () => setTip(null);
  const hot = tip ? tip.key : null;
  const hotClass = (key: string) => (hot != null && key === hot ? " is-hot" : "");

  const node = tip ? <FloatingTip x={tip.x} y={tip.y} title={tip.title} rows={tip.rows} /> : null;

  return { show, move, hide, node, active: tip !== null, hot, hotClass };
}

/**
 * Tooltip standar untuk chart SVG bulanan: kartu putih bersih.
 */
export function ChartTooltip({
  left,
  top,
  title,
  rows,
  keyed = rows.length > 1,
}: {
  /** Titik jangkar dalam koordinat viewport. */
  left: number;
  top: number;
  title: string;
  rows: readonly ChartTooltipRow[];
  /** Tampilkan penanda warna seri; default bila ada lebih dari satu baris. */
  keyed?: boolean;
}) {
  if (typeof document === "undefined") return null;

  const headerBottom =
    document.querySelector<HTMLElement>("[data-dashboard-header]")?.getBoundingClientRect()
      .bottom ?? 0;
  const renderBelow = top - 96 < headerBottom;

  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-70"
      style={{
        left,
        top: renderBelow ? Math.max(top, headerBottom + 12) : top,
        transform: renderBelow ? "translate(-50%, 12px)" : "translate(-50%, calc(-100% - 12px))",
      }}
    >
      <div className="relative rounded-[10px] border border-[#f1f3f7] bg-white px-3 py-2 whitespace-nowrap text-[#111827] shadow-[0_8px_24px_rgba(17,24,39,0.12)] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="text-[11.5px] leading-snug font-semibold text-gray-700 dark:text-zinc-300">
          {title}
        </div>
        {rows.map((row, index) => (
          <div
            key={index}
            className="mt-1 flex items-center gap-1.5 text-[11px] leading-snug font-medium text-gray-900 dark:text-zinc-200"
          >
            {keyed && (
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ background: row.color }}
              />
            )}
            {row.text}
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
