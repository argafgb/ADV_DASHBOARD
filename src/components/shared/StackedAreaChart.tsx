"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { C, fmt } from "@/lib/utils";
import { RechartsTip } from "@/components/chart-tooltip";

export interface AreaSeries {
  key: string;
  name: string;
  color: string;
}

interface StackedAreaChartProps {
  /** Row objects keyed by `categoryKey` + each series `key`. */
  data: object[];
  categoryKey: string;
  series: AreaSeries[];
  height?: number;
}

/** Stacked area chart (e.g. category-contribution trend). */
export default function StackedAreaChart({
  data,
  categoryKey,
  series,
  height = 260,
}: StackedAreaChartProps) {
  const minWidth = Math.max(360, data.length * 48);

  return (
    <div className="relative isolate z-0 w-full min-w-0 overflow-x-auto overflow-y-hidden pb-1">
      <div style={{ height, minWidth }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={C.grid}
              vertical={false}
            />
            <XAxis
              dataKey={categoryKey}
              stroke={C.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              padding={{ left: 12, right: 12 }}
            />
            <YAxis
              stroke={C.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <RechartsTip
                    title={label}
                    rows={payload.map((item) => ({
                      color: item.color,
                      label: String(item.name || item.dataKey || ""),
                      value: fmt(Number(item.value ?? 0)),
                    }))}
                  />
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stackId="trend"
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.18}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
