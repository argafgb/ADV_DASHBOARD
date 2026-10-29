"use client";

import React from "react";
import { useFilters } from "@/features/network-performance/context/NetworkFilterContext";
import SectionCard from "./SectionCard";

/**
 * Shown on pages 1-3 when the selected year has no SLA data.
 *
 * The year filter is global and spans both sources, but they do not cover the
 * same years: traffic reaches back to 2025 while `branch_monthly_reports`
 * starts in 2026. Picking 2025 would otherwise leave every tile on these pages
 * blank with nothing explaining why.
 *
 * Deliberately does NOT fall back to a year that does have data — rendering
 * 2026 numbers under a "2025" filter would be worse than rendering nothing.
 *
 * Styling matches the amber notice already used inside the traffic table, so
 * this reads as the same pattern rather than a new one.
 */
export default function EmptyYearNotice({
  year,
  availableYears,
  suggestion,
}: {
  year: number;
  availableYears: number[];
  suggestion?: string;
}) {
  const { setTahun } = useFilters();
  const fallback = availableYears[availableYears.length - 1];

  return (
    <SectionCard>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "14px 16px",
          border: "1px solid var(--border-default)",
          borderLeft: "3px solid var(--status-amber-fg)",
          borderRadius: "var(--radius-base)",
          background: "var(--status-amber-bg)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--status-amber-fg)",
            }}
          >
            Data SLA {year} belum tersedia
          </div>
          <div
            style={{
              fontSize: "12px",
              lineHeight: 1.55,
              color: "var(--text-secondary)",
              marginTop: "5px",
            }}
          >
            Laporan bulanan cabang baru tersedia mulai{" "}
            {availableYears.length ? availableYears[0] : "tahun berikutnya"}, jadi
            halaman ini tidak punya angka untuk {year}.
            {suggestion ? " " + suggestion : ""}
          </div>
        </div>
        {fallback != null && (
          <button
            onClick={() => setTahun(fallback)}
            style={{
              flexShrink: 0,
              height: "32px",
              padding: "0 14px",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#fff",
              background: "var(--accent)",
              border: "1px solid var(--accent)",
              borderRadius: "var(--radius-base)",
            }}
          >
            Lihat {fallback}
          </button>
        )}
      </div>
    </SectionCard>
  );
}
