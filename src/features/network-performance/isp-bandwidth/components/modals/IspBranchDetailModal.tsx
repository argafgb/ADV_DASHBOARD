"use client";

import React from "react";
import ModalShell, {
  ModalCloseButton,
} from "@/features/network-performance/components/modals/ModalShell";
import type { IspBranchModalData } from "../../types/isp-cost.types";

export default function IspBranchDetailModal({
  data,
  onClose,
}: {
  data: IspBranchModalData | null;
  onClose: () => void;
}) {
  if (!data) return null;

  return (
    <ModalShell width={520} maxHeight={640} onClose={onClose}>
      {/* Header */}
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
          <div style={{ display: "flex", alignItems: "baseline", gap: "9px" }}>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xl)",
                fontWeight: "var(--fw-bold)",
                color: "var(--text-primary)",
              }}
            >
              {data.branch}
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--text-placeholder)",
              }}
            >
              {data.region}
            </span>
          </div>
          <div
            style={{
              fontSize: "var(--fs-md)",
              color: "var(--text-placeholder)",
              marginTop: "4px",
            }}
          >
            {data.subtitle}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "12px",
              marginTop: "10px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {data.cost}{" "}
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                }}
              >
                / bulan
              </span>
            </div>
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              Total setahun: <b>{data.yearTotal}</b>
            </span>
          </div>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      {/* Scrollable Content */}
      <div
        className="nl-scroll"
        style={{
          overflowY: "auto",
          padding: "16px 22px 20px",
          contain: "paint",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* KPI Mini Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            background: "var(--bg-page)",
            padding: "10px 12px",
            borderRadius: "var(--radius-base)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "9.5px",
                textTransform: "uppercase",
                letterSpacing: ".04em",
                fontWeight: 700,
                color: "var(--text-placeholder)",
              }}
            >
              Bulan Termahal
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "13px",
                fontWeight: 800,
                color: "#B45309",
                marginTop: "3px",
              }}
            >
              {data.hiLabel} · {data.hiValue}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "9.5px",
                textTransform: "uppercase",
                letterSpacing: ".04em",
                fontWeight: 700,
                color: "var(--text-placeholder)",
              }}
            >
              Bulan Termurah
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "13px",
                fontWeight: 800,
                color: "#047857",
                marginTop: "3px",
              }}
            >
              {data.loLabel} · {data.loValue}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "9.5px",
                textTransform: "uppercase",
                letterSpacing: ".04em",
                fontWeight: 700,
                color: "var(--text-placeholder)",
              }}
            >
              Rentang Selisih
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "13px",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginTop: "3px",
              }}
            >
              {data.spread}
            </div>
          </div>
        </div>

        {/* Section 1: Monthly Cost Trend */}
        <div>
          <div
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--text-placeholder)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              fontWeight: 700,
              marginBottom: "10px",
            }}
          >
            Biaya Per Bulan (Jan–Des)
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {data.months.map((m) => (
              <div
                key={m.month}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr 88px 48px",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  {m.month}
                </span>
                <div
                  style={{
                    height: "8px",
                    background: "var(--chart-gray-track)",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "999px",
                      background: m.color,
                      width: m.width,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    textAlign: "right",
                  }}
                >
                  {m.value}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: m.deltaColor,
                    textAlign: "right",
                  }}
                >
                  {m.delta}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Links Breakdown */}
        <div>
          <div
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--text-placeholder)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              fontWeight: 700,
              marginBottom: "10px",
            }}
          >
            Komposisi Link & Vendor
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "9px",
            }}
          >
            {data.links.map((l) => (
              <div
                key={l.vendor}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 70px 1fr 88px 42px",
                  gap: "10px",
                  alignItems: "center",
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
                  {l.vendor}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: "var(--text-placeholder)",
                  }}
                >
                  {l.mbps}
                </span>
                <div
                  style={{
                    height: "8px",
                    background: "var(--chart-gray-track)",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "999px",
                      background: l.color,
                      width: l.width,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    textAlign: "right",
                  }}
                >
                  {l.cost}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textAlign: "right",
                  }}
                >
                  {l.share}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
