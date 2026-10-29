"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useFilters } from "@/features/network-performance/context/NetworkFilterContext";
import { useNetworkData } from "../context/NetworkDataContext";
import { useHoverTip } from "../context/TooltipLayer";
import SectionCard, { CardTitle } from "./SectionCard";
import { MONTHS } from "../data/constants";
import { monthRangeLabel } from "../services/labels";

interface LatencyComparisonBarChartProps {
  tahun: number;
  bulan: number | null;
  bulanMonths?: number[] | null;
  compareYear: number;
}

export default function LatencyComparisonBarChart({
  tahun,
  bulan,
  bulanMonths,
  compareYear,
}: LatencyComparisonBarChartProps) {
  const { bulanRange } = useFilters();
  const { sla, weeklyQuality } = useNetworkData();
  const { tipEnter, tipMove, tipLeave } = useHoverTip();

  const win = sla.activeMonths(tahun, bulanRange ?? bulan, bulanMonths);

  const isSingleMonth = useMemo(() => {
    if (bulanMonths && bulanMonths.length > 0) {
      return bulanMonths.length === 1;
    }
    if (typeof bulanRange === "object" && bulanRange !== null) {
      return bulanRange.start === bulanRange.end;
    }
    return bulan != null;
  }, [bulan, bulanRange, bulanMonths]);

  const singleMonthIndex = useMemo(() => {
    if (!isSingleMonth) return null;
    if (bulanMonths && bulanMonths.length === 1) return bulanMonths[0];
    if (typeof bulanRange === "object" && bulanRange !== null)
      return bulanRange.start;
    return bulan;
  }, [isSingleMonth, bulan, bulanRange, bulanMonths]);

  const availableWeeks = useMemo(() => {
    if (!isSingleMonth || singleMonthIndex == null) return [];
    const weeks = new Set<number>();
    (weeklyQuality ?? []).forEach((r) => {
      if (
        r.year === tahun &&
        r.month - 1 === singleMonthIndex &&
        r.weekNumber != null
      ) {
        weeks.add(r.weekNumber);
      }
    });
    return Array.from(weeks).sort((a, b) => a - b);
  }, [weeklyQuality, tahun, isSingleMonth, singleMonthIndex]);

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useEffect(() => {
    if (!isSingleMonth) {
      setSelectedWeek(null);
    } else if (
      selectedWeek !== null &&
      !availableWeeks.includes(selectedWeek)
    ) {
      setSelectedWeek(null);
    }
  }, [isSingleMonth, availableWeeks, selectedWeek]);

  const branches = sla.mapped();

  const rows = useMemo(() => {
    const list = weeklyQuality ?? [];
    return branches.map((b) => {
      const bNameLower = b.name.trim().toLowerCase();

      // All records for this branch in the active window
      const allBranchRecordsInWin = list.filter((r) => {
        if (r.year !== tahun) return false;
        if (!win.includes(r.month - 1)) return false;
        return r.branchName.trim().toLowerCase() === bNameLower;
      });

      // Filtered records based on singleMonth / selectedWeek
      const branchRecords = allBranchRecordsInWin.filter((r) => {
        if (
          isSingleMonth &&
          singleMonthIndex != null &&
          r.month - 1 !== singleMonthIndex
        ) {
          return false;
        }
        if (
          isSingleMonth &&
          selectedWeek !== null &&
          r.weekNumber !== selectedWeek
        ) {
          return false;
        }
        return true;
      });

      const validRecords = branchRecords.filter(
        (r) => r.slaLatencyMs != null && !isNaN(r.slaLatencyMs),
      );

      const lat =
        validRecords.length > 0
          ? validRecords.reduce(
              (sum, r) => sum + (r.slaLatencyMs as number),
              0,
            ) / validRecords.length
          : null;

      // Note for specific single week mode
      let notes: string | null = null;
      if (isSingleMonth && selectedWeek !== null) {
        const recWithNote = branchRecords.find(
          (r) => r.notes && r.notes.trim().length > 0,
        );
        notes = recWithNote
          ? (recWithNote.notes?.trim().replace(/\r?\n+/g, " ") ?? null)
          : null;
      }

      // Weeks with notes in this single month
      const weeksWithNotes = isSingleMonth
        ? Array.from(
            new Set(
              allBranchRecordsInWin
                .filter(
                  (r) =>
                    r.month - 1 === singleMonthIndex &&
                    r.notes &&
                    r.notes.trim().length > 0 &&
                    r.weekNumber != null,
                )
                .map((r) => `W${r.weekNumber}`),
            ),
          ).sort()
        : [];

      // Months with notes in All Months mode
      const monthsWithNotes = !isSingleMonth
        ? Array.from(
            new Set(
              allBranchRecordsInWin
                .filter((r) => r.notes && r.notes.trim().length > 0)
                .map((r) => MONTHS[r.month - 1]),
            ),
          )
        : [];

      const testedWeeks = validRecords
        .map((r) => r.weekNumber)
        .filter((w): w is number => w != null)
        .sort((a, b) => a - b);

      return {
        name: b.name,
        lat,
        notes,
        testedWeeksCount: validRecords.length,
        testedWeeksSummary:
          testedWeeks.length > 1
            ? `W${testedWeeks[0]}–W${testedWeeks[testedWeeks.length - 1]}`
            : testedWeeks.length === 1
              ? `W${testedWeeks[0]}`
              : "",
        weeksWithNotes,
        monthsWithNotes,
      };
    });
  }, [
    branches,
    weeklyQuality,
    tahun,
    win,
    isSingleMonth,
    singleMonthIndex,
    selectedWeek,
  ]);

  const H = 330,
    padB = 100,
    padT = 18,
    axisW = 50;

  const plotH = H - padT - padB;
  const lo = 0;
  const maxLat = rows.reduce(
    (max, d) => (d.lat != null && d.lat > max ? d.lat : max),
    0,
  );
  const hi = Math.max(35, Math.ceil(maxLat / 5) * 5);

  const yv = (v: number) =>
    padT + plotH - (Math.min(hi, Math.max(lo, v)) / hi) * plotH;

  const grid: number[] = [];
  for (let g = lo; g <= hi + 0.001; g += 5) {
    grid.push(Math.round(g));
  }

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

  const weekLabel = selectedWeek != null ? ` · W${selectedWeek}` : "";

  const axisSvg = (
    <svg
      width={axisW}
      height={H}
      viewBox={"0 0 " + axisW + " " + H}
      style={{ flexShrink: 0, display: "block" }}
    >
      {grid.map((g, i) =>
        g === 20 ? null : (
          <text
            key={i}
            x={axisW - 8}
            y={yv(g) + 3}
            textAnchor="end"
            fontSize={10}
            fontFamily="var(--font-body)"
            fill="var(--chart-axis)"
          >
            {g} ms
          </text>
        ),
      )}
      <text
        x={axisW - 8}
        y={yv(20) + 3}
        textAnchor="end"
        fontSize={9}
        fontWeight={700}
        fontFamily="var(--font-body)"
        fill="#DC2626"
      >
        20.0 ms
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
        y1={yv(20)}
        y2={yv(20)}
        stroke="#DC2626"
        strokeWidth={1.6}
        strokeDasharray="6 4"
      />
      {rows.map((d, i) => {
        const cx = padL + group * i + group / 2;
        const x1 = cx - bw - gap / 2;
        const x2 = cx + gap / 2;
        const lat = d.lat;
        const curBarColor =
          lat != null && lat > 20.0 ? "#DC2626" : "var(--accent)";

        return (
          <g key={i}>
            {/* Bar compareYear (2025) baseline stub */}
            <rect
              x={x1}
              y={padT + plotH - 4}
              width={bw}
              height={4}
              rx={2}
              fill="var(--accent)"
              opacity={0.15}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) =>
                tipEnter(
                  e,
                  {
                    title: `${d.name} (${compareYear})`,
                    primary: "Belum ada pengujian latency",
                    secondary: `${compareYear} (Baseline)`,
                    tone: "gray",
                  },
                  "none",
                )
              }
              onMouseMove={(e) => tipMove(e)}
              onMouseLeave={() => tipLeave()}
            />

            {/* Bar tahun (2026) */}
            {lat != null ? (
              <>
                <path
                  d={top(x2, yv(lat), bw, padT + plotH - yv(lat), 4)}
                  fill={curBarColor}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) =>
                    tipEnter(
                      e,
                      {
                        title: `${d.name} (${tahun})${isSingleMonth && selectedWeek != null ? ` · W${selectedWeek}` : ""}`,
                        primary: `Latency ${lat.toFixed(1)} ms`,
                        secondary: !isSingleMonth
                          ? `Rata-rata kumulatif ${tahun} (${monthRangeLabel(win)})`
                          : selectedWeek === null
                            ? d.testedWeeksCount > 1
                              ? `Rata-rata ${d.testedWeeksCount} minggu (${MONTHS[singleMonthIndex!]})`
                              : `Rata-rata pengujian (${MONTHS[singleMonthIndex!]})`
                            : lat > 20.0
                              ? "Melebihi target max 20.0 ms"
                              : "Latency normal (≤ 20.0 ms)",
                        meta: !isSingleMonth
                          ? d.monthsWithNotes.length > 0
                            ? `Catatan insiden ada di: ${d.monthsWithNotes.join(", ")} · pilih bulan di atas untuk detail`
                            : lat > 20.0
                              ? "Rata-rata melebihi batas 20.0 ms"
                              : "Kondisi stabil tanpa catatan insiden"
                          : selectedWeek === null
                            ? d.weeksWithNotes.length > 0
                              ? `Catatan insiden ada di: ${d.weeksWithNotes.join(", ")} · klik tab minggu untuk detail`
                              : lat > 20.0
                                ? "Rata-rata melebihi batas 20.0 ms"
                                : "Kondisi stabil tanpa catatan insiden"
                            : d.notes
                              ? d.notes
                              : lat > 20.0
                                ? "Terdeteksi lonjakan latency"
                                : "Kondisi stabil",
                        tone: lat > 20.0 ? "red" : "green",
                      },
                      "none",
                    )
                  }
                  onMouseMove={(e) => tipMove(e)}
                  onMouseLeave={() => tipLeave()}
                />
                <text
                  x={x2 + bw / 2}
                  y={yv(lat) - 4}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight={700}
                  fontFamily="var(--font-display)"
                  fill={curBarColor}
                >
                  {lat.toFixed(1)} ms
                </text>
              </>
            ) : (
              <rect
                x={x2}
                y={padT + plotH - 4}
                width={bw}
                height={4}
                rx={2}
                fill="var(--accent)"
                opacity={0.15}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) =>
                  tipEnter(
                    e,
                    {
                      title: `${d.name} (${tahun})`,
                      primary: "Belum ada pengujian latency",
                      secondary: isSingleMonth
                        ? `Monitoring rutin · tidak ada catatan di ${MONTHS[singleMonthIndex!]}`
                        : "Monitoring rutin · tidak ada catatan pengujian",
                      tone: "gray",
                    },
                    "none",
                  )
                }
                onMouseMove={(e) => tipMove(e)}
                onMouseLeave={() => tipLeave()}
              />
            )}

            {/* Label nama cabang */}
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
    <SectionCard>
      <div
        className="network-card-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "12px",
        }}
      >
        <CardTitle
          title={`SLA Latency (ms) ${compareYear} vs ${tahun}`}
          subtitle={
            isSingleMonth
              ? `Monitoring latency jaringan per cabang · ${MONTHS[singleMonthIndex!]} ${tahun} · target maksimal 20.0 ms · geser untuk melihat semua`
              : `Monitoring rata-rata latency jaringan per cabang · ${monthRangeLabel(win)} ${tahun} · pilih bulan di filter atas untuk rincian mingguan · geser untuk melihat semua`
          }
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            paddingTop: "4px",
          }}
        >
          {/* Filter Minggu (hanya muncul saat 1 bulan spesifik dipilih dan memiliki data mingguan) */}
          {isSingleMonth && availableWeeks.length > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                background: "var(--bg-page, #f8fafc)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                padding: "2px 4px",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedWeek(null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "3px 9px",
                  fontSize: "11.5px",
                  fontWeight: selectedWeek === null ? 700 : 500,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background:
                    selectedWeek === null ? "var(--accent)" : "transparent",
                  color:
                    selectedWeek === null ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                Semua Minggu
              </button>
              {availableWeeks.map((w) => {
                const isSelected = selectedWeek === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedWeek(w)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "3px 9px",
                      fontSize: "11.5px",
                      fontWeight: isSelected ? 700 : 500,
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      background: isSelected ? "var(--accent)" : "transparent",
                      color: isSelected ? "#fff" : "var(--text-secondary)",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    W{w}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legends */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: "14px",
                  height: "10px",
                  background: "var(--accent)",
                  borderRadius: "2px",
                  display: "inline-block",
                }}
              />
              Normal (≤ 20 ms)
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: "14px",
                  height: "10px",
                  background: "#DC2626",
                  borderRadius: "2px",
                  display: "inline-block",
                }}
              />
              Tinggi (&gt; 20 ms)
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: "14px",
                  height: "10px",
                  background: "var(--accent)",
                  opacity: 0.3,
                  borderRadius: "2px",
                  display: "inline-block",
                }}
              />
              {compareYear} (Baseline)
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: "16px",
                  height: "0px",
                  borderTop: "2px dashed #DC2626",
                  display: "inline-block",
                }}
              />
              Target Max (20.0 ms)
            </span>
          </div>
        </div>
      </div>

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
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            flex: 1,
            minWidth: 0,
          }}
        >
          {barsSvg}
        </div>
      </div>
    </SectionCard>
  );
}
