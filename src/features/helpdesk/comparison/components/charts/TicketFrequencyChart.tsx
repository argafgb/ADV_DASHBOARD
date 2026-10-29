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
import { TrendingDown, TrendingUp, CalendarX } from "lucide-react";
import { RechartsTip } from "@/components/chart-tooltip";
import { fmt } from "@/lib/utils";
import { SHORT_MONTH_NAMES } from "@/lib/helpdesk/month-filter";
import TriangleDot from "@/components/ui/TriangleDot";
import SinglePointOverlay from "@/components/ui/SinglePointOverlay";
import type {
  TicketFrequency,
  TicketMonthlyComparison,
} from "../../types/comparison.types";

interface TicketFrequencyChartProps {
  frequencyData: TicketFrequency[];
  monthlyData: TicketMonthlyComparison[];
  selectedYear: number;
}

const COLORS = {
  yearPrev: "#F59E0B",
  yearCurrent: "#2563EB",
};

export default function TicketFrequencyChart({
  frequencyData,
  monthlyData,
  selectedYear,
}: TicketFrequencyChartProps) {
  const prevYear = selectedYear - 1;
  const currentYear = selectedYear;

  const currentFreq = frequencyData.find((f) => f.year === currentYear);
  const prevFreq = frequencyData.find((f) => f.year === prevYear);

  const totalPrev = prevFreq?.ticketCount ?? 0;
  const totalCurrent = currentFreq?.ticketCount ?? 0;
  const diff = currentFreq?.ticketDiff ?? 0;
  const growth = currentFreq?.growthPercentage ?? 0;

  const GrowthIcon = diff >= 0 ? TrendingUp : TrendingDown;
  const isPositiveImprovement = diff <= 0; // Less tickets is good
  const growthColor = isPositiveImprovement
    ? "text-emerald-600"
    : "text-rose-600";

  const monthNames = SHORT_MONTH_NAMES;

  const chartData = monthlyData.map((item) => ({
    month: monthNames[item.month - 1] ?? String(item.month),
    yearPrev: item.ticketsPrevYear,
    yearCurrent: item.ticketsSelectedYear,
  }));

  const isNoData =
    !monthlyData ||
    monthlyData.length === 0 ||
    monthlyData.every(
      (item) => item.ticketsPrevYear === 0 && item.ticketsSelectedYear === 0,
    );

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-950">
            Ticket Frequency (YoY)
          </h3>

          <p className="mt-0.5 text-xs text-slate-400">
            Ticket {prevYear}: {totalPrev.toLocaleString("id-ID")} · Ticket{" "}
            {currentYear}: {totalCurrent.toLocaleString("id-ID")}{" "}
            {diff !== 0 && (
              <span
                className={`inline-flex items-center gap-0.5 font-medium ${growthColor}`}
              >
                (<GrowthIcon className="h-3.5 w-3.5" />
                {Math.abs(growth).toFixed(2)}%)
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
            title="Data Frekuensi Tidak Tersedia"
            description="Tidak ada data transaksi atau tiket untuk rentang waktu yang dipilih"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 16,
                right: 24,
                left: 4,
                bottom: 12,
              }}
            >
              <defs>
                <linearGradient
                  id="colorFreqCurrent"
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
                vertical={false}
                stroke="#f1f5f9"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="month"
                padding={{ left: 8, right: 8 }}
                tickLine={false}
                axisLine={false}
                dy={10}
                tick={{
                  fill: "#94A3B8",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />

              <YAxis
                domain={[0, "auto"]}
                width={46}
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "#64748B",
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
                              ? fmt(valPrev)
                              : typeof valPrev === "string"
                                ? valPrev
                                : "–",
                        },
                        {
                          color: "#2563EB",
                          label: String(currentYear),
                          value:
                            typeof valCurrent === "number"
                              ? fmt(valCurrent)
                              : typeof valCurrent === "string"
                                ? valCurrent
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
                fill="url(#colorFreqCurrent)"
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: "#FFFFFF",
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
                    format: (v) => v.toLocaleString("id-ID"),
                  },
                  {
                    dataKey: "yearCurrent",
                    color: COLORS.yearCurrent,
                    fill: true,
                    format: (v) => v.toLocaleString("id-ID"),
                  },
                ]}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
