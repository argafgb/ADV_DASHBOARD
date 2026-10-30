"use client";

import React from "react";
import type { RegionRow } from "../services/regionService";

interface RegionSummaryPanelProps {
  rows: RegionRow[];
  mapRegion: string | null;
  onClearMapRegion: () => void;
  onRegionClick: (name: string) => void;
}

/** Panel "Ringkasan per region" + grid 6 kartu region — persis markup sumber. */
export default function RegionSummaryPanel({
  rows,
  mapRegion,
  onClearMapRegion,
  onRegionClick,
}: RegionSummaryPanelProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "16px 0 10px",
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
          Ringkasan per region
        </div>
        {mapRegion && (
          <button
            onClick={onClearMapRegion}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--accent)",
            }}
          >
            Reset filter
          </button>
        )}
      </div>
      <div
        className="network-region-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6,1fr)",
          gap: "10px",
        }}
      >
        {rows.map((r) => {
          const active = mapRegion === r.name;
          return (
            <button
              key={r.name}
              onClick={() => onRegionClick(r.name)}
              style={{
                textAlign: "left",
                cursor: "pointer",
                background: active ? "var(--accent-tint)" : "var(--bg-card)",
                border:
                  "1px solid " +
                  (active ? "var(--accent)" : "var(--border-default)"),
                borderRadius: "var(--radius-base)",
                padding: "12px 13px",
                transition: "border-color .15s,background .15s",
              }}
            >
              <div
                style={{
                  fontSize: "var(--fs-md-plus)",
                  fontWeight:
                    "var(--fw-bold)" as React.CSSProperties["fontWeight"],
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.name}
              </div>
              <div
                style={{
                  fontSize: "10.5px",
                  color: "var(--text-placeholder)",
                  fontWeight: 600,
                  marginTop: "2px",
                  lineHeight: 1.3,
                  height: "26px",
                  overflow: "hidden",
                }}
              >
                {r.area}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-2xl)",
                  fontWeight:
                    "var(--fw-black)" as React.CSSProperties["fontWeight"],
                  color: "var(--text-primary)",
                  marginTop: "5px",
                  lineHeight: 1,
                }}
              >
                {r.avg}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  marginTop: "8px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>
                  {r.count} cabang
                </span>
                <span
                  style={{
                    color:
                      r.below > 0
                        ? "var(--status-red-fg)"
                        : "var(--text-placeholder)",
                  }}
                >
                  {r.below} di bawah target
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
