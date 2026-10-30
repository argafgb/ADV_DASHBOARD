"use client";

import { useState } from "react";
import { FloatingTip } from "./chart-tooltip";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
  valueLabel?: string;
}

const GAP = 3;

export function Donut({
  data,
  centerValue,
  centerCaption,
  size = 172,
  stroke = 26,
  legend = false,
  total,
}: {
  data: DonutSlice[];
  centerValue: string;
  centerCaption: string;
  size?: number;
  stroke?: number;
  legend?: boolean;
  total?: number;
}) {
  const [hot, setHot] = useState<{ i: number; x: number; y: number } | null>(
    null,
  );

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = total ?? data.reduce((acc, d) => acc + d.value, 0);

  const arcs = data.reduce<{ offset: number; dash: number }[]>(
    (acc, slice, i) => {
      const raw = sum > 0 ? (slice.value / sum) * circumference : 0;
      const prev = acc[i - 1];
      acc.push({
        offset: prev ? prev.offset + prev.dash + GAP : 0,
        dash: Math.max(0, raw - GAP),
      });
      return acc;
    },
    [],
  );

  const pct = (value: number) =>
    sum > 0
      ? `${((value / sum) * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`
      : "–";

  return (
    <div className="dd-donut">
      <div
        className={`dd-donut__ring${hot ? " dd-chart--dim" : ""}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)", display: "block" }}
        >
          {data.map((slice, i) => {
            const arc = arcs[i];
            if (!arc || arc.dash <= 0) return null;
            const isHot = hot?.i === i;
            return (
              <circle
                key={slice.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={stroke}
                strokeDasharray={`${arc.dash} ${circumference}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="round"
                className={`dd-seg-part${isHot ? " is-hot" : ""}`}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) =>
                  setHot({ i, x: e.clientX, y: e.clientY - 12 })
                }
                onMouseMove={(e) =>
                  setHot({ i, x: e.clientX, y: e.clientY - 12 })
                }
                onMouseLeave={() => setHot(null)}
              />
            );
          })}
        </svg>

        <div className="dd-donut__center">
          <div className="dd-donut__pct">{centerValue}</div>
          <div className="dd-donut__caption">{centerCaption}</div>
        </div>
      </div>

      {legend && (
        <div className="dd-donut__legend">
          {data.map((slice, i) => {
            const isHot = hot?.i === i;
            return (
              <div
                key={slice.label}
                className={`dd-donut__lrow${isHot ? " is-hot" : ""}`}
                onMouseEnter={(e) =>
                  setHot({ i, x: e.clientX, y: e.clientY - 12 })
                }
                onMouseMove={(e) =>
                  setHot({ i, x: e.clientX, y: e.clientY - 12 })
                }
                onMouseLeave={() => setHot(null)}
              >
                <span
                  className="dd-chart__dot dd-chart__dot--round"
                  style={{ background: slice.color }}
                />
                <span className="dd-donut__lname">{slice.label}</span>
                <span className="dd-donut__lcount">
                  {slice.valueLabel ?? slice.value.toLocaleString("id-ID")}
                </span>
                <span className="dd-donut__lpct">{pct(slice.value)}</span>
              </div>
            );
          })}
        </div>
      )}

      {hot && data[hot.i] && (
        <FloatingTip
          x={hot.x}
          y={hot.y}
          title={data[hot.i].label}
          rows={[
            {
              color: data[hot.i].color,
              label: "Jumlah",
              value:
                data[hot.i].valueLabel ??
                data[hot.i].value.toLocaleString("id-ID"),
            },
            { label: "Porsi", value: pct(data[hot.i].value) },
          ]}
        />
      )}
    </div>
  );
}
