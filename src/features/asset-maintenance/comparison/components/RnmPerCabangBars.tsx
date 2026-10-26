"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import ChartCard from "@/components/shared/ChartCard";
import FilterSelect from "@/components/shared/FilterSelect";
import { RechartsTip } from "@/components/chart-tooltip";
import { resolveViewData } from "@/lib/async-view-state";
import { C, cn } from "@/lib/utils";
import {
  getRnmPerCabangData,
  type RnmScope,
  type RnmCategory,
} from "../services/comparisonService";
import type { AssetFilterInput } from "@/types/asset-pm.types";
import type { RnmDatum } from "../types/comparison.types";
import { RnmChartSkeleton } from "./skeletons/ComparisonSkeletons";

const SCOPE_TABS: { value: RnmScope; label: string }[] = [
  { value: "Operational", label: "Site" },
  { value: "Unit", label: "Unit" },
];

const CAT_TABS: { value: RnmCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Workstation", label: "Workstation" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Peripheral", label: "Peripheral" },
];

const SUB_DEFS: Record<
  Exclude<RnmCategory, "all">,
  { value: string; label: string }[]
> = {
  Workstation: [
    { value: "all", label: "All Workstation" },
    { value: "NOTEBOOK", label: "Notebook" },
    { value: "MINI PC", label: "Mini PC" },
    { value: "PC", label: "PC" },
  ],
  Infrastructure: [
    { value: "all", label: "All Infrastructure" },
    { value: "ACCESS POINT", label: "Access Point" },
    { value: "ROUTER", label: "Router" },
    { value: "REPEATER", label: "Repeater" },
    { value: "UPS", label: "UPS" },
    { value: "SWITCH", label: "Switch" },
    { value: "MODEM", label: "Modem" },
  ],
  Peripheral: [
    { value: "all", label: "All Peripheral" },
    { value: "DVD-RW", label: "DVD-RW" },
    { value: "PRINTER", label: "Printer" },
    { value: "SCANNER", label: "Scanner" },
    { value: "MONITOR", label: "Monitor" },
  ],
};

export default function RnmPerCabangBars({
  input,
  initialData,
}: {
  input: AssetFilterInput;
  initialData?: RnmDatum[];
}) {
  const [scope, setScope] = useState<RnmScope>("Operational");
  const [category, setCategory] = useState<RnmCategory>("all");
  const [subCategory, setSubCategory] = useState<string>("all");
  const [requestData, setRequestData] = useState<RnmDatum[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (
      isInitialMount.current &&
      initialData &&
      scope === "Operational" &&
      category === "all" &&
      subCategory === "all"
    ) {
      isInitialMount.current = false;
      return;
    }
    isInitialMount.current = false;

    startTransition(async () => {
      const res = await getRnmPerCabangData(
        input,
        scope,
        category,
        subCategory,
      );
      setRequestData(res);
    });
  }, [input, scope, category, subCategory, initialData]);

  const usesInitialData =
    scope === "Operational" && category === "all" && subCategory === "all";
  const resolvedData = resolveViewData(
    usesInitialData,
    initialData,
    requestData,
    null,
  );
  const chartData = resolvedData ?? [];
  const subOptions =
    category === "all"
      ? [{ value: "all", label: "—" }]
      : (SUB_DEFS[category] ?? [{ value: "all", label: "All" }]);

  const handleCategoryChange = (newCat: RnmCategory) => {
    setCategory(newCat);
    setSubCategory("all");
  };

  return (
    <ChartCard
      title="RnM Comparison by Branch"
      subtitle="Dinormalisasi ke rata-rata per bulan"
      action={
        <>
          {/* Segmented scope tabs on wider screens */}
          <div
            role="tablist"
            aria-label="Filter lingkup cabang"
            className="hidden items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800 sm:flex"
          >
            {SCOPE_TABS.map((tab) => {
              const active = scope === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScope(tab.value)}
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Scope dropdown on small screens */}
          <div className="sm:hidden">
            <FilterSelect
              aria-label="Filter lingkup cabang"
              value={scope}
              onValueChange={(v) => setScope(v as RnmScope)}
              options={SCOPE_TABS}
            />
          </div>
        </>
      }
    >
      {/* Category controls bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800/60">
        {/* Category tabs */}
        <div
          role="tablist"
          aria-label="Filter kategori RnM"
          className="flex items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800"
        >
          {CAT_TABS.map((tab) => {
            const active = category === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleCategoryChange(tab.value)}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sub-Category Dropdown */}
        <div
          className={cn(
            "flex items-center gap-1.5 transition-opacity",
            category === "all"
              ? "opacity-50 pointer-events-none"
              : "opacity-100",
          )}
        >
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {category === "all" ? "Detail Kategori" : `Detail ${category}`}
          </span>
          <FilterSelect
            aria-label="Detail sub-kategori RnM"
            value={subCategory}
            onValueChange={setSubCategory}
            options={subOptions}
            className="min-w-36 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Grouped Column Chart */}
      <div className="w-full overflow-x-auto pb-2">
        {isPending || !resolvedData ? (
          <RnmChartSkeleton />
        ) : (
          <div
            className="h-80"
            style={{ minWidth: Math.max(520, chartData.length * 72) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 24, right: 16, left: 0, bottom: 25 }}
                barGap={4}
                barCategoryGap="20%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={C.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="branch"
                  stroke={C.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={50}
                  dx={-2}
                  dy={4}
                />
                <YAxis
                  stroke={C.axis}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
                  width={44}
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
                          value: `${Number(item.value ?? 0).toFixed(1)}%`,
                        }))}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="y2025"
                  name="2025 (rata-rata/bulan)"
                  fill="#60A5FA"
                  minPointSize={3}
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                >
                  <LabelList
                    dataKey="y2025"
                    position="top"
                    formatter={(v: unknown) => `${Number(v || 0).toFixed(1)}%`}
                    style={{ fontSize: 10, fontWeight: 900, fill: C.axis }}
                  />
                </Bar>
                <Bar
                  dataKey="y2026"
                  name="2026 (rata-rata/bulan)"
                  fill="#2563EB"
                  minPointSize={3}
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                >
                  <LabelList
                    dataKey="y2026"
                    position="top"
                    formatter={(v: unknown) => `${Number(v || 0).toFixed(1)}%`}
                    style={{ fontSize: 10, fontWeight: 900, fill: C.axis }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Legend below the main chart */}
      <div className="mt-3 flex flex-wrap items-center gap-5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-[#60A5FA]" />
          <span>2025 (rata-rata/bulan)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-[#2563EB]" />
          <span>2026 (rata-rata/bulan)</span>
        </div>
      </div>
    </ChartCard>
  );
}
