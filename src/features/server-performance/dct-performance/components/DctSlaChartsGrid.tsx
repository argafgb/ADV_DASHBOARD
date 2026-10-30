"use client";

import { CompactChartTooltip } from "@/components/chart-tooltip";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import TriangleDot from "@/components/ui/TriangleDot";
import SinglePointOverlay from "@/components/ui/SinglePointOverlay";
import {
  DctMonthlyMetric,
  DctQuarterlyMetric,
} from "../types/dctPerformanceTypes";

interface DctSlaChartsGridProps {
  monthlyMetrics: DctMonthlyMetric[];
  quarterlyMetrics: DctQuarterlyMetric[];
  year: number;
  prevYear: number;
  periodLabel: string;
}



export function DctSlaChartsGrid({
  monthlyMetrics,
  quarterlyMetrics,
  year,
  prevYear,
  periodLabel,
}: DctSlaChartsGridProps) {
  const activeMonthlyData = monthlyMetrics.filter((m) => m.slaCurr !== null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 1. Quarterly SLA Chart */}
      <Card className="min-w-0 overflow-hidden bg-card border-border/60 shadow-xs backdrop-blur-xs">
        <CardHeader className="flex flex-col items-start justify-between gap-3 pb-2 sm:flex-row">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Quarterly SLA (%)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Kuartalan
            </CardDescription>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-0 w-4 border-t-2 border-dashed border-amber-500" />
              <span className="text-muted-foreground tabular-nums">
                {prevYear}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-blue-600" />
              <span className="text-muted-foreground tabular-nums">{year}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-2 pt-2 sm:px-6">
          <div className="relative h-64 w-full min-w-0 overflow-hidden sm:h-70">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={quarterlyMetrics}
                margin={{ top: 15, right: 12, left: 0, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="colorQCurr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.15}
                  vertical={false}
                />
                <XAxis
                  dataKey="quarter"
                  padding={{ left: 8, right: 8 }}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  minTickGap={8}
                  dy={5}
                />
                <YAxis
                  domain={[99.0, 100.0]}
                  ticks={[99.0, 99.3, 99.5, 99.8, 100.0]}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <Tooltip content={<CompactChartTooltip unit="%" />} />
                <Line
                  type="monotone"
                  dataKey="qPrev"
                  name={String(prevYear)}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={<TriangleDot color="#f59e0b" />}
                  activeDot={<TriangleDot color="#f59e0b" size={6} />}
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="qCurr"
                  name={String(year)}
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorQCurr)"
                  dot={{
                    r: 4,
                    fill: "#2563eb",
                    stroke: "#ffffff",
                    strokeWidth: 1.5,
                  }}
                  connectNulls={false}
                />
                <SinglePointOverlay
                  data={quarterlyMetrics}
                  xKey="quarter"
                  series={[
                    {
                      dataKey: "qPrev",
                      color: "#f59e0b",
                      format: (v) => `${v}%`,
                    },
                    {
                      dataKey: "qCurr",
                      color: "#2563eb",
                      fill: true,
                      format: (v) => `${v}%`,
                    },
                  ]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Monthly SLA Chart */}
      <Card className="min-w-0 overflow-hidden bg-card border-border/60 shadow-xs backdrop-blur-xs">
        <CardHeader className="flex flex-col items-start justify-between gap-3 pb-2 sm:flex-row">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              SLA (%)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Bulanan · {periodLabel}
            </CardDescription>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-0 w-4 border-t-2 border-dashed border-amber-500" />
              <span className="text-muted-foreground tabular-nums">
                {prevYear}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-blue-600" />
              <span className="text-muted-foreground tabular-nums">{year}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-2 pt-2 sm:px-6">
          <div className="relative h-64 w-full min-w-0 overflow-hidden sm:h-70">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={activeMonthlyData}
                margin={{ top: 15, right: 12, left: 0, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="colorSlaCurr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.15}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  padding={{ left: 8, right: 8 }}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  minTickGap={8}
                  dy={5}
                />
                <YAxis
                  domain={[99.0, 100.0]}
                  ticks={[99.0, 99.3, 99.5, 99.8, 100.0]}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <Tooltip content={<CompactChartTooltip unit="%" />} />
                <Line
                  type="monotone"
                  dataKey="slaPrev"
                  name={String(prevYear)}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={<TriangleDot color="#f59e0b" />}
                  activeDot={<TriangleDot color="#f59e0b" size={6} />}
                />
                <Area
                  type="monotone"
                  dataKey="slaCurr"
                  name={String(year)}
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSlaCurr)"
                  dot={{
                    r: 4,
                    fill: "#2563eb",
                    stroke: "#ffffff",
                    strokeWidth: 1.5,
                  }}
                />
                <SinglePointOverlay
                  data={activeMonthlyData}
                  xKey="month"
                  series={[
                    {
                      dataKey: "slaPrev",
                      color: "#f59e0b",
                      format: (v) => `${v}%`,
                    },
                    {
                      dataKey: "slaCurr",
                      color: "#2563eb",
                      fill: true,
                      format: (v) => `${v}%`,
                    },
                  ]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
