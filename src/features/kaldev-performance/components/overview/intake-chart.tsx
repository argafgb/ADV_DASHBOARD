"use client";

import { useState } from "react";

import { FloatingTip } from "@/components/chart-tooltip";
import { useMeasuredWidth } from "../ds/chart-utils";
import { Card } from "../shared/card";
import { fmt } from "../../utils/format";
import type { IntakeMonth, TrendPoint } from "../../types/kaldev.types";

const SERIES: { key: "done" | "progress" | "queue" | "other"; label: string; color: string }[] = [
  { key: "done", label: "Done", color: "var(--chart-green)" },
  { key: "progress", label: "On progress", color: "var(--chart-blue-primary)" },
  { key: "queue", label: "On queue", color: "var(--chart-amber)" },
  { key: "other", label: "On hold / cancelled", color: "var(--chart-neutral)" },
];

const H = 300;
const PAD_L = 44;
const PAD_R = 16;
const BASE = 266;
const SCALE_H = 240;
const HOVER_TOP = 16;
const BAR_W = 30;

/**
 * "Total project per bulan" — `StackedColumn` design system dalam SVG:
 * batang 30px, gridline putus-putus, label nilai di atas batang. Skala Y
 * mengikuti jumlah proyek selesai per bulan (seperti desain), dibulatkan
 * ke kelipatan 50 × 4 langkah.
 */
export function IntakeChart({
  intake,
  trend,
  yearLabel,
}: {
  intake: IntakeMonth[];
  trend: TrendPoint[];
  yearLabel: string;
}) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(709);
  const [hot, setHot] = useState<{ i: number; x: number; y: number } | null>(null);
  const n = intake.length;
  const monthlyMax = Math.max(1, ...trend.map((t) => t.ok + t.no));
  const step = Math.ceil(monthlyMax / 4 / 50) * 50 || 50;
  const top = step * 4;
  const innerW = Math.max(0, width - PAD_L - PAD_R);
  const colW = n ? innerW / n : innerW;
  const y = (v: number) => BASE - (v / top) * SCALE_H;

  return (
    <Card
      title="Total project per bulan"
      subtitle={`Proyek masuk tiap bulan pada ${yearLabel} beserta status terkininya`}
      bodyStyle={{ display: "grid", gap: 0, alignContent: "start", gridTemplateColumns: "minmax(0,1fr)" }}
    >
      <div className="dd-chart" ref={ref}>
        {n === 0 ? (
          <div className="dd-empty">
            <div className="dd-empty__title">Belum ada proyek</div>
            <div className="dd-empty__msg">Pilih periode lain untuk melihat proyek masuk per bulan.</div>
          </div>
        ) : (
          <svg className="dd-scol" width="100%" height={H} viewBox={`0 0 ${width} ${H}`}>
            {[0, 1, 2, 3, 4].map((k) => (
              <g key={k}>
                <line className="dd-chart__gridDash" x1={PAD_L} x2={width - PAD_R} y1={y(k * step)} y2={y(k * step)} />
                <text className="dd-chart__axis" x={PAD_L - 10} y={y(k * step) + 3.5} textAnchor="end">
                  {fmt(k * step)}
                </text>
              </g>
            ))}
            <line className="dd-chart__axisline" x1={PAD_L} x2={PAD_L} y1={HOVER_TOP} y2={BASE} />
            <line className="dd-chart__axisline" x1={PAD_L} x2={width - PAD_R} y1={BASE} y2={BASE} />
            <g className={hot ? "dd-chart--dim" : undefined}>
              {intake.map((m, i) => {
                const colX = PAD_L + i * colW;
                const barX = colX + colW / 2 - BAR_W / 2;
                const stacked = SERIES.reduce<{ key: string; label: string; color: string; v: number; y: number; h: number }[]>(
                  (acc, s) => {
                    const v = m[s.key];
                    const h = (v / top) * SCALE_H;
                    const prev = acc[acc.length - 1];
                    const bottom = prev ? prev.y : BASE;
                    acc.push({ ...s, v, y: bottom - h, h });
                    return acc;
                  },
                  [],
                );
                const segs = stacked.filter((s) => s.v > 0);
                const topY = stacked.length ? stacked[stacked.length - 1].y : BASE;
                return (
                  <g key={m.key} className={hot?.i === i ? "is-hot" : undefined}>
                    <rect
                      x={colX}
                      y={HOVER_TOP}
                      width={colW}
                      height={BASE - HOVER_TOP}
                      fill="transparent"
                      onMouseMove={(e) => setHot({ i, x: e.clientX, y: e.clientY - 12 })}
                      onMouseLeave={() => setHot(null)}
                    />
                    {segs.map((s) => (
                      <rect
                        key={s.key}
                        className={`dd-mark${hot?.i === i ? " is-hot" : ""}`}
                        x={barX}
                        y={s.y}
                        width={BAR_W}
                        height={s.h}
                        fill={s.color}
                        style={{ pointerEvents: "none" }}
                      />
                    ))}
                    <text className="dd-chart__barval" x={barX + BAR_W / 2} y={topY - 8} textAnchor="middle">
                      {fmt(m.total)}
                    </text>
                    <text className="dd-scol__xlabel" x={barX + BAR_W / 2} y={H - 11} textAnchor="middle">
                      {m.label}
                      {m.partial ? "*" : ""}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
        {hot && intake[hot.i] && (
          <FloatingTip
            x={hot.x}
            y={hot.y}
            title={`${intake[hot.i].full}${intake[hot.i].partial ? " · masih berjalan" : ""}`}
            rows={[
              ...SERIES.map((s) => ({ color: s.color, label: s.label, value: fmt(intake[hot.i][s.key]) })),
              { label: "Total masuk", value: fmt(intake[hot.i].total) },
            ]}
          />
        )}
      </div>
      <div className="dd-chart__legend dd-scol__legend">
        {SERIES.map((s) => (
          <span key={s.key} className="dd-chart__legenditem">
            <span className="dd-chart__dot dd-chart__dot--round" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="dd-chart__note">
        Tinggi batang adalah total proyek masuk pada bulan tersebut; arahkan kursor untuk rincian done, on
        progress, dan antrean.
      </div>
    </Card>
  );
}
