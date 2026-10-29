"use client";

import React from "react";
import { useHoverTip } from "../context/TooltipLayer";
import type { DonutSlice } from "../services/ispService";

/** Donut "Link per vendor ISP" — port donutChart() sumber (size 170, thick 26). */
export default function IspDonutChart({
  data,
  total,
}: {
  data: DonutSlice[];
  total: number;
}) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();
  const size = 170,
    thick = 26;
  const r = (size - thick) / 2,
    cx = size / 2,
    cy = size / 2,
    C = 2 * Math.PI * r;

  // Pra-hitung offset kumulatif tiap slice (pengganti akumulator `off` sumber).
  const slices: { d: DonutSlice; len: number; off: number }[] = [];
  for (let i = 0, acc = 0; i < (data || []).length; i++) {
    const d = data[i];
    const len = (d.count / total) * C;
    slices.push({ d, len, off: acc });
    acc += len;
  }

  return (
    <svg
      viewBox={"0 0 " + size + " " + size}
      style={{
        width: "min(170px, 100%)",
        height: "auto",
        aspectRatio: "1 / 1",
        display: "block",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--chart-gray-track)"
        strokeWidth={thick}
      />
      {slices.map(({ d, len, off }, i) => {
        const meta = d.vendors
          ? "Vendor: " + d.vendors.join(", ")
          : "Cabang: " +
            d.branches.slice(0, 6).join(", ") +
            (d.branches.length > 6 ? " +" + (d.branches.length - 6) : "");
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thick}
            strokeDasharray={len + " " + (C - len)}
            strokeDashoffset={-off}
            transform={"rotate(-90 " + cx + " " + cy + ")"}
            style={{ cursor: "pointer", transition: "stroke-width .12s" }}
            onMouseEnter={(e) => {
              e.currentTarget.setAttribute("stroke-width", String(thick + 5));
              tipEnter(
                e,
                {
                  title: d.name,
                  primary: d.count + " link",
                  secondary: "(" + d.count + " dari " + total + " link)",
                  meta,
                  tone: "blue",
                },
                "none",
              );
            }}
            onMouseMove={(e) => tipMove(e)}
            onMouseLeave={(e) => {
              e.currentTarget.setAttribute("stroke-width", String(thick));
              tipLeave();
            }}
          />
        );
      })}
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fontSize={26}
        fontWeight={800}
        fontFamily="var(--font-display)"
        fill="var(--text-primary)"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 17}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fontFamily="var(--font-body)"
        fill="var(--text-placeholder)"
      >
        link
      </text>
    </svg>
  );
}
