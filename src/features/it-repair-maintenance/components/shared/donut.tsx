"use client";

import { PieChart } from "lucide-react";
import { TipRows, useChartTooltip } from "./chart-tooltip";
import { EmptyState } from "./empty-state";
import type { DonutSlice } from "@/features/it-repair-maintenance/types/it-repair.types";

/**
 * `Donut` design system: cincin tanpa celah antar segmen (busur
 * `stroke-dasharray` berurutan dari atas), legenda berisi label · jumlah ·
 * persen, tooltip, dan potongan yang bisa diklik untuk menyaring/membuka
 * daftar record.
 */
export function Donut<T extends DonutSlice>({
  data,
  size = 148,
  stroke = 22,
  centerValue,
  centerCaption,
  onSliceClick,
  legend = true,
  className,
}: {
  data: T[];
  size?: number;
  stroke?: number;
  centerValue?: string | null;
  centerCaption?: string | null;
  onSliceClick?: (slice: T) => void;
  legend?: boolean;
  className?: string;
}) {
  if (!data || data.length === 0 || data.every((d) => !d.value)) {
    return (
      <EmptyState
        icon={PieChart}
        title="Tidak Ada Proporsi Data"
        message="Belum ada data untuk ditampilkan pada grafik donat."
        height={size}
      />
    );
  }

  const tip = useChartTooltip();
  const total = data.reduce((a, d) => a + (d.value || 0), 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pctOf = (v: number) => Math.round((v / total) * 100);
  // Busur digambar berurutan: offset tiap potongan = jumlah panjang potongan sebelumnya.
  const arcs = data.reduce<{ len: number; offset: number }[]>((acc, d) => {
    const len = ((d.value || 0) / total) * c;
    const prev = acc[acc.length - 1];
    acc.push({ len, offset: prev ? prev.offset + prev.len : 0 });
    return acc;
  }, []);

  return (
    <div className={["dd-chart", "dd-donut", className].filter(Boolean).join(" ")}>
      <div className="dd-donut__ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} className={tip.active ? "dd-chart--dim" : undefined}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-gray-track)" strokeWidth={stroke} />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {data.map((d, i) => {
              const { len, offset } = arcs[i];
              return (
                <circle
                  key={d.label}
                  className={["dd-mark" + tip.hotClass(d.label), onSliceClick ? "dd-clickable" : ""].filter(Boolean).join(" ")}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  onMouseEnter={(e) =>
                    tip.show(
                      e,
                      <TipRows
                        title={d.label}
                        rows={[
                          { color: d.color, label: "Jumlah", value: d.value },
                          { label: "Porsi", value: `${pctOf(d.value)}%` },
                        ]}
                      />,
                      d.label,
                    )
                  }
                  onMouseMove={tip.move}
                  onMouseLeave={tip.hide}
                  onClick={onSliceClick ? () => onSliceClick(d) : undefined}
                />
              );
            })}
          </g>
        </svg>
        <div className="dd-donut__center">
          {centerValue != null && <div className="dd-donut__pct">{centerValue}</div>}
          {centerCaption && <div className="dd-donut__caption">{centerCaption}</div>}
        </div>
      </div>
      {legend && (
        <div className="dd-donut__legend">
          {data.map((d) => (
            <div
              key={d.label}
              className="dd-donut__lrow"
              onClick={onSliceClick ? () => onSliceClick(d) : undefined}
              onMouseEnter={(e) =>
                tip.show(e, <TipRows title={d.label} rows={[{ color: d.color, label: "Jumlah", value: d.value }]} />, d.label)
              }
              onMouseMove={tip.move}
              onMouseLeave={tip.hide}
            >
              <span className="dd-chart__dot dd-chart__dot--round" style={{ background: d.color }} />
              <span className="dd-donut__lname" title={d.label}>
                {d.label}
              </span>
              <span className="dd-donut__lcount">{d.value}</span>
              <span className="dd-donut__lpct">{pctOf(d.value)}%</span>
            </div>
          ))}
        </div>
      )}
      {tip.node}
    </div>
  );
}
