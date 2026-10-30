"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "@/components/shared/EmptyState";
import { Building2, TrendingDown, TrendingUp } from "lucide-react";
import { RechartsTip } from "@/components/chart-tooltip";
import { fmt } from "@/lib/utils";
import type { TicketVolumeByDepartment } from "../../types/comparison.types";

interface TicketVolumeChartProps {
  data: TicketVolumeByDepartment[];
  selectedYear: number;
}

const COLORS = {
  yearPrev: "#F59E0B",
  yearCurrent: "#2563EB",
};

interface CustomBarLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  value?: unknown;
}

function renderVerticalBarLabel(props: CustomBarLabelProps) {
  const { x, y, width, value } = props;
  if (value === undefined || value === null) return null;

  const numX = Number(x) || 0;
  const numY = Number(y) || 0;
  const numW = Number(width) || 0;
  const cx = numX + numW / 2;
  const cy = numY;

  return (
    <g className="pointer-events-none">
      {/* Black dot at the top center of the bar */}
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#0F172A"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      {/* Value label above the dot */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="#0F172A"
        fontSize={12}
        fontWeight={800}
      >
        {typeof value === "number"
          ? value.toLocaleString("id-ID")
          : String(value ?? "")}
      </text>
    </g>
  );
}

export default function TicketVolumeChart({
  data,
  selectedYear,
}: TicketVolumeChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const prevYear = selectedYear - 1;
  const currentYear = selectedYear;

  const chartData = data.map((item) => ({
    department: item.departmentName,
    yearPrev: item.ticketsPrevYear,
    yearCurrent: item.ticketsSelectedYear,
    growth: item.growthPercentage,
    diff: item.ticketDiff,
  }));

  const isNoData =
    !data ||
    data.length === 0 ||
    data.every(
      (item) => item.ticketsPrevYear === 0 && item.ticketsSelectedYear === 0,
    );

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-950">
            Ticket Volume per Department
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Perbandingan volume tiket IT Support dan DCT Support
          </p>
        </div>

        <div className="flex items-center gap-5 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded bg-amber-500" />
            <span className="text-slate-500">{prevYear}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded bg-blue-600" />
            <span className="text-slate-500">{currentYear}</span>
          </div>
        </div>
      </div>

      {!isNoData && (
        <div className="mx-auto mb-2 grid max-w-3xl grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-10 sm:px-12">
          {chartData.map((item) => {
            const isZero = item.growth === 0 || item.diff === 0;
            const isDown = item.growth < 0;
            const isImprovement = item.diff < 0; // Less tickets is good

            const badgeBg = isZero
              ? "bg-slate-100"
              : isImprovement
                ? "bg-emerald-50"
                : "bg-rose-50";
            const badgeText = isZero
              ? "text-slate-600"
              : isImprovement
                ? "text-emerald-600"
                : "text-rose-600";

            return (
              <div key={item.department} className="flex justify-center">
                <div
                  className={`inline-flex items-center gap-1 rounded-full ${badgeBg} px-4 py-1 text-sm font-bold ${badgeText}`}
                >
                  {!isZero &&
                    (isDown ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    ))}
                  {Math.abs(item.growth).toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mx-auto h-75 w-full min-w-0 overflow-hidden">
        {isNoData ? (
          <EmptyState
            icon={Building2}
            title="Data Volume Departemen Tidak Tersedia"
            description="Tidak ada data volume tiket untuk rentang waktu yang dipilih"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              barGap={12}
              barCategoryGap="38%"
              margin={{
                top: 28,
                right: 16,
                left: 4,
                bottom: 8,
              }}
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
                vertical={true}
                horizontal={true}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="department"
                tickLine={false}
                axisLine={false}
                dy={10}
                tick={{
                  fill: "#0F172A",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              />

              <YAxis
                domain={[0, "auto"]}
                width={44}
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "#94A3B8",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(148, 163, 184, 0.08)",
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
                          color: COLORS.yearPrev,
                          label: String(prevYear),
                          value: valPrev != null ? fmt(Number(valPrev)) : "–",
                        },
                        {
                          color: COLORS.yearCurrent,
                          label: String(currentYear),
                          value:
                            valCurrent != null ? fmt(Number(valCurrent)) : "–",
                        },
                      ]}
                    />
                  );
                }}
              />

              <Bar
                dataKey="yearPrev"
                name={String(prevYear)}
                fill={COLORS.yearPrev}
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`prev-${index}`}
                    fill={COLORS.yearPrev}
                    fillOpacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.45
                    }
                    style={{ transition: "fill-opacity 0.15s ease" }}
                  />
                ))}
                <LabelList
                  dataKey="yearPrev"
                  content={renderVerticalBarLabel}
                />
              </Bar>

              <Bar
                dataKey="yearCurrent"
                name={String(currentYear)}
                fill={COLORS.yearCurrent}
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cur-${index}`}
                    fill={COLORS.yearCurrent}
                    fillOpacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.45
                    }
                    style={{ transition: "fill-opacity 0.15s ease" }}
                  />
                ))}
                <LabelList
                  dataKey="yearCurrent"
                  content={renderVerticalBarLabel}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
