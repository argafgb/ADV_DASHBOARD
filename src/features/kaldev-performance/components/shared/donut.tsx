"use client";

import { TipRows, useChartTooltip } from "@/components/chart-tooltip";
import { fmt } from "../../utils/format";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/**
 * `Donut` design system: cincin tanpa celah antar segmen, digambar sebagai
 * busur `stroke-dasharray` berurutan dari atas (-90°). Segmen lain diredupkan
 * saat satu segmen di-hover (`.dd-chart--dim`).
 */
export function Donut({
  data,
  size = 164,
  stroke = 24,
  centerValue,
  centerCaption,
}: {
  data: DonutSlice[];
  size?: number;
  stroke?: number;
  centerValue: string;
  centerCaption: string;
}) {
  const tip = useChartTooltip();
  const c = size / 2;
  const r = c - stroke / 2;
  const circ = 2 * Math.PI * r;
  const sum = data.reduce((a, d) => a + d.value, 0);

  const arcs = data.reduce<{ dash: number; offset: number }[]>((acc, d) => {
    const dash = sum > 0 ? (d.value / sum) * circ : 0;
    const prev = acc[acc.length - 1];
    acc.push({ dash, offset: prev ? prev.offset + prev.dash : 0 });
    return acc;
  }, []);

  const pct = (val: number) =>
    sum > 0 ? `${((val / sum) * 100).toFixed(1)}%` : "0%";

  return (
    <div className="dd-chart dd-donut">
      <div className="dd-donut__ring">
        <svg
          width={size}
          height={size}
          className={tip.active ? "dd-chart--dim" : undefined}
          style={{ display: "block" }}
        >
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="var(--chart-gray-track)"
            strokeWidth={stroke}
          />
          <g transform={`rotate(-90 ${c} ${c})`}>
            {arcs.map((arc, i) => {
              const slice = data[i];
              return (
                <circle
                  key={`${slice.label}-${i}`}
                  className={`dd-mark${tip.hotClass(slice.label)}`}
                  cx={c}
                  cy={c}
                  r={r}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
                  strokeDashoffset={-arc.offset}
                  onMouseEnter={(e) =>
                    tip.show(
                      e,
                      <TipRows
                        title={slice.label}
                        rows={[
                          {
                            color: slice.color,
                            label: "Jumlah",
                            value: `${fmt(slice.value)} (${pct(slice.value)})`,
                          },
                        ]}
                      />,
                      slice.label,
                    )
                  }
                  onMouseMove={tip.move}
                  onMouseLeave={tip.hide}
                />
              );
            })}
          </g>
        </svg>
        <div className="dd-donut__center">
          <div className="dd-donut__pct">{centerValue}</div>
          <div className="dd-donut__caption">{centerCaption}</div>
        </div>
      </div>
      {tip.node}
    </div>
  );
}
