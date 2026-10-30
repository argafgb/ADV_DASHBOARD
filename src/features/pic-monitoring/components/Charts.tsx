"use client";

import React from "react";

import { TipScope } from "./chart-tooltip";
import { getPieSegmentGeometry } from "../utils/chart-geometry";
import { MONTH_OPTIONS } from "../utils/period-filter";

export function topRoundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

// ---- Circular arc gauge (milestone pipeline) ----
interface ArcGaugeProps {
  pct: number;
  color: string;
  label: string;
  frac: string;
  size?: number;
  stroke?: number;
}

export function ArcGauge({
  pct,
  color,
  label,
  frac,
  size = 70,
  stroke = 7,
}: ArcGaugeProps) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const dash = (pct / 100) * C;
  return (
    <div className="flex flex-col items-center gap-1.5 relative z-10">
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="#FFFFFF"
          stroke="#EEF1F6"
          strokeWidth={stroke}
        ></circle>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${C}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        ></circle>
        <text
          x={size / 2}
          y={size / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[15px] font-bold fill-gray-900 font-sans"
        >
          {pct}%
        </text>
      </svg>
      <div className="text-[17px] font-bold text-gray-800 font-display tracking-tight text-center leading-tight">
        {label}
      </div>
      <div className="text-[13px] text-gray-400 -mt-1 tabular-nums">{frac}</div>
    </div>
  );
}

// ---- Vertical bar chart with rounded tops ----
interface VBarChartProps {
  data: {
    value: number;
    label?: string;
    year?: string;
    color: string;
    valueLabel?: string;
    chip?: { text: string; kind: "green" | "red" };
  }[];
  height?: number;
  max?: number | null;
  fmt?: (v: number) => string | number;
  yTicks?: number[] | null;
  barRadius?: number;
  /** Nama nilai pada tooltip, mis. "Proyek diajukan". */
  seriesLabel?: string;
}

