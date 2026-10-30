"use client";

import Link from "next/link";
import { Card } from "../shared/card";
import { Donut } from "../shared/donut";
import { fmt } from "../../utils/format";
import type { MixSlice } from "../../types/kaldev.types";

const COLOR: Record<MixSlice["key"], string> = {
  done: "var(--chart-green)",
  prog: "var(--chart-blue-primary)",
  queue: "var(--chart-amber)",
  planned: "var(--chart-blue-light, #60A5FA)",
};

/** "Status project" — donut Selesai / Dikerjakan / Antrean / Planned + hold & cancel dipisah di bawahnya. */
export function StatusMixCard({
  slices,
  total,
  subtitle,
  holdCount = 0,
  cancelCount = 0,
}: {
  slices: MixSlice[];
  total: number;
  subtitle: string;
  holdCount?: number;
  cancelCount?: number;
}) {
  return (
    <Card
      title="Status project"
      subtitle={subtitle}
      style={{ minWidth: 0 }}
      bodyStyle={{
        display: "grid",
        gap: 14,
        justifyItems: "center",
        gridTemplateColumns: "minmax(0,1fr)",
      }}
    >
      <Donut
        data={slices.map((s) => ({
          label: s.label,
          value: s.value,
          color: COLOR[s.key] ?? "var(--chart-neutral)",
        }))}
        size={164}
        stroke={24}
        centerValue={fmt(total)}
        centerCaption="proyek"
      />
      <div style={{ width: "100%", display: "grid", gap: 0 }}>
        {slices.map((s) => (
          <span
            key={s.key}
            className="dd-tooltip-wrap"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 0",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                flex: "0 0 auto",
                background: COLOR[s.key] ?? "var(--chart-neutral)",
              }}
            />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                font: "600 12px/1.3 var(--dd-font-sans)",
                color: "var(--text-secondary)",
              }}
            >
              {s.label}
            </span>
            <span
              style={{
                flex: "0 0 auto",
                font: "600 12.5px/1 var(--dd-font-sans)",
                fontVariantNumeric: "tabular-nums",
                color: "var(--text-primary)",
              }}
            >
              {fmt(s.value)}
            </span>
            <span
              style={{
                flex: "0 0 auto",
                width: 32,
                textAlign: "right",
                font: "400 11.5px/1 var(--dd-font-sans)",
                fontVariantNumeric: "tabular-nums",
                color: "var(--text-placeholder)",
              }}
            >
              {s.pct}%
            </span>
          </span>
        ))}
      </div>

      {/* Status Ditahan (Hold) & Cancelled dipisah di bawahnya sesuai feedback own dev */}
      {(holdCount > 0 || cancelCount > 0) && (
        <div
          style={{
            width: "100%",
            display: "grid",
            gap: 8,
            marginTop: 6,
            paddingTop: 10,
            borderTop: "1px dashed var(--border-default)",
          }}
        >
          {holdCount > 0 && (
            <Link
              href="/dashboard/kaldev-performance/action-required?tab=hold"
              scroll={false}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: 8,
                background: "var(--status-amber-bg)",
                border: "1px solid var(--border-subtle)",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <span
                  className="dd-pill dd-pill--amber"
                  style={{ padding: "2px 8px" }}
                >
                  <span className="dd-pill__dot" />
                  Ditahan
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: "var(--status-amber-fg)",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Proyek di-pause
                </span>
              </div>
              <span
                style={{
                  font: "600 12.5px/1 var(--dd-font-sans)",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--status-amber-fg)",
                }}
              >
                {fmt(holdCount)}
              </span>
            </Link>
          )}

          {cancelCount > 0 && (
            <Link
              href="/dashboard/kaldev-performance/project-register?view=table&status=Dibatalkan"
              scroll={false}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: 8,
                background: "var(--status-red-bg)",
                border: "1px solid var(--border-subtle)",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <span
                  className="dd-pill dd-pill--red"
                  style={{ padding: "2px 8px" }}
                >
                  <span className="dd-pill__dot" />
                  Dibatalkan
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: "var(--status-red-fg)",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Proyek cancel
                </span>
              </div>
              <span
                style={{
                  font: "600 12.5px/1 var(--dd-font-sans)",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--status-red-fg)",
                }}
              >
                {fmt(cancelCount)}
              </span>
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
