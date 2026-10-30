"use client";

import { useState } from "react";
import { ChartScatter } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { Card } from "../ds/card";
import { FloatingTip } from "../ds/chart-tooltip";
import { idNum, niceAxis, useMeasuredWidth } from "../ds/chart-utils";
import type { ScatterPoint } from "../../types/organization.types";

const H = 300;
const PL = 54;
const PR = 18;
const BOTTOM = 252;
const PLOT_TOP = 22;
const MIN_W = 460;

const GRID_DIVISIONS = 10;
const TICK_DIVISIONS = 5;
const AXIS_CHAR_W = 5.8;
const R_MIN = 5;
const R_SPAN = 9;
const LABEL_MIN_DX = 62;
const LABEL_MIN_DY = 13;

function pickLabels(points: { cx: number; cy: number }[]): boolean[] {
  const taken: { cx: number; cy: number }[] = [];

  return points.map((p) => {
    const collides = taken.some(
      (t) =>
        Math.abs(t.cx - p.cx) < LABEL_MIN_DX &&
        Math.abs(t.cy - p.cy) < LABEL_MIN_DY,
    );
    if (collides) return false;
    taken.push(p);
    return true;
  });
}

export function ScatterPlot({ data }: { data: ScatterPoint[] }) {
  const [ref, measured] = useMeasuredWidth<HTMLDivElement>(900);
  const [tip, setTip] = useState<{ i: number; x: number; y: number } | null>(
    null,
  );

  const W = Math.max(MIN_W, measured);

  const xMax = niceAxis(Math.max(...data.map((d) => d.hours), 1)).top;
  const yMax = niceAxis(Math.max(...data.map((d) => d.cost), 1)).top;

  const sx = (v: number) => PL + (v / xMax) * (W - PL - PR);
  const sy = (v: number) => BOTTOM - (v / yMax) * (BOTTOM - PLOT_TOP);

  const gridX = Array.from(
    { length: GRID_DIVISIONS + 1 },
    (_, i) => (i * xMax) / GRID_DIVISIONS,
  );
  const gridY = Array.from(
    { length: GRID_DIVISIONS + 1 },
    (_, i) => (i * yMax) / GRID_DIVISIONS,
  );
  const ticksX = Array.from(
    { length: TICK_DIVISIONS + 1 },
    (_, i) => (i * xMax) / TICK_DIVISIONS,
  );
  const ticksY = Array.from(
    { length: TICK_DIVISIONS + 1 },
    (_, i) => (i * yMax) / TICK_DIVISIONS,
  );

  const costDigits = yMax / TICK_DIVISIONS < 1 ? 1 : 0;
  const hot = data.length > 0 && tip ? data[tip.i] : null;

  const showLabel = pickLabels(
    data.map((p) => ({ cx: sx(p.hours), cy: sy(p.cost) })),
  );
  const hiddenLabels = showLabel.filter((v) => !v).length;

  return (
    <Card
      title="Jam vs biaya per unit"
      subtitle="Mendeteksi unit dengan biaya relatif tinggi terhadap jam lembur"
    >
      {data.length === 0 ? (
        <EmptyState
          icon={ChartScatter}
          title="Tidak Ada Data Pada Periode Ini"
          description="Belum ada unit dengan jam dan biaya approved. Coba ubah filter tahun, bulan, atau area."
          height={H}
        />
      ) : (
        <div className="dd-chart" ref={ref}>
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label="Sebaran total jam dan biaya lembur per unit"
            style={{ display: "block", maxWidth: "100%" }}
          >
            <g>
              {gridX.map((v) => (
                <line
                  key={v}
                  className="dd-chart__gridDash"
                  x1={sx(v)}
                  x2={sx(v)}
                  y1={PLOT_TOP}
                  y2={BOTTOM}
                />
              ))}
            </g>
            <g>
              {gridY.map((v) => (
                <line
                  key={v}
                  className="dd-chart__gridDash"
                  x1={PL}
                  x2={W - PR}
                  y1={sy(v)}
                  y2={sy(v)}
                />
              ))}
            </g>

            <line
              className="dd-chart__axisline"
              x1={PL}
              x2={PL}
              y1={PLOT_TOP}
              y2={BOTTOM}
            />
            <line
              className="dd-chart__axisline"
              x1={PL}
              x2={W - PR}
              y1={BOTTOM}
              y2={BOTTOM}
            />

            <g>
              {ticksX.map((v) => (
                <text
                  key={v}
                  className="dd-chart__axis"
                  x={sx(v)}
                  y={BOTTOM + 18}
                  textAnchor="middle"
                >
                  {idNum(v, 0)}
                </text>
              ))}
            </g>
            <g>
              {ticksY.map((v) => (
                <text
                  key={v}
                  className="dd-chart__axis"
                  x={PL - 6}
                  y={sy(v) + 3.5}
                  textAnchor="end"
                >
                  {v === 0 ? "0" : `Rp${idNum(v, costDigits)}`}
                </text>
              ))}
            </g>

            <g className={tip ? "dd-chart--dim" : undefined}>
              {data.map((p, i) => {
                const r = R_MIN + (p.hours / xMax) * R_SPAN;
                const cx = sx(p.hours);
                const cy = sy(p.cost);
                const show = (e: React.MouseEvent) =>
                  setTip({ i, x: e.clientX, y: e.clientY - 12 });

                const labelW = p.name.length * AXIS_CHAR_W;
                const flip = cx + r + 8 + labelW > W - PR;

                return (
                  <g
                    key={p.name}
                    onMouseEnter={show}
                    onMouseMove={show}
                    onMouseLeave={() => setTip(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      className={`dd-mark${tip?.i === i ? " is-hot" : ""}`}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="var(--chart-blue-primary)"
                      opacity={0.85}
                    />
                    {showLabel[i] && (
                      <text
                        className="dd-chart__axis"
                        x={cx + (flip ? -(r + 8) : r + 8)}
                        y={cy + 3.5}
                        textAnchor={flip ? "end" : "start"}
                      >
                        {p.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            <text
              className="dd-chart__axis"
              x={W - PR}
              y={H - 6}
              textAnchor="end"
            >
              Total jam approved
            </text>
            <text className="dd-chart__axis" x={PL} y={12} textAnchor="start">
              Biaya approved (juta rupiah)
            </text>
          </svg>

          {tip && hot && (
            <FloatingTip
              x={tip.x}
              y={tip.y}
              title={hot.name}
              rows={[
                {
                  color: "var(--chart-blue-primary)",
                  label: "Total jam",
                  value: `${idNum(hot.hours, 0)} jam`,
                },
                {
                  label: "Biaya approved",
                  value: `Rp${idNum(hot.cost, 1)} jt`,
                },
                {
                  label: "Biaya per jam",
                  value: `Rp${idNum(Math.round((hot.cost * 1_000_000) / hot.hours), 0)}`,
                },
              ]}
            />
          )}

          <div className="dd-chart__note">
            Seluruh {data.length} unit pada periode aktif ditampilkan agar unit
            berbiaya tinggi dengan jam rendah tetap terlihat. Arahkan kursor ke
            lingkaran untuk melihat jam, biaya, dan biaya rata-rata per jam unit
            tersebut.
            {hiddenLabels > 0
              ? ` Label ${hiddenLabels} unit yang berdempetan disembunyikan; namanya ada di tooltip.`
              : ""}
          </div>
        </div>
      )}
    </Card>
  );
}
