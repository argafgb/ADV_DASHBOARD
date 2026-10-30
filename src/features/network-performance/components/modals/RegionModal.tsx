"use client";

import React from "react";
import { useFilters } from "@/features/network-performance/context/NetworkFilterContext";
import ModalShell, { ModalCloseButton } from "./ModalShell";
import { useNetworkData } from "../../context/NetworkDataContext";
import { toneColor } from "../../services/slaService";
import type { RegionRow } from "../../services/regionService";
import type { MonthRange } from "@/lib/network/month-range";

/** Modal detail region (R1–R6) — persis markup sumber (560px). */
export default function RegionModal({
  rmName,
  row,
  tahun,
  bulan,
  periodLabel,
  mapRegion,
  onToggleFilter,
  onClose,
}: {
  rmName: string;
  row: RegionRow | undefined;
  tahun: number;
  bulan: number | MonthRange | null;
  periodLabel: string;
  mapRegion: string | null;
  onToggleFilter: () => void;
  onClose: () => void;
}) {
  const { bulanRange } = useFilters();
  const { sla } = useNetworkData();
  const TARGET = sla.TARGET;
  const win = sla.activeMonths(tahun, bulanRange ?? bulan);

  // Region detail popup — branch-level SLA for the selected region (sumber).
  const rmBranches = (row?.branches ?? [])
    .map((n) => {
      const v = sla.branchValW(n, tahun, win);
      const tn = v == null ? "gray" : sla.tone(v);
      return {
        name: n,
        sla: v != null ? v.toFixed(2) + "%" : "—",
        color: v == null ? "var(--text-placeholder)" : toneColor(tn),
        status:
          v == null
            ? "Tanpa data"
            : v >= TARGET
              ? "Capai target"
              : v >= TARGET - 0.4
                ? "Mendekati"
                : "Di bawah SLA",
        chipBg:
          v == null
            ? "var(--status-gray-bg)"
            : tn === "green"
              ? "var(--status-green-bg)"
              : tn === "amber"
                ? "var(--status-amber-bg)"
                : "var(--status-red-bg)",
        chipFg: v == null ? "var(--status-gray-fg)" : toneColor(tn),
        sortV: v == null ? -1 : v,
      };
    })
    .sort((a, b) => b.sortV - a.sortV);
  const rmMeasured = rmBranches.filter((b) => b.sortV >= 0);
  const rmBest = rmMeasured[0];
  const rmWorst = rmMeasured[rmMeasured.length - 1];
  const rmBelow = row ? row.below : 0;
  const rmFilterActive = mapRegion === rmName;

  const kpiLabel: React.CSSProperties = {
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: ".05em",
    fontWeight: 700,
    color: "var(--text-placeholder)",
  };
  const kpiValue: React.CSSProperties = {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-2xl)",
    fontWeight: "var(--fw-black)" as React.CSSProperties["fontWeight"],
    color: "var(--text-primary)",
    marginTop: "3px",
    lineHeight: 1,
  };

  return (
    <ModalShell width={560} maxHeight={640} onClose={onClose}>
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
        <div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xl)",
              fontWeight: "var(--fw-bold)" as React.CSSProperties["fontWeight"],
              color: "var(--text-primary)",
            }}
          >
            {rmName}
          </div>
          <div
            style={{
              fontSize: "var(--fs-md)",
              color: "var(--text-muted)",
              marginTop: "3px",
            }}
          >
            Ringkasan SLA per cabang · {periodLabel}
          </div>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>
      <div
        style={{
          display: "flex",
          padding: "16px 22px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={kpiLabel}>Rata-rata SLA</div>
          <div style={kpiValue}>{row ? row.avg : "—"}</div>
        </div>
        <div
          style={{
            flex: 1,
            paddingLeft: "16px",
            borderLeft: "1px solid var(--border-subtle)",
          }}
        >
          <div style={kpiLabel}>Cabang</div>
          <div style={kpiValue}>{row ? row.count : 0}</div>
        </div>
        <div
          style={{
            flex: 1,
            paddingLeft: "16px",
            borderLeft: "1px solid var(--border-subtle)",
          }}
        >
          <div style={kpiLabel}>Di bawah target</div>
          <div
            style={{
              ...kpiValue,
              color:
                rmBelow > 0 ? "var(--status-red-fg)" : "var(--text-primary)",
            }}
          >
            {rmBelow}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "22px",
          padding: "12px 22px",
          borderBottom: "1px solid var(--border-subtle)",
          fontSize: "11.5px",
          color: "var(--text-muted)",
        }}
      >
        <span>
          Tertinggi:{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {rmBest ? rmBest.name : "—"}
          </strong>{" "}
          {rmBest ? rmBest.sla : "—"}
        </span>
        <span>
          Terendah:{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {rmWorst ? rmWorst.name : "—"}
          </strong>{" "}
          {rmWorst ? rmWorst.sla : "—"}
        </span>
      </div>
      <div
        className="nl-scroll"
        style={{ overflowY: "auto", padding: "6px 22px 16px", flex: 1 }}
      >
        {rmBranches.map((b) => (
          <div
            key={b.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "11px 0",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: "var(--fs-md-plus)",
                fontWeight:
                  "var(--fw-semibold)" as React.CSSProperties["fontWeight"],
                color: "var(--text-primary)",
              }}
            >
              {b.name}
            </span>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "999px",
                background: b.chipBg,
                color: b.chipFg,
                whiteSpace: "nowrap",
              }}
            >
              {b.status}
            </span>
            <span
              style={{
                width: "74px",
                textAlign: "right",
                fontFamily: "var(--font-display)",
                fontSize: "13px",
                fontWeight: 800,
                color: b.color,
              }}
            >
              {b.sla}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: "14px 22px",
          borderTop: "1px solid var(--border-default)",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={onToggleFilter}
          style={{
            border: "1px solid var(--border-default)",
            background: "var(--bg-card)",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--accent)",
            borderRadius: "var(--radius-base)",
            padding: "8px 14px",
          }}
        >
          {rmFilterActive ? "Hapus filter peta" : "Filter peta ke region ini"}
        </button>
      </div>
    </ModalShell>
  );
}
