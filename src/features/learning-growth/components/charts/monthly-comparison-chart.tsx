"use client";

import { Fragment, useRef, useState } from "react";
import { ChartTooltip, type ChartTooltipRow } from "./chart-tooltip";
import { MONTHS_LONG, MONTHS_SHORT } from "../../utils/dashboard-config";

export interface ComparisonSeries {
  /** Tahun seri, mis. "2026". */
  label: string;
  color: string;
  /** Jumlah program unik per bulan, Januari sampai Desember. */
  data: readonly number[];
  /** Indeks bulan yang sudah berjalan; tahun berjalan berhenti di bulan ini. */
  months: readonly number[];
}

const WIDTH = 1080;
const HEIGHT = 232;
const PAD_LEFT = 48;
const PAD_RIGHT = 18;
const PAD_TOP = 26;
const PAD_BOTTOM = 26;
const PLOT_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;
const BASELINE = PAD_TOP + PLOT_HEIGHT;
const SLOT_WIDTH = PLOT_WIDTH / MONTHS_SHORT.length;
/** Kolom dibatasi 22px dengan celah 4px; sisa slot sengaja dibiarkan kosong. */
const BAR_WIDTH = 22;
const BAR_GAP = 4;
const BAR_RADIUS = 4;
/** Nilai nol tetap tampil tipis supaya tidak terbaca sebagai data hilang. */
const MIN_BAR_HEIGHT = 3;

/** Jarak garis bantu yang tetap jatuh di angka bulat. */
function tickStep(max: number): number {
  if (max <= 6) return 1;
  if (max <= 12) return 2;
  if (max <= 30) return 5;
  return Math.ceil(max / 30) * 5;
}

/** Kolom dengan ujung atas membulat dan alas rata di garis dasar. */
function columnPath(x: number, top: number, width: number): string {
  const r = Math.min(BAR_RADIUS, width / 2, BASELINE - top);
  return `M${x},${BASELINE} V${top + r} A${r},${r} 0 0 1 ${x + r},${top} H${x + width - r} A${r},${r} 0 0 1 ${x + width},${top + r} V${BASELINE} Z`;
}

/**
 * Grouped column chart jumlah program per bulan. Tahun pembanding di kiri,
 * tahun terpilih di kanan; bulan yang belum berjalan tidak diberi kolom.
 */
export function MonthlyComparisonChart({ series }: { series: readonly ComparisonSeries[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tip, setTip] = useState<{ month: number; left: number; top: number } | null>(null);
  // Model mengirim tahun terbaru dulu; kolom dibaca kronologis dari kiri.
  const ordered = [...series].reverse();
  const keyed = series.length > 1;
  const peak = Math.max(3, ...ordered.flatMap((s) => s.months.map((m) => s.data[m] ?? 0)));
  const step = tickStep(peak);
  const axisMax = Math.ceil(peak / step) * step;
  const ticks = Array.from({ length: axisMax / step + 1 }, (_, index) => index * step);
  const y = (value: number) => BASELINE - (value / axisMax) * PLOT_HEIGHT;
  const slotCenter = (month: number) => PAD_LEFT + SLOT_WIDTH * (month + 0.5);
  const groupWidth = ordered.length * BAR_WIDTH + (ordered.length - 1) * BAR_GAP;
  const barsAt = (month: number) =>
    ordered.flatMap((s, index) => {
      if (!s.months.includes(month)) return [];
      const value = s.data[month] ?? 0;
      return [
        {
          series: s,
          value,
          x: slotCenter(month) - groupWidth / 2 + index * (BAR_WIDTH + BAR_GAP),
          top: Math.min(y(value), BASELINE - MIN_BAR_HEIGHT),
          delay: month * 28 + index * 60,
        },
      ];
    });
  // Baris tooltip mengikuti urutan kolom: tahun pembanding dulu.
  const tooltipRows = (month: number): ChartTooltipRow[] =>
    ordered.flatMap((s) => {
      if (!s.months.includes(month)) return [];
      const value = `${s.data[month] ?? 0} program`;
      return [{ color: s.color, text: keyed ? `${s.label}: ${value}` : value }];
    });

  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full min-w-[620px] sm:min-w-0"
        role="img"
        aria-label={`Perbandingan jumlah program per bulan ${ordered.map((s) => s.label).join(" dan ")}`}
      >
        {ticks.map((tick) => (
          <Fragment key={tick}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#E5E7EB"
              strokeWidth={1}
              className="dark:stroke-zinc-800"
            />
            <text
              x={PAD_LEFT - 8}
              y={y(tick) + 4}
              textAnchor="end"
              fontSize={13}
              fill="#6B7280"
              fontFamily="'Plus Jakarta Sans',sans-serif"
              className="dark:fill-zinc-400"
            >
              {tick}
            </text>
          </Fragment>
        ))}
        {MONTHS_SHORT.map((label, month) => (
          <g
            key={label}
            className="transition-opacity duration-150"
            style={{ opacity: tip !== null && tip.month !== month ? 0.35 : 1 }}
          >
            {barsAt(month).map((bar) => (
              <Fragment key={bar.series.label}>
                <path
                  d={columnPath(bar.x, bar.top, BAR_WIDTH)}
                  fill={bar.series.color}
                  fillOpacity={bar.value === 0 ? 0.35 : 1}
                  className="dh-chart-bar-grow"
                  style={{ animationDelay: `${bar.delay}ms` }}
                />
                <text
                  x={bar.x + BAR_WIDTH / 2}
                  y={bar.top - 6}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={600}
                  fill={bar.value === 0 ? "#9CA3AF" : "#4B5563"}
                  fontFamily="'Plus Jakarta Sans',sans-serif"
                  className="dh-chart-label-reveal dark:fill-zinc-300"
                  style={{ animationDelay: `${bar.delay + 320}ms` }}
                >
                  {bar.value}
                </text>
              </Fragment>
            ))}
          </g>
        ))}
        {MONTHS_SHORT.map((label, month) => (
          <text
            key={label}
            x={slotCenter(month)}
            y={HEIGHT - 6}
            textAnchor="middle"
            fontSize={13}
            fill="#6B7280"
            fontFamily="'Plus Jakarta Sans',sans-serif"
            className="dark:fill-zinc-400"
          >
            {label}
          </text>
        ))}
        {MONTHS_LONG.map((label, month) => (
          <rect
            key={label}
            x={PAD_LEFT + SLOT_WIDTH * month}
            y={PAD_TOP - 20}
            width={SLOT_WIDTH}
            height={PLOT_HEIGHT + 20}
            fill="transparent"
            style={{ pointerEvents: "all" }}
            onMouseEnter={() => {
              const svg = svgRef.current;
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              const tallest = Math.min(BASELINE, ...barsAt(month).map((bar) => bar.top - 18));
              setTip({
                month,
                left: rect.left + (slotCenter(month) / WIDTH) * rect.width,
                top: rect.top + (tallest / HEIGHT) * rect.height,
              });
            }}
            onMouseLeave={() => setTip(null)}
          />
        ))}
      </svg>
      {tip !== null && (
        <ChartTooltip
          left={tip.left}
          top={tip.top}
          title={MONTHS_LONG[tip.month]!}
          rows={tooltipRows(tip.month)}
          keyed={keyed}
        />
      )}
    </div>
  );
}
