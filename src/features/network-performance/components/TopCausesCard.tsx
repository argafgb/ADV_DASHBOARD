"use client";

import React from "react";
import SectionCard, { CardTitle } from "./SectionCard";

export interface TopCauseRow {
  label: string;
  count: number;
  color: string;
  width: string;
}

/** Card "Top network causes" — persis markup sumber. */
export default function TopCausesCard({
  tahunLabel,
  rows,
}: {
  tahunLabel: string;
  rows: TopCauseRow[];
}) {
  return (
    <SectionCard>
      <CardTitle
        title="Top network causes"
        subtitle={"Berdasarkan dataset Downtime di bawah SLA · " + tahunLabel}
        subtitleMarginBottom="16px"
      />
      {rows.length === 0 ? (
        <div
          style={{
            padding: "24px 0",
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "var(--fs-sm)",
            fontStyle: "italic",
          }}
        >
          Belum ada insiden tercatat untuk periode ini.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
          {rows.map((c) => (
            <div key={c.label}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "9px",
                    fontSize: "var(--fs-md-minus)",
                    fontWeight:
                      "var(--fw-semibold)" as React.CSSProperties["fontWeight"],
                    color: "var(--text-secondary)",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: c.color,
                    }}
                  />
                  {c.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-md-plus)",
                    fontWeight:
                      "var(--fw-black)" as React.CSSProperties["fontWeight"],
                    color: "var(--text-primary)",
                  }}
                >
                  {c.count}
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "7px",
                  background: "var(--chart-gray-track)",
                  borderRadius: "999px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: "999px",
                    transition: "width .5s ease",
                    background: c.color,
                    width: c.width,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
