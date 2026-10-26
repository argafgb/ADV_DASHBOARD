"use client";

import { useState, type MouseEvent, type ReactNode } from "react";

export interface TipRow {
  color?: string;
  label: ReactNode;
  value: ReactNode;
  ink?: string;
}

/**
 * Isi tooltip chart — `TipRows` pada mockup design system.
 *
 * Satu judul, lalu baris-baris `dot · label : nilai`. Dipakai oleh Recharts
 * lewat prop `content`, dan oleh chart SVG/canvas lewat `<FloatingTip>` atau
 * `useChartTooltip`; keduanya memakai kelas `.dd-ctip*` yang sama supaya
 * semua tooltip di dashboard terlihat identik.
 */
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
          <span className="dd-ctip__sep" aria-hidden="true">:</span>
          <span className="dd-ctip__val">{r.value}</span>
        </div>
      ))}
    </>
  );
}

/**
 * Pembungkus untuk `content` Recharts. `.dd-ctip` sendiri `position:fixed`
 * karena mockup menempatkannya manual; Recharts sudah mengatur posisi, jadi
 * di sini di-nolkan agar tidak dobel.
 */
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

/**
 * Tooltip melayang untuk chart SVG buatan sendiri. Koordinat dalam piksel
 * viewport, sama seperti `S.ratioTip` di mockup.
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
  return (
    <div className="dd-ctip" style={{ left: x, top: y }}>
      <TipRows title={title} rows={rows} />
    </div>
  );
}

interface TipState {
  x: number;
  y: number;
  content: ReactNode;
  key: string | null;
}

/**
 * Hook tooltip instan dengan pengelolaan status aktif & peredupan.
 */
export function useChartTooltip() {
  const [tip, setTip] = useState<TipState | null>(null);
  const show = (e: MouseEvent, content: ReactNode, key: string | null = null) =>
    setTip({ x: e.clientX, y: e.clientY - 12, content, key });
  const move = (e: MouseEvent) =>
    setTip((t) =>
      t ? { x: e.clientX, y: e.clientY - 12, content: t.content, key: t.key } : t,
    );
  const hide = () => setTip(null);
  const hot = tip ? tip.key : null;
  const hotClass = (key: string) =>
    hot != null && key === hot ? " is-hot" : "";
  const node = tip ? (
    <div className="dd-ctip" style={{ left: tip.x, top: tip.y }}>
      {tip.content}
    </div>
  ) : null;
  return { show, move, hide, node, active: tip !== null, hot, hotClass };
}

/**
 * Tooltip instan untuk elemen statis (badge, chip, teks) sebagai pengganti
 * atribut `title` native yang lambat.
 */
export function HoverTip({
  content,
  className,
  children,
}: {
  content: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const [anchor, setAnchor] = useState<{ x: number; top: number } | null>(null);
  if (!content) return <span className={className}>{children}</span>;

  return (
    <span
      className={className}
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setAnchor({ x: r.left + r.width / 2, top: r.top - 8 });
      }}
      onMouseLeave={() => setAnchor(null)}
    >
      {children}
      {anchor && (
        <div className="dd-ctip" style={{ left: anchor.x, top: anchor.top }}>
          {content}
        </div>
      )}
    </span>
  );
}
