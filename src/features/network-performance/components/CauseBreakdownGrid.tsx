"use client";

import React from "react";
import { useHoverTip } from "../context/TooltipLayer";

export interface CauseRow {
  name: string;
  count: number;
  branches: string[];
  color: string;
  width: string;
  active?: boolean;
}

/** Grid "Penyebab downtime" — klik memfilter tabel & peta (persis sumber). */
export default function CauseBreakdownGrid({
  rows,
  total,
  onToggle,
}: {
  rows: CauseRow[];
  total: number;
  onToggle: (name: string) => void;
}) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();

  return (
    <div
      className="network-cause-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: "10px",
      }}
    >
      {rows.length === 0 ? (
        <div
          style={{
            gridColumn: "1 / -1",
            padding: "24px 0",
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "var(--fs-sm)",
            fontStyle: "italic",
          }}
        >
          Belum ada insiden downtime untuk periode ini.
        </div>
      ) : (
        rows.map((c) => (
        <button
          key={c.name}
          onClick={() => onToggle(c.name)}
          onMouseEnter={(e) =>
            tipEnter(
              e,
              {
                title: c.name,
                primary: c.count + " insiden",
                secondary: "(" + c.count + " dari " + total + " insiden)",
                meta: "Cabang: " + c.branches.join(", "),
                tone: "blue",
              },
              "none",
            )
          }
          onMouseMove={(e) => tipMove(e)}
          onMouseLeave={() => tipLeave()}
          style={{
            textAlign: "left",
            border: c.active
              ? "2px solid var(--accent)"
              : "1px solid var(--border-default)",
            background: c.active
              ? "rgba(37, 99, 235, 0.04)"
              : "var(--bg-card)",
            borderRadius: "var(--radius-base)",
            padding: c.active ? "11px 12px" : "12px 13px",
            cursor: "pointer",
            boxShadow: c.active ? "0 2px 8px rgba(37, 99, 235, 0.12)" : "none",
            transition: "border-color .15s, background .15s, box-shadow .15s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: c.active ? 700 : 600,
                color: c.active ? "var(--accent)" : "var(--text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c.name}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "16px",
                fontWeight: 800,
                color: "var(--text-primary)",
                flexShrink: 0,
              }}
            >
              {c.count}
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "var(--chart-gray-track)",
              borderRadius: "999px",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: "999px",
                background: c.color,
                width: c.width,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              marginTop: "9px",
            }}
          >
            {c.branches.map((bn) => (
              <span
                key={bn}
                style={{
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  background: "var(--bg-page)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "999px",
                  padding: "2px 8px",
                }}
              >
                {bn}
              </span>
            ))}
          </div>
        </button>
      )))}
    </div>
  );
}
