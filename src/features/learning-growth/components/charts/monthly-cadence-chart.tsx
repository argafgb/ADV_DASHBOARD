"use client";

import { Fragment, useRef, useState } from "react";
import { ChartTooltip, type ChartTooltipRow } from "./chart-tooltip";
import { MONTHS_LONG, MONTHS_SHORT } from "../../utils/dashboard-config";
import { visibleSeriesMonthIndexes } from "../../utils/filter-utils";

export interface CadenceSeries {
  /** Nilai per bulan Januari-Desember; null = bulan tanpa data, tidak digambar. */
  data: readonly (number | null)[];
  color: string;
  area: boolean;
  label: string;
  unit?: "program" | "%";
  dashed?: boolean;
}

const WIDTH = 1080;
const HEIGHT = 208;
const PAD_LEFT = 48;
const PAD_RIGHT = 18;
const PAD_TOP = 18;
const PAD_BOTTOM = 26;
const PLOT_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;
/** Sumbu X selalu Januari-Desember: Overview tidak memakai filter bulan. */
const AXIS_MONTHS = MONTHS_SHORT.map((_, index) => index);
const COLUMN_WIDTH = PLOT_WIDTH / (AXIS_MONTHS.length - 1);

function smoothPath(points: readonly [number, number][]) {
  if (points.length === 0) return "";
  return points.slice(1).reduce(
    (path, [nextX, nextY], index) => {
      const [currentX, currentY] = points[index]!;
      const controlOffset = (nextX - currentX) / 3;
      return `${path} C${(currentX + controlOffset).toFixed(1)},${currentY.toFixed(1)} ${(nextX - controlOffset).toFixed(1)},${nextY.toFixed(1)} ${nextX.toFixed(1)},${nextY.toFixed(1)}`;
    },
    `M${points[0]![0].toFixed(1)},${points[0]![1].toFixed(1)}`,
  );
}

