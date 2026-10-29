"use client";

import React from "react";
import SectionCard, { CardTitle } from "./SectionCard";
import SeverityBadge from "./SeverityBadge";
import { useHoverTip } from "../context/TooltipLayer";

export type ExposureTier = "critical" | "warning" | "nodata";

export interface ExposureRow {
  name: string;
  vendor: string;
  links: number;
  incidents: number;
  tier: ExposureTier;
}

const TIER: Record<
  ExposureTier,
  { bg: string; border: string; badge: string; note: string }
> = {
  critical: {
    bg: "var(--status-red-bg)",
    border: "var(--alert-red-border)",
    badge: "critical",
    note: "Satu tautan dan pernah tercatat downtime",
  },
  warning: {
    bg: "var(--status-amber-bg)",
    border: "var(--border-default)",
    badge: "medium",
    note: "Satu tautan — belum pernah gagal, tetap tanpa cadangan",
  },
  nodata: {
    bg: "var(--status-gray-bg)",
    border: "var(--border-default)",
    badge: "low",
    note: "Belum ada catatan tautan ISP — status redundansi tidak diketahui",
  },
};

/** Card "Redundancy & ISP exposure" — persis markup sumber. */
export default function RedundancyExposureCard({
  totalLinks,
  covTotal,
  withIspData,
  dualCount,
  singleCount,
  exposureRows,
}: {
  totalLinks: number;
  covTotal: number;
  withIspData: number;
  dualCount: number;
  singleCount: number;
  exposureRows: ExposureRow[];
}) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();
  const missing = covTotal - withIspData;

  const statBox = (
    dotColor: string,
    label: string,
    count: number,
    onEnter: (e: React.MouseEvent) => void,
  ) => (
    <div
      onMouseEnter={onEnter}
      onMouseMove={(e) => tipMove(e)}
      onMouseLeave={() => tipLeave()}
      style={{
        flex: 1,
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-base)",
        padding: "12px 14px",
        cursor: "default",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "var(--fs-sm-plus)",
          fontWeight: "var(--fw-semibold)" as React.CSSProperties["fontWeight"],
          color: "var(--text-muted)",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: dotColor,
          }}
        />
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-2xl)",
          fontWeight: "var(--fw-black)" as React.CSSProperties["fontWeight"],
          color: "var(--text-primary)",
          marginTop: "6px",
          lineHeight: 1,
        }}
      >
        {count}
        <span
          style={{
            fontSize: "var(--fs-md)",
            color: "var(--text-placeholder)",
            fontWeight: "var(--fw-bold)" as React.CSSProperties["fontWeight"],
          }}
        >
          {" "}
          cabang
        </span>
      </div>
    </div>
  );

  return (
    <SectionCard style={{ display: "flex", flexDirection: "column" }}>
      <CardTitle
        title="Redundancy & ISP exposure"
        subtitle={
          totalLinks +
          " tautan ISP di " +
          withIspData +
          " dari " +
          covTotal +
          " cabang aktif" +
          (missing > 0 ? " · " + missing + " cabang belum ada datanya" : "")
        }
      />
      <div style={{ display: "flex", gap: "12px", margin: "15px 0 4px" }}>
        {statBox(
          "var(--status-green-fg)",
          "Dual or more links",
          dualCount,
          (e) =>
            tipEnter(
              e,
              {
                title: "Dual or more links",
                primary: dualCount + " cabang",
                secondary:
                  "(" + dualCount + " dari " + withIspData + " cabang berdata)",
                meta: "Min. 2 tautan ISP, termasuk koneksi cadangan/mobile",
                tone: "green",
              },
              "none",
            ),
        )}
        {statBox(
          "var(--status-amber-fg)",
          "Single link only",
          singleCount,
          (e) =>
            tipEnter(
              e,
              {
                title: "Single link only",
                primary: singleCount + " cabang",
                secondary:
                  "(" +
                  singleCount +
                  " dari " +
                  withIspData +
                  " cabang berdata)",
                meta: "Hanya satu tautan ISP, tanpa redundansi",
                tone: "amber",
              },
              "none",
            ),
        )}
      </div>
      <div
        style={{
          fontSize: "var(--fs-sm)",
          color: "var(--text-placeholder)",
          textTransform: "uppercase",
          letterSpacing: ".05em",
          fontWeight: 700,
          margin: "16px 0 9px",
        }}
      >
        Highest exposure
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "7px",
          flex: 1,
        }}
      >
        {exposureRows.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              padding: "14px 2px",
            }}
          >
            <span
              style={{
                fontSize: "12.5px",
                fontWeight: 700,
                color: "var(--status-green-fg)",
              }}
            >
              Semua cabang punya lebih dari satu tautan
            </span>
            <span
              style={{
                fontSize: "11.5px",
                lineHeight: 1.5,
                color: "var(--text-placeholder)",
              }}
            >
              Tidak ada cabang yang bergantung pada satu ISP saja.
            </span>
          </div>
        )}
        {exposureRows.map((x) => {
          const t = TIER[x.tier];
          return (
            <div
              key={x.name}
              onMouseEnter={(e) =>
                tipEnter(
                  e,
                  {
                    title: x.name,
                    primary:
                      x.tier === "nodata"
                        ? "Tanpa data ISP"
                        : "Titik kegagalan tunggal",
                    secondary:
                      x.tier === "nodata"
                        ? "(0 tautan tercatat)"
                        : "(" + x.links + " tautan · " + x.vendor + ")",
                    meta:
                      t.note +
                      (x.incidents > 0
                        ? " · " + x.incidents + " insiden tercatat"
                        : ""),
                    tone:
                      x.tier === "critical"
                        ? "red"
                        : x.tier === "warning"
                          ? "amber"
                          : "gray",
                  },
                  "none",
                )
              }
              onMouseMove={(e) => tipMove(e)}
              onMouseLeave={() => tipLeave()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "9px 12px",
                background: t.bg,
                border: "1px solid " + t.border,
                borderRadius: "var(--radius-base)",
                cursor: "default",
              }}
            >
              <span
                style={{
                  fontSize: "var(--fs-md-plus)",
                  fontWeight:
                    "var(--fw-bold)" as React.CSSProperties["fontWeight"],
                  color: "var(--text-primary)",
                }}
              >
                {x.name}
              </span>
              <span
                style={{
                  fontSize: "var(--fs-sm-plus)",
                  color: "var(--text-muted)",
                }}
              >
                {x.tier === "nodata" ? "tanpa data ISP" : x.vendor}
              </span>
              <span style={{ flex: 1 }} />
              <SeverityBadge level={t.badge} />
            </div>
          );
        })}
      </div>
      {missing > 0 && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-placeholder)",
            marginTop: "12px",
            lineHeight: 1.4,
          }}
        >
          {missing} cabang aktif belum punya catatan tautan ISP, jadi status
          redundansinya belum bisa dinilai — bukan berarti tanpa cadangan.
        </div>
      )}
    </SectionCard>
  );
}
