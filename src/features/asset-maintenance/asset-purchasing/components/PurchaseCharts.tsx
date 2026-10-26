"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "@/components/shared/ChartCard";
import { RechartsTip } from "@/components/chart-tooltip";
import type { AssetPurchasingModel } from "../types";

const BLUE = "#2563EB";
const AMBER = "#F59E0B";
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;
const colorFor = (category: string) =>
  category === "Workstation" ? BLUE : AMBER;

const CHART_MARGIN = { top: 24, right: 20, left: 0, bottom: 4 };
const X_AXIS_LINE = { stroke: "#E5E7EB" };
const X_AXIS_TICK = { fill: "#6B7280", fontSize: 12 };
const Y_AXIS_TICK = { fill: "#9CA3AF", fontSize: 11 };
const TOOLTIP_CONTENT_STYLE = {
  borderRadius: 9,
  borderColor: "#E5E7EB",
  fontSize: 12,
};
const RESIZE_DEBOUNCE_MS = 80;

function ChartLegend({
  items,
  showValue = false,
}: {
  items: Array<{ name: string; value: number; color: string }>;
  showValue?: boolean;
}) {
  return (
    <ul
      className="flex min-h-6 flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2 text-xs text-zinc-600 dark:text-zinc-400"
      aria-label="Keterangan chart"
    >
      {items.map((item) => (
        <li
          key={item.name}
          className="flex items-center gap-1.5 whitespace-nowrap"
        >
          <span
            className="size-3 shrink-0 rounded-sm"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span>
            {item.name}
            {showValue ? `: ${item.value} unit` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MonthlyPurchaseTrend({
  model,
}: {
  model: AssetPurchasingModel;
}) {
  const monthlyByNumber = new Map(
    model.monthly.map((item) => [item.month, item]),
  );
  const chartData = MONTH_LABELS.map((label, index) => {
    const item = monthlyByNumber.get(index + 1);
    return {
      label,
      Workstation: item?.Workstation ?? null,
      Peripheral: item?.Peripheral ?? null,
    };
  });
  const legendItems = (["Workstation", "Peripheral"] as const)
    .filter(
      (name) =>
        model.scopeLabel !==
        (name === "Workstation" ? "Peripheral" : "Workstation"),
    )
    .map((name) => ({
      name,
      value: model.categoryTotals[name],
      color: colorFor(name),
    }));

  return (
    <ChartCard
      title="Monthly Purchase Trend"
      subtitle={`Unit yang dibeli per bulan · ${model.scopeLabel} · ${model.periodLabel}`}
    >
      <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden pb-1">
        <div
          className="min-w-175"
          aria-label="Monthly purchasing stacked bar chart"
        >
          <div className="h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              debounce={RESIZE_DEBOUNCE_MS}
            >
              <BarChart data={chartData} margin={CHART_MARGIN}>
                <CartesianGrid
                  vertical={false}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="label"
                  axisLine={X_AXIS_LINE}
                  tickLine={false}
                  tick={X_AXIS_TICK}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={Y_AXIS_TICK}
                />
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
                          value: `${Number(item.value ?? 0)} unit`,
                        }))}
                      />
                    );
                  }}
                />

                {model.scopeLabel !== "Peripheral" && (
                  <Bar
                    dataKey="Workstation"
                    stackId="units"
                    fill={BLUE}
                    maxBarSize={96}
                    minPointSize={3}
                    isAnimationActive={false}
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {model.scopeLabel !== "Workstation" && (
                  <Bar
                    dataKey="Peripheral"
                    stackId="units"
                    fill={AMBER}
                    maxBarSize={96}
                    minPointSize={3}
                    isAnimationActive={false}
                    radius={[6, 6, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={legendItems} />
        </div>
      </div>
    </ChartCard>
  );
}

export function PurchaseBreakdown({ model }: { model: AssetPurchasingModel }) {
  const max = model.topItems[0]?.total || 1;
  const composition = (["Workstation", "Peripheral"] as const)
    .map((name) => ({
      name,
      value: model.categoryTotals[name],
      color: colorFor(name),
    }))
    .filter(
      (item) =>
        model.scopeLabel === "Semua kategori" || item.name === model.scopeLabel,
    );
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartCard
        title="Top Purchased Items"
        subtitle={`Berdasarkan total unit · ${model.scopeLabel} · ${model.periodLabel}`}
      >
        <div className="max-h-96 min-w-0 space-y-3 overflow-y-auto pr-1">
          {model.topItems.map((item) => (
            <div
              key={item.name}
              className="grid grid-cols-[minmax(7rem,9rem)_1fr_2.5rem] items-center gap-3 text-xs"
            >
              <span
                className="truncate text-right font-semibold text-zinc-700 dark:text-zinc-300"
                title={item.name}
              >
                {item.name}
              </span>
              <div
                className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                title={`${item.name}: ${item.total} unit`}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.total / max) * 100}%`,
                    backgroundColor: colorFor(item.category),
                  }}
                />
              </div>
              <span className="text-right font-bold tabular-nums">
                {item.total}
              </span>
            </div>
          ))}
          {model.topItems.length === 0 && (
            <p className="py-20 text-center text-sm text-zinc-500">
              Tidak ada unit yang dibeli pada periode ini.
            </p>
          )}
        </div>
      </ChartCard>
      <ChartCard
        title="Category Composition"
        subtitle={`Proporsi unit · ${model.periodLabel}`}
      >
        <div className="w-full min-w-0">
          <div className="h-64 min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              debounce={RESIZE_DEBOUNCE_MS}
            >
              <PieChart>
                <Pie
                  data={composition}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={68}
                  outerRadius={96}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {composition.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    return (
                      <RechartsTip
                        title={item.name}
                        rows={[
                          {
                            color: item.payload?.color ?? item.payload?.fill,
                            label: "Jumlah",
                            value: `${Number(item.value ?? 0)} unit`,
                          },
                        ]}
                      />
                    );
                  }}
                />

                <text
                  x="50%"
                  y="48%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-zinc-900 text-3xl font-extrabold dark:fill-zinc-50"
                >
                  {model.totalUnits}
                </text>
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-zinc-500 text-[10px] font-bold"
                >
                  TOTAL UNIT
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={composition} showValue />
        </div>
      </ChartCard>
    </div>
  );
}
