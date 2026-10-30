"use client";

import type { ReactNode } from "react";

export interface TipRow {
  color?: string;
  label: string;
  value: ReactNode;
}

export function TipRows({
  title,
  rows,
}: {
  title?: ReactNode;
  rows: TipRow[];
}) {
  return (
    <>
      {title && <div className="dd-ctip__title">{title}</div>}
      {rows.map((r, i) => (
        <div key={i} className="dd-ctip__row">
          {r.color && (
            <span className="dd-ctip__dot" style={{ background: r.color }} />
          )}
          <span className="dd-ctip__lab">{r.label}</span>
          <span className="dd-ctip__sep">:</span>
          <span className="dd-ctip__val">{r.value}</span>
        </div>
      ))}
    </>
  );
}

export function RechartsTip({
  title,
  rows,
}: {
  title?: ReactNode;
  rows: TipRow[];
}) {
  return (
    <div className="dd-ctip" style={{ position: "static", transform: "none" }}>
      <TipRows title={title} rows={rows} />
    </div>
  );
}

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
  return (
    <div className="dd-ctip" style={{ left: x, top: y }}>
      <TipRows title={title} rows={rows} />
    </div>
  );
}
