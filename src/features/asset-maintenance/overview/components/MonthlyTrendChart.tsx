"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import ChartCard from "@/components/shared/ChartCard";
import EmptyState from "@/components/shared/EmptyState";
import { RechartsTip } from "@/components/chart-tooltip";
import { C, fmt } from "@/lib/utils";
import { formatMonthRangeLabel } from "@/lib/filter-utils";
import type { AssetFilterInput } from "@/types/asset-pm.types";
import type { MonthlyTrendPoint } from "../types/overview.types";

export default function MonthlyTrendChart({
  input,
  data: propsData,
}: {
  input: AssetFilterInput;
  data?: MonthlyTrendPoint[];
}) {
  const data = propsData || [];
  const isEmpty = data.length === 0;

  const subtitleLabel = `Jumlah temuan per bulan · ${formatMonthRangeLabel(
    input.month,
    input.year,
  )}`;

  return (
    <ChartCard title="Tren Temuan Bulanan" subtitle={subtitleLabel}>
      {isEmpty ? (
        <EmptyState
          icon={TrendingUp}
          title="Data Grafik Tidak Ditemukan"
          description="Belum ada tren data temuan pada kombinasi filter ini."
          height={288}
        />
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="temuanTrendFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={C.amber} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={C.grid}
                vertical={false}
              />
              <XAxis
                dataKey="month"
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
                cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }}
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
              <Area
                type="monotone"
                dataKey="temuan"
                name="Temuan"
                stroke={C.amber}
                strokeWidth={2}
                fill="url(#temuanTrendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