export function VBarChart({
  data,
  height = 220,
  max = null,
  fmt = (v) => v,
  yTicks = null,
  barRadius = 6,
  seriesLabel = "Nilai",
}: VBarChartProps) {
  const W = 560;
  const H = height;
  const padL = 44;
  const padR = 24;
  const padB = 30;
  const padT = data.some((d) => d.chip) ? 52 : 38;
  const m = max || Math.ceil(Math.max(...data.map((d) => d.value), 1) * 1.1);
  const n = data.length;
  const slot = (W - padL - padR) / Math.max(n, 1);
  const bw = Math.min(slot * 0.52, 56);
  const ticks = yTicks || [0, Math.round(m / 2), Math.round(m)];
  const y = (v: number) => H - padB - (v / m) * (H - padB - padT);
  const getTip = (key: string) => {
    const d = data[Number(key)];
    if (!d) return null;
    return {
      title: d.year || d.label,
      rows: [
        {
          color: d.color,
          label: seriesLabel,
          value: d.valueLabel != null ? d.valueLabel : fmt(d.value),
        },
      ],
    };
  };
  return (
    <TipScope getTip={getTip}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full h-auto select-none"
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              stroke="#E5E7EB"
              strokeDasharray="4 4"
              strokeWidth="1"
            ></line>
            <text
              x={padL - 6}
              y={y(t) + 4}
              textAnchor="end"
              className="text-[12px] fill-gray-400 font-display"
            >
              {fmt(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + slot * i + (slot - bw) / 2;
          const by = y(d.value);
          const bh = H - padB - by;
          return (
            <g key={i} data-tip={String(i)}>
              {/* Area hover selebar kolom, supaya tooltip muncul tanpa harus
                tepat di atas batang. */}
              <rect
                x={padL + slot * i}
                y={padT - 20}
                width={slot}
                height={H - padB - padT + 20}
                fill="transparent"
              />
              <path
                d={topRoundedRect(x, by, bw, Math.max(bh, 2), barRadius)}
                fill={d.color}
              ></path>
              <text
                x={x + bw / 2}
                y={by - 7}
                textAnchor="middle"
                className="text-[13px] font-bold fill-gray-900 font-sans"
              >
                {d.valueLabel != null ? d.valueLabel : fmt(d.value)}
              </text>
              <text
                x={x + bw / 2}
                y={H - padB + 18}
                textAnchor="middle"
                className="text-[12px] fill-gray-500 font-sans"
              >
                {d.year || d.label}
              </text>
              {d.chip ? (
                <g transform={`translate(${x + bw / 2}, ${by - 32})`}>
                  <rect
                    x={-26}
                    y={-11}
                    width={52}
                    height={17}
                    rx={8.5}
                    fill={d.chip.kind === "green" ? "#D1FAE5" : "#FEE2E2"}
                  ></rect>
                  <text
                    x={0}
                    y={2}
                    textAnchor="middle"
                    className={`text-[9.5px] font-bold ${d.chip.kind === "green" ? "fill-emerald-600" : "fill-red-600"} font-sans`}
                  >
                    {d.chip.text}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
    </TipScope>
  );
}

// ---- Grouped bar chart (2 series per group) ----
interface GroupedBarChartProps {
  /** `label` menggantikan `year` pada judul tooltip, mis. "2026 · Mar". */
  data: { year: string; label?: string; achieved: number; not: number }[];
  height?: number;
  onBarClick?: (year: string) => void;
}

export function GroupedBarChart({
  data,
  height = 300,
  onBarClick,
}: GroupedBarChartProps) {
  const W = 1000;
  const H = height;
  const padL = 48;
  const padR = 28;
  const padB = 40;
  const padT = 58;

  // Find maximum value to scale y-axis
  const m = Math.max(...data.map((d) => Math.max(d.achieved, d.not)), 1) * 1.15;
  const n = data.length;
  const slot = (W - padL - padR) / n;
  const bw = Math.min(slot * 0.3, 128); // width of each bar
  const y = (v: number) => H - padB - (v / m) * (H - padB - padT);
  const getTip = (key: string) => {
    const d = data[Number(key)];
    if (!d) return null;
    const evaluated = d.achieved + d.not;
    return {
      title: d.label ?? d.year,
      rows: [
        { color: "#2563EB", label: "Achieved", value: d.achieved },
        { color: "#EF4444", label: "Not Achieved", value: d.not },
        {
          label: "Ketercapaian",
          value:
            evaluated === 0
              ? "Belum dievaluasi"
              : `${Math.round((d.achieved / evaluated) * 100)}%`,
        },
      ],
    };
  };

  return (
    <TipScope getTip={getTip}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full select-none"
      >
        {/* 3 Horizontal dashed scale guide lines */}
        {[0, m / 2, m].map((t, i) => (
          <line
            key={i}
            x1={padL}
            x2={W - padR}
            y1={y(t)}
            y2={y(t)}
            stroke="#E5E7EB"
            strokeDasharray="6 6"
            strokeWidth="1.5"
          ></line>
        ))}

        {data.map((d, i) => {
          const cx = padL + slot * i + slot / 2;
          // Spaced out bars side-by-side
          const x1 = cx - bw - 5;
          const x2 = cx + 5;

          // Ensure even 0 value has a tiny 2px height on the baseline for visual reference
          const y1 = y(d.achieved);
          const y2 = y(d.not);
          const h1 = Math.max(H - padB - y1, 2);
          const h2 = Math.max(H - padB - y2, 2);

          return (
            <g
              key={i}
              data-tip={String(i)}
              onClick={() => onBarClick?.(d.year)}
              className="cursor-pointer group/bar transition-all"
            >
              {/* Background hover area for easier clicking */}
              <rect
                x={cx - slot / 2 + 5}
                y={padT - 10}
                width={slot - 10}
                height={H - padB - padT + 15}
                fill="rgba(37, 99, 235, 0.02)"
                className="opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-xl"
              />

              {/* Achieved SLA (Blue Bar) */}
              <path
                d={topRoundedRect(x1, y1, bw, h1, 8)}
                fill="#2563EB"
                className="transition-all duration-300 group-hover/bar:fill-[#1D4ED8]"
              ></path>
              {/* Achieved Value text */}
              <text
                x={x1 + bw / 2}
                y={y1 - 10}
                textAnchor="middle"
                className="text-[22px] font-extrabold fill-[#2563EB] font-sans transition-all group-hover/bar:fill-[#1D4ED8]"
              >
                {d.achieved}
              </text>

              {/* Not Achieved SLA (Red Bar) */}
              <path
                d={topRoundedRect(x2, y2, bw, h2, 8)}
                fill="#EF4444"
                opacity={d.not === 0 ? 0.4 : 1}
                className="transition-all duration-300 group-hover/bar:fill-[#DC2626]"
              ></path>
              {/* Not Achieved Value text */}
              <text
                x={x2 + bw / 2}
                y={y2 - 10}
                textAnchor="middle"
                className="text-[22px] font-extrabold fill-[#EF4444] font-sans transition-all group-hover/bar:fill-[#DC2626]"
              >
                {d.not}
              </text>

              {/* Year Label */}
              <text
                x={cx}
                y={H - padB + 28}
                textAnchor="middle"
                className="text-[20px] font-bold fill-gray-500 font-sans group-hover/bar:fill-gray-900 transition-colors"
              >
                {d.year}
              </text>
            </g>
          );
        })}
      </svg>
    </TipScope>
  );
}

// ---- Pie (filled wedges) ----
interface PieChartProps {
  segments: { value: number; color: string; label?: string }[];
  size?: number;
}

/**
 * Setiap potongan membawa `data-tip` = label-nya. Bungkus pie bersama
 * legendanya dengan `TipScope` dan beri baris legenda kunci yang sama, maka
 * potongan dan barisnya menyala bersama saat salah satunya disorot.
 */
export function PieChart({ segments, size = 170 }: PieChartProps) {
  const geometry = getPieSegmentGeometry(segments, size);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="block h-auto max-w-full select-none"
      style={{ width: size }}
    >
      {geometry.map((segment, index) => (
        <path
          key={index}
          data-tip={segment.label ?? String(index)}
          d={segment.path}
          fill={segment.color}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

// ---- Stacked horizontal bar ----
interface StackedBarProps {
  year: string;
  completed: number;
  inflight: number;
  max: number;
}

export function StackedBar({
  year,
  completed,
  inflight,
  max,
}: StackedBarProps) {
  const cw = max > 0 ? (completed / max) * 100 : 0;
  const iw = max > 0 ? (inflight / max) * 100 : 0;
  return (
    <div data-tip={year} className="flex items-center gap-3">
      <div className="w-9 sm:w-11 flex-shrink-0 text-[12px] sm:text-[13px] font-semibold text-gray-700 font-sans">
        {year}
      </div>
      <div className="flex-1 flex h-[22px] rounded-lg overflow-hidden bg-gray-100">
        <div
          className="bg-blue-600 flex items-center justify-center transition-all duration-500 ease-out"
          style={{ width: `${cw}%` }}
        >
          {completed > 4 ? (
            <span className="text-[10.5px] font-bold text-white font-sans">
              {completed}
            </span>
          ) : null}
        </div>
        <div
          className="bg-amber-400 flex items-center justify-center transition-all duration-500 ease-out"
          style={{ width: `${iw}%` }}
        >
          {inflight > 4 ? (
            <span className="text-[10.5px] font-bold text-white font-sans">
              {inflight}
            </span>
          ) : null}
        </div>
      </div>
      <div className="hidden w-[60px] flex-shrink-0 text-[11px] text-gray-400 tabular-nums text-right sm:block">
        {completed + inflight} total
      </div>
    </div>
  );
}

// ---- Throughput Comparison Chart (previous vs selected year) ----
interface ThroughputComparisonChartProps {
  data: {
    monthIndex: number;
    monthName: string;
    val2025: number;
    val2026: number;
    selectedYearPending?: boolean;
  }[];
  height?: number;
  previousYearLabel?: string;
  selectedYearLabel?: string;
}

export function ThroughputComparisonChart({
  data,
  height = 230,
  previousYearLabel,
  selectedYearLabel,
}: ThroughputComparisonChartProps) {
  const W = 1100;
  const H = height;
  const padL = 44;
  const padR = 26;
  const padB = 35;
  const padT = 38;

  const n = data.length;
  if (n === 0) {
    return (
      <div className="flex items-center justify-center h-[230px] text-xs text-gray-400">
        Data evaluasi belum tersedia.
      </div>
    );
  }

  // Find max value to determine the scale
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.val2025, d.val2026)),
    4,
  );
  const yMax = maxVal + 1; // leave room at the top

  const slot = (W - padL - padR) / n;
  const bw = Math.min(slot * 0.36, 32); // bar width
  const y = (v: number) => H - padB - (v / yMax) * (H - padB - padT);

  // Satu tooltip per bulan memuat kedua tahun, jadi perbandingannya terbaca
  // tanpa harus menyorot dua batang bergantian.
  const getTip = (key: string) => {
    const d = data[Number(key)];
    if (!d) return null;
    return {
      title: MONTH_OPTIONS[d.monthIndex]?.label ?? d.monthName,
      rows: [
        {
          color: "#2563EB",
          label: previousYearLabel ?? "Tahun lalu",
          value: `${d.val2025} proyek`,
        },
        {
          color: "#F59E0B",
          label: selectedYearLabel ?? "Tahun terpilih",
          value: d.selectedYearPending
            ? "Belum berjalan"
            : `${d.val2026} proyek`,
        },
      ],
    };
  };

  return (
    <TipScope getTip={getTip}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full h-auto select-none"
      >
        {/* Horizontal scale line indicators */}
        {[0, yMax / 2, yMax].map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              stroke="#F3F4F6"
              strokeDasharray="4 4"
              strokeWidth="1"
            ></line>
            <text
              x={padL - 6}
              y={y(t) + 4}
              textAnchor="end"
              className="text-[13px] fill-gray-400 font-display"
            >
              {Math.round(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = padL + slot * i + slot / 2;
          // Two side by side bars
          const x1 = cx - bw - 2;
          const x2 = cx + 2;

          const by1 = y(d.val2025);
          const bh1 = Math.max(H - padB - by1, 1.5);

          const by2 = y(d.val2026);
          const bh2 = Math.max(H - padB - by2, 1.5);

          return (
            <g key={i} data-tip={String(i)}>
              {/* Area hover selebar kolom bulan. */}
              <rect
                x={padL + slot * i}
                y={padT - 20}
                width={slot}
                height={H - padB - padT + 20}
                fill="transparent"
              />
              {/* Previous year (blue), matching Project Volume and DEV SLA YoY. */}
              <path
                d={topRoundedRect(x1, by1, bw, bh1, 4)}
                fill="#2563EB"
                className="transition-all duration-300 hover:fill-[#1D4ED8]"
              />
              {d.val2025 > 0 && (
                <text
                  x={x1 + bw / 2}
                  y={by1 - 6}
                  textAnchor="middle"
                  className="text-[12px] font-bold fill-blue-700 font-sans"
                >
                  {d.val2025}
                </text>
              )}

              {/* Selected year (amber), matching Project Volume. Bulan yang
                belum terjadi sengaja tidak digambar supaya tidak terbaca
                sebagai realisasi nol. */}
              {!d.selectedYearPending && (
                <path
                  d={topRoundedRect(x2, by2, bw, bh2, 4)}
                  fill="#F59E0B"
                  className="transition-all duration-300 hover:fill-[#D97706]"
                />
              )}
              {!d.selectedYearPending && d.val2026 > 0 && (
                <text
                  x={x2 + bw / 2}
                  y={by2 - 6}
                  textAnchor="middle"
                  className="text-[12px] font-bold fill-amber-600 font-sans"
                >
                  {d.val2026}
                </text>
              )}

              {/* Month Name label */}
              <text
                x={cx}
                y={H - padB + 20}
                textAnchor="middle"
                className={`text-[12px] font-semibold font-sans uppercase tracking-wider ${
                  d.selectedYearPending ? "fill-gray-300" : "fill-gray-400"
                }`}
              >
                {d.monthName}
              </text>
            </g>
          );
        })}
      </svg>
    </TipScope>
  );
}
