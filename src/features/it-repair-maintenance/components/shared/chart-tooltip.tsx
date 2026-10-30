"use client";

import { useState, type MouseEvent, type ReactNode } from "react";

/**
 * Tooltip chart bersama (port `useChartTooltip` + `tipRows` design system).
 *
 * Beri kunci stabil pada `show()` dan pasang `hotClass(key)` pada mark-nya:
 * saat tooltip terbuka chart memakai `.dd-chart--dim` (semua mark meredup),
 * dan `is-hot` mengangkat mark yang di-hover kembali ke opasitas penuh.
 */

export interface TipRow {
  color?: string;
  label: ReactNode;
  value: ReactNode;
  /** Warna teks; default dipetakan dari warna seri (INK). */
  ink?: string;
}

/* Warna seri yang terbaca sebagai teks 11.5px bukan warna mark-nya:
   amber dan biru muda gagal kontras di permukaan putih tooltip. */
const INK: Record<string, string> = {
  "var(--chart-amber)": "var(--status-amber-fg)",
  "var(--chart-green)": "var(--status-green-fg)",
  "var(--chart-red)": "var(--status-red-fg)",
  "var(--chart-blue-light)": "var(--chart-blue-primary)",
  "var(--chart-neutral)": "var(--text-secondary)",
  "var(--chart-gray-track)": "var(--text-secondary)",
};

export function TipRows({ title, rows }: { title: ReactNode; rows: TipRow[] }) {
  return (
    <>
      <div className="dd-ctip__title">{title}</div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="dd-ctip__row"
          style={{ color: r.ink ?? (r.color ? (INK[r.color] ?? r.color) : "var(--text-secondary)") }}
        >
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

interface TipState {
  x: number;
  y: number;
  content: ReactNode;
  key: string | null;
}

export function useChartTooltip() {
  const [tip, setTip] = useState<TipState | null>(null);
  const show = (e: MouseEvent, content: ReactNode, key: string | null = null) =>
    setTip({ x: e.clientX, y: e.clientY - 12, content, key });
  const move = (e: MouseEvent) =>
    setTip((t) => (t ? { x: e.clientX, y: e.clientY - 12, content: t.content, key: t.key } : t));
  const hide = () => setTip(null);
  const hot = tip ? tip.key : null;
  const hotClass = (key: string) => (hot != null && key === hot ? " is-hot" : "");
  const node = tip ? (
    <div className="dd-ctip" style={{ left: tip.x, top: tip.y }}>
      {tip.content}
    </div>
  ) : null;
  return { show, move, hide, node, active: tip !== null, hot, hotClass };
}
