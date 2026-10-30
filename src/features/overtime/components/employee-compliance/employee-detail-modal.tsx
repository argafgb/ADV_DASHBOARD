"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  Banknote,
  Clock3,
  Gauge,
  Lightbulb,
  X,
  type LucideIcon,
} from "lucide-react";
import { Card } from "../ds/card";
import { FloatingTip } from "../ds/chart-tooltip";
import { idNum, niceAxis, useMeasuredWidth } from "../ds/chart-utils";
import type { Employee, WeeklyData } from "../../types/employee.types";

const H = 200;
const BAR_MAX = 46;
const PL = 42;
const PR = 14;
const PT = 26;
const PB = 28;
const MIN_W = 280;

const subscribeNoop = () => () => {};

const TILE: Record<"blue" | "amber" | "green", CSSProperties> = {
  blue: { background: "var(--status-blue-bg)", color: "var(--status-blue-fg)" },
  amber: {
    background: "var(--status-amber-bg)",
    color: "var(--status-amber-fg)",
  },
  green: {
    background: "var(--status-green-bg)",
    color: "var(--status-green-fg)",
  },
};

export function EmployeeDetailModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const areaPath = employee.area.split(" / ").join(" · ");
  const tone = employee.tag === "risk" ? "dd-pill--red" : "dd-pill--amber";

  const kpis: {
    label: string;
    value: string;
    icon: LucideIcon;
    tone: keyof typeof TILE;
  }[] = [
    {
      label: "Jam approved",
      value: employee.hours,
      icon: Clock3,
      tone: "blue",
    },
    {
      label: "Frekuensi",
      value: `${idNum(employee.freq)} kali`,
      icon: Gauge,
      tone: "amber",
    },
    {
      label: "Biaya approved",
      value: employee.cost,
      icon: Banknote,
      tone: "green",
    },
  ];

  if (!mounted) return null;

  return createPortal(
    <div
      className="overtime-scope fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/45 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="dd-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Detail lembur karyawan"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dd-modal__head">
          <div className="dd-modal__title">Detail lembur karyawan</div>
          <span className="dd-chip dd-chip--entity">{areaPath}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="dd-iconbtn dd-iconbtn--ghost"
            style={{ marginLeft: "auto" }}
          >
            <X />
          </button>
        </div>

        <div className="dd-modal__body">
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="dd-avatar dd-avatar--lg dd-avatar--solid">
                {employee.initials}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    font: "var(--fw-semibold) 14px/1.3 var(--dd-font-sans)",
                    color: "var(--text-primary)",
                  }}
                >
                  {employee.name}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    font: "var(--fw-regular) 11.5px/1.4 var(--dd-font-sans)",
                    color: "var(--text-muted)",
                  }}
                >
                  {employee.id} · {employee.role} · {employee.area}
                </div>
              </div>
              <span style={{ flex: "none" }}>
                <span className={`dd-pill ${tone}`}>
                  <span className="dd-pill__dot" />
                  {employee.level}
                </span>
              </span>
            </div>

            <div
              className="dd-modal-kpis"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
                gap: 12,
              }}
            >
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <article key={kpi.label} className="dd-kpi">
                    <div className="dd-kpi__top">
                      <span className="dd-kpi__tile" style={TILE[kpi.tone]}>
                        <Icon />
                      </span>
                      <span className="dd-kpi__label">{kpi.label}</span>
                    </div>
                    <div className="dd-kpi__row">
                      <span
                        className="dd-kpi__value"
                        style={{ fontSize: 21, whiteSpace: "nowrap" }}
                      >
                        {kpi.value}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <Card
              title="Pola lembur mingguan"
              subtitle="Total jam approved per minggu pada periode aktif"
              actions={
                <span className="dd-pill dd-pill--green">Approved only</span>
              }
            >
              <div style={{ display: "grid", gap: 12 }}>
                <WeeklyBars weekly={employee.weekly} />
                <PeakInsight employee={employee} />
              </div>
            </Card>
          </div>
        </div>

        <div className="dd-modal__foot">
          <button
            type="button"
            onClick={onClose}
            className="dd-btn dd-btn--secondary dd-btn--md"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function WeeklyBars({ weekly }: { weekly: WeeklyData[] }) {
  const [ref, measured] = useMeasuredWidth<HTMLDivElement>(420);
  const [tip, setTip] = useState<{ i: number; x: number; y: number } | null>(
    null,
  );

  const W = Math.max(MIN_W, measured);
  const { step, top } = niceAxis(Math.max(...weekly.map((w) => w.hours), 1));

  const y = (v: number) => PT + (1 - v / top) * (H - PT - PB);
  const band = (W - PL - PR) / Math.max(weekly.length, 1);
  const bw = Math.min(BAR_MAX, Math.max(16, band * 0.54));

  const ticks = Array.from({ length: 5 }, (_, i) => i * step);
  const hot = tip ? weekly[tip.i] : null;

  const labelEvery = Math.max(1, Math.ceil(34 / band));
  const showValues = band >= 30;

  return (
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
                {idNum(v)}
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
          {weekly.map((week, i) => {
            const cx = PL + band * i + band / 2;
            const barH = Math.max(y(0) - y(week.hours), 4);
            const show = (e: React.MouseEvent) =>
              setTip({ i, x: e.clientX, y: e.clientY - 12 });

            return (
              <g
                key={week.label}
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
                  y={y(0) - barH}
                  width={bw}
                  height={barH}
                  rx={4}
                  fill="var(--chart-blue-primary)"
                />
                {showValues && (
                  <text
                    className="dd-chart__barval"
                    x={cx}
                    y={y(week.hours) - 7}
                    textAnchor="middle"
                  >
                    {idNum(week.hours, 1)}
                  </text>
                )}
                {i % labelEvery === 0 && (
                  <text
                    className="dd-chart__axis"
                    x={cx}
                    y={H - 10}
                    textAnchor="middle"
                  >
                    {week.short}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {tip && hot && (
        <FloatingTip
          x={tip.x}
          y={tip.y}
          title={hot.label}
          rows={[
            {
              color: "var(--chart-blue-primary)",
              label: "Jam approved",
              value: `${idNum(hot.hours, 1)} jam`,
            },
          ]}
        />
      )}
    </div>
  );
}

function PeakInsight({ employee }: { employee: Employee }) {
  const peak = employee.weekly.reduce<WeeklyData | null>(
    (hi, w) => (hi && hi.hours >= w.hours ? hi : w),
    null,
  );
  if (!peak || peak.hours <= 0) return null;

  const headline =
    employee.peakHeadline ??
    `Puncak lembur ${peak.label}: ${idNum(peak.hours, 1)} jam.`;
  const reason =
    employee.peakReason ??
    (peak.reason ? `Alasan dominan: ${peak.reason}.` : "");

  return (
    <div
      style={{
        display: "flex",
        gap: 9,
        alignItems: "flex-start",
        padding: "11px 12px",
        borderRadius: 10,
        background: "var(--bg-row-item)",
        font: "var(--fw-regular) 11.5px/1.5 var(--dd-font-sans)",
        color: "var(--text-muted)",
      }}
    >
      <span
        style={{ color: "var(--dd-accent)", flex: "none", marginTop: 1 }}
        aria-hidden
      >
        <Lightbulb size={14} />
      </span>
      <span>
        <strong style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {headline}
        </strong>{" "}
        {reason}
      </span>
    </div>
  );
}
