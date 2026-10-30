"use client";

import React from "react";
import { MONTHS } from "../data/constants";
import { useNetworkData } from "../context/NetworkDataContext";
import { useHoverTip } from "../context/TooltipLayer";
import type { TipData } from "../context/TooltipLayer";

/**
 * Line chart "SLA performance" — port trendChart() sumber.
 * Konstanta W/H/pad/lo/hi TIDAK diubah.
 */
export default function SlaTrendChart({
  tahun,
  compareYear,
}: {
  tahun: number;
  compareYear: number | null;
}) {
  const { sla, matrix } = useNetworkData();
  const { tipEnter, tipMove, tipLeave } = useHoverTip();

  const W = 1160,
    H = 250,
    padL = 42,
    padR = 16,
    padB = 28,
    padT = 18;
  const lo = 99.0,
    hi = 100.0,
    plotW = W - padL - padR,
    plotH = H - padT - padB;
  const bs = sla.mapped();
  const TARGET = sla.TARGET;

  const series = (y: number): (number | null)[] | null => {
    if (!matrix[y]) return null;
    return MONTHS.map((_, m) => {
      const vals = bs
        .map((b) => matrix[y][b.name]?.[m])
        .filter((c): c is NonNullable<typeof c> => c != null)
        .map((c) => c.value);
      return vals.length ? vals.reduce((a, c) => a + c, 0) / vals.length : null;
    });
  };
  const curRaw = (series(tahun) ?? new Array(12).fill(null)) as (
    number | null
  )[];
  const prevRaw = compareYear != null ? series(compareYear) : null;

  // All Months: garis penuh Jan–Des — bulan tanpa laporan meneruskan nilai
  // terakhir (flat carry-forward), sinkron dengan dashboard lain. Kecuali
  // saat hanya ada satu titik data: biarkan agar tampilan single-point aktif.
  const carryForward = (arr: (number | null)[]): (number | null)[] => {
    const filled = [...arr];
    const dataCount = filled.filter((v) => v != null).length;
    if (dataCount < 2) return filled;
    for (let i = 1; i < filled.length; i++) {
      if (filled[i] == null && filled[i - 1] != null) filled[i] = filled[i - 1];
    }
    return filled;
  };
  const cur = carryForward(curRaw);
  const prev = prevRaw ? carryForward(prevRaw) : null;

  const x = (i: number) => padL + (i / 11) * plotW;
  const yv = (v: number) =>
    padT + plotH - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * plotH;
  const linePath = (arr: (number | null)[]) => {
    let d = "",
      pen = false;
    arr.forEach((v, i) => {
      if (v == null) {
        pen = false;
        return;
      }
      d += (pen ? "L" : "M") + x(i) + "," + yv(v) + " ";
      pen = true;
    });
    return d.trim();
  };

  // Sudut kemiringan garis di titik i (derajat), dari tetangga non-null terdekat.
  const markerAngle = (arr: (number | null)[], i: number): number => {
    let iPrev = i - 1;
    while (iPrev >= 0 && arr[iPrev] == null) iPrev--;
    if (iPrev < 0) iPrev = i;
    let iNext = i + 1;
    while (iNext < arr.length && arr[iNext] == null) iNext++;
    if (iNext >= arr.length) iNext = i;
    const vPrev = arr[iPrev];
    const vNext = arr[iNext];
    if (vPrev == null || vNext == null || iPrev === iNext) return 0;
    return (
      (Math.atan2(yv(vNext) - yv(vPrev), x(iNext) - x(iPrev)) * 180) / Math.PI
    );
  };

  let lastCur = -1;
  let firstCur = -1;
  cur.forEach((v, i) => {
    if (v != null) {
      if (firstCur < 0) firstCur = i;
      lastCur = i;
    }
  });
  const isSinglePoint = firstCur >= 0 && firstCur === lastCur;
  const area = (() => {
    if (lastCur < 0) return "";
    if (isSinglePoint) {
      // Satu titik data: arsir wedge dari titik ke kanan-bawah plot (standar
      // tampilan single-point lintas dashboard).
      const px = x(firstCur);
      const py = yv(cur[firstCur] as number);
      const rightEdge = Math.min(px + plotW * 0.9, W - padR);
      return (
        "M" +
        px +
        "," +
        py +
        " L" +
        rightEdge +
        "," +
        (padT + plotH) +
        " L" +
        px +
        "," +
        (padT + plotH) +
        " Z"
      );
    }
    let d = "M" + x(firstCur) + "," + yv(cur[firstCur] as number);
    for (let i = firstCur + 1; i <= lastCur; i++)
      d += " L" + x(i) + "," + yv(cur[i] as number);
    d +=
      " L" +
      x(lastCur) +
      "," +
      (padT + plotH) +
      " L" +
      x(firstCur) +
      "," +
      (padT + plotH) +
      " Z";
    return d;
  })();

  const grid = [99.0, 99.25, 99.5, 99.75, 100.0];

  const tipMk = (i: number, v: number, yr: number): TipData => ({
    title: MONTHS[i] + " " + yr,
    primary: "SLA " + v.toFixed(2) + "%",
    secondary: "(rata-rata " + bs.length + " cabang)",
    meta:
      v >= TARGET
        ? "capai target"
        : "di bawah target " + TARGET.toFixed(1) + "%",
    tone: sla.tone(v),
  });

  return (
    <div
      className="nl-scroll network-trend-chart"
      style={{
        position: "relative",
        isolation: "isolate",
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        overflowX: "auto",
        overflowY: "hidden",
      }}
    >
      <svg
        viewBox={"0 0 " + W + " " + H}
        style={{
          width: "100%",
          minWidth: "720px",
          height: "auto",
          display: "block",
        }}
      >
        <defs>
          <linearGradient id="nl-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {grid.map((g, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={yv(g)}
              y2={yv(g)}
              stroke="var(--chart-grid)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={padL - 8}
              y={yv(g) + 3}
              textAnchor="end"
              fontSize={10}
              fontFamily="var(--font-body)"
              fill="var(--chart-axis)"
            >
              {g.toFixed(2)}
            </text>
          </g>
        ))}
        <line
          x1={padL}
          x2={W - padR}
          y1={yv(TARGET)}
          y2={yv(TARGET)}
          stroke="#DC2626"
          strokeWidth={1.6}
          strokeDasharray="6 4"
        />
        {area ? <path d={area} fill="url(#nl-area)" /> : null}
        {prev ? (
          <path
            d={linePath(prev)}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={2}
            strokeDasharray="4 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        <path
          d={linePath(cur)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {prev
          ? prev.map((v, i) => {
              if (v == null) return null;
              const angle = markerAngle(prev, i);
              return (
                <polygon
                  key={"pd" + i}
                  points={`${x(i) + 4.5},${yv(v)} ${x(i) - 3.6},${yv(v) - 4.5} ${x(i) - 3.6},${yv(v) + 4.5}`}
                  fill="#fff"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  transform={
                    angle !== 0
                      ? `rotate(${angle} ${x(i)} ${yv(v)})`
                      : undefined
                  }
                  style={{ pointerEvents: "none" }}
                />
              );
            })
          : null}
        {prev && compareYear != null
          ? prev.map((v, i) =>
              v == null ? null : (
                <circle
                  key={"p" + i}
                  cx={x(i)}
                  cy={yv(v)}
                  r={5.5}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) =>
                    tipEnter(e, tipMk(i, v, compareYear), "dot")
                  }
                  onMouseMove={(e) => tipMove(e)}
                  onMouseLeave={() => tipLeave()}
                />
              ),
            )
          : null}
        {cur.map((v, i) =>
          v == null ? null : (
            <circle
              key={"c" + i}
              cx={x(i)}
              cy={yv(v)}
              r={3.2}
              fill="#fff"
              stroke="var(--accent)"
              strokeWidth={2}
              style={{ pointerEvents: "none" }}
            />
          ),
        )}
        {cur.map((v, i) =>
          v == null ? null : (
            <circle
              key={"ch" + i}
              cx={x(i)}
              cy={yv(v)}
              r={7}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => tipEnter(e, tipMk(i, v, tahun), "dot")}
              onMouseMove={(e) => tipMove(e)}
              onMouseLeave={() => tipLeave()}
            />
          ),
        )}
        {isSinglePoint &&
          (() => {
            const px = x(firstCur);
            const marks: { v: number; color: string }[] = [];
            const pv = prev?.[firstCur];
            if (pv != null) marks.push({ v: pv, color: "#F59E0B" });
            marks.push({ v: cur[firstCur] as number, color: "#2563EB" });
            // Pill nilai di atas marker; geser jika bertumpuk.
            const sorted = [...marks].sort((a, b) => yv(a.v) - yv(b.v));
            let occupied = Infinity;
            const rows = [] as { v: number; color: string; ly: number }[];
            for (let i = sorted.length - 1; i >= 0; i--) {
              const m = sorted[i];
              let ly = yv(m.v) - 12;
              if (occupied - ly < 16) ly = occupied - 16;
              rows.push({ ...m, ly });
              occupied = ly;
            }
            // Pill yang keluar tepi atas plot (nilai puncak, mis. 100%)
            // dipindah ke bawah marker; stack ke bawah bila bertumpuk.
            const minLy = padT + 9;
            let occupiedBelow = -Infinity;
            for (const r of rows) {
              if (r.ly < minLy) {
                r.ly = Math.max(yv(r.v) + 20, occupiedBelow + 16);
                occupiedBelow = r.ly;
              }
            }
            return rows.map((m, ri) => {
              const text = m.v.toFixed(2) + "%";
              const w = Math.max(30, text.length * 6.2 + 12);
              return (
                <g key={"sp" + ri} style={{ pointerEvents: "none" }}>
                  <rect
                    x={px - w / 2}
                    y={m.ly - 8}
                    width={w}
                    height={15}
                    rx={4}
                    fill={m.color}
                    fillOpacity={0.12}
                  />
                  <text
                    x={px}
                    y={m.ly + 3.5}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={700}
                    fontFamily="var(--font-body)"
                    fill={m.color}
                  >
                    {text}
                  </text>
                </g>
              );
            });
          })()}
        {MONTHS.map((l, i) => (
          <text
            key={"m" + i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={11}
            fontFamily="var(--font-body)"
            fill="var(--chart-axis)"
          >
            {l}
          </text>
        ))}
      </svg>
    </div>
  );
}
