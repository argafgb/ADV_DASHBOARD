"use client";

import React from "react";
import ModalShell, { ModalCloseButton } from "./ModalShell";
import SeverityBadge from "../SeverityBadge";
import type { DtRow } from "../DowntimeTable";

function fmtStamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const dateStr = d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${dateStr}, ${hours}:${minutes}`;
}

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: ".05em",
  fontWeight: 700,
  color: "var(--text-placeholder)",
};

/** Detail satu insiden — dibuka dari kolom Problem pada tabel downtime. */
export default function IncidentDetailModal({
  row,
  onClose,
}: {
  row: DtRow;
  onClose: () => void;
}) {
  const field = (label: string, value: React.ReactNode) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={labelStyle}>{label}</div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-lg-minus)",
          fontWeight: 800,
          color: "var(--text-primary)",
          marginTop: "3px",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );

  const block = (label: string, text: string | null) => (
    <div style={{ marginTop: "16px" }}>
      <div style={labelStyle}>{label}</div>
      <div
        style={{
          fontSize: "13px",
          lineHeight: 1.55,
          color: text ? "var(--text-secondary)" : "var(--text-placeholder)",
          marginTop: "5px",
          whiteSpace: "pre-wrap",
        }}
      >
        {text || "Tidak tercatat"}
      </div>
    </div>
  );

  return (
    <ModalShell width={620} maxHeight={680} onClose={onClose}>
      <div
        style={{
          padding: "20px 22px 16px",
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "4px",
            }}
          >
            <SeverityBadge level={row.level} />
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                color: "var(--text-placeholder)",
              }}
            >
              {row.cause}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xl)",
              fontWeight: "var(--fw-bold)" as React.CSSProperties["fontWeight"],
              color: "var(--text-primary)",
            }}
          >
            {row.site}
          </div>
          <div
            style={{
              fontSize: "var(--fs-md)",
              color: "var(--text-muted)",
              marginTop: "3px",
            }}
          >
            {row.region} · {row.periode}
          </div>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          padding: "16px 22px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {field("SLA bulan ini", row.sla)}
        {field("Durasi", row.durasi)}
        {field(
          "Tercatat di laporan",
          <span
            style={{
              color: row.verified
                ? "var(--status-green-fg)"
                : "var(--status-amber-fg)",
            }}
          >
            {row.verified ? "Ya" : "Belum"}
          </span>,
        )}
      </div>

      <div
        className="nl-scroll"
        style={{ overflowY: "auto", padding: "16px 22px 22px", flex: 1 }}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          {field("Mulai downtime", fmtStamp(row.downtimeStart))}
          {field("Kembali normal", fmtStamp(row.uptimeEnd))}
        </div>
        {block("Problem", row.problem)}
        {block("Dampak", row.impact)}
        {block("Solusi", row.solution)}
        {!row.verified && (
          <div
            style={{
              marginTop: "18px",
              padding: "10px 13px",
              border: "1px solid var(--border-default)",
              borderLeft: "3px solid var(--status-amber-fg)",
              borderRadius: "var(--radius-base)",
              background: "var(--status-amber-bg)",
              fontSize: "12px",
              lineHeight: 1.5,
              color: "var(--text-secondary)",
            }}
          >
            Insiden ini belum masuk ke laporan bulanan cabang, sehingga durasinya
            belum tentu tercermin pada SLA bulan tersebut.
          </div>
        )}
      </div>
    </ModalShell>
  );
}
