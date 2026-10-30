"use client";

import React, { useState, type MouseEvent } from "react";
import { useCountUp } from "../../hooks/useCountUp";
import { FloatingTip } from "./chart-tooltip";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: readonly DonutSegment[];
  total: number;
  hoveredIndex?: number | null;
  onHoverSegment?: (index: number | null, e?: MouseEvent) => void;
  size?: number;
  stroke?: number;
}

const GAP = 3;

/**
 * Standard Donut Chart:
 * - Ujung potongan flat / lurus (tanpa strokeLinecap="round").
 * - Celah lurus 3px antar segmen.
 * - Track lingkaran abu-abu terang (#EEF1F6), tanpa arsir.
 * - Efek hover dimming (.dd-chart--dim + .is-hot) dan tooltip mengambang.
 */
export function DonutChart({
  segments,
  total,
  hoveredIndex,
  onHoverSegment,
  size = 176,
  stroke = 24,
}: DonutChartProps) {
  const [internalHot, setInternalHot] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const activeIndex = hoveredIndex !== undefined ? hoveredIndex : (internalHot?.index ?? null);

  const animatedTotal = useCountUp(total);
  const geometryTotal = Math.max(1, animatedTotal);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs = segments.reduce<{ offset: number; dash: number; percent: number }[]>(
    (acc, segment, i) => {
      const raw = total > 0 ? (segment.value / geometryTotal) * circumference : 0;
      const prev = acc[i - 1];
      acc.push({
        offset: prev ? prev.offset + prev.dash + (segments.length > 1 ? GAP : 0) : 0,
        dash: Math.max(0, raw - (segments.length > 1 ? GAP : 0)),
        percent: total > 0 ? Math.round((segment.value / total) * 100) : 0,
      });
      return acc;
    },
    [],
  );

  const handleMouseEnter = (i: number, e: MouseEvent) => {
    if (onHoverSegment) {
      onHoverSegment(i, e);
    } else {
      setInternalHot({ index: i, x: e.clientX, y: e.clientY - 12 });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (onHoverSegment) {
      onHoverSegment(activeIndex, e);
    } else {
      setInternalHot((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY - 12 } : null));
    }
  };

  const handleMouseLeave = () => {
    if (onHoverSegment) {
      onHoverSegment(null);
    } else {
      setInternalHot(null);
    }
  };

  const isDimmed = activeIndex !== null;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`block h-auto w-full max-w-[${size}px] ${isDimmed ? "dd-chart--dim" : ""}`}
        role="img"
        aria-label={`Komposisi ${total} program`}
      >
        {/* Track abu-abu solid standar design system, tanpa arsir */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EEF1F6"
          strokeWidth={stroke}
          className="dark:stroke-zinc-800"
        />

        {total > 0 &&
          arcs.map((arc, i) => {
            const segment = segments[i];
            const isHot = activeIndex === i;
            return (
              <circle
                key={segment.label}
                className={`dd-mark transition-all duration-150 ${isHot ? "is-hot" : ""}`}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
                strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                strokeDashoffset={-arc.offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{
                  cursor: "pointer",
                  transition:
                    "stroke-dasharray 400ms ease-out, stroke-dashoffset 400ms ease-out, opacity 150ms ease",
                }}
                onMouseEnter={(e) => handleMouseEnter(i, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}

        {/* Center label */}
        <text
          x={size / 2}
          y={size / 2 + 2}
          textAnchor="middle"
          fontSize={28}
          fontWeight={600}
          className="fill-zinc-900 dark:fill-zinc-100 font-sans tabular-nums"
        >
          {animatedTotal}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 20}
          textAnchor="middle"
          fontSize={11}
          fontWeight={500}
          className="fill-zinc-400 dark:fill-zinc-400 font-sans"
        >
          program
        </text>
      </svg>

      {/* Internal floating tip bila dipanggil standalone tanpa legend handler */}
      {hoveredIndex === undefined && internalHot !== null && segments[internalHot.index] && (
        <FloatingTip
          x={internalHot.x}
          y={internalHot.y}
          title={segments[internalHot.index].label}
          rows={[
            {
              color: segments[internalHot.index].color,
              label: "Jumlah",
              value: `${segments[internalHot.index].value} program`,
            },
            {
              label: "Porsi",
              value: `${arcs[internalHot.index]?.percent ?? 0}%`,
            },
          ]}
        />
      )}
    </div>
  );
}
