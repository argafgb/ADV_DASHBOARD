import Link from "next/link";
import type { ReactNode } from "react";

import type { DeltaChipData, Tone } from "@/features/it-repair-maintenance/types/it-repair.types";

/** Baris KPI: 3 kolom di Overview, 5 kolom di halaman detail. */
export function KpiGrid({ cols, children }: { cols: 3 | 4 | 5; children: ReactNode }) {
  return <div className={`dd-kpi-grid dd-kpi-grid--${cols}`}>{children}</div>;
}

/** Titik "i" dengan tooltip (InfoDot design system). */
export function InfoDot({ text }: { text: string }) {
  return (
    <span className="dd-tooltip-wrap">
      <span className="dd-info" aria-label={text}>
        i
      </span>
      <span className="dd-tooltip" role="tooltip">
        {text}
      </span>
    </span>
  );
}

/**
 * Chip delta kuartal pada KPI, persis seperti desain: DeltaChip tanpa panah
 * bawaan + ikon garis tren `ir-delta-ic` (naik/turun) + persentase.
 */
export function TrendDelta({ delta, onAccent = false }: { delta: DeltaChipData; onAccent?: boolean }) {
  const up = delta.dir === "up";
  return (
    <span className={`dd-delta ${onAccent ? "dd-delta--on-accent" : `dd-delta--${delta.tone}`}`}>
      <svg
        className="ir-delta-ic"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {up ? (
          <>
            <polyline points="3 17 9 11 13 15 21 7" />
            <polyline points="15 7 21 7 21 13" />
          </>
        ) : (
          <>
            <polyline points="3 7 9 13 13 9 21 17" />
            <polyline points="15 17 21 17 21 11" />
          </>
        )}
      </svg>
      {delta.text}
    </span>
  );
}

const CHEV = (
  <svg
    className="dd-kpi__chev"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <polyline points="9 6 15 12 9 18" />
  </svg>
);

/**
 * Kartu metrik design system. Baris 1 = tile ikon bernada status + label
 * (+ InfoDot) + chevron bila bisa diklik; baris 2 = nilai + sub-metrik.
 * `variant="accent"` = kartu utama berisi gradien, paling banyak satu per baris.
 * Kartu yang bisa diklik dirender sebagai tautan (state di URL).
 */
export function KpiCard({
  label,
  value,
  sub,
  subTone,
  icon,
  tone = "blue",
  delta,
  info,
  variant = "base",
  href,
}: {
  label: string;
  value: string;
  sub?: string | null;
  subTone?: Tone | null;
  icon: ReactNode;
  tone?: Tone;
  delta?: DeltaChipData | null;
  info?: string | null;
  variant?: "base" | "accent";
  href?: string | null;
}) {
  const accent = variant === "accent";
  const cls = ["dd-kpi", accent ? "dd-kpi--accent" : "", href ? "dd-kpi--click" : ""].filter(Boolean).join(" ");
  const tileStyle = accent
    ? undefined
    : { background: `var(--status-${tone}-bg)`, color: `var(--status-${tone}-fg)` };
  const body = (
    <>
      {delta && (
        <span className="dd-kpi__delta">
          <TrendDelta delta={delta} onAccent={accent} />
        </span>
      )}
      <div className="dd-kpi__top">
        <span className="dd-kpi__tile" style={tileStyle}>
          {icon}
        </span>
        <span className="dd-kpi__label">
          {label}
          {info && <InfoDot text={info} />}
        </span>
        {href && CHEV}
      </div>
      <div className="dd-kpi__row">
        <span className="dd-kpi__value">{value}</span>
        {sub && (
          <span className="dd-kpi__sub" style={subTone ? { color: `var(--status-${subTone}-fg)` } : undefined}>
            {sub}
          </span>
        )}
      </div>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls} scroll={false}>
        {body}
      </Link>
    );
  }
  return <section className={cls}>{body}</section>;
}
