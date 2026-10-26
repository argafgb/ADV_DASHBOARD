"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, MapPinned } from "lucide-react";
import ChartCard from "@/components/shared/ChartCard";
import EmptyState from "@/components/shared/EmptyState";
import { RechartsTip } from "@/components/chart-tooltip";
import { C } from "@/lib/utils";
import type {
  DeviceRequestType,
  DeviceRequestTypeFilter,
  DeviceRequestsModel,
} from "../types";
import { TYPE_META } from "../utils/deviceRequestsTransformer";

const TYPES: DeviceRequestType[] = ["router", "ap", "switch"];

function visibleTypes(active: DeviceRequestTypeFilter) {
  return TYPES.filter((t) => active === "all" || active === t);
}

export function MonthlyRequestTrendChart({
  model,
  activeType,
}: {
  model: DeviceRequestsModel;
  activeType: DeviceRequestTypeFilter;
}) {
  const hasData = model.monthly.some((m) => m.router + m.ap + m.switch > 0);
  return (
    <ChartCard
      title="Tren Kebutuhan per Bulan"
      subtitle="Unit perangkat yang diminta per bulan pemenuhan"
    >
      {hasData ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={model.monthly}
              margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            >
              <CartesianGrid
                stroke={C.grid}
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: C.axis }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: C.axis }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(37,99,235,0.06)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <RechartsTip
                      title={`Bulan ${label}`}
                      rows={payload.map((item) => ({
                        color: item.color,
                        label: String(item.name || item.dataKey || ""),
                        value: `${Number(item.value ?? 0)} unit`,
                      }))}
                    />
                  );
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              {visibleTypes(activeType).map((t, i, arr) => (
                <Bar
                  key={t}
                  dataKey={t}
                  name={TYPE_META[t].label}
                  stackId="req"
                  fill={TYPE_META[t].color}
                  minPointSize={3}
                  radius={i === arr.length - 1 ? [4, 4, 0, 0] : 0}
                  maxBarSize={36}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="Data Grafik Tidak Ditemukan"
          description="Belum ada kebutuhan perangkat pada filter terpilih."
          height={256}
        />
      )}
    </ChartCard>
  );
}

export function RegionRequestBarChart({
  model,
  activeType,
  activeRegion,
  onRegionToggle,
}: {
  model: DeviceRequestsModel;
  activeType: DeviceRequestTypeFilter;
  activeRegion: string;
  onRegionToggle: (region: string) => void;
}) {
  return (
    <ChartCard
      title="Kebutuhan per Region"
      subtitle="Klik bar untuk memfilter region"
    >
      {model.regions.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={model.regions}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke={C.grid}
                strokeDasharray="4 4"
                horizontal={false}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: C.axis }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="region"
                width={48}
                tick={{ fontSize: 11, fill: C.axis, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(37,99,235,0.06)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <RechartsTip
                      title={`Region ${label}`}
                      rows={payload.map((item) => ({
                        color: item.color,
                        label: String(item.name || item.dataKey || ""),
                        value: `${Number(item.value ?? 0)} unit`,
                      }))}
                    />
                  );
                }}
              />
              {visibleTypes(activeType).map((t, i, arr) => (
                <Bar
                  key={t}
                  dataKey={t}
                  name={TYPE_META[t].label}
                  stackId="region"
                  fill={TYPE_META[t].color}
                  minPointSize={3}
                  radius={i === arr.length - 1 ? [0, 4, 4, 0] : 0}
                  maxBarSize={22}
                  cursor="pointer"
                  onClick={(entry) => {
                    const region = (
                      entry?.payload as { region?: string } | undefined
                    )?.region;
                    if (region) onRegionToggle(region);
                  }}
                >
                  {model.regions.map((r) => (
                    <Cell
                      key={r.region}
                      fillOpacity={
                        activeRegion === "ALL" || activeRegion === r.region
                          ? 1
                          : 0.3
                      }
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          icon={MapPinned}
          title="Tidak Ada Data Region"
          description="Belum ada kebutuhan perangkat per region untuk filter ini."
          height={256}
        />
      )}
    </ChartCard>
  );
}
