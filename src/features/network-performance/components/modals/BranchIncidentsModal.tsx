"use client";

import React from "react";
import ModalShell, { ModalCloseButton } from "./ModalShell";
import SeverityBadge from "../SeverityBadge";
import type { DtRow } from "../DowntimeTable";

/** Modal listing every incident at one branch — opened from a grouped map marker; row click opens IncidentDetailModal. */
export default function BranchIncidentsModal({
  branchName,
  rows,
  onSelect,
  onClose,
}: {
  branchName: string;
  rows: DtRow[];
  onSelect: (row: DtRow) => void;
  onClose: () => void;
}) {
  return (
    <ModalShell width={560} maxHeight={640} onClose={onClose}>
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
            {branchName}
          </div>
          <div
            style={{
              fontSize: "var(--fs-md)",
              color: "var(--text-muted)",
              marginTop: "3px",
            }}
          >
            {rows.length} insiden di cabang ini
          </div>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>
      <div
        className="nl-scroll"
        style={{ overflowY: "auto", padding: "10px 22px 20px" }}
      >
        {rows.map((r) => (
          <div
            key={r.id}
            onClick={() => onSelect(r)}
            title="Lihat detail insiden"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "13px 10px",
              margin: "0 -10px",
              borderBottom: "1px solid var(--border-subtle)",
              cursor: "pointer",
              borderRadius: "var(--radius-base)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "";
            }}
          >
            <div style={{ flexShrink: 0, marginTop: "1px" }}>
              <SeverityBadge level={r.level} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ display: "flex", alignItems: "baseline", gap: "10px" }}
              >
                <span
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "11.5px",
                    color: "var(--text-placeholder)",
                  }}
                >
                  {r.periode}
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
                  {r.sla}
                </span>
                <span
                  style={{
                    fontSize: "var(--fs-sm-plus)",
                    color: "var(--text-placeholder)",
                  }}
                >
                  {r.durasi}
                </span>
              </div>
              <div
                style={{
                  fontSize: "var(--fs-md)",
                  color: "var(--text-muted)",
                  marginTop: "3px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.problem}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
