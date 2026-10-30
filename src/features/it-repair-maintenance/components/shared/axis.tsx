"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Skala sumbu "bulat" design system: maksimum dibagi `count`, dibulatkan ke
 * 1/2/2,5/5/10 × pangkat sepuluh terdekat; tick dari 0 sampai `top`.
 */
export function niceScale(max: number, count = 4): { top: number; step: number; ticks: number[] } {
  const target = Math.max(max || 0, 1);
  const raw = target / (count || 4);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || mag * 10;
  const top = Math.ceil(target / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return { top, step, ticks };
}

/** Garis sumbu + gridline vertikal di belakang batang chart horizontal. */
export function GridLines({ ticks, top, rows }: { ticks: number[]; top: number; rows: number }) {
  return (
    <div className="dd-hbar__gridlines" style={{ gridRow: `1 / span ${rows}` }}>
      {ticks.map((t, i) =>
        i === 0 ? null : <span key={t} className="dd-hbar__gline" style={{ left: `${(t / top) * 100}%` }} />,
      )}
    </div>
  );
}

/** Skala tick x di bawah chart batang horizontal. */
export function XAxis({
  ticks,
  top,
  row,
  format = (v: number) => String(v),
}: {
  ticks: number[];
  top: number;
  row: number;
  format?: (v: number) => string;
}) {
  return (
    <div className="dd-hbar__xaxis" style={{ gridRow: row }}>
      {ticks.map((t, i) => (
        <span
          key={t}
          className={[
            "dd-hbar__tick",
            i === 0 ? "dd-hbar__tick--first" : "",
            i === ticks.length - 1 ? "dd-hbar__tick--last" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ left: `${(t / top) * 100}%` }}
        >
          {format(t)}
        </span>
      ))}
    </div>
  );
}

/**
 * Lebar piksel wadah chart yang diukur langsung.
 *
 * Chart SVG di sini memakai viewBox seukuran lebar terukur supaya satuan
 * user = piksel CSS; teks sumbu tidak ikut meregang saat kartu melebar.
 */
export function useMeasuredWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const next = Math.round(el.getBoundingClientRect().width);
      if (next > 0) setW(next);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}
