"use client";

import { TipRows, useChartTooltip } from "@/components/chart-tooltip";
import { Card } from "../shared/card";
import { fmt, pct1 } from "../../utils/format";
import type { TrendPoint } from "../../types/kaldev.types";

function toneFg(gap: number): string {
  return gap <= 0
    ? "var(--status-green-fg)"
    : gap <= 5
      ? "var(--status-amber-fg)"
      : "var(--status-red-fg)";
}

/**
 * "Tren SLA <tahun>" pada tab Tren & kategori: batang komposisi tercapai
 * (hijau) di atas jalur abu-abu per bulan, garis target putus-putus, dan
 * persentase berwarna sesuai jaraknya ke target.
 */
export function CompositionChart({
  trend,
  target,
  yearLabel,
  note,
}: {
  trend: TrendPoint[];
  target: number;
  yearLabel: string;
  note: string | null;
}) {
  const tip = useChartTooltip();

  return (
    <Card
      title={`Tren SLA ${yearLabel}`}
      subtitle="Komposisi tercapai dan tidak tercapai per bulan"
      actions={
        <div className="dd-chart__legend">
          <span className="dd-chart__legenditem">
            <span
              className="dd-chart__dot"
              style={{ background: "var(--chart-green)" }}
            />
            Tercapai
          </span>
          <span className="dd-chart__legenditem">
            <span
              style={{
                width: 14,
                borderTop: "2px dashed var(--text-secondary)",
                flex: "0 0 auto",
              }}
            />
            Target {target}%
          </span>
        </div>
      }
    >
      {trend.length === 0 ? (
        <div className="dd-empty">
          <div className="dd-empty__title">Belum ada proyek selesai</div>
          <div className="dd-empty__msg">
            Pilih periode lain untuk melihat komposisi SLA.
          </div>
        </div>
      ) : (
        <div className="dd-chart" style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {trend.map((t) => (
              <span
                key={t.key}
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: "center",
                  font: "600 12px/1 var(--dd-font-sans)",
                  fontVariantNumeric: "tabular-nums",
                  color: toneFg(target - t.pct),
                }}
              >
                {pct1(t.pct)}
              </span>
            ))}
          </div>
          <div
            className={tip.active ? "dd-chart--dim" : undefined}
            style={{
              position: "relative",
              height: 280,
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: `${target}%`,
                borderTop: "2px dashed var(--text-secondary)",
                zIndex: 3,
                pointerEvents: "none",
              }}
            />
            {trend.map((t) => (
              <div
                key={t.key}
                className={"dd-mark" + tip.hotClass(t.key)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: "100%",
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  tip.show(
                    e,
                    <TipRows
                      title={t.full}
                      rows={[
                        {
                          color: "var(--chart-green)",
                          label: "Tercapai",
                          value: `${fmt(t.ok)} (${pct1(t.pct)})`,
                        },
                        {
                          color: "var(--chart-red)",
                          label: "Tidak tercapai",
                          value: `${fmt(t.no)} (${pct1(100 - t.pct)})`,
                        },
                        {
                          label: "Total selesai",
                          value: fmt(t.ok + t.no),
                        },
                      ]}
                    />,
                    t.key,
                  )
                }
                onMouseMove={tip.move}
                onMouseLeave={tip.hide}
              >
                <div
                  style={{
                    width: "50%",
                    maxWidth: 34,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    background: "var(--chart-gray-track)",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: `${t.pct}%`,
                      background: "var(--chart-green)",
                      borderRadius: 5,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {trend.map((t) => (
              <span
                key={t.key}
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: "center",
                  font: "600 11px/1 var(--dd-font-sans)",
                  color: "var(--text-muted)",
                }}
              >
                {t.label}
                {t.partial ? "*" : ""}
              </span>
            ))}
          </div>
          {note && <div className="dd-chart__note">{note}</div>}
          {tip.node}
        </div>
      )}
    </Card>
  );
}
