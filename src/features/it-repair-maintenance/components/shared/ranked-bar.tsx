"use client";

import { Fragment, type CSSProperties } from "react";

import { BarChart3 } from "lucide-react";
import { GridLines, XAxis, niceScale } from "./axis";
import { TipRows, useChartTooltip } from "./chart-tooltip";
import { EmptyState } from "./empty-state";
import type { RankedRow } from "@/features/it-repair-maintenance/types/it-repair.types";

/**
 * `RankedBar` design system: daftar peringkat pada skala tick bersama dengan
 * kedua garis sumbu, supaya panjang batang terbaca sebagai angka. Tiap baris
 * dirender berurutan (label, batang, nilai) persis seperti desain; grid CSS
 * yang menempatkannya ke kolom.
 */
export function RankedBar({
  rows,
  color = "var(--chart-green)",
  catWidth = 116,
  showRank = true,
  note,
  onRowClick,
  axisLabel,
}: {
  rows: RankedRow[];
  color?: string;
  catWidth?: number;
  showRank?: boolean;
  note?: string | null;
  onRowClick?: (row: RankedRow) => void;
  axisLabel?: string | null;
}) {
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Tidak Ada Data Peringkat"
        message="Belum ada data untuk kategori ini pada periode aktif."
        height={220}
      />
    );
  }

  const tip = useChartTooltip();
  const { ticks, top } = niceScale(Math.max(1, ...rows.map((r) => r.value || 0)), 4);

  return (
    <div className="dd-chart">
      <div
        className={["dd-hbar", tip.active ? "dd-chart--dim" : ""].filter(Boolean).join(" ")}
        style={{ "--cat-w": `${catWidth}px`, "--bar-gap": "14px" } as CSSProperties}
      >
        <GridLines ticks={ticks} top={top} rows={rows.length} />
        {rows.map((r, i) => (
          <Fragment key={r.label}>
            <span className="dd-hbar__ylabel dd-rbar__yl" style={{ gridRow: i + 1 }}>
              {showRank && <span className="dd-rbar__rank">{i + 1}</span>}
              <span className="dd-rbar__name" title={r.label}>
                {r.label}
              </span>
            </span>
            <div
              className={["dd-hbar__plot", onRowClick ? "dd-clickable" : ""].filter(Boolean).join(" ")}
              style={{ gridRow: i + 1 }}
              title={onRowClick ? "Klik untuk melihat detail" : undefined}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              onMouseEnter={(e) =>
                tip.show(e, <TipRows title={r.label} rows={[{ color, label: "Jumlah", value: r.value }]} />, r.label)
              }
              onMouseMove={tip.move}
              onMouseLeave={tip.hide}
            >
              <div className="dd-rbar__track">
                <div
                  className={"dd-rbar__fill dd-mark" + tip.hotClass(r.label)}
                  style={{ width: `${((r.value || 0) / top) * 100}%`, minWidth: "4px", background: color }}
                />
              </div>
            </div>
            <span className="dd-chart__value dd-hbar__val" style={{ gridRow: i + 1 }}>
              {r.value}
            </span>
          </Fragment>
        ))}
        <XAxis ticks={ticks} top={top} row={rows.length + 1} />
        {axisLabel && (
          <div className="dd-hbar__axistitle" style={{ gridRow: rows.length + 2 }}>
            {axisLabel}
          </div>
        )}
      </div>
      {note && <div className="dd-chart__note">{note}</div>}
      {tip.node}
    </div>
  );
}
