"use client";

import { useState, useEffect } from "react";
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
import ChartCard from "@/components/shared/ChartCard";
import SegmentedTabs from "@/components/shared/SegmentedTabs";
import { RechartsTip } from "@/components/chart-tooltip";
import { resolveViewData } from "@/lib/async-view-state";
import { C, fmt } from "@/lib/utils";
import { getAssetGrowthData } from "../services/overviewService";
import type { AssetFilterInput } from "@/types/asset-pm.types";
import type {
  GrowthDeviceFilter,
  YearlyGrowthPoint,
} from "../types/overview.types";

const DEVICE_TABS = [
  { value: "ALL", label: "Semua" },
  { value: "workstation", label: "Workstation" },
  { value: "infrastructure", label: "Infrastruktur" },
  { value: "peripheral", label: "Periferal" },
];

const DEVICE_TITLE_MAP: Record<GrowthDeviceFilter, string> = {
  ALL: "Pertumbuhan Total Aset",
  workstation: "Pertumbuhan Aset Workstation",
  infrastructure: "Pertumbuhan Aset Infrastruktur",
  peripheral: "Pertumbuhan Aset Periferal",
};

function getOpacity(val: number, maxVal: number): number {
  if (maxVal <= 0) return 1;
  const ratio = val / maxVal;
  return Math.max(0.35, Math.min(1, 0.35 + 0.65 * ratio));
}

export default function WorkstationGrowthChart({
  input,
  initialData,
  data,
}: {
  input: AssetFilterInput;
  initialData?: YearlyGrowthPoint[];
  data?: YearlyGrowthPoint[];
}) {
  const [device, setDevice] = useState<GrowthDeviceFilter>("ALL");
  const [requestData, setRequestData] = useState<YearlyGrowthPoint[] | null>(
    null,
  );
  const chartData = resolveViewData(
    device === "ALL",
    data ?? initialData,
    requestData,
    [],
  );

  // The initial data already contains every device category.
  useEffect(() => {
    if (device === "ALL") return;

    let isMounted = true;
    async function loadGrowth() {
      try {
        const res = await getAssetGrowthData(input, device);
        if (isMounted) {
          setRequestData(res ?? []);
        }
      } catch (error) {
        console.error("Failed to load asset growth data:", error);
        if (isMounted) {
          setRequestData([]);
        }
      }
    }
    loadGrowth();
    return () => {
      isMounted = false;
    };
  }, [input, device]);

  const chartTitle = DEVICE_TITLE_MAP[device] || "Total Asset Growth";

  // Calculate max values for dynamic contrast scaling
  const maxAllVal = Math.max(
    0,
    ...chartData.map((d) =>
      Math.max(d.workstation || 0, d.infrastructure || 0, d.peripheral || 0),
    ),
  );

  const maxSingleVal = Math.max(0, ...chartData.map((d) => d.total || 0));

  return (
    <ChartCard
      title={chartTitle}
      subtitle="Pertumbuhan jumlah perangkat sepanjang periode"
      action={
        <SegmentedTabs
          aria-label="Filter tipe perangkat"
          value={device}
          onChange={(v) => setDevice(v as GrowthDeviceFilter)}
          options={DEVICE_TABS}
        />
      }
    >
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
            Tidak ada data untuk filter ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              maxBarSize={64}
              barGap={6}
              barCategoryGap="25%"
              margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={C.grid}
                vertical={false}
              />
              <XAxis
                dataKey="year"
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
                width={36}
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
                        value: fmt(Number(item.value ?? 0)),
                      }))}
                    />
                  );
                }}
              />

              {device === "ALL" ? (
                <>
                  <Legend />
                  <Bar
                    dataKey="workstation"
                    name="Workstation"
                    fill={C.accent}
                    minPointSize={3}
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-ws-${index}`}
                        fillOpacity={getOpacity(
                          entry.workstation || 0,
                          maxAllVal,
                        )}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="infrastructure"
                    name="Infrastructure"
                    fill={C.green}
                    minPointSize={3}
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-infra-${index}`}
                        fillOpacity={getOpacity(
                          entry.infrastructure || 0,
                          maxAllVal,
                        )}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="peripheral"
                    name="Peripheral"
                    fill={C.amber}
                    minPointSize={3}
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-periph-${index}`}
                        fillOpacity={getOpacity(
                          entry.peripheral || 0,
                          maxAllVal,
                        )}
                      />
                    ))}
                  </Bar>
                </>
              ) : (
                <Bar
                  dataKey="total"
                  name="Total unit"
                  fill={C.accent}
                  minPointSize={3}
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-total-${index}`}
                      fillOpacity={getOpacity(entry.total || 0, maxSingleVal)}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
