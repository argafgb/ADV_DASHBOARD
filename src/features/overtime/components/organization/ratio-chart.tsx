"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { Card } from "../ds/card";
import { FloatingTip } from "../ds/chart-tooltip";
import {
  COARSE_STEPS,
  idNum,
  niceAxis,
  useMeasuredWidth,
} from "../ds/chart-utils";
import type { RatioBarItem, RatioUnmatched } from "../../types/organization.types";

const H = 262;
const PL = 44;
const PR = 14;
const PT = 28;
const PB = 34;
const MIN_W = 340;

const SHORT_LABEL_MAX = 14;

const shortLabel = (name: string) =>
  name.length > SHORT_LABEL_MAX
    ? `${name.slice(0, SHORT_LABEL_MAX - 1).trimEnd()}…`
    : name;

const idHours = (h: number) =>
  h.toLocaleString("id-ID", { maximumFractionDigits: 0 });

export function RatioChart({
  data,
  unmatched,
}: {
  data: RatioBarItem[];
  unmatched?: RatioUnmatched;
}) {
  const hasUnmatched = (unmatched?.units ?? 0) > 0;
  const [ref, measured] = useMeasuredWidth<HTMLDivElement>(520);
  const [tip, setTip] = useState<{ i: number; x: number; y: number } | null>(
    null,
  );

  const W = Math.max(MIN_W, measured);
  const { step, top } = niceAxis(
    Math.max(...data.map((d) => d.value), 1),
    COARSE_STEPS,
  );

  const y = (v: number) => PT + (1 - v / top) * (H - PT - PB);
  const band = (W - PL - PR) / Math.max(data.length, 1);
  const bw = Math.min(46, Math.max(16, band * 0.54));

  const ticks = Array.from({ length: 5 }, (_, i) => i * step);
  const hot = data.length > 0 && tip ? data[tip.i] : null;

  return (
    <Card
      title="Rasio lembur per karyawan"
      subtitle="Jam approved ÷ headcount unit agar perbandingan lebih adil"
    >
      {data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Tidak Ada Data Pada Periode Ini"
          description="Rasio membutuhkan jam approved dan headcount unit. Coba ubah filter tahun, bulan, atau area."
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
                    {idNum(v, 0)}
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

            <g className={hot ? "dd-chart--dim" : undefined}>
              {data.map((row, i) => {
                const cx = PL + band * i + band / 2;
                const h = Math.max(y(0) - y(row.value), 4);
                const show = (e: React.MouseEvent) =>
                  setTip({ i, x: e.clientX, y: e.clientY - 12 });

                return (
                  <g
                    key={row.name}
                    onMouseEnter={show}
                    onMouseMove={show}
                    onMouseLeave={() => setTip(null)}
                    style={{ cursor: "default" }}
                  >
                    <rect
                      x={cx - band / 2}
                      y={PT}
                      width={band}
                      height={H - PT - PB}
                      fill="transparent"
                    />
                    <rect
                      className={`dd-mark${tip?.i === i ? " is-hot" : ""}`}
                      x={cx - bw / 2}
                      y={y(0) - h}
                      width={bw}
                      height={h}
                      rx={4}
                      fill="var(--chart-blue-primary)"
                    />
                    <text
                      className="dd-chart__barval"
                      x={cx}
                      y={y(row.value) - 7}
                      textAnchor="middle"
                    >
                      {idNum(row.value, 1)}
                    </text>
                    <text
                      className="dd-chart__axis"
                      x={cx}
                      y={H - 12}
                      textAnchor="middle"
                    >
                      {shortLabel(row.name)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {tip && hot && (
            <FloatingTip
              x={tip.x}
              y={tip.y}
              title={hot.name}
              rows={[
                {
                  color: "var(--chart-blue-primary)",
                  label: "Jam per orang",
                  value: `${idNum(hot.value, 1)} jam`,
                },
              ]}
            />
          )}
        </div>
      )}

      <div className="dd-chart__note">
        Jam per orang per bulan, lima unit teratas diurutkan dari yang
        tertinggi.
        {hasUnmatched && unmatched
          ? ` ${unmatched.units} unit lain (${idHours(unmatched.hours)} jam) belum bisa dihitung karena tidak ada headcount aktif yang cocok.`
          : ""}
      </div>
    </Card>
  );
}
