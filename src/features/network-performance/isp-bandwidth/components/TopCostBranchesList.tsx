"use client";

import React from "react";
import { useHoverTip } from "@/features/network-performance/context/TooltipLayer";
import type { IspCostBranchTopRow } from "../types/isp-cost.types";

export default function TopCostBranchesList({
  rows,
}: {
  rows: IspCostBranchTopRow[];
}) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();

  return (
    <div>
      {/* List Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-placeholder)",
            textTransform: "uppercase",
            letterSpacing: ".05em",
            fontWeight: 700,
          }}
        >
          Top 10 branches by cost
        </div>
        <div style={{ fontSize: "10.5px", color: "var(--text-placeholder)" }}>
          skala 0–50 jt
        </div>
      </div>

      {/* Column Headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "138px 1fr 40px 74px 34px",
          gap: "0 10px",
          marginBottom: "7px",
        }}
      >
        <span />
        <span />
        <span
          style={{
            fontSize: "9.5px",
            textTransform: "uppercase",
            letterSpacing: ".05em",
            fontWeight: 700,
            color: "var(--text-placeholder)",
            textAlign: "right",
          }}
        >
          Link
        </span>
        <span
          style={{
            fontSize: "9.5px",
            textTransform: "uppercase",
            letterSpacing: ".05em",
            fontWeight: 700,
            color: "var(--text-placeholder)",
            textAlign: "right",
          }}
        >
          Rp / bln
        </span>
        <span
          style={{
            fontSize: "9.5px",
            textTransform: "uppercase",
            letterSpacing: ".05em",
            fontWeight: 700,
            color: "var(--text-placeholder)",
            textAlign: "right",
          }}
        >
          Porsi
        </span>
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
        {rows.map((b) => (
          <div
            key={b.branch}
            onMouseEnter={(e) => tipEnter(e, b.tip, "none")}
            onMouseMove={(e) => tipMove(e)}
            onMouseLeave={() => tipLeave()}
            style={{
              display: "grid",
              gridTemplateColumns: "138px 1fr 40px 74px 34px",
              gap: "0 10px",
              alignItems: "center",
              cursor: "default",
              outline: "none",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "6px",
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {b.branch}
              </span>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 700,
                  color: "var(--text-placeholder)",
                  flexShrink: 0,
                }}
              >
                {b.region}
              </span>
            </span>
            <div
              style={{
                height: "10px",
                background: "var(--chart-gray-track)",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "999px",
                  background: b.color,
                  width: b.width,
                  transition: "width .5s ease",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textAlign: "right",
              }}
            >
              {b.links}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "11.5px",
                fontWeight: 800,
                color: "var(--text-primary)",
                textAlign: "right",
                whiteSpace: "nowrap",
              }}
            >
              {b.cost}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "10.5px",
                fontWeight: 700,
                color: "var(--text-placeholder)",
                textAlign: "right",
              }}
            >
              {b.pct}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
