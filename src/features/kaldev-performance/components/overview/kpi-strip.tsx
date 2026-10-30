import Link from "next/link";
import type { ReactNode } from "react";

import { HoverTip } from "@/components/chart-tooltip";
import { DeltaChip } from "../ds/delta-chip";
import { IconChevronRight } from "../shared/icons";
import { p1 } from "../../utils/format";
import type {
  OverviewKpi,
  SlaSummary,
} from "../../types/kaldev.types";

/**
 * Empat kartu KPI di baris teratas Overview sesuai artefak finishing Kaldev:
 * 1. Proyek aktif (aksen biru gradien, angka 42px, kicker antrean & dikerjakan)
 * 2. Pencapaian SLA (angka 32px, selisih target, visual bar dengan jarum target, pill status)
 * 3. Melewati SLA (angka 42px, subtext merah, chevron, link ke /action-required?tab=sla)
 * 4. Selesai (angka 42px, subtext periode)
 */
export function KpiStrip({
  kpi,
  sla,
  dueHref,
}: {
  kpi: OverviewKpi;
  sla: SlaSummary;
  dueHref: string;
}) {
  let delta: ReactNode = null;
  if (kpi.doneDelta && kpi.doneDelta.previous > 0) {
    const { current, previous, span } = kpi.doneDelta;
    const change = ((current - previous) / previous) * 100;
    const up = change >= 0;
    delta = (
      <HoverTip
        content={`vs ${span} bulan sebelumnya: ${previous.toLocaleString("id-ID")}`}
      >
        <DeltaChip direction={up ? "up" : "down"} tone={up ? "up" : "down"}>
          {up ? "+" : "−"}
          {p1(Math.abs(change))}%
        </DeltaChip>
      </HoverTip>
    );
  }

  const slaFg = sla.achieved
    ? "var(--status-green-fg)"
    : "var(--status-red-fg)";
  const slaBarWidth = `${Math.max(0, Math.min(100, sla.pct))}%`;

  return (
    <div
      className="dd-kpi-grid dd-kpi-grid--4"
      style={{ alignItems: "stretch" }}
    >
      {/* 1. Proyek aktif */}
      <section className="dd-kpi dd-kpi--accent">
        <div className="dd-kpi__top">
          <span className="dd-kpi__label">Proyek aktif</span>
        </div>
        <div style={{ marginTop: "auto" }}>
          <div className="dd-kpi__row">
            <span
              className="dd-kpi__value"
              style={{ fontWeight: 600, fontSize: "42px" }}
            >
              {kpi.aktif}
            </span>
          </div>
          <div
            style={{
              marginTop: 7,
              font: "600 11.5px/1.3 var(--dd-font-sans)",
              fontVariantNumeric: "tabular-nums",
              color: "rgba(255, 255, 255, 0.82)",
            }}
          >
            {kpi.aktifSub}
          </div>
        </div>
      </section>

      {/* 2. Pencapaian SLA */}
      <section className="dd-kpi">
        <div className="dd-kpi__top">
          <span className="dd-kpi__label">Pencapaian SLA</span>
          <span
            style={{
              flex: "none",
              font: "600 11px/1 var(--dd-font-sans)",
              fontVariantNumeric: "tabular-nums",
              color: "var(--text-placeholder)",
            }}
          >
            {sla.periodLabel}
          </span>
        </div>
        <div style={{ display: "grid", gap: 9 }}>
          <div className="dd-kpi__row">
            <span
              className="dd-kpi__value"
              style={{ fontWeight: 600, fontSize: "32px" }}
            >
              {sla.pctLabel}
            </span>
          </div>
          <div
            style={{
              font: "600 12.5px/1.3 var(--dd-font-sans)",
              fontVariantNumeric: "tabular-nums",
              color: slaFg,
            }}
          >
            Target SLA: {sla.target}% · {sla.gapText}
          </div>
          <div
            style={{
              position: "relative",
              height: 7,
              borderRadius: 999,
              background: "var(--chart-gray-track)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: slaBarWidth,
                borderRadius: 999,
                background: slaFg,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -4,
                bottom: -4,
                left: `${sla.target}%`,
                width: 2,
                borderRadius: 2,
                background: "var(--text-primary)",
              }}
            />
          </div>
          <span
            style={{
              justifySelf: "start",
              width: "max-content",
              display: "inline-flex",
              alignItems: "center",
              height: 26,
              padding: "0 13px",
              borderRadius: 999,
              border: `1px solid ${slaFg}`,
              font: "600 11.5px/1 var(--dd-font-sans)",
              color: slaFg,
            }}
          >
            {sla.achieved ? "Achieved" : "Not achieved"}
          </span>
        </div>
      </section>

      {/* 3. Melewati SLA */}
      <Link
        href={dueHref}
        scroll={false}
        className="dd-kpi dd-kpi--click"
        style={{ textDecoration: "none" }}
      >
        <div className="dd-kpi__top">
          <span className="dd-kpi__label">Melewati SLA</span>
          <span
            style={{
              display: "inline-flex",
              width: 15,
              height: 15,
              color: "var(--text-lightest)",
              flex: "none",
            }}
          >
            <IconChevronRight />
          </span>
        </div>
        <div style={{ marginTop: "auto" }}>
          <div className="dd-kpi__row">
            <span
              className="dd-kpi__value"
              style={{ fontWeight: 600, fontSize: "42px" }}
            >
              {kpi.late}
            </span>
          </div>
          <div
            style={{
              marginTop: 7,
              font: "600 11.5px/1.3 var(--dd-font-sans)",
              color: "var(--status-red-fg)",
            }}
          >
            proyek aktif lewat target
          </div>
        </div>
      </Link>

      {/* 4. Selesai */}
      <section className="dd-kpi" style={{ position: "relative" }}>
        {delta && <span className="dd-kpi__delta">{delta}</span>}
        <div className="dd-kpi__top">
          <span className="dd-kpi__label">Selesai</span>
        </div>
        <div style={{ marginTop: "auto" }}>
          <div className="dd-kpi__row">
            <span
              className="dd-kpi__value"
              style={{ fontWeight: 600, fontSize: "42px" }}
            >
              {kpi.done}
            </span>
          </div>
          <div
            style={{
              marginTop: 7,
              font: "600 11.5px/1.3 var(--dd-font-sans)",
              color: "var(--text-muted)",
            }}
          >
            {kpi.doneSub}
          </div>
        </div>
      </section>
    </div>
  );
}
