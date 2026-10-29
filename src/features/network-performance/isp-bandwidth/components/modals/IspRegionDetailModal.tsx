"use client";

import React from "react";
import ModalShell, {
  ModalCloseButton,
} from "@/features/network-performance/components/modals/ModalShell";
import type { IspRegionModalData } from "../../types/isp-cost.types";

export default function IspRegionDetailModal({
  data,
  onClose,
}: {
  data: IspRegionModalData | null;
  onClose: () => void;
}) {
  if (!data) return null;

  return (
    <ModalShell width={440} maxHeight={560} onClose={onClose}>
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
              {data.region}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-placeholder)",
                fontWeight: 600,
              }}
            >
              {data.area}
            </div>
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
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginTop: "10px",
              lineHeight: 1,
            }}
          >
            {data.total}{" "}
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-muted)",
              }}
            >
              per bulan
            </span>
          </div>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      {/* Scrollable Branch List */}
      <div
        className="nl-scroll"
        style={{
          overflowY: "auto",
          padding: "8px 22px 20px",
          contain: "paint",
        }}
      >
        {data.rows.map((b) => (
          <div
            key={b.branch}
            style={{
              padding: "11px 0",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "7px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {b.branch}
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "var(--text-placeholder)",
                  }}
                >
                  {b.links}
                </span>
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {b.cost}
              </span>
            </div>
            <div
              style={{
                height: "6px",
                borderRadius: "999px",
                background: "var(--chart-gray-track)",
                overflow: "hidden",
                marginTop: "7px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "999px",
                  background: b.color,
                  width: b.width,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
