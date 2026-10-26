"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { C, fmt } from "@/lib/utils";
import { RechartsTip } from "@/components/chart-tooltip";
import EmptyState from "@/components/shared/EmptyState";

export interface BarSeries {
  key: string;
  name: string;
  color: string;
  /** Same stackId across series → stacked; omit → grouped. */
  stackId?: string;
}

interface SeriesBarChartProps {
  /** Row objects keyed by `categoryKey` + each series `key`. */
  data: object[];
  /** Category key (site/branch/year/month). */
  categoryKey: string;
  series: BarSeries[];
  height?: number;
  /** "vertical" renders horizontal bars with categories on the Y axis. */
  layout?: "horizontal" | "vertical";
  currency?: boolean;
  showLegend?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Configurable grouped/stacked Recharts bar chart with purpose-driven EmptyState. */
export default function SeriesBarChart({
  data,
  categoryKey,
  series,
  height = 280,
  layout = "horizontal",
  currency = false,
  showLegend = false,
  emptyTitle = "Data Grafik Tidak Ditemukan",
  emptyDescription = "Tidak ada riwayat atau statistik data untuk ditayangkan pada filter ini.",
}: SeriesBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title={emptyTitle}
        description={emptyDescription}
        height={height}
      />
    );
  }

  const fmtVal = (v: number) => (currency ? `Rp ${fmt(v)}` : fmt(v));
  const isVertical = layout === "vertical";

  const minWidth = isVertical
    ? Math.max(360, data.length > 0 ? 360 : 0)
    : Math.max(360, data.length * 52);

  return (
    <div className="relative isolate z-0 w-full min-w-0 overflow-x-auto overflow-y-hidden pb-1">
      <div style={{ height, minWidth }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={layout}
            margin={{ top: 12, right: 16, left: isVertical ? 8 : 0, bottom: 4 }}
            barGap={2}
            onMouseMove={(state) =>
              setActiveIndex(
                typeof state?.activeTooltipIndex === "number"
                  ? state.activeTooltipIndex
                  : null,
              )
            }
            onMouseLeave={() => setActiveIndex(null)}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={C.grid}
              vertical={isVertical}
              horizontal={!isVertical}
            />
            {isVertical ? (
              <>
                <XAxis
                  type="number"
                  stroke={C.axis}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => fmtVal(Number(v))}
                  padding={{ left: 0, right: 8 }}
                />
                <YAxis
                  type="category"
                  dataKey={categoryKey}
                  stroke={C.axis}
                  fontSize={12}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  tick={{ width: 112 }}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="category"
                  dataKey={categoryKey}
                  stroke={C.axis}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="number"
                  stroke={C.axis}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => fmtVal(Number(v))}
                />
              </>
            )}
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <RechartsTip
                    title={label}
                    rows={payload.map((item) => ({
                      color: item.color,
                      label: String(item.name || item.dataKey || ""),
                      value: fmtVal(Number(item.value ?? 0)),
                    }))}
                  />
                );
              }}
            />
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                iconType="circle"
              />
            )}
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                stackId={s.stackId}
                minPointSize={3}
                radius={s.stackId ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${s.key}-${index}`}
                    fill={s.color}
                    fillOpacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.45
                    }
                    style={{ transition: "fill-opacity 0.15s ease" }}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
