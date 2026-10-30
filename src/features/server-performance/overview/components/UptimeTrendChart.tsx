"use client";

import { Card } from "@/components/ui/card";
import TriangleDot from "@/components/ui/TriangleDot";
import SinglePointOverlay from "@/components/ui/SinglePointOverlay";
import { TrendChartPoint } from "../types/overviewTypes";
import { SLA_TARGET } from "../../utils/calculations";
import { RechartsTip } from "@/components/chart-tooltip";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface UptimeTrendChartProps {
  data: TrendChartPoint[];
  periodLabel: string;
  year: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
  }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <RechartsTip
        title={label}
        rows={payload.map((entry) => ({
          color: entry.color,
          label: entry.name,
          value: `${entry.value}%`,
        }))}
      />
    );
  }
  return null;
}

export default function UptimeTrendChart({
  data,
  periodLabel,
  year,
}: UptimeTrendChartProps) {
  return (
    <Card className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col justify-between gap-2 border-b border-zinc-100 px-5 pt-5 pb-4 sm:flex-row sm:items-center dark:border-zinc-800">
        <div>
          <h3 className="font-sans text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Uptime Trend
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
            Semua sistem · {periodLabel}
          </p>
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-rose-500" />
            <span className="text-zinc-600 dark:text-zinc-400">
              Target {SLA_TARGET}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-dashed border-amber-500" />
            <span className="text-zinc-600 dark:text-zinc-400">2025</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-4 bg-blue-600 dark:bg-blue-400 rounded-full" />
            <span className="text-zinc-900 dark:text-zinc-100 font-bold">
              2026
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 h-64 w-full min-w-0 overflow-hidden px-2 sm:h-75 sm:px-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="color2026" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
                className="dark:stroke-zinc-800"
              />
              <XAxis
                dataKey="month"
                padding={{ left: 8, right: 8 }}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                minTickGap={8}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[99.5, 100.0]}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val.toFixed(1)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={SLA_TARGET}
                stroke="#f43f5e"
                strokeDasharray="6 3"
                label={{
                  value: `Target ${SLA_TARGET}%`,
                  fill: "#e11d48",
                  fontSize: 11,
                  fontWeight: 700,
                  position: "insideTopRight",
                }}
              />
              <Line
                type="monotone"
                dataKey="sla2025"
                name="2025"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={<TriangleDot color="#f59e0b" />}
                activeDot={<TriangleDot color="#f59e0b" size={6} />}
                opacity={year === "2026" ? 0.6 : 1}
              />
              <Area
                type="monotone"
                dataKey="sla2026"
                name="2026"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#color2026)"
                dot={{
                  r: 4,
                  fill: "#ffffff",
                  stroke: "#2563eb",
                  strokeWidth: 2,
                }}
                activeDot={{ r: 6 }}
                opacity={year === "2025" ? 0.6 : 1}
              />
              <SinglePointOverlay
                data={data}
                xKey="month"
                series={[
                  {
                    dataKey: "sla2025",
                    color: "#f59e0b",
                    format: (v) => `${v}%`,
                  },
                  {
                    dataKey: "sla2026",
                    color: "#2563eb",
                    fill: true,
                    format: (v) => `${v}%`,
                  },
                ]}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            Data tren SLA uptime belum tersedia untuk periode ini.
          </div>
        )}
      </div>
    </Card>
  );
}
