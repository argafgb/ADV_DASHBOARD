"use client";

import type { CSSProperties } from "react";

import { TipRows, useChartTooltip } from "@/components/chart-tooltip";
import { Card } from "../shared/card";
import { fmt } from "../../utils/format";
import type { CategoryRow } from "../../types/kaldev.types";

const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];

/** Skala sumbu tiga langkah (mis. 0 · 10 · 20 · 30 untuk maksimum 23). */
function axisTop(max: number): number {
  const step = STEPS.find((s) => s * 3 >= max) ?? STEPS[STEPS.length - 1];
  return step * 3;
}

/**
 * `RankedBar` design system: batang horizontal per kategori dengan gridline
 * vertikal dan sumbu X di bawah.
 */
export function CategoryRankedCard({
  rows,
  title = "Proyek aktif per kategori",
  subtitle = "Antrean dan dikerjakan, urut terbanyak",
}: {
  rows: CategoryRow[];
  title?: string;
  subtitle?: string;
}) {
  const tip = useChartTooltip();
  const max = Math.max(0, ...rows.map((r) => r.value));
  const top = axisTop(max);
  const ticks = [0, 1, 2, 3].map((i) => ({
    label: fmt((top / 3) * i),
    left: (i / 3) * 100,
  }));

  return (
    <Card title={title} subtitle={subtitle}>
      {rows.length === 0 ? (
        <div className="dd-empty">
          <div className="dd-empty__title">Belum ada proyek aktif</div>
          <div className="dd-empty__msg">
            Tidak ada antrean maupun pekerjaan berjalan pada sumber ini.
          </div>
        </div>
      ) : (
        <div className="dd-chart">
          <div
            className={["dd-hbar", tip.active ? "dd-chart--dim" : ""]
              .filter(Boolean)
              .join(" ")}
            style={{ "--cat-w": "116px", "--bar-gap": "14px" } as CSSProperties}
          >
            <div
              className="dd-hbar__gridlines"
              style={{ gridRow: `1 / span ${rows.length}` }}
            >
              {ticks.slice(1).map((t) => (
                <span
                  key={t.label}
                  className="dd-hbar__gline"
                  style={{ left: `${t.left}%` }}
                />
              ))}
            </div>
            {rows.map((r, i) => (
              <span
                key={`y-${r.label}`}
                className="dd-hbar__ylabel dd-rbar__yl"
                style={{ gridRow: i + 1 }}
              >
                <span className="dd-rbar__name">{r.label}</span>
              </span>
            ))}
            {rows.map((r, i) => (
              <div
                key={`p-${r.label}`}
                className="dd-hbar__plot"
                style={{ gridRow: i + 1, cursor: "pointer" }}
                onMouseEnter={(e) =>
                  tip.show(
                    e,
                    <TipRows
                      title={r.label}
                      rows={[
                        {
                          color: "var(--chart-blue-primary)",
                          label: "Jumlah",
                          value: fmt(r.value),
                        },
                      ]}
                    />,
                    r.label,
                  )
                }
                onMouseMove={tip.move}
                onMouseLeave={tip.hide}
              >
                <div className="dd-rbar__track">
                  <div
                    className={"dd-rbar__fill dd-mark" + tip.hotClass(r.label)}
                    style={{
                      width: `${top ? (r.value / top) * 100 : 0}%`,
                      minWidth: 4,
                      background: "var(--chart-blue-primary)",
                    }}
                  />
                </div>
              </div>
            ))}
            {rows.map((r, i) => (
              <span
                key={`v-${r.label}`}
                className="dd-chart__value dd-hbar__val"
                style={{ gridRow: i + 1 }}
              >
                {fmt(r.value)}
              </span>
            ))}
            <div
              className="dd-hbar__xaxis"
              style={{ gridRow: rows.length + 1 }}
            >
              {ticks.map((t, i) => (
                <span
                  key={t.label}
                  className={`dd-hbar__tick${i === 0 ? " dd-hbar__tick--first" : ""}${i === ticks.length - 1 ? " dd-hbar__tick--last" : ""}`}
                  style={{ left: `${t.left}%` }}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>
          {tip.node}
        </div>
      )}
    </Card>
  );
}
