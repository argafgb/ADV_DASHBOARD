"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { Card } from "../ds/card";
import { FloatingTip } from "../ds/chart-tooltip";
import { niceAxis, useMeasuredWidth } from "../ds/chart-utils";
import type { YoyDataPoint } from "../../types/overview.types";

interface YoyLineChartProps {
  title: string;
  subtitle: string;
  chipLabel: string;
  baseYear: number;
  data: YoyDataPoint[];
  unit: string;
  format?: "default" | "currency";
}

const H = 286;
const PL = 54;
const PR = 22;
const PT = 30;
const PB = 36;
const MIN_W = 420;

const SERIES = [
  { key: "year2024", offset: -2, color: "var(--chart-neutral)" },
  { key: "year2025", offset: -1, color: "var(--chart-blue-light)" },
  { key: "year2026", offset: 0, color: "var(--chart-blue-primary)" },
] as const;

type Tip = { i: number; category: string; x: number; y: number };

export function YoyLineChart({
  title,
  subtitle,
  chipLabel,
  baseYear,
  data,
  unit,
  format = "default",
}: YoyLineChartProps) {
  const seriesLabel = (offset: number) => String(baseYear + offset);
  const [ref, measured] = useMeasuredWidth<HTMLDivElement>(900);
  const [tip, setTip] = useState<Tip | null>(null);

  const W = Math.max(MIN_W, measured);
  const labels = data.map((d) => d.month);

  const values = data.flatMap((d) =>
    SERIES.map((s) => d[s.key]).filter((v): v is number => v != null),
  );
  const { step, top } = niceAxis(Math.max(...values, 1));

  const x = (i: number) =>
    PL + (i / Math.max(labels.length - 1, 1)) * (W - PL - PR);
  const y = (v: number) => PT + (1 - v / top) * (H - PT - PB);
  const band = (W - PL - PR) / Math.max(labels.length - 1, 1);

  const id = (v: number, digits: number) =>
    v.toLocaleString("id-ID", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  const currency = format === "currency";
  const tick = (v: number) => id(v, 0);
  const point = (v: number) => (currency ? id(Math.round(v), 0) : id(v, 2));
  const tipValue = (v: number) =>
    currency ? `Rp${id(v, 1)} jt` : `${id(v, 2)} ${unit}`;

  const lead = SERIES[SERIES.length - 1];
  const ticks = Array.from({ length: 5 }, (_, i) => i * step);

  const legend = (
    <>
      <span className="dd-chart__legend" style={{ marginRight: 4 }}>
        {SERIES.map((s) => (
          <span className="dd-chart__legenditem" key={s.key}>
            <span
              className="dd-chart__dot dd-chart__dot--round"
              style={{ background: s.color }}
            />
            {seriesLabel(s.offset)}
          </span>
        ))}
      </span>
      <span className="dd-chip dd-chip--blue">{chipLabel}</span>
    </>
  );

  return (
    <Card
      className="dd-trendcard"
      title={title}
      subtitle={subtitle}
      actions={legend}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Tidak Ada Data Pada Periode Ini"
          description="Data tren akan muncul setelah sinkronisasi dari HRIS selesai."
          height={H}
        />
      ) : (
        <div className="dd-chart" ref={ref}>
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ display: "block", maxWidth: "100%" }}
          >
            <g>
              {ticks.map((v) => (
                <g key={v}>
                  <line
                    className="dd-chart__gridDash"
                    x1={PL}
                    x2={W - PR}
                    y1={y(v)}
                    y2={y(v)}
                  />
                  <text
                    className="dd-chart__axis"
                    x={PL - 9}
                    y={y(v) + 3.5}
                    textAnchor="end"
                  >
                    {tick(v)}
                  </text>
                </g>
              ))}
            </g>

            <line
              className="dd-chart__axisline"
              x1={PL}
              x2={PL}
              y1={PT}
              y2={y(0)}
            />
            <line
              className="dd-chart__axisline"
              x1={PL}
              x2={W - PR}
              y1={y(0)}
              y2={y(0)}
            />

            <g>
              {labels.map((l, i) => (
                <text
                  key={l}
                  className="dd-chart__axis"
                  x={x(i)}
                  y={H - 12}
                  textAnchor="middle"
                >
                  {l}
                </text>
              ))}
            </g>

            {SERIES.map((s) => {
              const pts = data
                .map((d, i) => {
                  const val = d[s.key];
                  return val != null ? { i, val } : null;
                })
                .filter((p): p is { i: number; val: number } => p != null);

              if (pts.length < 2) return null;
              const pathD = pts
                .map((p, idx) => `${idx === 0 ? "M" : "L"} ${x(p.i)} ${y(p.val)}`)
                .join(" ");

              return (
                <path
                  key={s.key}
                  d={pathD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.key === lead.key ? 2.6 : 1.8}
                />
              );
            })}

            {SERIES.map((s) =>
              data.map((d, i) => {
                const val = d[s.key];
                if (val == null) return null;
                const isLead = s.key === lead.key;
                const isHot = tip?.i === i;
                return (
                  <circle
                    key={`${s.key}-${i}`}
                    cx={x(i)}
                    cy={y(val)}
                    r={isLead ? 4.5 : 3.5}
                    fill="#fff"
                    stroke={s.color}
                    strokeWidth={isLead ? 2.5 : 2}
                    className={`dd-line__dot${isHot ? " is-hot" : ""}`}
                  />
                );
              }),
            )}

            {data.map((d, i) => {
              const val = d[lead.key];
              if (val == null) return null;
              return (
                <text
                  key={`lead-val-${i}`}
                  x={x(i)}
                  y={y(val) - 8}
                  textAnchor="middle"
                  className="dd-chart__barval"
                  style={{
                    fontWeight: "var(--fw-semibold)",
                    fill: "var(--text-primary)",
                  }}
                >
                  {point(val)}
                </text>
              );
            })}

            <g>
              {labels.map((l, i) => (
                <rect
                  key={`hit-${l}`}
                  x={x(i) - band / 2}
                  y={PT}
                  width={band}
                  height={H - PT - PB}
                  fill="transparent"
                  onMouseEnter={(e) =>
                    setTip({ i, category: l, x: e.clientX, y: e.clientY - 12 })
                  }
                  onMouseMove={(e) =>
                    setTip({ i, category: l, x: e.clientX, y: e.clientY - 12 })
                  }
                  onMouseLeave={() => setTip(null)}
                  style={{ cursor: "default" }}
                />
              ))}
            </g>
          </svg>

          {tip && (
            <FloatingTip
              x={tip.x}
              y={tip.y}
              title={tip.category}
              rows={[...SERIES].reverse().flatMap((s) => {
                const val = data[tip.i]?.[s.key];
                return val == null
                  ? []
                  : [
                      {
                        color: s.color,
                        label: seriesLabel(s.offset),
                        value: tipValue(val),
                      },
                    ];
              })}
            />
          )}
        </div>
      )}
    </Card>
  );
}
