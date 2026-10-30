"use client";

import { useState } from "react";

import { Card } from "../shared/card";
import { fmt, pct1 } from "../../utils/format";
import type { TrendPoint } from "../../types/kaldev.types";

function toneVar(gap: number): string {
  return gap <= 0
    ? "var(--chart-green)"
    : gap <= 5
      ? "var(--chart-amber)"
      : "var(--chart-red)";
}
function toneFg(gap: number): string {
  return gap <= 0
    ? "var(--status-green-fg)"
    : gap <= 5
      ? "var(--status-amber-fg)"
      : "var(--status-red-fg)";
}

/**
 * "Tren SLA bulanan" — port dari chart garis buatan desain: titik per bulan
 * pada kolom hover, garis SVG (viewBox 1000×1000, tanpa skala stroke) dengan
 * gradien saat warna dua titik berbeda, garis target putus-putus, sumbu Y
 * dinamis (batas bawah mengikuti nilai terendah), dan tooltip per kolom.
 */
export function SlaTrendChart({
  title = "Tren SLA bulanan",
  subtitle,
  trend,
  target,
  note,
}: {
  title?: string;
  subtitle: string;
  trend: TrendPoint[];
  target: number;
  note: string | null;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const n = trend.length;
  const pcts = trend.map((t) => t.pct);
  const slaLo = Math.max(
    0,
    Math.min(80, Math.floor((Math.min(...pcts, target) - 2) / 5) * 5),
  );
  const pos = (v: number) =>
    Math.max(0, Math.min(100, ((v - slaLo) / (100 - slaLo)) * 100));
  const ticks = [0, 1, 2, 3, 4].map((k) => ({
    label: `${Math.round(slaLo + (k * (100 - slaLo)) / 4)}%`,
    pos: `${k * 25}%`,
  }));
  const pts = trend.map((t, i) => ({
    x: ((i + 0.5) / n) * 1000,
    y: 1000 - pos(t.pct) * 10,
    c: toneVar(target - t.pct),
  }));

  const anchor = (i: number) => {
    if (n < 4)
      return { left: "50%", right: "auto", transform: "translateX(-50%)" };
    if (i <= 1) return { left: 0, right: "auto", transform: "none" };
    if (i >= n - 2) return { left: "auto", right: 0, transform: "none" };
    return { left: "50%", right: "auto", transform: "translateX(-50%)" };
  };

  const legend = (
    <div className="dd-chart__legend">
      <span className="dd-chart__legenditem">
        <span
          className="dd-chart__dot dd-chart__dot--round"
          style={{ background: "var(--chart-green)" }}
        />
        Tercapai
      </span>
      <span className="dd-chart__legenditem">
        <span
          className="dd-chart__dot dd-chart__dot--round"
          style={{ background: "var(--chart-amber)" }}
        />
        Mendekati target
      </span>
      <span className="dd-chart__legenditem">
        <span
          className="dd-chart__dot dd-chart__dot--round"
          style={{ background: "var(--chart-red)" }}
        />
        Di bawah target
      </span>
      <span className="dd-chart__legenditem">
        <span
          style={{
            width: 14,
            borderTop: "2px dashed var(--text-secondary)",
            flex: "0 0 auto",
          }}
        />
        Target {target}%
      </span>
    </div>
  );

  return (
    <Card
      title={title}
      subtitle={subtitle}
      bodyStyle={{ justifyContent: "flex-start" }}
    >
      {n === 0 ? (
        <div className="dd-empty">
          <div className="dd-empty__title">Belum ada proyek selesai</div>
          <div className="dd-empty__msg">
            Pilih periode lain untuk melihat tren SLA.
          </div>
        </div>
      ) : (
        <div className="dd-chart" style={{ display: "grid", gap: 9 }}>
          {legend}
          <div
            style={{
              display: "grid",
              gap: 7,
              gridTemplateColumns: "38px minmax(0,1fr)",
            }}
          >
            <div style={{ position: "relative", height: 250, marginTop: 10 }}>
              {ticks.map((t) => (
                <span
                  key={t.label}
                  style={{
                    position: "absolute",
                    right: 8,
                    bottom: t.pos,
                    transform: "translateY(50%)",
                    font: "500 10.5px/1 var(--dd-font-sans)",
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--chart-axis)",
                  }}
                >
                  {t.label}
                </span>
              ))}
            </div>
            <div
              style={{
                position: "relative",
                height: 250,
                marginTop: 10,
                borderLeft: "1px solid var(--chart-grid)",
                borderBottom: "1px solid var(--chart-grid)",
              }}
              onMouseLeave={() => setHover(null)}
            >
              {ticks.map((t) => (
                <span
                  key={t.label}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: t.pos,
                    borderTop: "1px solid var(--chart-grid)",
                    pointerEvents: "none",
                  }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: `${pos(target).toFixed(2)}%`,
                  borderTop: "2px dashed var(--text-secondary)",
                  pointerEvents: "none",
                }}
              />
              <svg
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  overflow: "visible",
                  pointerEvents: "none",
                }}
                aria-hidden
              >
                <defs>
                  {pts.slice(0, -1).map((a, i) => {
                    const b = pts[i + 1];
                    if (a.c === b.c) return null;
                    return (
                      <linearGradient
                        key={`g${i}`}
                        id={`kdTrendSeg${i}`}
                        gradientUnits="userSpaceOnUse"
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                      >
                        <stop offset="0" style={{ stopColor: a.c }} />
                        <stop offset="1" style={{ stopColor: b.c }} />
                      </linearGradient>
                    );
                  })}
                </defs>
                {pts.slice(0, -1).map((a, i) => {
                  const b = pts[i + 1];
                  return (
                    <line
                      key={`l${i}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={a.c === b.c ? a.c : `url(#kdTrendSeg${i})`}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex" }}>
                {trend.map((t, i) => {
                  const gap = target - t.pct;
                  const on = hover === t.key;
                  const showValue = on || (!hover && i === n - 1);
                  const a = anchor(i);
                  const bottom = `${pos(t.pct).toFixed(2)}%`;
                  return (
                    <div
                      key={t.key}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: "100%",
                        position: "relative",
                        cursor: "pointer",
                        background: on ? "var(--bg-subtle)" : "transparent",
                        transition: "background .12s",
                        opacity: hover && !on ? 0.45 : 1,
                      }}
                      onMouseEnter={() => setHover(t.key)}
                    >
                      <span
                        style={{
                          display: on ? "block" : "none",
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: "50%",
                          borderLeft: "1px dashed var(--chart-axis)",
                          pointerEvents: "none",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          left: "50%",
                          bottom,
                          width: on ? 13 : 10,
                          height: on ? 13 : 10,
                          marginLeft: on ? -6.5 : -5,
                          marginBottom: on ? -6.5 : -5,
                          borderRadius: "50%",
                          background: "var(--bg-card)",
                          border: `2.5px solid ${toneVar(gap)}`,
                          boxShadow: on ? "0 0 0 4px var(--bg-subtle)" : "none",
                          zIndex: 2,
                        }}
                      />
                      <span
                        style={{
                          display: showValue ? "block" : "none",
                          position: "absolute",
                          left: "50%",
                          bottom,
                          transform: "translate(-50%, -14px)",
                          whiteSpace: "nowrap",
                          font: "600 11.5px/1 var(--dd-font-sans)",
                          fontVariantNumeric: "tabular-nums",
                          color: toneFg(gap),
                          zIndex: 3,
                        }}
                      >
                        {pct1(t.pct)}
                      </span>
                      <div
                        className="dd-ctip"
                        style={{
                          display: on ? "block" : "none",
                          position: "absolute",
                          top: 0,
                          left: a.left,
                          right: a.right,
                          transform: a.transform,
                          zIndex: 12,
                          minWidth: 180,
                          textAlign: "left",
                        }}
                      >
                        <div className="dd-ctip__title">{t.full}</div>
                        <div
                          className="dd-ctip__row"
                          style={{ color: "var(--status-green-fg)" }}
                        >
                          <span
                            className="dd-ctip__dot"
                            style={{ background: "var(--chart-green)" }}
                          />
                          <span className="dd-ctip__lab">Tercapai</span>
                          <span className="dd-ctip__sep">:</span>
                          <span className="dd-ctip__val">
                            {fmt(t.ok)} · {pct1(t.pct)}
                          </span>
                        </div>
                        <div
                          className="dd-ctip__row"
                          style={{ color: "var(--status-red-fg)" }}
                        >
                          <span
                            className="dd-ctip__dot"
                            style={{ background: "var(--chart-red)" }}
                          />
                          <span className="dd-ctip__lab">Tidak tercapai</span>
                          <span className="dd-ctip__sep">:</span>
                          <span className="dd-ctip__val">
                            {fmt(t.no)} · {pct1(100 - t.pct)}
                          </span>
                        </div>
                        <div
                          className="dd-ctip__row"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span
                            className="dd-ctip__dot"
                            style={{ background: "var(--chart-neutral)" }}
                          />
                          <span className="dd-ctip__lab">Total selesai</span>
                          <span className="dd-ctip__sep">:</span>
                          <span className="dd-ctip__val">
                            {fmt(t.ok + t.no)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <span />
            <div style={{ display: "flex" }}>
              {trend.map((t) => (
                <span
                  key={t.key}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: "center",
                    font: "500 10.5px/1 var(--dd-font-sans)",
                    color:
                      hover === t.key
                        ? "var(--text-primary)"
                        : "var(--chart-axis)",
                  }}
                >
                  {t.label}
                  {t.partial ? "*" : ""}
                </span>
              ))}
            </div>
          </div>
          {note && (
            <div className="dd-chart__note" style={{ marginTop: 2 }}>
              {note}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