/** Reference cadence chart: smooth lines, soft area fill, and month hover columns. */
export function MonthlyCadenceChart({ series }: { series: readonly CadenceSeries[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tip, setTip] = useState<{ i: number; left: number; top: number } | null>(null);
  const activeMonthIndex = tip?.i ?? null;
  // Seri tahun berjalan berhenti di bulan ini, supaya bulan yang belum
  // berjalan tidak terbaca seolah turun ke nol. Bulan bernilai null juga
  // tidak diberi titik, dan garisnya putus di sana.
  const visibleSeries = series.map((item) => {
    const months = visibleSeriesMonthIndexes(item.label, AXIS_MONTHS);
    const points = months.flatMap((monthIndex) => {
      const value = item.data[monthIndex];
      return value === null || value === undefined ? [] : [{ monthIndex, value }];
    });
    const runs = points.reduce<(typeof points)[]>((result, point, index) => {
      const previous = points[index - 1];
      if (previous && point.monthIndex === previous.monthIndex + 1) {
        result[result.length - 1]!.push(point);
      } else {
        result.push([point]);
      }
      return result;
    }, []);
    return { ...item, months, points, runs };
  });
  const isPercent = visibleSeries.some((s) => s.unit === "%");
  const maxValue = isPercent
    ? 100
    : Math.max(3, ...visibleSeries.flatMap((s) => s.points.map((point) => point.value)));
  const x = (i: number) => PAD_LEFT + (i / (AXIS_MONTHS.length - 1)) * PLOT_WIDTH;
  const y = (v: number) => PAD_TOP + PLOT_HEIGHT - (v / maxValue) * PLOT_HEIGHT;
  const hoverColumn = (i: number) => {
    const left = Math.max(PAD_LEFT, x(i) - COLUMN_WIDTH / 2);
    const right = Math.min(WIDTH - PAD_RIGHT, x(i) + COLUMN_WIDTH / 2);
    return { left, width: right - left };
  };
  const gridLines = Array.from({ length: maxValue + 1 }, (_, g) => g);
  // Label tahun selalu ikut bila chart memuat dua tahun, termasuk di bulan
  // yang baru punya nilai untuk satu tahun saja.
  const keyed = visibleSeries.length > 1;
  const tooltipRows = (monthIndex: number): ChartTooltipRow[] =>
    visibleSeries.flatMap((s) => {
      if (!s.months.includes(monthIndex)) return [];
      const point = s.points.find((candidate) => candidate.monthIndex === monthIndex);
      const value = point
        ? `${point.value}${s.unit === "%" ? "%" : " program"}`
        : "tidak ada program";
      return [{ color: s.color, text: keyed ? `${s.label}: ${value}` : value }];
    });

  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full min-w-[620px] sm:min-w-0"
        role="img"
        aria-label="Grafik program bulanan"
      >
        <defs>
          {visibleSeries
            .filter((s) => s.area)
            .map((s) => (
              <linearGradient
                key={s.label}
                id={`tcGrad-${s.color.slice(1)}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
        </defs>
        {gridLines
          .filter((g) => !isPercent || g % 25 === 0)
          .map((g) => (
            <Fragment key={g}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={y(g)}
                y2={y(g)}
                stroke="#E5E7EB"
                strokeWidth={1}
                className="dark:stroke-zinc-800"
              />
              <text
                x={PAD_LEFT - 8}
                y={y(g) + 4}
                textAnchor="end"
                fontSize={13}
                fill="#6B7280"
                fontFamily="'Plus Jakarta Sans',sans-serif"
                className="dark:fill-zinc-400"
              >
                {g}
                {isPercent ? "%" : ""}
              </text>
            </Fragment>
          ))}
        {visibleSeries.map((s, si) => {
          return (
            <Fragment key={s.label}>
              {/* Satu ruas per rangkaian bulan berurutan yang punya nilai. */}
              {s.runs.map((run) => {
                const line = smoothPath(
                  run.map((point) => [x(point.monthIndex), y(point.value)] as const),
                );
                return (
                  <Fragment key={run[0]!.monthIndex}>
                    {/* Satu titik tidak punya rentang, jadi tidak diberi bidang area. */}
                    {s.area && run.length > 1 && (
                      <path
                        d={`${line} L${x(run[run.length - 1]!.monthIndex)},${PAD_TOP + PLOT_HEIGHT} L${x(run[0]!.monthIndex)},${PAD_TOP + PLOT_HEIGHT} Z`}
                        fill={`url(#tcGrad-${s.color.slice(1)})`}
                        className="dh-chart-area-reveal"
                      />
                    )}
                    <path
                      d={line}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2.25}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeDasharray={s.dashed ? "7 6" : undefined}
                      pathLength={s.dashed ? undefined : 1}
                      className={s.dashed ? "dh-chart-line-dashed" : "dh-chart-line-draw"}
                    />
                  </Fragment>
                );
              })}
              {s.points.map((point, i) => {
                const pointX = x(point.monthIndex);
                const pointY = y(point.value);
                const isHot = activeMonthIndex === point.monthIndex;
                if (s.dashed) {
                  const size = isHot ? 6 : 4.5;
                  return (
                    <polygon
                      key={`${si}-${i}`}
                      points={`${pointX + size},${pointY} ${pointX - size * 0.8},${pointY - size} ${pointX - size * 0.8},${pointY + size}`}
                      fill="#fff"
                      stroke={s.color}
                      strokeWidth={isHot ? 2.5 : 2}
                      strokeLinejoin="round"
                      className="dh-chart-point-pop transition-all duration-150"
                      style={{
                        animationDelay: `${180 + i * 35 + si * 60}ms`,
                        pointerEvents: "none",
                        opacity: activeMonthIndex !== null && !isHot ? 0.35 : 1,
                      }}
                    />
                  );
                }
                return (
                  <circle
                    key={`${si}-${i}`}
                    cx={pointX}
                    cy={pointY}
                    r={isHot ? 5.5 : 3.2}
                    fill="#fff"
                    stroke={s.color}
                    strokeWidth={isHot ? 2.5 : 2}
                    className="dh-chart-point-pop transition-all duration-150"
                    style={{
                      animationDelay: `${180 + i * 35 + si * 60}ms`,
                      opacity: activeMonthIndex !== null && !isHot ? 0.35 : 1,
                    }}
                  />
                );
              })}
            </Fragment>
          );
        })}
        {activeMonthIndex !== null && (
          <line
            x1={x(activeMonthIndex)}
            x2={x(activeMonthIndex)}
            y1={PAD_TOP - 6}
            y2={PAD_TOP + PLOT_HEIGHT}
            stroke="#94A3B8"
            strokeWidth={1}
            opacity={0.65}
            pointerEvents="none"
          />
        )}
        {AXIS_MONTHS.map((monthIndex) => (
          <text
            key={MONTHS_SHORT[monthIndex]}
            x={x(monthIndex)}
            y={HEIGHT - 6}
            textAnchor="middle"
            fontSize={13}
            fill="#6B7280"
            fontFamily="'Plus Jakarta Sans',sans-serif"
            className="dark:fill-zinc-400"
          >
            {MONTHS_SHORT[monthIndex]}
          </text>
        ))}
        {AXIS_MONTHS.map((monthIndex) => {
          const hitArea = hoverColumn(monthIndex);
          return (
            <rect
              key={MONTHS_LONG[monthIndex]}
              x={hitArea.left}
              y={PAD_TOP - 6}
              width={hitArea.width}
              height={PLOT_HEIGHT + 12}
              fill="transparent"
              style={{ pointerEvents: "all" }}
              onMouseEnter={() => {
                const svg = svgRef.current;
                if (!svg) return;
                const rect = svg.getBoundingClientRect();
                const topValue = Math.max(
                  0,
                  ...visibleSeries.flatMap((s) =>
                    s.points
                      .filter((point) => point.monthIndex === monthIndex)
                      .map((point) => point.value),
                  ),
                );
                setTip({
                  i: monthIndex,
                  left: rect.left + (x(monthIndex) / WIDTH) * rect.width,
                  top: rect.top + (y(topValue) / HEIGHT) * rect.height,
                });
              }}
              onMouseLeave={() => setTip(null)}
            />
          );
        })}
      </svg>
      {tip !== null && (
        <ChartTooltip
          left={tip.left}
          top={tip.top}
          title={MONTHS_LONG[tip.i]!}
          rows={tooltipRows(tip.i)}
          keyed={keyed}
        />
      )}
    </div>
  );
}
