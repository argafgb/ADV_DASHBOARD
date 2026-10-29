"use client";

import React from "react";
import { MONTHS } from "../data/constants";
import { useNetworkData } from "../context/NetworkDataContext";
import { useHoverTip } from "../context/TooltipLayer";

/**
 * Heatmap "SLA per cabang per minggu" — dihitung dari insiden downtime riil.
 * cw=23, delegasi tooltip via atribut data-tip.
 */
export default function SlaWeeklyHeatmap({ tahun }: { tahun: number }) {
  const { sla } = useNetworkData();
  const { tipEnter, tipMove, tipLeave } = useHoverTip();
  const y = tahun;
  const cw = 23;
  const TARGET = sla.TARGET;
  const statusOf = (v: number | null) =>
    v == null
      ? "No data"
      : v >= TARGET
        ? "On target"
        : v >= TARGET - 0.3
          ? "Near target"
          : "Below SLA";
  const monthDiv = "2px solid var(--border-divider)";
  const weekDiv = "1px solid var(--border-subtle)";
  const hatch =
    "repeating-linear-gradient(45deg, rgba(17,24,39,.06) 0 3px, transparent 3px 6px)";

  const mappedBranches = sla.mapped();

  const cornerCell: React.CSSProperties = {
    position: "sticky",
    left: 0,
    zIndex: 6,
    background: "#fff",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: ".04em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    padding: "6px 12px",
    textAlign: "left",
    minWidth: "132px",
    borderBottom: "1px solid var(--border-default)",
    borderRight: "1px solid var(--border-default)",
  };
  const avgHead: React.CSSProperties = {
    position: "sticky",
    right: 0,
    zIndex: 6,
    background: "#fff",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: ".04em",
    textTransform: "uppercase",
    color: "var(--text-primary)",
    padding: "6px 8px",
    textAlign: "center",
    borderBottom: "1px solid var(--border-default)",
    borderLeft: "1px solid var(--border-default)",
    minWidth: "56px",
  };

  const monthTh = MONTHS.map((m, mi) => {
    const numWeeks = sla.getWeeksInMonth(y, mi);
    return (
      <th
        key={mi}
        colSpan={numWeeks}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 4,
          background: "#fff",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: ".03em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          padding: "6px 0",
          textAlign: "center",
          borderBottom: "1px solid var(--border-default)",
          borderLeft: mi === 0 ? "none" : monthDiv,
        }}
      >
        {m}
      </th>
    );
  });

  const weekTh: React.ReactNode[] = [];
  MONTHS.forEach((m, mi) => {
    const numWeeks = sla.getWeeksInMonth(y, mi);
    for (let w = 0; w < numWeeks; w++) {
      weekTh.push(
        <th
          key={mi + "-" + w}
          style={{
            position: "sticky",
            top: 26,
            zIndex: 3,
            background: "#fff",
            fontSize: "8.5px",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: "var(--text-placeholder)",
            padding: "4px 0",
            textAlign: "center",
            width: cw + "px",
            minWidth: cw + "px",
            borderBottom: "1px solid var(--border-default)",
            borderLeft: w === 0 ? (mi === 0 ? "none" : monthDiv) : weekDiv,
          }}
        >
          {"W" + (w + 1)}
        </th>,
      );
    }
  });

  return (
    <div
      className="nl-scroll"
      style={{
        overflow: "auto",
        maxHeight: "520px",
        border: "1px solid var(--border-subtle)",
        borderRadius: "10px",
      }}
      onMouseOver={(e) => {
        const target = e.target as HTMLElement;
        const c = target.closest && (target.closest("[data-tip]") as HTMLElement);
        if (!c) return;
        const v = c.getAttribute("data-v");
        tipEnter(
          e,
          {
            title: c.getAttribute("data-b") || "",
            primary: v ? "SLA " + v + "%" : "Tidak ada data",
            secondary: "(" + c.getAttribute("data-p") + ")",
            meta: c.getAttribute("data-meta") || c.getAttribute("data-status"),
            tone: c.getAttribute("data-tone") || undefined,
          },
          "rect",
          c,
        );
      }}
      onMouseMove={(e) => tipMove(e)}
      onMouseOut={(e) => {
        const to = e.relatedTarget as HTMLElement | null;
        if (!to || !to.closest || !to.closest("[data-tip]")) tipLeave();
      }}
    >
      <table
        style={{
          borderCollapse: "separate",
          borderSpacing: 0,
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            <th rowSpan={2} style={{ top: 0, ...cornerCell }}>
              Cabang
            </th>
            {monthTh}
            <th rowSpan={2} style={{ top: 0, ...avgHead }}>
              AVG
            </th>
          </tr>
          <tr>{weekTh}</tr>
        </thead>
        <tbody>
          {mappedBranches.map((b, ri) => {
            const cells: React.ReactNode[] = [];
            const allWeekValues: (number | null)[] = [];
            let hasAnyReport = false;

            MONTHS.forEach((m, mi) => {
              const weekInfos = sla.weeksForBranchMonth(b.name, y, mi);
              weekInfos.forEach((info, w) => {
                allWeekValues.push(info.value);
                if (info.value != null) hasAnyReport = true;

                const v = info.value;
                const t = sla.cellTone(v);
                const cellNo = v == null;
                const metaText =
                  info.downtimeMinutes > 0
                    ? "Downtime: " +
                      info.downtimeMinutes +
                      " mnt (" +
                      info.incidentCount +
                      " insiden)"
                    : statusOf(v);

                cells.push(
                  <td
                    key={mi + "-" + w}
                    style={{
                      padding: "2px",
                      borderBottom: "1px solid var(--border-subtle)",
                      borderLeft:
                        w === 0 ? (mi === 0 ? "none" : monthDiv) : weekDiv,
                    }}
                  >
                    <div
                      data-tip="1"
                      data-b={b.name}
                      data-p={
                        m +
                        " W" +
                        (w + 1) +
                        " " +
                        y +
                        " · " +
                        info.dateRangeLabel
                      }
                      data-v={v != null ? v.toFixed(2) : ""}
                      data-tone={sla.tone(v)}
                      data-status={statusOf(v)}
                      data-meta={metaText}
                      style={{
                        height: "20px",
                        borderRadius: "4px",
                        background: t.bg,
                        backgroundImage: cellNo ? hatch : "none",
                      }}
                    />
                  </td>,
                );
              });
            });

            const present = allWeekValues.filter(
              (c): c is number => c != null && !isNaN(c),
            );
            const avg = present.length
              ? present.reduce((a, c) => a + c, 0) / present.length
              : null;
            const at = sla.cellTone(avg);

            return (
              <tr key={ri}>
                <td
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                    background: "#fff",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: !hasAnyReport
                      ? "var(--text-placeholder)"
                      : "var(--text-secondary)",
                    fontStyle: !hasAnyReport ? "italic" : "normal",
                    padding: "0 12px",
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid var(--border-subtle)",
                    borderRight: "1px solid var(--border-default)",
                  }}
                >
                  {b.name}
                </td>
                {cells}
                <td
                  style={{
                    position: "sticky",
                    right: 0,
                    zIndex: 1,
                    background: "#fff",
                    padding: "2px 6px",
                    borderBottom: "1px solid var(--border-subtle)",
                    borderLeft: "1px solid var(--border-default)",
                  }}
                >
                  <div
                    style={{
                      background: at.bg,
                      color: at.fg,
                      fontFamily: "var(--font-display)",
                      fontSize: "11px",
                      fontWeight: 800,
                      borderRadius: "6px",
                      padding: "6px 0",
                      textAlign: "center",
                    }}
                  >
                    {avg != null ? avg.toFixed(2) : "—"}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
