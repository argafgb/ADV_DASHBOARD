"use client";

import { useState } from "react";

import { TrendingUp } from "lucide-react";
import { useMeasuredWidth } from "./axis";
import { TipRows } from "./chart-tooltip";
import { EmptyState } from "./empty-state";

/**
 * Chart garis "Monthly repairs" — port dari `IrLine` buatan desain: garis
 * 2,5px dengan area tipis di bawahnya, titik per bulan, nilai di atas titik,
 * kolom hover bergaris putus, dan tooltip satu seri.
 */
export function LineChart({
  labels,
  tipLabels,
  data,
  color,
  name,
  height = 250,
}: {
  labels: string[];
  tipLabels: string[];
  data: number[];
  color: string;
  name: string;
  height?: number;
}) {
  if (!labels || labels.length === 0 || !data || data.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Tidak Ada Data Tren"
        message="Belum ada data bulanan untuk ditampilkan pada grafik garis."
        height={height}
      />
    );
  }

  const [ref, W] = useMeasuredWidth<HTMLDivElement>(800);
  const [hov, setHov] = useState<{ i: number; cx: number; cy: number } | null>(null);
  const PL = 40;
  const PR = 16;
  const PT = 26;
  const PB = 30;
  const n = labels.length;
  const max = Math.max(1, ...data);
  const step = Math.max(1, Math.ceil(max / 4 / 5) * 5);
  const topV = step * 4;
  const ticks = [0, 1, 2, 3, 4].map((k) => k * step);
  const band = n ? (W - PL - PR) / n : W - PL - PR;
  const x = (i: number) => PL + band * (i + 0.5);
  const y = (v: number) => PT + (1 - v / topV) * (height - PT - PB);
  const d = data.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");

  return (
    <div className="dd-chart" ref={ref}>
      <svg className="dd-line" width="100%" height={height} viewBox={`0 0 ${W} ${height}`}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="dd-chart__grid" x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} />
            <text className="dd-chart__axis" x={PL - 9} y={y(v) + 3.5} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <line className="dd-chart__axisline" x1={PL} x2={PL} y1={PT - 6} y2={y(0)} />
        <line className="dd-chart__axisline" x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} />
        {labels.map((l, i) => (
          <text key={`l${i}`} className="dd-chart__axis" x={x(i)} y={height - 10} textAnchor="middle">
            {l}
          </text>
        ))}
        {n > 0 && (
          <path
            d={`${d} L${x(n - 1)} ${y(0)} L${x(0)} ${y(0)} Z`}
            fill={color}
            opacity={0.08}
          />
        )}
        {hov && (
          <line
            x1={x(hov.i)}
            x2={x(hov.i)}
            y1={PT - 6}
            y2={y(0)}
            stroke="var(--chart-axis)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}
        {n > 0 && <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
        {data.map((v, i) => {
          const on = hov?.i === i;
          return (
            <g key={`c${i}`}>
              <circle className="dd-line__dot" cx={x(i)} cy={y(v)} r={on ? 5.5 : 4} stroke={color} />
              <text
                className="dd-chart__barval"
                x={x(i)}
                y={y(v) - 11}
                textAnchor="middle"
                style={on ? { fill: "var(--text-primary)" } : undefined}
              >
                {v}
              </text>
            </g>
          );
        })}
        {data.map((_, i) => (
          <rect
            key={`z${i}`}
            x={PL + band * i}
            y={PT - 6}
            width={band}
            height={y(0) - PT + 6}
            fill="transparent"
            onMouseMove={(e) => setHov({ i, cx: e.clientX, cy: e.clientY })}
            onMouseLeave={() => setHov(null)}
          />
        ))}
      </svg>
      {hov && (
        <div className="dd-ctip" style={{ left: hov.cx, top: hov.cy - 12 }}>
          <TipRows title={tipLabels[hov.i]} rows={[{ color, label: name, value: data[hov.i] }]} />
        </div>
      )}
    </div>
  );
}
