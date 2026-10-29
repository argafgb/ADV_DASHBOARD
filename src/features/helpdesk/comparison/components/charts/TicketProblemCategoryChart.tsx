"use client";

import { useEffect, useMemo, useState } from "react";
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
import { BarChart3, AppWindow } from "lucide-react";
import { RechartsTip } from "@/components/chart-tooltip";
import type { TicketVolumeByCategory } from "../../types/comparison.types";

interface TicketProblemCategoryChartProps {
  data: TicketVolumeByCategory[];
  selectedYear: number;
}

const COLORS = {
  yearPrev: "#F59E0B",
  yearCurrent: "#2563EB",
};

interface CustomHorizontalBarLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: unknown;
}

function renderHorizontalBarLabel(props: CustomHorizontalBarLabelProps) {
  const { x, y, width, height, value } = props;
  if (value === undefined || value === null) return null;

  const numX = Number(x) || 0;
  const numY = Number(y) || 0;
  const numW = Number(width) || 0;
  const numH = Number(height) || 0;
  const cx = numX + numW;
  const cy = numY + numH / 2;

  return (
    <g className="pointer-events-none">
      {/* Black dot at the right center edge of bar */}
      <circle
        cx={cx}
        cy={cy}
        r={3.5}
        fill="#0F172A"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
      {/* Detail number to the right of the dot */}
      <text
        x={cx + 8}
        y={cy + 4}
        textAnchor="start"
        fill="#0F172A"
        fontSize={11}
        fontWeight={700}
        className="select-none dark:fill-slate-100"
      >
        {typeof value === "number"
          ? value.toLocaleString("id-ID")
          : String(value ?? "")}
      </text>
    </g>
  );
}

export default function TicketProblemCategoryChart({
  data,
  selectedYear,
}: TicketProblemCategoryChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const prevYear = selectedYear - 1;
  const currentYear = selectedYear;

  // Categories available for selection
  const availableCategories = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      id: item.category,
      label: item.category === "ALL" ? "Semua Aplikasi" : item.category,
      total: item.ticketsSelectedYear,
    }));
  }, [data]);

  // Default to DCT WEB if available (for DCT Support / ALL), else SOFTWARE if available (for IT Support), else first category with features, else ALL
  const initialCategory = useMemo(() => {
    const hasDctWeb = data.find((d) => d.category === "DCT WEB");
    if (
      hasDctWeb &&
      hasDctWeb.topFeatures &&
      hasDctWeb.topFeatures.length > 0
    ) {
      return "DCT WEB";
    }
    const hasSoftware = data.find((d) => d.category === "SOFTWARE");
    if (
      hasSoftware &&
      hasSoftware.topFeatures &&
      hasSoftware.topFeatures.length > 0
    ) {
      return "SOFTWARE";
    }
    const firstWithFeatures = data.find(
      (d) => d.category !== "ALL" && d.topFeatures && d.topFeatures.length > 0,
    );
    return firstWithFeatures?.category ?? data[0]?.category ?? "ALL";
  }, [data]);

  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);

  useEffect(() => {
    if (!data.some((d) => d.category === selectedCategory)) {
      setSelectedCategory(initialCategory);
    }
  }, [data, initialCategory, selectedCategory]);

  // Get the selected category item and its top features
  const activeCategoryData = useMemo(() => {
    const found = data.find((d) => d.category === selectedCategory);
    return found ?? data[0];
  }, [data, selectedCategory]);

  const chartData = useMemo(() => {
    if (!activeCategoryData?.topFeatures?.length) return [];
    return activeCategoryData.topFeatures.map((item) => ({
      feature: item.feature ?? "Unknown",
      yearPrev: item.ticketsPrevYear,
      yearCurrent: item.ticketsSelectedYear,
      ticketDiff: item.ticketDiff,
      growthPercentage: item.growthPercentage,
    }));
  }, [activeCategoryData]);

  const isNoData = !chartData || chartData.length === 0;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-950 dark:text-slate-50">
            Top 6 Ticket Kendala Menu / Fitur
          </h3>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            6 menu atau fitur dengan volume tiket kendala tertinggi per aplikasi
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded bg-amber-500" />
            <span className="text-slate-500 dark:text-slate-400">
              {prevYear}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded bg-blue-600" />
            <span className="text-slate-500 dark:text-slate-400">
              {currentYear}
            </span>
          </div>
        </div>
      </div>

      {/* Category Selection Filter Pills */}
      {availableCategories.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 dark:border-zinc-800">
          <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <AppWindow className="h-3.5 w-3.5" />
            Pilih Aplikasi:
          </span>
          {availableCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-600"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-96 w-full min-w-0 overflow-hidden">
        {isNoData ? (
          <EmptyState
            icon={BarChart3}
            title="Data Menu / Fitur Tidak Tersedia"
            description={`Tidak ada rincian kendala menu/fitur untuk aplikasi ${
              selectedCategory === "ALL" ? "keseluruhan" : selectedCategory
            } pada rentang waktu yang dipilih`}
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              barGap={6}
              barCategoryGap={14}
              margin={{
                top: 8,
                right: 72,
                left: 10,
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
                type="number"
                domain={[0, "auto"]}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                tick={{
                  fill: "#64748B",
                  fontSize: 11,
                  fontWeight: 500,
                }}
                tickFormatter={(val: number) => val.toLocaleString("id-ID")}
              />

              <YAxis
                type="category"
                dataKey="feature"
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "#475569",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(148, 163, 184, 0.08)",
                }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const itemPayload = payload[0]?.payload;
                  const valPrev = itemPayload?.yearPrev ?? 0;
                  const valCurrent = itemPayload?.yearCurrent ?? 0;
                  return (
                    <RechartsTip
                      title={label}
                      rows={[
                        {
                          color: COLORS.yearPrev,
                          label: String(prevYear),
                          value: `${valPrev.toLocaleString("id-ID")} tiket`,
                        },
                        {
                          color: COLORS.yearCurrent,
                          label: String(currentYear),
                          value: `${valCurrent.toLocaleString("id-ID")} tiket`,
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
                radius={[0, 6, 6, 0]}
                maxBarSize={16}
                minPointSize={6}
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
                  content={renderHorizontalBarLabel}
                />
              </Bar>

              <Bar
                dataKey="yearCurrent"
                name={String(currentYear)}
                fill={COLORS.yearCurrent}
                radius={[0, 6, 6, 0]}
                maxBarSize={16}
                minPointSize={6}
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
                  content={renderHorizontalBarLabel}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}