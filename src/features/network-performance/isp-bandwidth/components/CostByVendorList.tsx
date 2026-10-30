"use client";

import React from "react";
import { useHoverTip } from "@/features/network-performance/context/TooltipLayer";
import type { IspCostVendorRow } from "../types/isp-cost.types";

export default function CostByVendorList({
  rows,
}: {
  rows: IspCostVendorRow[];
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
          Cost by vendor
        </div>
        <div style={{ fontSize: "10.5px", color: "var(--text-placeholder)" }}>
          skala 0–100 jt
        </div>
      </div>

      {/* Column Headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "82px 1fr 40px 74px 34px",
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
        {rows.map((v) => (
          <div
            key={v.vendor}
            onMouseEnter={(e) => tipEnter(e, v.tip, "none")}
            onMouseMove={(e) => tipMove(e)}
            onMouseLeave={() => tipLeave()}
            style={{
              display: "grid",
              gridTemplateColumns: "82px 1fr 40px 74px 34px",
              gap: "0 10px",
              alignItems: "center",
              cursor: "default",
              outline: "none",
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
              {v.vendor}
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
                  background: v.color,
                  width: v.width,
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
              {v.links}
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
              {v.cost}
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
              {v.pct}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
