"use client";

import React from "react";
import { useFilters } from "@/features/network-performance/context/NetworkFilterContext";
import { useNetworkData } from "../context/NetworkDataContext";
import { windowLabel } from "../services/labels";
import { useHoverTip } from "../context/TooltipLayer";
import type { TipData } from "../context/TooltipLayer";

/**
 * Grouped bar chart "SLA {compare} vs {current}" — port barChart() sumber.
 * Konstanta H/padB/padT/axisW/bw/gap/group TIDAK diubah.
 */
export default function SlaComparisonBarChart({
  tahun,
  bulan,
  bulanMonths,
  compareYear,
}: {
  tahun: number;
  bulan: number | null;
  bulanMonths?: number[] | null;
  compareYear: number;
}) {
  const { bulanRange } = useFilters();
  const { sla, periods } = useNetworkData();
  const { tipEnter, tipMove, tipLeave } = useHoverTip();

  const H = 330,
    padB = 100,
    padT = 18,
    axisW = 46;
  const branches = sla.mapped();
  const win = sla.activeMonths(tahun, bulanRange ?? bulan, bulanMonths);
  const winCompare = sla.activeMonths(
    compareYear,
    bulanRange ?? bulan,
    bulanMonths,
  );
  const allM = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const TARGET = sla.TARGET;

  const rows = branches.map((b) => ({
    name: b.name,
    yCompare: sla.branchValW(b.name, compareYear, winCompare),
    yCurrent: sla.branchValW(b.name, tahun, win),
    fyCompare: sla.branchValW(b.name, compareYear, allM),
  }));

  // Floor follows the data so low outliers still draw a real bar instead of a
  // zero-height stub.
  const vals: number[] = [];
  rows.forEach((d) => {
    [d.yCompare, d.yCurrent, d.fyCompare].forEach((v) => {
      if (v != null) vals.push(v);
    });
  });
  const dataMin = vals.length ? Math.min.apply(null, vals) : 98.5;
  const lo = Math.min(98.5, Math.floor((dataMin - 0.2) * 2) / 2),
    hi = 100.0,
    plotH = H - padT - padB;
  const yv = (v: number) =>
    padT + plotH - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * plotH;
  const grid: number[] = [];
  for (let g = lo; g <= hi + 0.001; g += 0.5)
    grid.push(Math.round(g * 10) / 10);
  const bw = 14,
    gap = 5,
    group = bw * 2 + gap + 22,
    padL = 60,
    padR = 25,
    plotW = padL + rows.length * group + padR;
  const top = (x: number, y: number, w: number, ht: number, r: number) => {
    r = Math.min(r, w / 2, Math.max(0, ht));
    return (
      "M" +
      x +
      "," +
      (y + ht) +
      " L" +
      x +
      "," +
      (y + r) +
      " Q" +
      x +
      "," +
      y +
      " " +
      (x + r) +
      "," +
      y +
      " L" +
      (x + w - r) +
      "," +
      y +
      " Q" +
      (x + w) +
      "," +
      y +
      " " +
      (x + w) +
      "," +
      (y + r) +
      " L" +
      (x + w) +
      "," +
      (y + ht) +
      " Z"
    );
  };

  const mk = (name: string, v: number | null, yr: number): TipData => ({
    title: name,
    primary: "SLA " + (v != null ? v.toFixed(2) + "%" : "—"),
    secondary:
      "(" + windowLabel(bulan, periods.monthsByYear[yr] ?? []) + " " + yr + ")",
    meta:
      v == null
        ? "tidak ada data"
        : v >= TARGET
          ? "capai target"
          : "di bawah target",
    tone: sla.tone(v),
  });

  const axisSvg = (
    <svg
      width={axisW}
      height={H}
      viewBox={"0 0 " + axisW + " " + H}
      style={{ flexShrink: 0, display: "block" }}
    >
      {grid.map((g, i) =>
        g === TARGET ? null : (
          <text
            key={i}
            x={axisW - 8}
            y={yv(g) + 3}
            textAnchor="end"
            fontSize={10}
            fontFamily="var(--font-body)"
            fill="var(--chart-axis)"
          >
            {g.toFixed(1)}
          </text>
        ),
      )}
      <text
        x={axisW - 8}
        y={yv(TARGET) + 3}
        textAnchor="end"
        fontSize={9}
        fontWeight={700}
        fontFamily="var(--font-body)"
        fill="#DC2626"
      >
        {TARGET.toFixed(1)}
      </text>
    </svg>
  );

  const barsSvg = (
    <svg
      width={plotW}
      height={H}
      viewBox={"0 0 " + plotW + " " + H}
      style={{ display: "block" }}
    >
      {grid.map((g, i) => (
        <line
          key={i}
          x1={0}
          x2={plotW}
          y1={yv(g)}
          y2={yv(g)}
          stroke="var(--chart-grid)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}
      <line
        x1={0}
        x2={plotW}
        y1={yv(TARGET)}
        y2={yv(TARGET)}
        stroke="#DC2626"
        strokeWidth={1.6}
        strokeDasharray="6 4"
      />
      {rows.map((d, i) => {
        const cx = padL + group * i + group / 2;
        const x1 = cx - bw - gap / 2,
          x2 = cx + gap / 2;
        const tCmp = d.yCompare,
          tCur = d.yCurrent;
        return (
          <g key={i}>
            {tCmp != null ? (
              <path
                d={top(x1, yv(tCmp), bw, padT + plotH - yv(tCmp), 4)}
                fill="#475569"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) =>
                  tipEnter(e, mk(d.name, tCmp, compareYear), "none")
                }
                onMouseMove={(e) => tipMove(e)}
                onMouseLeave={() => tipLeave()}
              />
            ) : (
              <rect
                x={x1}
                y={padT + plotH - 4}
                width={bw}
                height={4}
                rx={2}
                fill="#94A3B8"
                opacity={0.4}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) =>
                  tipEnter(e, mk(d.name, null, compareYear), "none")
                }
                onMouseMove={(e) => tipMove(e)}
                onMouseLeave={() => tipLeave()}
              />
            )}
            {tCur != null ? (
              <path
                d={top(x2, yv(tCur), bw, padT + plotH - yv(tCur), 4)}
                fill="var(--accent)"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) =>
                  tipEnter(e, mk(d.name, tCur, tahun), "none")
                }
                onMouseMove={(e) => tipMove(e)}
                onMouseLeave={() => tipLeave()}
              />
            ) : (
              <rect
                x={x2}
                y={padT + plotH - 4}
                width={bw}
                height={4}
                rx={2}
                fill="var(--accent)"
                opacity={0.3}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) =>
                  tipEnter(e, mk(d.name, null, tahun), "none")
                }
                onMouseMove={(e) => tipMove(e)}
                onMouseLeave={() => tipLeave()}
              />
            )}
            {tCmp != null && (
              <text
                x={x1 + bw / 2}
                y={yv(tCmp) - 4}
                textAnchor="middle"
                fontSize={8}
                fontWeight={700}
                fontFamily="var(--font-display)"
                fill="#475569"
              >
                {tCmp.toFixed(1)}
              </text>
            )}
            {tCur != null && (
              <text
                x={x2 + bw / 2}
                y={yv(tCur) - 4}
                textAnchor="middle"
                fontSize={8}
                fontWeight={700}
                fontFamily="var(--font-display)"
                fill="var(--accent)"
              >
                {tCur.toFixed(1)}
              </text>
            )}
            <text
              transform={"rotate(-45 " + cx + " " + (H - padB + 18) + ")"}
              x={cx}
              y={H - padB + 18}
              textAnchor="end"
              fontSize={13}
              fontWeight={600}
              fontFamily="var(--font-body)"
              fill="var(--text-secondary)"
            >
              <title>{d.name}</title>
              {d.name}
            </text>
          </g>
        );
      })}
    </svg>
  );

  return (
    <div
      style={{
        position: "relative",
        isolation: "isolate",
        display: "flex",
        alignItems: "stretch",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          background: "var(--bg-card)",
          zIndex: 1,
          borderRight: "1px solid var(--border-subtle, #e4e4e7)",
        }}
      >
        {axisSvg}
      </div>
      <div
        className="nl-scroll"
        style={{ overflowX: "auto", overflowY: "hidden", flex: 1, minWidth: 0 }}
      >
        {barsSvg}
      </div>
    </div>
  );
}
