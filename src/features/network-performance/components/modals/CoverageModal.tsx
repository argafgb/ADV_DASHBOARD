"use client";

import React from "react";
import ModalShell, { ModalCloseButton } from "./ModalShell";

export interface CoverageRow {
  name: string;
  region: string;
}

/** Modal "Branches without monitoring data" — persis markup sumber (520px). */
export default function CoverageModal({
  rows,
  periodLabel,
  onClose,
}: {
  rows: CoverageRow[];
  periodLabel: string;
  onClose: () => void;
}) {
  return (
    <ModalShell width={520} maxHeight={620} onClose={onClose}>
      <div
        style={{
          padding: "20px 22px 16px",
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xl)",
              fontWeight: "var(--fw-bold)" as React.CSSProperties["fontWeight"],
              color: "var(--text-primary)",
            }}
          >
            Branches without monitoring data
          </div>
          <div
            style={{
              fontSize: "var(--fs-md)",
              color: "var(--text-muted)",
              marginTop: "3px",
            }}
          >
            {rows.length} cabang tanpa hasil uji · {periodLabel}
          </div>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>
      <div
        className="nl-scroll"
        style={{ overflowY: "auto", padding: "10px 22px 20px" }}
      >
        {rows.length === 0 && (
          <div
            style={{
              padding: "18px 0",
              fontSize: "var(--fs-md)",
              color: "var(--text-muted)",
              lineHeight: 1.55,
            }}
          >
            Seluruh cabang punya hasil uji pada periode ini.
          </div>
        )}
        {rows.map((b) => (
          <div
            key={b.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "13px 0",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "var(--fs-md-plus)",
                  fontWeight:
                    "var(--fw-bold)" as React.CSSProperties["fontWeight"],
                  color: "var(--text-primary)",
                }}
              >
                {b.name}
              </div>
              <div
                style={{
                  fontSize: "var(--fs-sm-plus)",
                  color: "var(--text-placeholder)",
                  marginTop: "2px",
                }}
              >
                {b.region}
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight:
                  "var(--fw-bold)" as React.CSSProperties["fontWeight"],
                padding: "3px 11px",
                borderRadius: "var(--radius-pill)",
                background: "var(--status-gray-bg)",
                color: "var(--status-gray-fg)",
              }}
            >
              No data
            </span>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
