"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "@/components/shared/EmptyState";
import { RechartsTip } from "@/components/chart-tooltip";
import { TrendingDown, TrendingUp, CalendarX } from "lucide-react";
import TriangleDot from "@/components/ui/TriangleDot";
import SinglePointOverlay from "@/components/ui/SinglePointOverlay";
import type { SlaTrendComparison } from "../../types/slaPerformance.types";

interface SlaProblemResolveChartProps {
  data: SlaTrendComparison[];
  selectedYear: number;
}

const COLORS = {
  yearPrev: "#F59E0B",
  yearCurrent: "#2563EB",
};

export default function SlaProblemResolveChart({
  data,
  selectedYear,
}: SlaProblemResolveChartProps) {
  const prevYear = selectedYear - 1;
  const currentYear = selectedYear;

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const chartData = data.map((item) => ({
    month: monthNames[item.month - 1] ?? String(item.month),
    yearPrev: item.prevYearPercentage,
    yearCurrent: item.selectedYearPercentage,
  }));

  const isNoData =
    !data ||
    data.length === 0 ||
    data.every(
      (item) =>
        (item.prevYearPercentage === 0 || item.prevYearPercentage === null) &&
        (item.selectedYearPercentage === 0 ||
          item.selectedYearPercentage === null),
    );

  const avgPrev =
    data.length > 0
      ? data.reduce((acc, curr) => acc + curr.prevYearPercentage, 0) /
        data.length
      : 0;

  const avgSelected =
    data.length > 0
      ? data.reduce((acc, curr) => acc + curr.selectedYearPercentage, 0) /
        data.length
      : 0;

  const gap = avgSelected - avgPrev;
  const GapIcon = gap >= 0 ? TrendingUp : TrendingDown;
  const gapColor = gap >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900">
            SLA Problem Resolve (YoY)
          </h3>

          <p className="mt-0.5 text-xs text-slate-400">
            Rata-rata {prevYear}: {avgPrev.toFixed(2)}% · Rata-rata{" "}
            {currentYear}: {avgSelected.toFixed(2)}%{" "}
            {gap !== 0 && (
              <span
                className={`inline-flex items-center gap-0.5 font-semibold ${gapColor}`}
              >
                (<GapIcon className="h-3.5 w-3.5" />
                {Math.abs(gap).toFixed(2)}%)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-amber-500" />
            <span className="text-slate-500">{prevYear}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-1 w-4 rounded-full bg-blue-600" />
            <span className="font-bold text-slate-900">{currentYear}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto h-75 w-full min-w-0 overflow-hidden">
        {isNoData ? (
          <EmptyState
            icon={CalendarX}
            title="Data SLA Tidak Tersedia"
            description="Tidak ada data SLA Problem Resolve untuk rentang waktu yang dipilih"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 16,
                right: 24,
                left: 4,
                bottom: 8,
              }}
            >
              <defs>
                <linearGradient
                  id="colorResolveCurrent"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#f1f5f9"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                padding={{ left: 8, right: 8 }}
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "#94A3B8",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />

              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
                tickLine={false}
                axisLine={false}
                width={52}
                tick={{
                  fill: "#94A3B8",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />

              <Tooltip
                cursor={{
                  stroke: "#CBD5E1",
                  strokeDasharray: "4 4",
                }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const valPrev = payload.find(
                    (item) => item.dataKey === "yearPrev",
                  )?.value;
                  const valCurrent = payload.find(
                    (item) => item.dataKey === "yearCurrent",
                  )?.value;
                  return (
                    <RechartsTip
                      title={label}
                      rows={[
                        {
                          color: "#F59E0B",
                          label: String(prevYear),
                          value:
                            typeof valPrev === "number"
                              ? `${valPrev.toFixed(2)}%`
                              : "–",
                        },
                        {
                          color: "#2563EB",
                          label: String(currentYear),
                          value:
                            typeof valCurrent === "number"
                              ? `${valCurrent.toFixed(2)}%`
                              : "–",
                        },
                      ]}
                    />
                  );
                }}
              />

              <Line
                type="monotone"
                dataKey="yearPrev"
                name={String(prevYear)}
                stroke={COLORS.yearPrev}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={<TriangleDot color={COLORS.yearPrev} />}
                activeDot={<TriangleDot color={COLORS.yearPrev} size={6} />}
              />

              <Area
                type="monotone"
                dataKey="yearCurrent"
                name={String(currentYear)}
                stroke={COLORS.yearCurrent}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorResolveCurrent)"
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: "#fff",
                  stroke: COLORS.yearCurrent,
                }}
                activeDot={{ r: 6 }}
              />
              <SinglePointOverlay
                data={chartData}
                xKey="month"
                series={[
                  {
                    dataKey: "yearPrev",
                    color: COLORS.yearPrev,
                    format: (v) => `${v}%`,
                  },
                  {
                    dataKey: "yearCurrent",
                    color: COLORS.yearCurrent,
                    fill: true,
                    format: (v) => `${v}%`,
                  },
                ]}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
